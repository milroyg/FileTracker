import { create } from 'axios';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';
import { toApiError } from './errors';

export const apiClient = create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json, text/plain, */*',
  },
});

apiClient.interceptors.request.use((config) => {
  logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '');
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const apiError = toApiError(error);
    logger.debug(`[API] failed ${error?.config?.url}: ${apiError.message}`);
    return Promise.reject(apiError);
  },
);
