/**
 * JWT test helper functions
 * @module tests/helpers/jwt.helper
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { authConfig } from '../../src/config/auth.config';

/**
 * Create a valid JWT token for testing
 * @param {string} userId - User ID to encode in token
 * @param {Object} overrides - Optional overrides for token claims
 * @returns {string} Signed JWT token
 */
export function makeToken(
  userId: string,
  overrides: Record<string, unknown> = {}
): string {
  const jti = randomUUID();
  const payload = {
    sub: userId,
    jti,
    ...overrides,
  };
  return jwt.sign(payload, authConfig.JWT_SECRET, {
    expiresIn: authConfig.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Create an expired JWT token for testing
 * @param {string} userId - User ID to encode in token
 * @returns {string} Expired JWT token
 */
export function makeExpiredToken(userId: string): string {
  const jti = randomUUID();
  const payload = {
    sub: userId,
    jti,
  };
  return jwt.sign(payload, authConfig.JWT_SECRET, {
    expiresIn: '-1h', // Expired 1 hour ago
    algorithm: 'HS256',
  });
}

/**
 * Create a JWT token with specific jti claim
 * @param {string} userId - User ID to encode
 * @param {string} jti - JWT ID claim value
 * @returns {string} Signed JWT token
 */
export function makeTokenWithJti(userId: string, jti: string): string {
  const payload = {
    sub: userId,
    jti,
  };
  return jwt.sign(payload, authConfig.JWT_SECRET, {
    expiresIn: authConfig.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Decode and return JWT payload (for assertions in tests)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded payload
 */
export function decodeToken(token: string): Record<string, unknown> {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid token');
  }
  return decoded as Record<string, unknown>;
}

/**
 * Verify a JWT token is valid
 * @param {string} token - JWT token to verify
 * @returns {Object} Verified payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token: string): Record<string, unknown> {
  return jwt.verify(token, authConfig.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as Record<string, unknown>;
}
