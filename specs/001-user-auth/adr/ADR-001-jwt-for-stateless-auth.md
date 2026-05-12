# ADR-001: JWT for Stateless Authentication

**Date**: 2026-05-12  
**Status**: Accepted  
**Context**: We need to implement session management for user authentication in a REST API.

## Decision

We will use JWT (JSON Web Tokens) with HS256 algorithm for stateless authentication instead of traditional server-side session storage.

## Rationale

- **Stateless**: No server-side session table required; scales horizontally without session replication.
- **Standard**: JWT is industry-standard (RFC 7519); widely supported across libraries and platforms.
- **Transparency**: Claims are readable by client and server; easy to debug.
- **Single-region v1**: HS256 (symmetric key) is sufficient; upgrade to RS256 if multi-region is needed.

## Alternatives Considered

1. **OAuth 2.0 + Server-Side Sessions**
   - ❌ Adds external dependency (third-party provider); overkill for internal auth.

2. **Session Cookies + Redis Cache**
   - ❌ Requires distributed cache; adds operational complexity; not needed for v1.

3. **API Keys**
   - ❌ No expiry mechanism; difficult to rotate securely.

## Consequences

- ✅ Horizontal scalability without session replication.
- ✅ Mobile-friendly (tokens in Authorization header).
- ⚠️ Token revocation requires blocklist (implemented as in-memory store for v1).
- ⚠️ Cannot instantly invalidate all tokens if secret is compromised; mitigation: rotate secret in deployment.

## Implementation Details

- **Signing Algorithm**: HS256 (HMAC with SHA-256).
- **Secret**: ≥256-bit random string from `JWT_SECRET` environment variable.
- **Expiry**: 24 hours (`exp` claim).
- **Payload**: `{ sub: userId, iat, exp }` (minimal for v1).
- **Refresh**: Not implemented in v1; users re-login after 24h.

## Compliance

- ✅ Constitution: Aligns with simplicity principle (no session table, no Redis).
- ✅ Security: Signed tokens prevent tampering; HTTPS enforced in deployment.
