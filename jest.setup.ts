/**
 * Jest setup file - runs before all tests
 * Loads environment variables from .env file
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test';
