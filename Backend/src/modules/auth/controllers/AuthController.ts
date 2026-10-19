import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/IAuthService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
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

  private setTokenCookie(res: Response, token: string): void {
    res.cookie(this.cookieConfig.cookieName, token, this.getCookieOptions());
  }

  private clearTokenCookie(res: Response): void {
    res.clearCookie(this.cookieConfig.cookieName, {
      httpOnly: true,
      secure: this.cookieConfig.isProduction,
      sameSite: this.cookieConfig.sameSite,
      path: '/api/v1/auth',
    });
  }

  registerParent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.registerParent(req.body);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(result.user, result.message));
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.verifyEmail(req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(result.user, result.message));
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.resendVerification(req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userAgent = req.headers['user-agent'] as string | undefined;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = await this.authService.login({
        ...req.body,
        userAgent,
        ipAddress,
      });

      this.setTokenCookie(res, result.refreshToken);

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(
          {
            user: result.user,
            accessToken: result.accessToken,
            expiresIn: result.expiresIn,
          },
          'Login successful.'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies[this.cookieConfig.cookieName] || req.body.refreshToken;
      const userAgent = req.headers['user-agent'] as string | undefined;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = await this.authService.refreshSession({
        refreshToken,
        userAgent,
        ipAddress,
      });

      this.setTokenCookie(res, result.refreshToken);

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(
          {
            accessToken: result.accessToken,
          },
          'Session refreshed successfully.'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies[this.cookieConfig.cookieName] || req.body?.refreshToken;

      const result = await this.authService.logout(refreshToken);
      this.clearTokenCookie(res);

      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getCurrentUser(req.user!.sub);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(user, 'User profile retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.requestPasswordReset(req.body, this.resetUrlBase);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.changePassword({
        userId: req.user!.sub,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  };
}
