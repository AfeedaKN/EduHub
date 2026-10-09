import { axiosClient } from './axiosClient';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'PARENT' | 'TEACHER' | 'MANAGEMENT';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

export interface RegisterParentPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  selectedRole: 'PARENT' | 'TEACHER' | 'MANAGEMENT';
}

export interface LoginResponseData {
  user: UserResponse;
  accessToken: string;
  expiresIn: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponseWrapper<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const authApi = {
  // Parent Registration
  registerParent: async (payload: RegisterParentPayload): Promise<ApiResponseWrapper<UserResponse>> => {
    const res = await axiosClient.post<ApiResponseWrapper<UserResponse>>('/auth/parents/register', payload);
    return res.data;
  },

  // Verify Email OTP
  verifyEmail: async (payload: VerifyEmailPayload): Promise<ApiResponseWrapper<UserResponse>> => {
    const res = await axiosClient.post<ApiResponseWrapper<UserResponse>>('/auth/verify-email', payload);
    return res.data;
  },

  // Resend OTP
  resendVerification: async (payload: ResendVerificationPayload): Promise<ApiResponseWrapper<null>> => {
    const res = await axiosClient.post<ApiResponseWrapper<null>>('/auth/resend-verification', payload);
    return res.data;
  },

  // Common Login for all roles
  login: async (payload: LoginPayload): Promise<ApiResponseWrapper<LoginResponseData>> => {
    const res = await axiosClient.post<ApiResponseWrapper<LoginResponseData>>('/auth/login', payload);
    return res.data;
  },

  // Refresh Session
  refreshSession: async (): Promise<ApiResponseWrapper<{ accessToken: string }>> => {
    const res = await axiosClient.post<ApiResponseWrapper<{ accessToken: string }>>('/auth/refresh');
    return res.data;
  },

  // Logout
  logout: async (): Promise<ApiResponseWrapper<null>> => {
    const res = await axiosClient.post<ApiResponseWrapper<null>>('/auth/logout');
    return res.data;
  },

  // Get Current Authenticated Profile
  getMe: async (): Promise<ApiResponseWrapper<UserResponse>> => {
    const res = await axiosClient.get<ApiResponseWrapper<UserResponse>>('/auth/me');
    return res.data;
  },

  // Request Password Reset
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponseWrapper<null>> => {
    const res = await axiosClient.post<ApiResponseWrapper<null>>('/auth/forgot-password', payload);
    return res.data;
  },

  // Reset Password with Token
  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponseWrapper<null>> => {
    const res = await axiosClient.post<ApiResponseWrapper<null>>('/auth/reset-password', payload);
    return res.data;
  },

  // Change Password
  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponseWrapper<null>> => {
    const res = await axiosClient.patch<ApiResponseWrapper<null>>('/auth/change-password', payload);
    return res.data;
  },
};
