import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';
import type { AuthResponse } from '@foodjet/shared';
import { authConfig } from '../../config/configuration';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/types/authenticated-user';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB — OWASP's minimum recommendation for argon2id
  timeCost: 2,
  parallelism: 1,
};

export interface AuthResult {
  auth: AuthResponse;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone ?? null,
      passwordHash: await argon2.hash(dto.password, ARGON2_OPTIONS),
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);

    // Verify against a dummy hash when the account is missing so that a wrong
    // email and a wrong password take the same time to answer. Otherwise the
    // response latency alone tells an attacker which emails are registered.
    if (!user) {
      await argon2.hash(dto.password, ARGON2_OPTIONS);
      throw new UnauthorizedException('Incorrect email or password');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Transparently upgrade the stored hash when the cost parameters move on.
    // This is the only moment the plaintext is available to rehash with.
    if (argon2.needsRehash(user.passwordHash, ARGON2_OPTIONS)) {
      const upgraded = await argon2.hash(dto.password, ARGON2_OPTIONS);
      await this.users.updatePasswordHash(user.id, upgraded);
      this.logger.log(`Upgraded password hash parameters for user ${user.id}`);
    }

    return this.buildAuthResult(user);
  }

  async refresh(presentedToken: string | undefined): Promise<AuthResult> {
    if (!presentedToken) {
      throw new UnauthorizedException('No active session');
    }

    const rotated = await this.refreshTokens.rotate(presentedToken);
    const user = await this.users.findById(rotated.userId);

    if (!user) {
      await this.refreshTokens.revokeAllForUser(rotated.userId);
      throw new UnauthorizedException('No active session');
    }

    return {
      auth: {
        user: UsersService.toPublic(user),
        ...(await this.signAccessToken(user)),
      },
      refreshToken: rotated.token,
      refreshExpiresAt: rotated.expiresAt,
    };
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (presentedToken) {
      await this.refreshTokens.revoke(presentedToken);
    }
  }

  /**
   * Verifies a bearer token outside the HTTP pipeline, where Passport guards do
   * not run — currently the WebSocket handshake. Returns undefined rather than
   * throwing so callers can fall back to anonymous access.
   */
  async verifyAccessToken(token: string | undefined): Promise<AuthenticatedUser | undefined> {
    if (!token) return undefined;

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.accessSecret,
      });

      const user = await this.users.findById(payload.sub);
      if (!user) return undefined;

      return { id: user.id, email: user.email, role: user.role };
    } catch {
      return undefined;
    }
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const [tokens, refresh] = await Promise.all([
      this.signAccessToken(user),
      this.refreshTokens.issue(user.id),
    ]);

    return {
      auth: { user: UsersService.toPublic(user), ...tokens },
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  private async signAccessToken(
    user: User,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const expiresIn = this.config.accessTtlSeconds;

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.accessSecret,
      expiresIn,
    });

    return { accessToken, expiresIn };
  }
}
