import { isAxiosError } from 'axios';

const NETWORK_MESSAGE = 'Unable to reach the WRD server. Please check your connection.';

/**
 * Error thrown by every API call. Unlike a plain Error it keeps the HTTP
 * status and raw body, so callers can tell "the device couldn't reach the
 * server" (safe to queue offline and retry) from "the server answered with
 * an error" (retrying the same request won't help).
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly body?: unknown;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    options: { status?: number; body?: unknown; isNetworkError: boolean },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.body = options.body;
    this.isNetworkError = options.isNetworkError;
  }

  /** The response body as trimmed text, or '' when there is none. */
  get bodyText(): string {
    return typeof this.body === 'string' ? this.body.trim() : '';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    // No response at all = timeout / DNS / offline / TLS failure.
    if (!error.response) {
      return new ApiError(NETWORK_MESSAGE, { isNetworkError: true });
    }
    const { status, data } = error.response;
    const serverMessage =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : undefined;
    return new ApiError(serverMessage ?? `The WRD server returned an error (HTTP ${status}).`, {
      status,
      body: data,
      isNetworkError: false,
    });
  }

  return new ApiError(error instanceof Error ? error.message : NETWORK_MESSAGE, {
    isNetworkError: false,
  });
}
