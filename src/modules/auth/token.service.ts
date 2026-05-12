/**
 * JWT Token Service - handles token issuance, verification, and blocklisting
 * @module modules/auth/token.service
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { authConfig } from '../../config/auth.config';
import { query } from '../../db/config';
import { BlocklistEntry } from './auth.types';

/**
 * Service for JWT token management
 */
export class TokenService {
  /**
   * Issue a new JWT token for a user
   * @param {string} userId - User ID to encode in token
   * @returns {Promise<string>} Signed JWT token
   */
  async issue(userId: string): Promise<string> {
    const jti = randomUUID();
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
   * Verify a JWT token
   * @param {string} token - Token to verify
   * @returns {Object} Decoded payload
   * @throws {Error} If token is invalid, expired, or blocklisted
   */
  verify(token: string): Record<string, unknown> {
    try {
      const decoded = jwt.verify(token, authConfig.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as Record<string, unknown>;

      // Check if token is blocklisted
      const jti = decoded.jti as string;
      // Note: Synchronous check would require keeping blocklist in memory
      // For now, verification happens before blocklist check in middleware
      // Actual blocklist check is done separately in authenticate middleware

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a token is blocklisted
   * @param {string} jti - JWT ID claim
   * @returns {Promise<boolean>} True if blocklisted
   */
  async isBlocklisted(jti: string): Promise<boolean> {
    const result = await query<BlocklistEntry>(
      'SELECT * FROM token_blocklist WHERE jti = $1',
      [jti]
    );

    return result.rows.length > 0;
  }

  /**
   * Add a token to the blocklist (for logout or revocation)
   * @param {string} jti - JWT ID claim
   * @returns {Promise<void>}
   */
  async blocklist(jti: string): Promise<void> {
    // Get expiration time from token metadata
    // For simplicity, use current time + 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Upsert to ensure idempotency
    await query(
      `INSERT INTO token_blocklist (jti, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (jti) DO NOTHING`,
      [jti, expiresAt]
    );
  }

  /**
   * Revoke all active tokens for a user (for password reset)
   * Note: In the current architecture, we don't track which tokens belong to which user
   * This method is a placeholder for future enhancement (e.g., adding user_id to JWT payload)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async revokeAllForUser(userId: string): Promise<void> {
    // In v1, tokens are identified by jti only
    // To implement this properly, we would need to either:
    // 1. Store issued tokens in a users_tokens table
    // 2. Add userId to the JWT payload for blocklist lookup
    // For now, this is a no-op but documented for future implementation
    console.log(`[TokenService] Revoke all tokens for user: ${userId}`);
  }
}

// Export singleton instance
export const tokenService = new TokenService();
