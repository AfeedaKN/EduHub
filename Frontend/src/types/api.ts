export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  timestamp: string;
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
