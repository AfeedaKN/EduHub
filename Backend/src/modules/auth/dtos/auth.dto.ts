export enum UserRole {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  MANAGEMENT = 'MANAGEMENT',
}

export enum AccountStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export enum ChallengeType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}

export interface RegisterParentDTO {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
}

export interface VerifyEmailDTO {
  email: string;
  code: string;
}

export interface ResendVerificationDTO {
  email: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  selectedRole: UserRole;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginResponseDTO {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
