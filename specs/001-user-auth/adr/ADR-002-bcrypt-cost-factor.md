# ADR-002: Bcrypt Cost Factor 12

**Date**: 2026-05-12  
**Status**: Accepted  
**Context**: We need to hash passwords securely with a cost factor that balances security and performance.

## Decision

We will use bcrypt with a cost factor of **12** for all password hashing operations.

## Rationale

- **Cost Factor 12**: ~250 ms per hash on modern hardware (acceptable for login flow; p95 < 500 ms).
- **Future-Proof**: Chosen conservatively; cost factor can increase as hardware improves without breaking existing hashes.
- **OWASP Recommended**: Cost factor ≥10; 12 aligns with security best practices.
- **Constitutional Requirement**: Enforced as non-negotiable constant in `src/config/auth.config.ts`.

## Alternatives Considered

1. **Cost Factor 10**
   - ❌ Faster (~100 ms) but less future-proof; upgrades harder as hardware speeds up.

2. **Cost Factor 14**
   - ❌ Slower (~1000 ms); exceeds login performance target (p95 < 500 ms).

3. **Argon2 or PBKDF2**
   - ❌ bcrypt is simpler, battle-tested; Argon2 adds complexity without proportional benefit for v1.

## Consequences

- ✅ Passwords resist brute-force attacks even if database is leaked.
- ✅ Automatically future-proof as hardware improves.
- ⚠️ Single bcrypt operation takes ~250 ms; login endpoint is bcrypt-bound (acceptable for SLA).

## Implementation Details

- **Library**: `npm install bcrypt`
- **Constant**: `BCRYPT_COST = 12` in `src/config/auth.config.ts`
- **Usage**: `bcrypt.hash(password, BCRYPT_COST)` in registration.
- **No Regressions**: Existing hashes (if any) remain valid; `bcrypt.compare()` works across all cost factors.

## Compliance

- ✅ Constitution: Non-negotiable security gate; documented as required constant.
- ✅ Security: Resistant to modern GPU-based attacks (cost factor 12 = ~250 ms).
