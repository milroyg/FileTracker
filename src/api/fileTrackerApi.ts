import { apiClient } from './client';
import { ApiError } from './errors';
import { sortRecordsByLatestDate } from '../utils/dateUtils';

export interface MovementRecord {
  dt: string;
  username: string;
  employee: string;
}

export interface FileSearchResult {
  code: string;
  filename: string;
}

/**
 * Outcome of `/scan`. The server replies with plain text — exactly "Ok" or
 * "File not in System" (see legacy Admin.java). Anything else is surfaced to
 * the user verbatim rather than guessed at.
 */
export type ScanOutcome =
  { kind: 'ok' } | { kind: 'not_registered' } | { kind: 'unexpected'; message: string };

const OK_RESPONSE = 'ok';
const NOT_REGISTERED_RESPONSE = 'file not in system';

export function classifyScanResponse(rawBody: unknown): ScanOutcome {
  const body = typeof rawBody === 'string' ? rawBody.trim() : '';
  const normalized = body.toLowerCase();
  if (normalized === OK_RESPONSE) return { kind: 'ok' };
  if (normalized === NOT_REGISTERED_RESPONSE) return { kind: 'not_registered' };
  return {
    kind: 'unexpected',
    message: body || 'The WRD server returned an empty response.',
  };
}

type RecordMap = Record<string, { dt?: string; username?: string; employee?: string } | null>;
type FileMap = Record<string, { code?: string; filename?: string } | null>;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export const FileTrackerApi = {
  /**
   * Records that a file was marked to an employee.
   * GET /scan?code=&employee=&username=
   */
  async markFileToEmployee(code: string, username: string, employee: string): Promise<ScanOutcome> {
    try {
      const response = await apiClient.get<string>('/scan', {
        params: { code: code.trim(), employee: employee.trim(), username: username.trim() },
        responseType: 'text',
      });
      return classifyScanResponse(response.data);
    } catch (error) {
      // Some deployments answer "File not in System" with a non-2xx status.
      if (error instanceof ApiError && !error.isNetworkError) {
        const outcome = classifyScanResponse(error.bodyText);
        if (outcome.kind === 'not_registered') return outcome;
      }
      throw error;
    }
  },

  /**
   * Registers a new file code with its subject.
   * GET /regcode?code=&filename=
   * Returns the server's confirmation text (may be empty).
   */
  async registerNewFile(code: string, filename: string): Promise<string> {
    const response = await apiClient.get<string>('/regcode', {
      params: { code: code.trim(), filename: filename.trim() },
      responseType: 'text',
    });
    return typeof response.data === 'string' ? response.data.trim() : '';
  },

  /**
   * Movement history of one file code, newest first.
   * GET /searchcode?code=
   */
  async searchByCode(code: string): Promise<MovementRecord[]> {
    const response = await apiClient.get<RecordMap>('/searchcode', {
      params: { code: code.trim() },
    });
    if (!isObject(response.data)) return [];

    const records = Object.values(response.data)
      .filter((item): item is NonNullable<typeof item> => !!item)
      .map((item) => ({
        dt: item.dt || '-',
        username: item.username || '-',
        employee: item.employee || '-',
      }));
    return sortRecordsByLatestDate(records);
  },

  /**
   * Registered files whose subject contains the given text.
   * GET /searchfile?filename=
   */
  async searchByFileName(filename: string): Promise<FileSearchResult[]> {
    const response = await apiClient.get<FileMap>('/searchfile', {
      params: { filename: filename.trim() },
    });
    if (!isObject(response.data)) return [];

    return Object.values(response.data)
      .filter((item): item is { code: string; filename?: string } => !!item?.code)
      .map((item) => ({ code: item.code, filename: item.filename || '' }));
  },
};
