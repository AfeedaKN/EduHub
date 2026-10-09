import { Request, Response } from 'express';
import { IAuthService } from '../interfaces/IAuthService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { CookieOptions } from 'express';

export interface AuthCookieConfig {
  cookieName: string;
  isProduction: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAgeDays: number;
}

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly cookieConfig: AuthCookieConfig,
    private readonly resetUrlBase: string
  ) {}

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.cookieConfig.isProduction,
      sameSite: this.cookieConfig.sameSite,
      path: '/api/v1/auth',
      maxAge: this.cookieConfig.maxAgeDays * 24 * 60 * 60 * 1000,
    };
  }

  registerParent = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.registerParent(req.body);
    res.status(201).json(ApiResponse.success(result.user, result.message));
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.verifyEmail(req.body);
    res.status(200).json(ApiResponse.success(result.user, result.message));
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resendVerification(req.body);
    res.status(200).json(ApiResponse.success(null, result.message));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const userAgent = req.headers['user-agent'] as string | undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = await this.authService.login({
      ...req.body,
      userAgent,
      ipAddress,
    });

    res.cookie(this.cookieConfig.cookieName, result.refreshToken, this.getCookieOptions());

    res.status(200).json(
      ApiResponse.success(
        {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
        'Login successful.'
      )
    );
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies[this.cookieConfig.cookieName] || req.body.refreshToken;
    const userAgent = req.headers['user-agent'] as string | undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = await this.authService.refreshSession({
      refreshToken,
      userAgent,
      ipAddress,
    });

    res.cookie(this.cookieConfig.cookieName, result.refreshToken, this.getCookieOptions());

    res.status(200).json(
      ApiResponse.success(
        {
          accessToken: result.accessToken,
        },
        'Session refreshed successfully.'
      )
    );
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies[this.cookieConfig.cookieName] || req.body?.refreshToken;

    const result = await this.authService.logout(refreshToken);

    res.clearCookie(this.cookieConfig.cookieName, {
      httpOnly: true,
      secure: this.cookieConfig.isProduction,
      sameSite: this.cookieConfig.sameSite,
      path: '/api/v1/auth',
    });

    res.status(200).json(ApiResponse.success(null, result.message));
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.getCurrentUser(req.user!.sub);
    res.status(200).json(ApiResponse.success(user, 'User profile retrieved successfully.'));
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.requestPasswordReset(req.body, this.resetUrlBase);
    res.status(200).json(ApiResponse.success(null, result.message));
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resetPassword(req.body);
    res.status(200).json(ApiResponse.success(null, result.message));
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.changePassword({
      userId: req.user!.sub,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.status(200).json(ApiResponse.success(null, result.message));
  };
}
