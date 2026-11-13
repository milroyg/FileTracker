import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileTrackerApi } from '../api/fileTrackerApi';
import { toApiError } from '../api/errors';
import { fetchIsOnline } from '../utils/network';
import { logger } from '../utils/logger';

/**
 * Offline outbox: file movements and registrations recorded while the device
 * couldn't reach the server, replayed later by `sync()`.
 *
 * Guarantees:
 * - Every read-modify-write of the stored queue runs under one lock, so an
 *   action queued while a sync is running is never overwritten.
 * - Only one sync runs at a time (concurrent callers share the same run).
 * - Nothing is silently dropped: an action the server can't accept stays in
 *   the queue as `needs_registration` or `failed` until the user resolves or
 *   discards it.
 */

export type OutboxActionType = 'MARK_EMPLOYEE' | 'REGISTER_FILE';

/**
 * - pending: waiting to be sent (retried automatically)
 * - needs_registration: server says the file code isn't registered yet
 * - failed: server rejected it, or it failed MAX_ATTEMPTS times — needs the user
 */
export type OutboxStatus = 'pending' | 'needs_registration' | 'failed';

export interface OutboxItem {
  id: string;
  type: OutboxActionType;
  code: string;
  username: string;
  employee?: string;
  filename?: string;
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
}

export interface SyncResult {
  syncedCount: number;
  remainingCount: number;
}

export interface OutboxSnapshot {
  items: OutboxItem[];
  loaded: boolean;
  isSyncing: boolean;
  /** Most recent sync that actually delivered something. */
  lastSync: (SyncResult & { at: number }) | null;
}

export const OUTBOX_STORAGE_KEY = '@wrd_filetracker:offline_outbox';
export const MAX_ATTEMPTS = 5;

const INITIAL_SNAPSHOT: OutboxSnapshot = {
  items: [],
  loaded: false,
  isSyncing: false,
  lastSync: null,
};

let snapshot: OutboxSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();
let lockChain: Promise<unknown> = Promise.resolve();
let inFlightSync: Promise<SyncResult> | null = null;

function setSnapshot(patch: Partial<OutboxSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

/** Serializes async critical sections (a minimal promise-chain mutex). */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lockChain.then(fn, fn);
  lockChain = run.catch(() => undefined);
  return run;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Accepts items written by older app versions (no status/attempts fields). */
function normalizeItem(raw: unknown): OutboxItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<OutboxItem> & { timestamp?: number };
  if (!item.id || !item.code || (item.type !== 'MARK_EMPLOYEE' && item.type !== 'REGISTER_FILE')) {
    return null;
  }
  const isComplete = item.type === 'MARK_EMPLOYEE' ? !!item.employee : !!item.filename;
  return {
    id: item.id,
    type: item.type,
    code: item.code,
    username: item.username ?? '',
    employee: item.employee,
    filename: item.filename,
    createdAt: item.createdAt ?? item.timestamp ?? Date.now(),
    status: isComplete ? (item.status ?? 'pending') : 'failed',
    attempts: item.attempts ?? 0,
    lastError: isComplete ? item.lastError : 'Incomplete action data.',
  };
}

/** Must be called inside the lock. */
async function readItems(): Promise<OutboxItem[]> {
  if (snapshot.loaded) return snapshot.items;
  let items: OutboxItem[] = [];
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = parsed.map(normalizeItem).filter((item): item is OutboxItem => item !== null);
    }
  } catch (error) {
    logger.warn('[Outbox] Could not read stored outbox:', error);
  }
  setSnapshot({ items, loaded: true });
  return items;
}

/** Atomically transforms and persists the queue. Throws if it can't be saved. */
function mutate(transform: (items: OutboxItem[]) => OutboxItem[]): Promise<OutboxItem[]> {
  return withLock(async () => {
    const next = transform(await readItems());
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(next));
    setSnapshot({ items: next });
    return next;
  });
}

