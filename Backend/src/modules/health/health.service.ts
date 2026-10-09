import mongoose from 'mongoose';
import os from 'os';

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

export class HealthService {
  public static getHealthStatus(): SystemHealthData {
    const dbStateMap: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbStateCode = mongoose.connection.readyState;
    const dbStatus = dbStateMap[dbStateCode] || 'disconnected';
    const isDbHealthy = dbStateCode === 1;

    const memoryUsage = process.memoryUsage();

    return {
      status: isDbHealthy ? 'healthy' : 'degraded',
      platform: 'EduHub School ERP Backend',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || undefined,
      },
      server: {
        nodeVersion: process.version,
        memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    };
  }
}
