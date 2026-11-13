import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../../api/errors';
import { FileTrackerApi } from '../../api/fileTrackerApi';
import { fetchIsOnline } from '../../utils/network';
import { MAX_ATTEMPTS, OUTBOX_STORAGE_KEY, OutboxService } from '../outboxService';

jest.mock('../../api/fileTrackerApi', () => ({
  FileTrackerApi: {
    markFileToEmployee: jest.fn(),
    registerNewFile: jest.fn(),
  },
}));
jest.mock('../../utils/network', () => ({ fetchIsOnline: jest.fn() }));

const markFile = FileTrackerApi.markFileToEmployee as jest.Mock;
const registerFile = FileTrackerApi.registerNewFile as jest.Mock;
const isOnline = fetchIsOnline as jest.Mock;

async function storedItems() {
  const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const networkError = () => new ApiError('offline', { isNetworkError: true });
const serverError = () => new ApiError('HTTP 500', { status: 500, isNetworkError: false });

beforeEach(async () => {
  await AsyncStorage.clear();
  OutboxService.resetForTests();
  jest.clearAllMocks();
  isOnline.mockResolvedValue(true);
});

describe('OutboxService', () => {
  it('removes a movement once the server confirms it', async () => {
    markFile.mockResolvedValue({ kind: 'ok' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    const result = await OutboxService.sync();

    expect(result).toEqual({ syncedCount: 1, remainingCount: 0 });
    expect(markFile).toHaveBeenCalledWith('1024', 'alice', 'bob');
    expect(await storedItems()).toEqual([]);
  });

  it('keeps a movement for an unregistered file instead of dropping it', async () => {
    markFile.mockResolvedValue({ kind: 'not_registered' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    const result = await OutboxService.sync();

    expect(result.syncedCount).toBe(0);
    const [item] = await storedItems();
    expect(item).toMatchObject({ code: '1024', status: 'needs_registration' });
  });

  it('does not lose an action queued while a sync is in progress', async () => {
    const response = deferred<{ kind: 'ok' }>();
    markFile.mockReturnValueOnce(response.promise);
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    const sync = OutboxService.sync();
    await new Promise((r) => setTimeout(r, 0)); // let the sync reach the API call
    await OutboxService.enqueueMarkEmployee('2048', 'alice', 'carol');
    response.resolve({ kind: 'ok' });
    await sync;

    const items = await storedItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ code: '2048', employee: 'carol', status: 'pending' });
  });

  it('runs only one sync at a time', async () => {
    markFile.mockResolvedValue({ kind: 'ok' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    const [first, second] = await Promise.all([OutboxService.sync(), OutboxService.sync()]);

    expect(markFile).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('stops on a network error and keeps everything pending', async () => {
    markFile.mockRejectedValue(networkError());
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');
    await OutboxService.enqueueMarkEmployee('2048', 'alice', 'carol');

    await OutboxService.sync();

    expect(markFile).toHaveBeenCalledTimes(1);
    const items = await storedItems();
    expect(items.map((i: { status: string }) => i.status)).toEqual(['pending', 'pending']);
    expect(items[0].attempts).toBe(0);
  });

  it(`marks an action failed after ${MAX_ATTEMPTS} server errors`, async () => {
    markFile.mockRejectedValue(serverError());
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    for (let i = 0; i < MAX_ATTEMPTS; i++) await OutboxService.sync();
    await OutboxService.sync(); // no longer retried

    expect(markFile).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    const [item] = await storedItems();
    expect(item).toMatchObject({ status: 'failed', attempts: MAX_ATTEMPTS, lastError: 'HTTP 500' });
  });

  it('marks an unexpected server reply as failed with the reply text', async () => {
    markFile.mockResolvedValue({ kind: 'unexpected', message: 'Employee unknown' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    await OutboxService.sync();

    const [item] = await storedItems();
    expect(item).toMatchObject({ status: 'failed', lastError: 'Employee unknown' });
  });

  it('sends registrations first and then the movements they unblock', async () => {
    markFile.mockResolvedValueOnce({ kind: 'not_registered' }).mockResolvedValue({ kind: 'ok' });
    registerFile.mockResolvedValue('Saved');

    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');
    await OutboxService.sync(); // -> needs_registration
    await OutboxService.enqueueRegisterFile('1024', 'alice', 'Tender for pump');

    const result = await OutboxService.sync();

    expect(registerFile).toHaveBeenCalledWith('1024', 'Tender for pump');
    expect(result).toEqual({ syncedCount: 2, remainingCount: 0 });
  });

  it('releases waiting movements when the file is registered online', async () => {
    markFile.mockResolvedValueOnce({ kind: 'not_registered' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');
    await OutboxService.sync();

    await OutboxService.releaseRegistered('1024');

    const [item] = await storedItems();
    expect(item).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('does nothing while offline', async () => {
    isOnline.mockResolvedValue(false);
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    const result = await OutboxService.sync();

    expect(markFile).not.toHaveBeenCalled();
    expect(result).toEqual({ syncedCount: 0, remainingCount: 1 });
  });

  it('upgrades items stored by older app versions', async () => {
    await AsyncStorage.setItem(
      OUTBOX_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'mark_1',
          type: 'MARK_EMPLOYEE',
          code: '1024',
          username: 'alice',
          employee: 'bob',
          timestamp: 123,
        },
        { id: 'broken', type: 'UNKNOWN', code: 'x' },
      ]),
    );

    const items = await OutboxService.load();

    expect(items).toEqual([
      expect.objectContaining({ id: 'mark_1', status: 'pending', attempts: 0, createdAt: 123 }),
    ]);
  });

  it('retry and discard update the queue', async () => {
    markFile.mockResolvedValue({ kind: 'unexpected', message: 'nope' });
    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');
    await OutboxService.sync();
    const [failed] = await storedItems();

    await OutboxService.retry(failed.id);
    expect((await storedItems())[0]).toMatchObject({ status: 'pending', attempts: 0 });

    await OutboxService.discard(failed.id);
    expect(await storedItems()).toEqual([]);
  });

  it('notifies subscribers when the queue changes', async () => {
    const listener = jest.fn();
    const unsubscribe = OutboxService.subscribe(listener);

    await OutboxService.enqueueMarkEmployee('1024', 'alice', 'bob');

    expect(listener).toHaveBeenCalled();
    expect(OutboxService.getSnapshot().items).toHaveLength(1);
    unsubscribe();
  });
});
