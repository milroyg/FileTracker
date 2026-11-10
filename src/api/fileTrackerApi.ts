import { apiClient } from './client';

export interface MovementRecord {
  dt: string;
  username: string;
  employee: string;
}

export interface FileSearchResult {
  code: string;
  filename: string;
}

// Module-level in-flight request cache and deduplication lock
const inFlightRequests = new Map<string, Promise<any>>();
const recentResultsCache = new Map<string, { data: any; timestamp: number }>();

// Cache validity window: 2000ms (2 seconds)
// Discards duplicate clicks/IME events within 2 seconds
const DEDUPLICATION_WINDOW_MS = 2000;

async function deduplicatedRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  // 1. Return in-flight promise if an identical request is already running
  if (inFlightRequests.has(key)) {
    console.log(`[FileTrackerApi] Coalescing concurrent duplicate request for: ${key}`);
    return inFlightRequests.get(key) as Promise<T>;
  }

  // 2. Return recent cached result if identical request resolved within deduplication window
  const cached = recentResultsCache.get(key);
  if (cached && now - cached.timestamp < DEDUPLICATION_WINDOW_MS) {
    console.log(`[FileTrackerApi] Returning recent cached result (dedup window) for: ${key}`);
    return cached.data as T;
  }

  // 3. Initiate request and register in-flight promise
  const promise = (async () => {
    try {
      const data = await fetcher();
      recentResultsCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export const FileTrackerApi = {
  /**
   * Scans a file barcode and marks it to an employee.
   * Corresponds to legacy URL2 in Admin.java:
   * GET /scan?code=...&employee=...&username=...
   * Responses:
   *  "Ok" -> Successfully recorded
   *  "File not in System" -> Needs to be registered first
   */
  async markFileToEmployee(
    code: string,
    username: string,
    employee: string
  ): Promise<'Ok' | 'File not in System' | string> {
    const cleanCode = code.trim();
    const key = `scan:${cleanCode}:${username.trim()}:${employee.trim()}`;

    return deduplicatedRequest<string>(key, async () => {
      const response = await apiClient.get<string>('/scan', {
        params: { code: cleanCode, employee, username },
        responseType: 'text',
      });
      return response.data?.trim() || '';
    });
  },

  /**
   * Registers a brand new file code with its full subject/filename.
   * Corresponds to legacy URL3 in Admin.java:
   * GET /regcode?code=...&filename=...
   */
  async registerNewFile(code: string, filename: string): Promise<string> {
    const cleanCode = code.trim();
    const cleanFilename = filename.trim();
    const key = `regcode:${cleanCode}:${cleanFilename.toLowerCase()}`;

    return deduplicatedRequest<string>(key, async () => {
      const response = await apiClient.get<string>('/regcode', {
        params: { code: cleanCode, filename: cleanFilename },
        responseType: 'text',
      });
      return response.data?.trim() || '';
    });
  },

  /**
   * Searches the chronological movement history of a specific file barcode.
   * Corresponds to legacy SearchHandler.java:
   * GET /searchcode?code=...
   */
  async searchByCode(code: string): Promise<MovementRecord[]> {
    const cleanCode = code.trim();
    const key = `searchcode:${cleanCode.toLowerCase()}`;

    return deduplicatedRequest<MovementRecord[]>(key, async () => {
      console.log(`[FileTrackerApi] >>> DISPATCHING HTTP GET /searchcode for: "${cleanCode}"`);
      const response = await apiClient.get<Record<string, { dt?: string; username?: string; employee?: string }>>(
        '/searchcode',
        { params: { code: cleanCode } }
      );

      if (!response.data || typeof response.data !== 'object') {
        return [];
      }

      const records: MovementRecord[] = [];
      for (const itemKey of Object.keys(response.data)) {
        const item = response.data[itemKey];
        if (item) {
          records.push({
            dt: item.dt || '-',
            username: item.username || '-',
            employee: item.employee || '-',
          });
        }
      }
      return records;
    });
  },

  /**
   * Searches registered files matching a subject/filename substring.
   * Corresponds to legacy SearchHandler.java:
   * GET /searchfile?filename=...
   */
  async searchByFileName(filename: string): Promise<FileSearchResult[]> {
    const cleanFilename = filename.trim();
    const key = `searchfile:${cleanFilename.toLowerCase()}`;

    return deduplicatedRequest<FileSearchResult[]>(key, async () => {
      console.log(`[FileTrackerApi] >>> DISPATCHING HTTP GET /searchfile for: "${cleanFilename}"`);
      const response = await apiClient.get<Record<string, { code?: string; filename?: string }>>(
        '/searchfile',
        { params: { filename: cleanFilename } }
      );

      if (!response.data || typeof response.data !== 'object') {
        return [];
      }

      const results: FileSearchResult[] = [];
      for (const itemKey of Object.keys(response.data)) {
        const item = response.data[itemKey];
        if (item && item.code) {
          results.push({
            code: item.code,
            filename: item.filename || '',
          });
        }
      }
      return results;
    });
  },
};

