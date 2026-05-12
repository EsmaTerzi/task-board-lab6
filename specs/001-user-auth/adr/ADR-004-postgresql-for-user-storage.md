# ADR-004: PostgreSQL for User and Token Storage

**Date**: 2026-05-12  
**Status**: Accepted  
**Context**: We need a persistent store for users, password reset tokens, and token blocklist metadata.

## Decision

We will use **PostgreSQL 16** as the primary relational database for all user authentication data.

## Rationale

- **Relational Schema**: Users, password reset tokens, and audit logs fit naturally into normalized tables.
- **ACID Guarantees**: Transactions ensure registration and token issuance are atomic.
- **Standard for Node.js**: pg / postgres libraries are mature and widely used.
- **Constitutional Alignment**: Eliminates magic strings; schema is explicitly version-controlled via migrations.

## Alternatives Considered

1. **MongoDB/NoSQL**
   - ❌ Adds complexity for schema validation; RDBMS is better for auth data (structured, validated).

2. **SQLite** (embedded)
   - ❌ Single-process only; does not support concurrent deployments; not suitable for production.

3. **DynamoDB / Cloud-Native Store**
   - ❌ Increases vendor lock-in; overkill for v1; PostgreSQL is portable.

## Database Schema

```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- token_blocklist table (metadata only; in-process Set is primary)
CREATE TABLE token_blocklist (
  id SERIAL PRIMARY KEY,
  jti VARCHAR(255) UNIQUE NOT NULL,
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

## Consequences

- ✅ Durable, auditable user records.
- ✅ Supports password reset tokens with expiry.
- ✅ Optional persistence of blocklist revocations (for recovery after process restart).
- ⚠️ Adds a network call for user lookups; acceptable (cache can be added on Day 2 if needed).

## Implementation Details

- **Connection Pool**: `pg.Pool` with idle timeout to avoid stale connections.
- **Migrations**: SQL files in `src/db/migrations/` (version-controlled, run on startup).
- **ORM/Query Library**: `node-postgres` (pg) for type-safe queries; no ORM overhead.
- **Connection String**: From `DATABASE_URL` environment variable.

## Compliance

- ✅ Constitution: All queries are strongly typed; migrations are version-controlled.
- ✅ Security: Password hashes stored; reset tokens are hashed before storage.
