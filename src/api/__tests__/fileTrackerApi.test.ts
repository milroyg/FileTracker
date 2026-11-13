import { AxiosError, AxiosHeaders } from 'axios';
import { apiClient } from '../client';
import { ApiError, toApiError } from '../errors';
import { FileTrackerApi, classifyScanResponse } from '../fileTrackerApi';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));
const get = apiClient.get as jest.Mock;

beforeEach(() => get.mockReset());

describe('classifyScanResponse', () => {
  it.each(['Ok', 'OK', ' ok \n'])('treats %p as success', (body) => {
    expect(classifyScanResponse(body)).toEqual({ kind: 'ok' });
  });

  it.each(['File not in System', 'file not in system '])('treats %p as unregistered', (body) => {
    expect(classifyScanResponse(body)).toEqual({ kind: 'not_registered' });
  });

  it.each(['Error: database unavailable', 'okay but not saved', 'Not Found', '<html>500</html>'])(
    'does not guess at %p',
    (body) => {
      expect(classifyScanResponse(body)).toEqual({ kind: 'unexpected', message: body });
    },
  );

  it('reports an empty body as unexpected', () => {
    expect(classifyScanResponse('')).toMatchObject({ kind: 'unexpected' });
    expect(classifyScanResponse(undefined)).toMatchObject({ kind: 'unexpected' });
  });
});

describe('FileTrackerApi.markFileToEmployee', () => {
  it('sends trimmed parameters', async () => {
    get.mockResolvedValue({ data: 'Ok' });
    await FileTrackerApi.markFileToEmployee(' 1024 ', ' alice ', ' bob ');
    expect(get).toHaveBeenCalledWith('/scan', {
      params: { code: '1024', employee: 'bob', username: 'alice' },
      responseType: 'text',
    });
  });

  it('recognises "File not in System" returned with an error status', async () => {
    get.mockRejectedValue(
      new ApiError('HTTP 404', { status: 404, body: 'File not in System', isNetworkError: false }),
    );
    await expect(FileTrackerApi.markFileToEmployee('1', 'a', 'b')).resolves.toEqual({
      kind: 'not_registered',
    });
  });

  it('rethrows network errors', async () => {
    get.mockRejectedValue(new ApiError('offline', { isNetworkError: true }));
    await expect(FileTrackerApi.markFileToEmployee('1', 'a', 'b')).rejects.toMatchObject({
      isNetworkError: true,
    });
  });
});

describe('FileTrackerApi searches', () => {
  it('maps and sorts movement history newest first', async () => {
    get.mockResolvedValue({
      data: {
        a: { dt: '01-01-2024 10:00', username: 'x', employee: 'y' },
        b: { dt: '05-03-2024 09:00', username: 'p' },
        c: null,
      },
    });
    const records = await FileTrackerApi.searchByCode('1024');
    expect(records).toEqual([
      { dt: '05-03-2024 09:00', username: 'p', employee: '-' },
      { dt: '01-01-2024 10:00', username: 'x', employee: 'y' },
    ]);
  });

  it('drops file results without a code', async () => {
    get.mockResolvedValue({ data: { a: { code: '1', filename: 'Tender' }, b: { filename: 'x' } } });
    expect(await FileTrackerApi.searchByFileName('tender')).toEqual([
      { code: '1', filename: 'Tender' },
    ]);
  });

  it('returns [] for a non-object body', async () => {
    get.mockResolvedValue({ data: 'No records' });
    expect(await FileTrackerApi.searchByFileName('x')).toEqual([]);
  });
});

describe('toApiError', () => {
  it('flags a request with no response as a network error', () => {
    const error = new AxiosError('timeout', 'ECONNABORTED');
    expect(toApiError(error)).toMatchObject({ isNetworkError: true });
  });

  it('keeps status and body of a server error', () => {
    const error = new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
      data: 'Server exploded',
      statusText: 'Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    const apiError = toApiError(error);
    expect(apiError).toMatchObject({ status: 500, isNetworkError: false });
    expect(apiError.bodyText).toBe('Server exploded');
  });
});
