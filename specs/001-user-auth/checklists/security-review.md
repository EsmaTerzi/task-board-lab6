# Security Review Checklist: User Authentication System

**Purpose**: Verify the authentication implementation is free from common security vulnerabilities before merge.
**Created**: 2026-05-12
**Feature**: [spec.md](../spec.md)
**Reference**: OWASP Top 10, OWASP Authentication Cheat Sheet

---

## Password Security

- [ ] SEC001 Passwords are hashed with bcrypt at cost factor ≥ 12 — never stored or logged in plaintext
- [ ] SEC002 Password hashing occurs server-side only — raw passwords never leave the auth service layer
- [ ] SEC003 Password complexity rules enforced (≥ 8 chars, uppercase, number, special character)
- [ ] SEC004 Old password hash is overwritten atomically on password reset — no transition window with two valid hashes
- [ ] SEC005 Password fields are excluded from all API response payloads and serializers

## JWT Security

- [ ] SEC006 JWT is signed with a strong secret (HS256 ≥ 256-bit secret, or RS256 private key)
- [ ] SEC007 JWT signing secret/private key is loaded from environment variables — never hardcoded in source
- [ ] SEC008 JWT `exp` claim is set to exactly 24 hours — no tokens with missing or far-future expiry
- [ ] SEC009 JWT `jti` (JWT ID) claim is included for blocklist and revocation support
- [ ] SEC010 Algorithm is explicitly validated on verification — `alg: "none"` attack is not possible
- [ ] SEC011 JWT is transmitted via `Authorization: Bearer` header only — never in URL query parameters or cookies without `HttpOnly`+`Secure` flags

## User Enumeration Prevention

- [ ] SEC012 Login endpoint returns identical response body, status code, and response time for wrong password vs. unknown email
- [ ] SEC013 Password reset request returns 200 OK regardless of whether the email is registered
- [ ] SEC014 Registration 409 Conflict response does not reveal additional account details beyond "email already in use"
- [ ] SEC015 Timing attacks on login mitigated — bcrypt comparison always runs even when user is not found (dummy hash comparison)

## Token & Session Management

- [ ] SEC016 Password reset tokens are cryptographically random (≥ 128 bits entropy, e.g., `crypto.randomBytes(32)`)
- [ ] SEC017 Reset tokens are stored as a hash (e.g., SHA-256) — raw token only travels in the email link
- [ ] SEC018 Reset tokens are single-use — marked as used immediately upon successful password change
- [ ] SEC019 Reset tokens expire after 1 hour — expired tokens are rejected
- [ ] SEC020 All active sessions are invalidated upon successful password reset (JWT blocklist updated)
- [ ] SEC021 Explicit logout invalidates the specific token via blocklist — token cannot be replayed after logout

## Input Validation & Injection

- [ ] SEC022 Email input is validated against a strict RFC-compliant pattern before processing
- [ ] SEC023 All inputs are validated at the API boundary using a schema validator (e.g., Zod, Joi) — no raw user data passed to services
- [ ] SEC024 No raw user input is interpolated into database queries — parameterized queries or ORM used exclusively
- [ ] SEC025 Error responses never expose internal stack traces, query details, or system paths

## Sensitive Data Handling

- [ ] SEC026 No passwords, tokens, or JWT secrets appear in application logs at any log level
- [ ] SEC027 Reset token in email link is the raw token — the stored value is its hash (raw never hits the DB)
- [ ] SEC028 `Authorization` header value is redacted in access logs
- [ ] SEC029 Environment variables holding secrets are validated at startup — app fails fast if missing

## Brute Force & Abuse Protection

- [ ] SEC030 Login endpoint is protected by rate limiting (API gateway or middleware) — spec assumption documented
- [ ] SEC031 Password reset endpoint is protected by rate limiting to prevent token flooding
- [ ] SEC032 Account lockout policy is documented — if out of scope for v1, explicitly noted as a known risk

## Dependency & Configuration

- [ ] SEC033 JWT library used does not have known CVEs — verified via `npm audit` or equivalent in CI
- [ ] SEC034 bcrypt library version is pinned and audited
- [ ] SEC035 `tsconfig.json` has `strict: true` — eliminates class of type-related runtime errors

## Notes

- Check items off as completed: `[x]`
- SEC015 (dummy hash comparison) is critical — verify in `AuthService.login()` unit tests with a non-existent email
- SEC010 (`alg: none`) protection depends on the JWT library used — confirm in library docs and add a test asserting it
- SEC030–SEC031 are infrastructure concerns; if API gateway is not yet in place, a middleware-level solution must be added before production deployment
