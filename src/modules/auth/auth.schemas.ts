/**
 * Input validation schemas using Zod
 * @module modules/auth/auth.schemas
 */

import { z } from 'zod';

/**
 * Schema for user registration request
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema for user login request
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema for password reset request
 */
export const ResetRequestSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .transform((val) => val.toLowerCase()),
});

export type ResetRequestInput = z.infer<typeof ResetRequestSchema>;

/**
 * Schema for password reset confirmation
 */
export const ResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),
});

export type ResetConfirmInput = z.infer<typeof ResetConfirmSchema>;
