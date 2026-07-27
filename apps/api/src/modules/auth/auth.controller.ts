import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthResponse, User } from '@foodjet/shared';
import { appConfig } from '../../config/configuration';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UsersService } from '../users/users.service';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create an account and start a session' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.commit(await this.auth.register(dto), res);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Exchange credentials for an access token' })
  @ApiResponse({ status: 401, description: 'Incorrect email or password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.commit(await this.auth.login(dto), res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh cookie for a fresh access token',
    description:
      'Reads the httpOnly refresh cookie, revokes it and issues a replacement. ' +
      'Reusing an already-rotated token revokes every session for that user.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const presented = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    return this.commit(await this.auth.refresh(presented), res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
    clearRefreshCookie(res, this.config.isProduction);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the signed-in user' })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<User> {
    const user = await this.users.findByIdOrFail(current.id);
    return UsersService.toPublic(user);
  }

  /** Writes the rotated refresh token to its cookie and returns the JSON body. */
  private commit(result: AuthResult, res: Response): AuthResponse {
    setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresAt,
      this.config.isProduction,
    );
    return result.auth;
  }
}
