import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull } from 'drizzle-orm';
import { AUTH_CONFIG, type AuthConfig } from '../config/auth.config';
import { DRIZZLE_PRIVILEGED, type Database } from '../db/drizzle.provider';
import { refreshTokens } from '../db/schema';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  UserRole,
} from './auth.types';

/** Minimal user shape needed to mint tokens. */
interface TokenUser {
  id: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

/** Outcome of attempting to rotate a presented refresh token. */
export type RotateResult =
  | {
      status: 'ok';
      tenantId: string;
      userId: string;
      familyId: string;
      refreshToken: string;
    }
  | { status: 'invalid' }
  | { status: 'reuse'; tenantId: string; userId: string; familyId: string };

/**
 * Issues and rotates tokens.
 *
 * Access tokens are short-lived signed JWTs. Refresh tokens are signed JWTs
 * (distinct secret) whose row in `refresh_tokens` is the source of truth for
 * revocation and rotation. Only the SHA-256 of the refresh token is stored.
 * Rotation revokes the presented token and issues a replacement in the same
 * family; presenting an already-revoked token is treated as theft and revokes
 * the whole family. Refresh-token persistence uses the privileged connection.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(DRIZZLE_PRIVILEGED) private readonly db: Database,
  ) {}

  /** Signs a short-lived access token for the given user. */
  signAccessToken(user: TokenUser): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      tid: user.tenantId,
      role: user.role,
      email: user.email,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessTtlSeconds,
    });
  }

  /**
   * Issues a brand-new refresh token (new family) for a fresh login/registration.
   */
  issueRefreshToken(tenantId: string, userId: string): Promise<string> {
    return this.persistRefreshToken(this.db, tenantId, userId, randomUUID());
  }

  /** SHA-256 hex of a token string. */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Signs a refresh JWT, stores its hash, and returns the token string.
   * @param executor - the privileged db or an open transaction.
   */
  private async persistRefreshToken(
    executor: Database,
    tenantId: string,
    userId: string,
    familyId: string,
  ): Promise<string> {
    const id = randomUUID();
    const payload: RefreshTokenPayload = {
      sub: userId,
      tid: tenantId,
      fam: familyId,
      jti: id,
    };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.refreshSecret,
      expiresIn: this.config.refreshTtlSeconds,
    });
    const expiresAt = new Date(Date.now() + this.config.refreshTtlSeconds * 1000);

    await executor.insert(refreshTokens).values({
      id,
      tenantId,
      userId,
      tokenHash: this.hash(token),
      familyId,
      expiresAt,
    });
    return token;
  }

  /**
   * Verifies and rotates a presented refresh token. See class docs for the
   * reuse-detection contract. Never throws on auth failures — returns a status
   * the caller maps to an HTTP response (so it can audit first).
   */
  async rotate(presentedToken: string): Promise<RotateResult> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(presentedToken, {
        secret: this.config.refreshSecret,
      });
    } catch {
      return { status: 'invalid' };
    }

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(refreshTokens)
        .for('update')
        .where(eq(refreshTokens.id, payload.jti))
        .limit(1);

      if (!row || row.tokenHash !== this.hash(presentedToken)) {
        return { status: 'invalid' };
      }

      // Already revoked → this is a replay of a rotated/stolen token.
      if (row.revokedAt !== null) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.familyId, row.familyId),
              isNull(refreshTokens.revokedAt),
            ),
          );
        return {
          status: 'reuse',
          tenantId: row.tenantId,
          userId: row.userId,
          familyId: row.familyId,
        };
      }

      if (row.expiresAt.getTime() <= Date.now()) {
        return { status: 'invalid' };
      }

      // Rotate: issue a replacement in the same family, then revoke this one.
      const newToken = await this.persistRefreshToken(
        tx as unknown as Database,
        row.tenantId,
        row.userId,
        row.familyId,
      );
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, row.id));

      return {
        status: 'ok',
        tenantId: row.tenantId,
        userId: row.userId,
        familyId: row.familyId,
        refreshToken: newToken,
      };
    });
  }

  /** Revokes every still-active token in a family (used on logout). */
  async revokeFamily(familyId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  /** Reads the family id from a refresh token without rotating it. */
  async readFamily(presentedToken: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(
        presentedToken,
        { secret: this.config.refreshSecret },
      );
      return payload.fam;
    } catch {
      return null;
    }
  }
}
