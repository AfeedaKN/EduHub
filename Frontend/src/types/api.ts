export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorDetail;
  errors?: unknown;
  timestamp: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta?: PaginatedMeta;
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded';
  platform: string;
  uptime: number;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting';
    name?: string;
  };
  server: {
    nodeVersion: string;
    memoryUsageMB: number;
  };
}
