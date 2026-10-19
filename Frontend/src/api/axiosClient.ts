import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const axiosClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach JWT token if present
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('eduhub_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract error message cleanly
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const errorData = error.response?.data?.error;
    const message = errorData?.message || error.response?.data?.message || error.message || 'Something went wrong';
    const code = errorData?.code || 'UNKNOWN_ERROR';
    const details = errorData?.details;

    const customError = {
      message,
      code,
      details,
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);

export interface ApiCustomError {
  message: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export function isApiCustomError(error: unknown): error is ApiCustomError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (isApiCustomError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallbackMessage;
}

export default axiosClient;
