import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { AUTH_CONFIG, type AuthConfig } from '../config/auth.config';
import { DRIZZLE_PRIVILEGED, type Database } from '../db/drizzle.provider';
import { TenantDb } from '../db/tenant-db.service';
import { tenants, users } from '../db/schema';
import { AuditService } from './audit.service';
import type { AuthenticatedUser, TokenPair, UserRole } from './auth.types';
import { TokenService } from './token.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

/** Request metadata captured for audit rows. */
export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

/** Public (sanitised) user representation — never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

/** Result of register/login — the user plus a token pair. */
export interface AuthResult {
  user: PublicUser;
  tokens: TokenPair;
}

/**
 * Orchestrates authentication. Bootstrap operations (register/login/refresh)
 * use the privileged connection since they precede or span tenant context;
 * `me()` reads through the RLS-enforced TenantDb to demonstrate (and exercise)
 * tenant-scoped access. A generic "Invalid credentials" message is returned on
 * every login failure to avoid tenant/user enumeration.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_PRIVILEGED) private readonly db: Database,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    private readonly tenantDb: TenantDb,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Registers a new tenant and its first admin user, returning tokens. */
  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    const slug = dto.tenantSlug.toLowerCase();
    const email = dto.email.toLowerCase();

    const [existing] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (existing) {
      throw new ConflictException('That tenant slug is already taken');
    }

    const passwordHash = await argonHash(dto.password);

    const created = await this.db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: dto.tenantName, slug })
        .returning({ id: tenants.id });
      const [user] = await tx
        .insert(users)
        .values({ tenantId: tenant.id, email, passwordHash, role: 'admin' })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          tenantId: users.tenantId,
        });
      return user;
    });

    await this.audit.record({
      eventType: 'user.registered',
      tenantId: created.tenantId,
      actorUserId: created.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      payload: { slug },
    });

    return { user: created, tokens: await this.issueTokens(created) };
  }

  /** Authenticates a user within a tenant (resolved by slug), returning tokens. */
  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    const slug = dto.tenantSlug.toLowerCase();
    const email = dto.email.toLowerCase();

    const [tenant] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    const [user] = tenant
      ? await this.db
          .select()
          .from(users)
          .where(and(eq(users.tenantId, tenant.id), eq(users.email, email)))
          .limit(1)
      : [];

    const passwordOk = user
      ? await argonVerify(user.passwordHash, dto.password)
      : false;

    if (!user || !passwordOk) {
      await this.audit.record({
        eventType: 'login.failure',
        tenantId: tenant?.id ?? null,
        actorUserId: user?.id ?? null,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { slug, email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit.record({
      eventType: 'login.success',
      tenantId: user.tenantId,
      actorUserId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { user: this.toPublicUser(user), tokens: await this.issueTokens(user) };
  }

  /** Rotates a refresh token, enforcing reuse detection. */
  async refresh(refreshToken: string, ctx: RequestContext): Promise<TokenPair> {
    const result = await this.tokens.rotate(refreshToken);

    if (result.status === 'reuse') {
      await this.audit.record({
        eventType: 'token.reuse_detected',
        tenantId: result.tenantId,
        actorUserId: result.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { familyId: result.familyId },
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (result.status === 'invalid') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.tokens.signAccessToken(user);
    await this.audit.record({
      eventType: 'token.refreshed',
      tenantId: user.tenantId,
      actorUserId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return {
      accessToken,
      refreshToken: result.refreshToken,
      expiresIn: this.config.accessTtlSeconds,
    };
  }

  /** Revokes the token family behind a refresh token (logout). Idempotent. */
  async logout(refreshToken: string, ctx: RequestContext): Promise<void> {
    const familyId = await this.tokens.readFamily(refreshToken);
    if (familyId) {
      await this.tokens.revokeFamily(familyId);
      await this.audit.record({
        eventType: 'logout',
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { familyId },
      });
    }
  }

  /**
   * Returns the authenticated user, read through the RLS-enforced connection
   * scoped to their tenant — exercising the tenant-isolation path end to end.
   */
  async me(principal: AuthenticatedUser): Promise<PublicUser> {
    const [user] = await this.tenantDb.run(principal.tenantId, (tx) =>
      tx
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          tenantId: users.tenantId,
        })
        .from(users)
        .where(eq(users.id, principal.userId))
        .limit(1),
    );
    if (!user) {
      // Should not happen for a valid token; treated as unauthorized.
      throw new UnauthorizedException();
    }
    return user;
  }

  /** Builds an access + refresh token pair for a user. */
  private async issueTokens(user: {
    id: string;
    tenantId: string;
    role: UserRole;
    email: string;
  }): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken(user),
      this.tokens.issueRefreshToken(user.tenantId, user.id),
    ]);
    return { accessToken, refreshToken, expiresIn: this.config.accessTtlSeconds };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
