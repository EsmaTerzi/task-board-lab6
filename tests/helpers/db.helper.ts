/**
 * Database test helper functions
 * Works with both PostgreSQL and SQLite
 * @module tests/helpers/db.helper
 */

import { pool, query } from '@db/config';
import SQLiteAdapter from '@db/sqlite-adapter';

/**
 * Get a connection from the test pool
 * @returns {Promise<any>} Database client
 */
export async function getTestDB() {
  // For SQLite, pool is already a SQLiteAdapter
  if (pool instanceof SQLiteAdapter) {
    return pool;
  }
  // For PostgreSQL
  return (pool as any).connect();
}

/**
 * Truncate all auth-related tables (for test isolation)
 * @returns {Promise<void>}
 */
export async function truncateAll(): Promise<void> {
  // For SQLite in-memory database
  if (pool instanceof SQLiteAdapter) {
    const db = pool.getDatabase();
    db.exec('DELETE FROM password_reset_tokens');
    db.exec('DELETE FROM token_blocklist');
    db.exec('DELETE FROM users');
    return;
  }

  // For PostgreSQL
  const client = await (pool as any).connect();
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
  // For SQLite
  if (pool instanceof SQLiteAdapter) {
    const db = pool.getDatabase();
    db.exec(`DELETE FROM ${tableName}`);
    return;
  }

  // For PostgreSQL
  const client = await (pool as any).connect();
  try {
    await client.query(`TRUNCATE TABLE ${tableName}`);
  } finally {
    client.release();
  }
}

/**
 * Get all users from database (for test assertions)
 * @returns {Promise<any[]>} Array of user records
 */
export async function getAllUsers(): Promise<any[]> {
  const result = await query('SELECT * FROM users');
  return result.rows;
}

/**
 * Get all blocklisted tokens
 * @returns {Promise<any[]>} Array of blocklist entries
 */
export async function getAllBlocklistedTokens(): Promise<any[]> {
  const result = await query('SELECT * FROM token_blocklist');
  return result.rows;
}
