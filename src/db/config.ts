/**
 * Database Configuration and Pool
 * Supports both PostgreSQL (production) and SQLite (testing)
 * @module config/db.config
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import SQLiteAdapter from './sqlite-adapter';

// Determine which database adapter to use
const isTestEnv = process.env.NODE_ENV === 'test';
let pool: Pool | SQLiteAdapter;

if (isTestEnv) {
  // Use SQLite in-memory database for testing
  pool = new SQLiteAdapter();
  
  // Initialize test schema
  initializeTestDatabase(pool as SQLiteAdapter);
} else {
  // Use PostgreSQL for production
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL environment variable is required in production`
    );
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * Initialize SQLite test database schema
 */
function initializeTestDatabase(db: SQLiteAdapter): void {
  const database = db.getDatabase();
  
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create password_reset_tokens table
  database.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create token_blocklist table
  database.exec(`
    CREATE TABLE IF NOT EXISTS token_blocklist (
      jti TEXT PRIMARY KEY,
      expires_at DATETIME NOT NULL
    )
  `);
}

/**
 * Execute a parameterized query on the pool
 * @param {string} sql - SQL query with placeholders ($1, $2, ...)
 * @param {unknown[]} params - Query parameters
 * @returns {Promise<QueryResult>} Query result
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (isTestEnv) {
    const result = (pool as SQLiteAdapter).queryAsync<T>(sql, params);
    return result as Promise<QueryResult<T>>;
  }
  return (pool as Pool).query<T>(sql, params);
}

/**
 * Get a single client from the pool (for transactions)
 * @returns {Promise<PoolClient | SQLiteAdapter>} Database client
 */
export async function getClient(): Promise<PoolClient | SQLiteAdapter> {
  if (isTestEnv) {
    return (pool as SQLiteAdapter).getClient();
  }
  return (pool as Pool).connect();
}

/**
 * Close the pool
 * @returns {Promise<void>}
 */
export async function closePool(): Promise<void> {
  if (isTestEnv) {
    (pool as SQLiteAdapter).close();
  } else {
    await (pool as Pool).end();
  }
}

export { pool };
export default pool;
