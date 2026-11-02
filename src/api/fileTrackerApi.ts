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
    const response = await apiClient.get<string>('/scan', {
      params: { code, employee, username },
      responseType: 'text',
    });
    return response.data?.trim();
  },

  /**
   * Registers a brand new file code with its full subject/filename.
   * Corresponds to legacy URL3 in Admin.java:
   * GET /regcode?code=...&filename=...
   */
  async registerNewFile(code: string, filename: string): Promise<string> {
    const response = await apiClient.get<string>('/regcode', {
      params: { code, filename },
      responseType: 'text',
    });
    return response.data?.trim();
  },

  /**
   * Searches the chronological movement history of a specific file barcode.
   * Corresponds to legacy SearchHandler.java:
   * GET /searchcode?code=...
   */
  async searchByCode(code: string): Promise<MovementRecord[]> {
    const response = await apiClient.get<Record<string, { dt?: string; username?: string; employee?: string }>>(
      '/searchcode',
      { params: { code } }
    );

    if (!response.data || typeof response.data !== 'object') {
      return [];
    }

    const records: MovementRecord[] = [];
    for (const key of Object.keys(response.data)) {
      const item = response.data[key];
      if (item) {
        records.push({
          dt: item.dt || '-',
          username: item.username || '-',
          employee: item.employee || '-',
        });
      }
    }
    return records;
  },

  /**
   * Searches registered files matching a subject/filename substring.
   * Corresponds to legacy SearchHandler.java:
   * GET /searchfile?filename=...
   */
  async searchByFileName(filename: string): Promise<FileSearchResult[]> {
    const response = await apiClient.get<Record<string, { code?: string; filename?: string }>>(
      '/searchfile',
      { params: { filename } }
    );

    if (!response.data || typeof response.data !== 'object') {
      return [];
    }

    const results: FileSearchResult[] = [];
    for (const key of Object.keys(response.data)) {
      const item = response.data[key];
      if (item && item.code) {
        results.push({
          code: item.code,
          filename: item.filename || '',
        });
      }
    }
    return results;
  },
};

