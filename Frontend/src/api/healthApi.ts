import axiosClient from './axiosClient';
import { ApiResponse, SystemHealthData } from '../types/api';

export const healthApi = {
  getSystemHealth: async (): Promise<ApiResponse<SystemHealthData>> => {
    const response = await axiosClient.get<ApiResponse<SystemHealthData>>('/health');
    return response.data;
  },
};
