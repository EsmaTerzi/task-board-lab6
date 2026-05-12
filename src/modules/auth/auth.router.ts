/**
 * Authentication Router
 * @module modules/auth/auth.router
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { RegisterSchema, LoginSchema } from './auth.schemas';
import { authenticate } from '../../middleware/authenticate';
import { TokenService } from './token.service';

/**
 * Create auth router with dependencies
 */
export function createAuthRouter(
  controller: AuthController,
  tokenService: TokenService
): Router {
  const router = Router();

  // POST /auth/register
  router.post(
    '/register',
    validate(RegisterSchema),
    (req: Request, res: Response, next: NextFunction) => controller.register(req as any, res, next)
  );

  // POST /auth/login
  router.post(
    '/login',
    validate(LoginSchema),
    (req: Request, res: Response, next: NextFunction) => controller.login(req as any, res, next)
  );

  // POST /auth/logout (protected)
  router.post(
    '/logout',
    authenticate(tokenService),
    (req: Request, res: Response, next: NextFunction) => controller.logout(req as any, res, next)
  );

  return router;
}

export default createAuthRouter;