function updateItem(id: string, patch: Partial<OutboxItem>) {
  return mutate((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
}

function removeItem(id: string) {
  return mutate((items) => items.filter((item) => item.id !== id));
}

type ProcessOutcome = 'synced' | 'kept' | 'network';

async function processItem(item: OutboxItem): Promise<ProcessOutcome> {
  try {
    if (item.type === 'REGISTER_FILE') {
      await FileTrackerApi.registerNewFile(item.code, item.filename ?? '');
      await mutate((items) =>
        items
          .filter((other) => other.id !== item.id)
          .map((other) => releaseIfRegistered(other, item.code)),
      );
      return 'synced';
    }

    const outcome = await FileTrackerApi.markFileToEmployee(
      item.code,
      item.username,
      item.employee ?? '',
    );
    if (outcome.kind === 'ok') {
      await removeItem(item.id);
      return 'synced';
    }
    if (outcome.kind === 'not_registered') {
      await updateItem(item.id, {
        status: 'needs_registration',
        lastError: 'This file code is not registered yet.',
      });
      return 'kept';
    }
    await updateItem(item.id, { status: 'failed', lastError: outcome.message });
    return 'kept';
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.isNetworkError) return 'network';
    const attempts = item.attempts + 1;
    await updateItem(item.id, {
      attempts,
      lastError: apiError.message,
      status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
    });
    return 'kept';
  }
}

function releaseIfRegistered(item: OutboxItem, registeredCode: string): OutboxItem {
  return item.type === 'MARK_EMPLOYEE' &&
    item.status === 'needs_registration' &&
    item.code === registeredCode
    ? { ...item, status: 'pending', attempts: 0, lastError: undefined }
    : item;
}

async function runSync(): Promise<SyncResult> {
  await OutboxService.load();
  if (!(await fetchIsOnline())) {
    return { syncedCount: 0, remainingCount: snapshot.items.length };
  }

  setSnapshot({ isSyncing: true });
  let syncedCount = 0;
  try {
    // Registrations first: a successful one releases the movements that were
    // waiting on it, which then go out in the second pass of the same run.
    phases: for (const type of ['REGISTER_FILE', 'MARK_EMPLOYEE'] as const) {
      const batch = snapshot.items.filter(
        (item) => item.type === type && item.status === 'pending',
      );
      for (const item of batch) {
        const outcome = await processItem(item);
        if (outcome === 'network') break phases; // connection dropped; try again later
        if (outcome === 'synced') syncedCount++;
      }
    }
  } catch (error) {
    // Storage failure while updating the queue — leave everything for next time.
    logger.warn('[Outbox] Sync aborted:', error);
  } finally {
    const remainingCount = snapshot.items.length;
    setSnapshot({
      isSyncing: false,
      lastSync:
        syncedCount > 0 ? { syncedCount, remainingCount, at: Date.now() } : snapshot.lastSync,
    });
  }
  return { syncedCount, remainingCount: snapshot.items.length };
}

export const OutboxService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): OutboxSnapshot {
    return snapshot;
  },

  load(): Promise<OutboxItem[]> {
    return withLock(readItems);
  },

  async enqueueMarkEmployee(code: string, username: string, employee: string): Promise<void> {
    await mutate((items) => [
      ...items,
      {
        id: createId('mark'),
        type: 'MARK_EMPLOYEE',
        code: code.trim(),
        username: username.trim(),
        employee: employee.trim(),
        createdAt: Date.now(),
        status: 'pending',
        attempts: 0,
      },
    ]);
  },

  async enqueueRegisterFile(code: string, username: string, filename: string): Promise<void> {
    await mutate((items) => [
      ...items,
      {
        id: createId('reg'),
        type: 'REGISTER_FILE',
        code: code.trim(),
        username: username.trim(),
        filename: filename.trim(),
        createdAt: Date.now(),
        status: 'pending',
        attempts: 0,
      },
    ]);
  },

  /** Puts a failed / needs-registration item back in line for the next sync. */
  async retry(id: string): Promise<void> {
    await updateItem(id, { status: 'pending', attempts: 0, lastError: undefined });
  },

  async discard(id: string): Promise<void> {
    await removeItem(id);
  },

  /** Call after a file code is registered online: its waiting movements can go out. */
  async releaseRegistered(code: string): Promise<void> {
    const trimmed = code.trim();
    await mutate((items) => items.map((item) => releaseIfRegistered(item, trimmed)));
  },

  /** Sends every pending action. Safe to call any time; concurrent calls share one run. */
  sync(): Promise<SyncResult> {
    if (!inFlightSync) {
      inFlightSync = runSync().finally(() => {
        inFlightSync = null;
      });
    }
    return inFlightSync;
  },

  /** Test helper: forget all in-memory state. */
  resetForTests() {
    snapshot = INITIAL_SNAPSHOT;
    listeners.clear();
    lockChain = Promise.resolve();
    inFlightSync = null;
  },
};
