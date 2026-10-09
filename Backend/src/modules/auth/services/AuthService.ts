import { IAuthService } from '../interfaces/IAuthService';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IRefreshSessionRepository } from '../interfaces/IRefreshSessionRepository';
import { IVerificationChallengeRepository } from '../interfaces/IVerificationChallengeRepository';
import { IPasswordResetTokenRepository } from '../interfaces/IPasswordResetTokenRepository';
import { IPasswordService } from './PasswordService';
import { ITokenService } from './TokenService';
import { IEmailService } from './EmailService';
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
  UserRole,
  AccountStatus,
  ChallengeType,
} from '../dtos/auth.dto';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  AccountDisabledError,
  UnverifiedAccountError,
} from '../../../shared/domain/errors/AppError';
import { generateSecureOtp, generateSecureToken, hashString } from '../../../shared/utils/cryptoUtils';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: IRefreshSessionRepository,
    private readonly challengeRepo: IVerificationChallengeRepository,
    private readonly resetTokenRepo: IPasswordResetTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
    private readonly refreshExpiryDays: number = 7
  ) { }

  private mapUserResponse(userDoc: any): UserResponseDTO {
    return {
      id: userDoc._id.toString(),
      fullName: userDoc.fullName,
      email: userDoc.email,
      phone: userDoc.phone,
      role: userDoc.role,
      status: userDoc.status,
      emailVerifiedAt: userDoc.emailVerifiedAt,
      createdAt: userDoc.createdAt,
    };
  }

  async registerParent(dto: RegisterParentDTO): Promise<{ user: UserResponseDTO; message: string }> {
    const email = dto.email.toLowerCase().trim();

    if (!dto.acceptedTerms) {
      throw new ValidationError('You must accept the terms and conditions to register.');
    }

    if (!dto.password || dto.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }

    const exists = await this.userRepo.existsByEmail(email);
    if (exists) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const newUser = await this.userRepo.create({
      fullName: dto.fullName.trim(),
      email,
      phone: dto.phone.trim(),
      passwordHash,
      role: UserRole.PARENT, // Strictly forced
      status: AccountStatus.PENDING_VERIFICATION,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    });

    const userId = newUser._id.toString();

    // Invalidate old challenges
    await this.challengeRepo.invalidateAllForUser(userId, ChallengeType.EMAIL_VERIFICATION);

    // Generate 6-digit OTP
    const rawOtp = generateSecureOtp(6);
    console.log("otp", rawOtp);

    const codeHash = hashString(rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.challengeRepo.create({
      userId,
      type: ChallengeType.EMAIL_VERIFICATION,
      codeHash,
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(newUser.email, newUser.fullName, rawOtp);

    return {
      user: this.mapUserResponse(newUser),
      message: 'Registration successful. A verification code has been sent to your email.',
    };
  }

  async verifyEmail(dto: VerifyEmailDTO): Promise<{ user: UserResponseDTO; message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new NotFoundError('Account with this email does not exist.');
    }

    if (user.status === AccountStatus.ACTIVE) {
      return {
        user: this.mapUserResponse(user),
        message: 'Account email is already verified.',
      };
    }

    const userId = user._id.toString();
    const challenge = await this.challengeRepo.findLatestValid(userId, ChallengeType.EMAIL_VERIFICATION);

    if (!challenge) {
      throw new ValidationError(
        'Verification code has expired or is invalid. Please request a new code.',
        'INVALID_OR_EXPIRED_CODE'
      );
    }

    const providedHash = hashString(dto.code.trim());

    if (challenge.codeHash !== providedHash) {
      const updated = await this.challengeRepo.incrementAttempt(challenge._id.toString());
      const attemptCount = updated ? updated.attemptCount : challenge.attemptCount + 1;
      const remaining = challenge.maxAttempts - attemptCount;

      if (remaining <= 0) {
        throw new ValidationError(
          'Maximum verification attempts exceeded. Please request a new code.',
          'MAX_ATTEMPTS_EXCEEDED'
        );
      }
      throw new ValidationError(
        `Invalid verification code. ${remaining} attempt(s) remaining.`,
        'INVALID_CODE'
      );
    }

    // Consume challenge
    await this.challengeRepo.consume(challenge._id.toString());

    // Activate user
    const updatedUser = await this.userRepo.updateStatus(userId, AccountStatus.ACTIVE, new Date());

    return {
      user: this.mapUserResponse(updatedUser || user),
      message: 'Email successfully verified. You can now log in to your account.',
    };
  }

  async resendVerification(dto: ResendVerificationDTO): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);

    // Enumeration defense
    if (!user) {
      return {
        message: 'If an unverified account exists with this email, a new verification code has been sent.',
      };
    }

    if (user.status === AccountStatus.ACTIVE) {
      return {
        message: 'This account email is already verified.',
      };
    }

    const userId = user._id.toString();
    await this.challengeRepo.invalidateAllForUser(userId, ChallengeType.EMAIL_VERIFICATION);

    const rawOtp = generateSecureOtp(6);
    const codeHash = hashString(rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.challengeRepo.create({
      userId,
      type: ChallengeType.EMAIL_VERIFICATION,
      codeHash,
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(user.email, user.fullName, rawOtp);

    return {
      message: 'A new verification code has been sent to your email.',
    };
  }

  async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email, password, or selected role.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email, password, or selected role.', 'INVALID_CREDENTIALS');
    }

    if (user.role.toUpperCase() !== dto.selectedRole.toUpperCase()) {
      throw new UnauthorizedError('Invalid email, password, or selected role.', 'INVALID_CREDENTIALS');
    }

    if (user.status === AccountStatus.DISABLED) {
      throw new AccountDisabledError('Your account has been disabled. Please contact school administration.');
    }

    if (user.status === AccountStatus.PENDING_VERIFICATION) {
      throw new UnverifiedAccountError('Please verify your email address before logging in.');
    }

    const userId = user._id.toString();

    // Access Token
    const accessToken = this.tokenService.generateAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    // Refresh Token
    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = hashString(rawRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshExpiryDays * 24 * 60 * 60 * 1000);

    await this.sessionRepo.create({
      userId,
      tokenHash,
      expiresAt,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });

    return {
      user: this.mapUserResponse(user),
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: '15m',
    };
  }

  async refreshSession(dto: RefreshTokenDTO): Promise<{ accessToken: string; refreshToken: string }> {
    if (!dto.refreshToken) {
      throw new UnauthorizedError('Refresh token is required.', 'MISSING_REFRESH_TOKEN');
    }

    const tokenHash = hashString(dto.refreshToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh session.', 'INVALID_SESSION');
    }

    const userId = session.userId.toString();

    if (session.isRevoked) {
      await this.sessionRepo.revokeAllForUser(userId);
      throw new UnauthorizedError('Session reuse detected. All sessions revoked for security.', 'SESSION_REUSED');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedError('Session has expired. Please log in again.', 'SESSION_EXPIRED');
    }

    const user = await this.userRepo.findById(userId);
    if (!user || user.status !== AccountStatus.ACTIVE) {
      await this.sessionRepo.revokeByTokenHash(tokenHash);
      throw new UnauthorizedError('User account is invalid or inactive.', 'ACCOUNT_INACTIVE');
    }

    // Token Rotation
    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = hashString(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshExpiryDays * 24 * 60 * 60 * 1000);

    await this.sessionRepo.revokeByTokenHash(tokenHash, newTokenHash);

    await this.sessionRepo.create({
      userId,
      tokenHash: newTokenHash,
      expiresAt,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });

    const newAccessToken = this.tokenService.generateAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      const tokenHash = hashString(refreshToken);
      await this.sessionRepo.revokeByTokenHash(tokenHash);
    }
    return { message: 'Logged out successfully.' };
  }

  async getCurrentUser(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    if (user.status === AccountStatus.DISABLED) {
      throw new AccountDisabledError('Your account has been disabled.');
    }
    return this.mapUserResponse(user);
  }

  async requestPasswordReset(dto: ForgotPasswordDTO, resetUrlBase: string): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);

    const genericResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    if (!user || user.status === AccountStatus.DISABLED) {
      return genericResponse;
    }

    const userId = user._id.toString();
    await this.resetTokenRepo.invalidateAllForUser(userId);

    const rawToken = generateSecureToken(32);
    const tokenHash = hashString(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.resetTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${resetUrlBase}?token=${rawToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetLink);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    if (!dto.token) {
      throw new ValidationError('Reset token is required.');
    }

    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long.');
    }

    const tokenHash = hashString(dto.token);
    const resetToken = await this.resetTokenRepo.findByTokenHash(tokenHash);

    if (!resetToken) {
      throw new ValidationError(
        'Invalid or expired password reset link. Please request a new one.',
        'INVALID_RESET_TOKEN'
      );
    }

    const userId = resetToken.userId.toString();
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User associated with this token no longer exists.');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.userRepo.updatePasswordHash(userId, newHash);

    await this.resetTokenRepo.consume(resetToken._id.toString());
    await this.sessionRepo.revokeAllForUser(userId);

    return {
      message: 'Password has been successfully reset. You can now log in with your new password.',
    };
  }

  async changePassword(dto: ChangePasswordDTO): Promise<{ message: string }> {
    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ValidationError('New password cannot be the same as the current password.');
    }

    const user = await this.userRepo.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isCurrentValid = await this.passwordService.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect.', 'INVALID_PASSWORD');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.userRepo.updatePasswordHash(dto.userId, newHash);

    await this.sessionRepo.revokeAllForUser(dto.userId);

    return {
      message: 'Password changed successfully.',
    };
  }
}
