import {
  RegisterParentDTO,
  VerifyEmailDTO,
  ResendVerificationDTO,
  LoginDTO,
  LoginResponseDTO,
  RefreshTokenDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  UserResponseDTO,
} from '../dtos/auth.dto';

export interface IAuthService {
  registerParent(dto: RegisterParentDTO): Promise<{ user: UserResponseDTO; message: string }>;
  verifyEmail(dto: VerifyEmailDTO): Promise<{ user: UserResponseDTO; message: string }>;
  resendVerification(dto: ResendVerificationDTO): Promise<{ message: string }>;
  login(dto: LoginDTO): Promise<LoginResponseDTO>;
  refreshSession(dto: RefreshTokenDTO): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken?: string): Promise<{ message: string }>;
  getCurrentUser(userId: string): Promise<UserResponseDTO>;
  requestPasswordReset(dto: ForgotPasswordDTO, resetUrlBase: string): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }>;
  changePassword(dto: ChangePasswordDTO): Promise<{ message: string }>;
}
