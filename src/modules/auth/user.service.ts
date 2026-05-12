/**
 * User registration and lookup service
 * @module modules/auth/user.service
 */

import bcrypt from 'bcrypt';
import { query } from '../../db/config';
import { User, NewUser } from './auth.types';
import { authConfig } from '../../config/auth.config';

/**
 * Service for user registration and lookup
 */
export class UserService {
  /**
   * Register a new user with email and password
   * @param {NewUser} dto - Registration input (email, password)
   * @returns {Promise<User>} Created user
   * @throws {Error} If email already exists
   */
  async register(dto: NewUser): Promise<User> {
    const email = dto.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error(
        `An account with this email (${email}) already exists.`
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(
      dto.password,
      authConfig.BCRYPT_COST
    );

    // Insert user
    const result = await query<User>(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       RETURNING id, email, password_hash, created_at, updated_at`,
      [email, password_hash]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Find a user by email
   * @param {string} email - Email address (case-insensitive)
   * @returns {Promise<User | null>} User record or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const result = await query<User>(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    return result.rows[0] || null;
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User | null>} User record or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Update user password (for password reset)
   * @param {string} userId - User ID
   * @param {string} newPassword - New plaintext password
   * @returns {Promise<User>} Updated user record
   */
  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const password_hash = await bcrypt.hash(
      newPassword,
      authConfig.BCRYPT_COST
    );

    const result = await query<User>(
      `UPDATE users 
       SET password_hash = $1, updated_at = now() 
       WHERE id = $2 
       RETURNING *`,
      [password_hash, userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

// Export singleton instance
export const userService = new UserService();
