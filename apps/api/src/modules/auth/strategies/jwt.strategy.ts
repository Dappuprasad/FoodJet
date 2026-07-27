import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../../config/configuration';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/types/authenticated-user';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly users: UsersService,
    @Inject(authConfig.KEY) config: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  /**
   * Re-reads the user on every request rather than trusting the claims wholesale.
   * A role revoked or an account deleted mid-session takes effect immediately
   * instead of lingering until the access token expires.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
