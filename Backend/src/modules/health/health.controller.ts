import { Request, Response } from 'express';
import { HealthService } from './health.service';
import { ApiResponse } from '../../utils/apiResponse';

export class HealthController {
  public static checkHealth(_req: Request, res: Response): void {
    const healthData = HealthService.getHealthStatus();
    ApiResponse.success(
      res,
      'EduHub API system is operational',
      healthData,
      200
    );
  }
}
