/**
 * Database test helper functions
 * @module tests/helpers/db.helper
 */

import { pool } from '../../src/db/config';

/**
 * Get a connection from the test pool
 * @returns {Promise<any>} Database client
 */
export async function getTestDB() {
  return pool.connect();
}

/**
 * Truncate all auth-related tables (for test isolation)
 * @returns {Promise<void>}
 */
export async function truncateAll(): Promise<void> {
  const client = await pool.connect();
  try {
    // Disable FK constraints temporarily
    await client.query('SET session_replication_role = REPLICA');

    // Truncate all tables
    await client.query('TRUNCATE TABLE password_reset_tokens CASCADE');
    await client.query('TRUNCATE TABLE token_blocklist CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');

    // Re-enable FK constraints
    await client.query('SET session_replication_role = DEFAULT');
  } finally {
    client.release();
  }
}

/**
 * Truncate specific table
 * @param {string} tableName - Name of table to truncate
 * @returns {Promise<void>}
 */
export async function truncateTable(tableName: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SET session_replication_role = REPLICA');
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    await client.query('SET session_replication_role = DEFAULT');
  } finally {
    client.release();
  }
}

/**
 * Get all users from database (for test assertions)
 * @returns {Promise<any[]>} Array of user records
 */
export async function getAllUsers(): Promise<any[]> {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
}

/**
 * Get all blocklisted tokens
 * @returns {Promise<any[]>} Array of blocklist entries
 */
export async function getAllBlocklistedTokens(): Promise<any[]> {
  const result = await pool.query('SELECT * FROM token_blocklist');
  return result.rows;
}
