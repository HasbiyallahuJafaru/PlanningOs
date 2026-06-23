import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_CONFIG, type AuthConfig } from '../config/auth.config';
import type { AccessTokenPayload, AuthenticatedUser } from './auth.types';

/**
 * Passport JWT strategy for access tokens.
 *
 * Extracts the bearer token, verifies it against the access secret (and its
 * expiry), then maps the validated claims to the AuthenticatedUser shape that
 * is attached to `request.user`. passport-jwt rejects expired/invalid tokens
 * before `validate` is called, so reaching here means the token is sound.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(AUTH_CONFIG) config: AuthConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  /**
   * @param payload - the verified access-token claims.
   * @returns the principal stored on request.user.
   */
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      tenantId: payload.tid,
      role: payload.role,
      email: payload.email,
    };
  }
}
