# ADR-003: In-Process Token Blocklist for v1

**Date**: 2026-05-12  
**Status**: Accepted  
**Context**: We need a way to revoke JWTs (e.g., on logout) without relying on a database query for every request.

## Decision

We will maintain an in-process Set of revoked JWT tokens (`jti` claims) in memory for v1, with automatic expiry cleanup.

## Rationale

- **Simplicity**: No additional infrastructure (Redis, database table) needed for v1.
- **Performance**: O(1) blocklist lookup during token verification.
- **Acceptable v1 Scope**: Single Node.js instance; no horizontal scaling required yet.
- **Automatic Cleanup**: Tokens expire after 24h naturally; removal of expired tokens from blocklist is best-effort.

## Alternatives Considered

1. **Redis-Based Blocklist**
   - ❌ Adds operational complexity and cost; overkill for single-instance v1.

2. **Database Blocklist Table**
   - ❌ Adds query overhead to every protected request; violates performance goal.

3. **No Revocation** (JWT Until Expiry)
   - ❌ Users cannot force logout; security risk if token is leaked.

## Consequences

- ✅ Zero operational overhead for v1; scales to ~1M tokens in typical Node.js process.
- ✅ Fast token verification (no I/O).
- ⚠️ **Blocklist is lost on process restart** → Users logged out of all sessions. *Acceptable for v1; upgrade path: migrate to Redis on Day 2.*
- ⚠️ **Multi-instance deployment**: Instances have separate blocklists; users can logout from instance A but remain logged into instance B. *Mitigation: add sticky sessions (round-robin to same instance) or upgrade to Redis.*

## Implementation Details

- **Data Structure**: `Set<string>` where each string is a JWT `jti` claim.
- **Cleanup**: Periodic timer (e.g., every 1 hour) removes tokens older than 24h.
- **API**: 
  ```typescript
  addToBlocklist(jti: string): void
  isBlocklisted(jti: string): boolean
  ```
- **File**: `src/services/token-blocklist.service.ts`

## Migration Path

- **Day 2 (if needed)**: Replace in-process Set with Redis for multi-instance support.
- **Database Option**: If Redis not available, can migrate to PostgreSQL table with TTL cleanup.

## Compliance

- ✅ Constitution: Simplicity principle; YAGNI (no Redis until horizontally scaled).
- ✅ Security: Revocation works within single process; acceptable for v1 SLA.
