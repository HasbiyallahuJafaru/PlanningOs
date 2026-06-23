import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AUTH_CONFIG, loadAuthConfig } from '../config/auth.config';
import { AuditService } from './audit.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';

/**
 * Auth feature module. Provides the resolved AuthConfig (validated at startup),
 * the passport JWT strategy, and the auth/token/audit services. JwtModule is
 * registered without a global secret because access and refresh tokens are
 * signed with different secrets, passed per-call.
 */
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_CONFIG, useFactory: loadAuthConfig },
    AuthService,
    TokenService,
    AuditService,
    JwtStrategy,
  ],
})
export class AuthModule {}
