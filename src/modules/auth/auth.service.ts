/**
 * Authentication Service - handles login and logout
 * @module modules/auth/auth.service
 */

import bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import { authConfig } from '../../config/auth.config';

/**
 * DTO for login request
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  accessToken: string;
}

/**
 * Service for authentication operations
 */
export class AuthService {
  /**
   * Create auth service with injected dependencies
   */
  constructor(
    private userService: UserService,
    private tokenService: TokenService
  ) {}

  /**
   * Authenticate user with email and password
   * @param {LoginDTO} dto - Email and password
   * @returns {Promise<LoginResponse>} Access token
   * @throws {Error} If credentials are invalid
   */
  async login(dto: LoginDTO): Promise<LoginResponse> {
    const email = dto.email.toLowerCase().trim();

    // Lookup user
    const user = await this.userService.findByEmail(email);

    // If user not found, still run bcrypt comparison against dummy hash
    // to prevent timing-based user enumeration (SEC015)
    if (!user) {
      // Use a dummy bcrypt hash (cost 12) to consume constant time
      const dummyHash =
        '$2b$12$R9h7cIPz0gi.URNNGU3zu.OPST9/PgBkqquzi.Ss5oLZBfH9rGvTm';
      await bcrypt.compare(dto.password, dummyHash);
      throw new Error('Invalid credentials.');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials.');
    }

    // Issue JWT token
    const accessToken = await this.tokenService.issue(user.id);

    return { accessToken };
  }

  /**
   * Revoke a token (logout)
   * @param {string} token - JWT token to revoke
   * @returns {Promise<void>}
   * @throws {Error} If token is invalid
   */
  async logout(token: string): Promise<void> {
    // Verify token is valid
    const payload = this.tokenService.verify(token) as any;

    // Add token jti to blocklist
    await this.tokenService.blocklist(payload.jti);
  }
}

// Export singleton instance
export const authService = (
  userService: UserService,
  tokenService: TokenService
) => new AuthService(userService, tokenService);
