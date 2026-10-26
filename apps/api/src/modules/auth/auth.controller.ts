import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  type AuthSession,
  type AuthUser,
  type ForgotPasswordInput,
  forgotPasswordSchema,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  type RegisterResult,
  registerSchema,
  type ResetPasswordInput,
  resetPasswordSchema,
} from '@quiz-nest/shared';
import type { CookieOptions, Request, Response } from 'express';
import { API_PREFIX } from '../../app.setup.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { Env } from '../../config/env.js';
import { REFRESH_COOKIE, REFRESH_TOKEN_TTL_MS } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { RequestUser } from './auth.types.js';
import { CurrentUser, Public } from './decorators.js';
import { PasswordResetService } from './password-reset.service.js';

const MINUTE = 60_000;

/**
 * Teacher/admin accounts. Login returns a short-lived access token in the body and
 * sets a long-lived refresh token in an httpOnly cookie that only /api/auth receives.
 * The cookie is SameSite=Strict, so other websites can't make the browser send it.
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 10 * MINUTE } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResult> {
    const result = await this.auth.register(body);
    if ('pendingApproval' in result) {
      res.status(202);
      return result;
    }
    this.setRefreshCookie(res, result.refreshToken);
    return result.session;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: MINUTE } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const { session, refreshToken } = await this.auth.login(body);
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  /**
   * The web app calls this on page load and whenever the access token expires.
   * Returns null when there's no cookie at all: being logged out isn't an error.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: MINUTE } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession | null> {
    const cookie: string | undefined = req.cookies?.[REFRESH_COOKIE];
    if (!cookie) return null;

    try {
      const { session, refreshToken } = await this.auth.refresh(cookie);
      this.setRefreshCookie(res, refreshToken);
      return session;
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<null> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearRefreshCookie(res);
    return null;
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: MINUTE } })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ): Promise<null> {
    await this.passwordReset.requestReset(body.email);
    return null;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: MINUTE } })
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<null> {
    await this.passwordReset.resetPassword(body.token, body.password);
    this.clearRefreshCookie(res);
    return null;
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser): Promise<AuthUser> {
    return this.auth.me(user.id);
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: `/${API_PREFIX}/auth`,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, { ...this.cookieOptions(), maxAge: REFRESH_TOKEN_TTL_MS });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }
}
