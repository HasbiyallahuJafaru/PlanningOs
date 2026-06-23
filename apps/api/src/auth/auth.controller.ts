import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from './current-user.decorator';
import { AuthService, type RequestContext } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

/** Auth endpoints: registration, login, token refresh/rotation, logout, and me. */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Register a new tenant + admin user. Returns the user and a token pair. */
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, AuthController.ctx(req));
  }

  /** Log in within a tenant (by slug). Returns the user and a token pair. */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, AuthController.ctx(req));
  }

  /** Exchange a refresh token for a new token pair (rotating, reuse-detecting). */
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, AuthController.ctx(req));
  }

  /** Revoke the refresh token's family. Always 204, even if already revoked. */
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto, @Req() req: Request): Promise<void> {
    await this.auth.logout(dto.refreshToken, AuthController.ctx(req));
  }

  /** The authenticated user, read via the tenant-scoped (RLS) connection. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user);
  }

  /** Example admin-only route, demonstrating RBAC via @Roles + RolesGuard. */
  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['admin'])
  adminCheck(@CurrentUser() user: AuthenticatedUser) {
    return { ok: true, role: user.role };
  }

  /** Extracts request metadata recorded on audit rows. */
  private static ctx(req: Request): RequestContext {
    return {
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }
}
