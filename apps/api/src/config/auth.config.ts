/** DI token for the resolved auth configuration. */
export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

/** Strongly-typed JWT / token settings, resolved once from the environment. */
export interface AuthConfig {
  /** HMAC secret for short-lived access tokens. */
  accessSecret: string;
  /** HMAC secret for refresh tokens (distinct from the access secret). */
  refreshSecret: string;
  /** Access-token lifetime in seconds. */
  accessTtlSeconds: number;
  /** Refresh-token lifetime in seconds. */
  refreshTtlSeconds: number;
}

/**
 * Reads and validates auth configuration from environment variables.
 * Throws at startup if the JWT secrets are missing, so the app never boots in
 * an insecure half-configured state. (.env is loaded by ConfigModule/dotenv.)
 */
export function loadAuthConfig(): AuthConfig {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must both be set (see apps/api/.env.example).',
    );
  }
  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.',
    );
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2592000),
  };
}
