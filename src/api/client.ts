import axios from 'axios';
import { ENV } from '../config/env';

// Enforce HTTPS everywhere for security compliance (replaces vulnerable cleartext HTTP URL3)
export const BASE_URL = ENV.API_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json, text/plain, */*',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Outgoing] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params || '');
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(`[API Error] ${error.message} from ${error.config?.url}`);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Unable to connect to Goa WRD server. Please verify your connection.';
    return Promise.reject(new Error(message));
  }
);
