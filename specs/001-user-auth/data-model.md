# Data Model: User Authentication System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-12

---

## Tables

### `users`

Represents a registered account.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` | |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Stored lowercase |
| `password_hash` | `TEXT` | NOT NULL | bcrypt, cost factor ≥ 12 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `DEFAULT now()` | Updated on password change |

**Indexes**: `UNIQUE INDEX` on `email`.

---

### `password_reset_tokens`

Represents a pending password reset request.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users.id` ON DELETE CASCADE, NOT NULL | |
| `token_hash` | `TEXT` | NOT NULL | SHA-256 of the raw token sent in email |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | 1 hour from creation |
| `used_at` | `TIMESTAMPTZ` | NULL | Set on successful use; non-NULL = consumed |

**Indexes**: Index on `user_id`; Index on `token_hash` for lookup.

**Invariants**:
- Raw token never stored — only its SHA-256 hash.
- Token is single-use: once `used_at` is set, further use is rejected.
- Expired tokens (`expires_at < now()`) are rejected even if `used_at` is NULL.

---

### `token_blocklist`

Represents explicitly revoked JWTs (logout + post-reset invalidation).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `jti` | `TEXT` | PK | JWT ID claim value |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Natural JWT expiry — used for cleanup |

**Indexes**: PK on `jti` (used for O(1) blocklist lookup).

**Operational note**: Rows where `expires_at < now()` can be safely deleted — their associated JWTs would be rejected by expiry check regardless. A periodic cleanup job (or SQL `DELETE WHERE expires_at < now()`) should run to prevent unbounded growth.

---

## Entity Relationships

```
users (1) ──────< password_reset_tokens (many)
users (1) ──── [implicit via jti claim] ──── token_blocklist
```

`token_blocklist` does not have a direct FK to `users` — entries are keyed by `jti` (a UUID embedded in the JWT at issuance). This allows blocklisting without a join and supports the case where a user is deleted but their tokens still need to be rejected until natural expiry.

---

## Migration Files

| File | Description |
|------|-------------|
| `src/db/migrations/001_create_users.sql` | Creates `users` table |
| `src/db/migrations/002_create_password_reset_tokens.sql` | Creates `password_reset_tokens` table |
| `src/db/migrations/003_create_token_blocklist.sql` | Creates `token_blocklist` table |
