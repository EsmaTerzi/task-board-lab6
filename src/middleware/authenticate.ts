/**
 * JWT Authentication Middleware
 * @module middleware/authenticate
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';

/**
 * Extend Express Request to include user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}

/**
 * Middleware to verify JWT and attach user to request
 * Expects Bearer token in Authorization header
 * @returns {Function} Express middleware
 */
export function authenticate(tokenService: TokenService) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    // Extract Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    if (!match) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const token = match[1];

    try {
      // Verify token
      const payload = tokenService.verify(token) as any;

      // Check if token is blocklisted
      tokenService
        .isBlocklisted(payload.jti)
        .then((isBlocklisted) => {
          if (isBlocklisted) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
          }

          // Attach user payload to request
          req.user = payload;
          next();
        })
        .catch(() => {
          res.status(401).json({ message: 'Unauthorized.' });
        });
    } catch {
      res.status(401).json({ message: 'Unauthorized.' });
    }
  };
}

export default authenticate;
