/**
 * Authentication Configuration
 * @module config/auth.config
 */

/**
 * Validates and loads authentication configuration from environment variables.
 * Throws an error if required variables are missing.
 * @throws {Error} If JWT_SECRET or other required env vars are missing
 * @returns {Object} Configuration object with typed constants
 */
export function loadAuthConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const bcryptCost = parseInt(process.env.BCRYPT_COST || '12', 10);
  const resetTokenTtlHours = parseInt(
    process.env.RESET_TOKEN_TTL_HOURS || '1',
    10
  );

  // Validate required secrets
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required (min 32 bytes)'
    );
  }
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters (256 bits recommended)'
    );
  }

  if (isNaN(bcryptCost) || bcryptCost < 10) {
    throw new Error(
      'BCRYPT_COST must be a number >= 10 (recommended: 12)'
    );
  }

  return {
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    BCRYPT_COST: bcryptCost,
    RESET_TOKEN_TTL_HOURS: resetTokenTtlHours,
  };
}

/**
 * Load and cache auth config at module level
 */
export const authConfig = loadAuthConfig();

export default authConfig;
