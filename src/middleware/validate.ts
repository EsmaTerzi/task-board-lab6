/**
 * Generic Zod validation middleware for Express
 * @module middleware/validate
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Creates a validation middleware that parses and validates request body against a Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        errors: result.error.flatten(),
      });
      return;
    }

    // Replace req.body with validated and typed data
    req.body = result.data;
    next();
  };
}

export default validate;
