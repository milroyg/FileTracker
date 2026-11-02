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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Unable to connect to Goa WRD server. Please verify your connection.';
    return Promise.reject(new Error(message));
  }
);
