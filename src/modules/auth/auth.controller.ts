/**
 * Authentication Controller - HTTP request handlers
 * @module modules/auth/auth.controller
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AuthService, LoginDTO } from './auth.service';
import { TokenService } from './token.service';
import { RegisterInput, LoginInput } from './auth.schemas';
import { AuthenticatedRequest } from '../../middleware/authenticate';

/**
 * Auth controller with dependency injection
 */
export class AuthController {
  private userService: UserService;
  private authService: AuthService;

  constructor(userService: UserService, tokenService: TokenService) {
    this.userService = userService;
    this.authService = new AuthService(userService, tokenService);
  }

  /**
   * Handle user registration
   * @route POST /auth/register
   */
  async register(
    req: Request<never, never, RegisterInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await this.userService.register(req.body);
      res.status(201).json({ id: user.id });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          message: 'An account with this email already exists.',
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Handle user login
   * @route POST /auth/login
   */
  async login(
    req: Request<never, never, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: LoginDTO = {
        email: req.body.email,
        password: req.body.password,
      };
      const result = await this.authService.login(dto);
      res.status(200).json({ accessToken: result.accessToken });
    } catch (error) {
      // Always return 401 without details to prevent enumeration
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  }

  /**
   * Handle user logout (requires authentication)
   * @route POST /auth/logout
   */
  async logout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: 'Unauthorized.' });
        return;
      }

      const match = authHeader.match(/^Bearer\s+(.+)$/);
      if (!match) {
        res.status(401).json({ message: 'Unauthorized.' });
        return;
      }

      const token = match[1];
      await this.authService.logout(token);

      res.status(204).send();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized.' });
    }
  }
}

/**
 * Create controller instance with dependencies
 */
export function createAuthController(
  userService: UserService,
  tokenService: TokenService
): AuthController {
  return new AuthController(userService, tokenService);
}
