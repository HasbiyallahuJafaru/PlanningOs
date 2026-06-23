import type { userRole } from '../db/schema';

/** The application roles (mirrors the user_role enum). */
export type UserRole = (typeof userRole.enumValues)[number];

/** Claims carried by an access token. Kept small — no PII beyond email. */
export interface AccessTokenPayload {
  /** user id */
  sub: string;
  /** tenant id (the tenant claim used for scoping) */
  tid: string;
  /** user role */
  role: UserRole;
  /** user email */
  email: string;
}

/** Claims carried by a refresh token. */
export interface RefreshTokenPayload {
  /** user id */
  sub: string;
  /** tenant id */
  tid: string;
  /** token family id (shared across a rotation chain) */
  fam: string;
  /** this token's row id (refresh_tokens.id) */
  jti: string;
}

/**
 * The authenticated principal attached to `request.user` by JwtStrategy.
 * Downstream code reads `tenantId` from here to scope all data access.
 */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

/** A freshly issued token pair returned to clients. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** access-token lifetime in seconds, for client-side refresh scheduling */
  expiresIn: number;
}
