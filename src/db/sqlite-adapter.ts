/**
 * SQLite Database Adapter for Testing
 * Provides a PostgreSQL-compatible interface using SQLite in-memory database
 * @module db/sqlite-adapter
 */

import Database from 'better-sqlite3';

interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

/**
 * SQLite adapter that provides a PostgreSQL-like interface
 */
class SQLiteAdapter {
  private db: Database.Database;
  private lastInsertContext: { table: string; params: unknown[] } | null = null;

  constructor() {
    // In-memory database for testing
    this.db = new Database(':memory:');
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Execute a parameterized query
   * @param {string} sql - SQL query
   * @param {unknown[]} params - Query parameters
   * @returns {QueryResult} Query result
   */
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): QueryResult<T> {
    try {
      // Convert Date objects to ISO strings for SQLite compatibility
      const convertedParams = params.map((p) => {
        if (p instanceof Date) {
          return p.toISOString();
        }
        return p;
      });

      // Convert PostgreSQL $1, $2 style params to ?
      let convertedSql = sql;
      let paramIndex = 1;
      while (convertedSql.includes(`$${paramIndex}`)) {
        convertedSql = convertedSql.replace(`$${paramIndex}`, '?');
        paramIndex++;
      }

      // Handle different query types
      if (
        convertedSql.trim().toUpperCase().startsWith('SELECT') ||
        convertedSql.trim().toUpperCase().startsWith('WITH')
      ) {
        const stmt = this.db.prepare(convertedSql);
        const rows = stmt.all(...convertedParams) as T[];
        return {
          rows,
          rowCount: rows.length,
        };
      } else if (convertedSql.trim().toUpperCase().includes('INSERT')) {
        // Handle INSERT...RETURNING
        if (convertedSql.trim().toUpperCase().includes('RETURNING')) {
          return this.handleInsertReturning<T>(convertedSql, convertedParams);
        } else {
          // Regular INSERT without RETURNING
          const stmt = this.db.prepare(convertedSql);
          const info = stmt.run(...convertedParams);
          return {
            rows: [],
            rowCount: info.changes,
          };
        }
      } else if (
        convertedSql.trim().toUpperCase().startsWith('UPDATE') ||
        convertedSql.trim().toUpperCase().startsWith('DELETE')
      ) {
        const stmt = this.db.prepare(convertedSql);
        const info = stmt.run(...convertedParams);

        return {
          rows: [],
          rowCount: info.changes,
        };
      } else {
        // Execute general statements
        this.db.exec(convertedSql);
        return {
          rows: [],
          rowCount: 0,
        };
      }
    } catch (error) {
      throw new Error(`SQLite query error: ${(error as Error).message}\nQuery: ${sql}`);
    }
  }

  /**
   * Handle INSERT...RETURNING queries
   * SQLite doesn't support RETURNING, so we execute INSERT then SELECT
   */
  private handleInsertReturning<T extends Record<string, unknown>>(
    sql: string,
    params: unknown[]
  ): QueryResult<T> {
    // Split INSERT and RETURNING parts
    const returningMatch = sql.match(/RETURNING\s+(.+?)(?:;|$)/i);
    if (!returningMatch) {
      throw new Error('Invalid RETURNING clause');
    }

    const returningCols = returningMatch[1].trim();
    const insertSql = sql
      .substring(0, sql.toUpperCase().indexOf('RETURNING'))
      .trim();

    // Execute the INSERT
    let convertedInsert = insertSql;
    let paramIndex = 1;
    while (convertedInsert.includes(`$${paramIndex}`)) {
      convertedInsert = convertedInsert.replace(`$${paramIndex}`, '?');
      paramIndex++;
    }

    const stmt = this.db.prepare(convertedInsert);
    const info = stmt.run(...params);

    if (info.changes === 0) {
      return {
        rows: [],
        rowCount: 0,
      };
    }

    // Extract table name from INSERT statement
    const tableMatch = insertSql.match(/INSERT\s+INTO\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not extract table name from INSERT');
    }

    const tableName = tableMatch[1];

    // Extract column names and values for WHERE clause
    const colsMatch = insertSql.match(/\(([^)]+)\)\s*VALUES/i);
    const valuesMatch = insertSql.match(/VALUES\s*\(([^)]+)\)/i);

    if (!colsMatch || !valuesMatch) {
      throw new Error('Could not parse INSERT columns/values');
    }

    const cols = colsMatch[1]
      .split(',')
      .map((c) => c.trim());
    const values = valuesMatch[1].split(',').map((v, idx) => ({
      col: cols[idx],
      param: params[idx],
    }));

    // Build a WHERE clause from the first value (usually email for users)
    // For now, use the first non-NULL param
    const whereCol = cols[0];
    const whereVal = params[0];

    const selectSql = `SELECT ${returningCols} FROM ${tableName} WHERE ${whereCol} = ?`;
    const selectStmt = this.db.prepare(selectSql);
    const rows = selectStmt.all(whereVal) as T[];

    return {
      rows,
      rowCount: rows.length,
    };
  }


  /**
   * Execute async query (matches pg interface)
   * @param {string} sql - SQL query
   * @param {unknown[]} params - Query parameters
   * @returns {Promise<QueryResult>} Query result
   */
  async queryAsync<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.query<T>(sql, params);
  }

  /**
   * Get a client for transactions (not supported in same way, returns this)
   * @returns {SQLiteAdapter} This adapter
   */
  getClient(): SQLiteAdapter {
    return this;
  }

  /**
   * Begin transaction
   */
  begin(): void {
    this.db.exec('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  commit(): void {
    this.db.exec('COMMIT');
  }

  /**
   * Rollback transaction
   */
  rollback(): void {
    this.db.exec('ROLLBACK');
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
  }

  /**
   * Execute raw SQL
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Get underlying database instance
   */
  getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Check if a token is blocklisted (synchronous)
   * @param {string} jti - JWT ID to check
   * @returns {boolean} True if blocklisted
   */
  isTokenBlocklisted(jti: string): boolean {
    try {
      const stmt = this.db.prepare('SELECT 1 FROM token_blocklist WHERE jti = ?');
      const result = stmt.get(jti);
      return !!result;
    } catch {
      return false;
    }
  }
}

export default SQLiteAdapter;
