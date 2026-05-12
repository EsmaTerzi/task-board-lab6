/**
 * Database Configuration and Pool
 * @module config/db.config
 */

import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Create and configure PostgreSQL connection pool
 * @returns {Pool} Configured connection pool
 */
function createPool(): Pool {
  const databaseUrl =
    process.env.NODE_ENV === 'test'
      ? process.env.DATABASE_TEST_URL
      : process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL or DATABASE_TEST_URL environment variable is required`
    );
  }

  return new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * Global connection pool
 */
export const pool = createPool();

/**
 * Execute a parameterized query on the pool
 * @param {string} sql - SQL query with placeholders ($1, $2, ...)
 * @param {unknown[]} params - Query parameters
 * @returns {Promise<QueryResult>} Query result
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}

/**
 * Get a single client from the pool (for transactions)
 * @returns {Promise<PoolClient>} Database client
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close the pool
 * @returns {Promise<void>}
 */
export async function closePool(): Promise<void> {
  return pool.end();
}

export default pool;
