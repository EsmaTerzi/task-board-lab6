/**
 * Express Application Factory
 * @module app
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createAuthRouter } from './modules/auth/auth.router';
import { createAuthController } from './modules/auth/auth.controller';
import { UserService } from './modules/auth/user.service';
import { TokenService } from './modules/auth/token.service';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize services
  const userService = new UserService();
  const tokenService = new TokenService();
  const authController = createAuthController(userService, tokenService);

  // Routes
  app.use('/auth', createAuthRouter(authController, tokenService));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Global error handler
  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction): void => {
      console.error('[Error]', err.message);

      // Don't expose internal error details
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  );

  // 404 handler
  app.use((req: Request, res: Response): void => {
    res.status(404).json({
      message: 'Not found',
    });
  });

  return app;
}

// Start server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
