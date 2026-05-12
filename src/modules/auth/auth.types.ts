/**
 * Shared TypeScript interfaces and types for authentication module
 * @module modules/auth/auth.types
 */

/**
 * Registered user in the database
 */
export interface User extends Record<string, unknown> {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input data for user registration
 */
export interface NewUser {
  email: string;
  password: string;
}

/**
 * JWT token payload
 */
export interface AuthTokenPayload {
  sub: string; // User ID
  jti: string; // JWT ID (for blocklisting)
  iat: number; // Issued At
  exp: number; // Expiration
}

/**
 * Password reset token record in database
 */
export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/**
 * Token blocklist entry
 */
export interface BlocklistEntry {
  jti: string;
  expires_at: Date;
  created_at: Date;
}
