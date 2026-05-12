# Research: User Authentication System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-12

---

## bcrypt

**Library**: `bcrypt` (npm) — Node.js binding to OpenBSD bcrypt  
**Why**: Adaptive hashing algorithm with configurable cost factor; intentionally slow to resist brute-force; widely audited.

**Key decisions**:
- Cost factor **12** chosen: ~250 ms on modern hardware — slow enough to deter brute force, fast enough for p95 < 500 ms login (SC-002).
- `bcrypt.hash(password, 12)` — async; never call sync variant in request handlers.
- Always call `bcrypt.compare()` even when user is not found (compare against a dummy hash) to prevent timing-based user enumeration (SEC015).

**References**:
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — recommends bcrypt cost ≥ 10; we use 12.
- [bcrypt npm](https://www.npmjs.com/package/bcrypt)

---

## JSON Web Tokens (JWT)

**Library**: `jsonwebtoken` (npm)  
**Algorithm**: HS256 (HMAC-SHA256, symmetric)  
**Why HS256 over RS256**: Single-service deployment in v1; no need to distribute a public key to other services. RS256 is the upgrade path if the token needs to be verified by multiple services.

**Token structure**:
```
Header:  { alg: "HS256", typ: "JWT" }
Payload: { sub: "<userId>", jti: "<uuid>", iat: <unix>, exp: <iat + 86400> }
```

**Key decisions**:
- `jti` (JWT ID) claim is a `crypto.randomUUID()` — enables blocklisting individual tokens.
- `exp` = `iat + 86400` (24 hours) — matches session expiry requirement.
- Secret loaded from `JWT_SECRET` env var; minimum 256-bit (32-byte) random string.
- `algorithms` option explicitly set to `["HS256"]` on `verify()` — prevents `alg: none` downgrade attack.

**References**:
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 — JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519)
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)

---

## Password Reset Token

**Generation**: `crypto.randomBytes(32).toString('hex')` — 256-bit entropy, URL-safe hex string.  
**Storage**: SHA-256 hash of the raw token stored in `password_reset_tokens.token_hash`.  
**Transport**: Raw token embedded in reset link sent via email — never stored in DB.

**Why hash the reset token**: If the database is compromised, attackers cannot use the stored value to reset passwords — they need the raw token which only exists in the email.

**References**:
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

---

## Input Validation

**Library**: `zod` (npm)  
**Why**: TypeScript-first schema validation; parsing `unknown` input into typed output; composable schemas; excellent error messages for 400 responses.

**Pattern**:
```typescript
// At controller boundary:
const result = RegisterSchema.safeParse(req.body);
if (!result.success) return res.status(400).json({ errors: result.error.flatten() });
// result.data is now fully typed
```

**References**:
- [Zod docs](https://zod.dev)

---

## Email Delivery

**Library**: `nodemailer` (npm)  
**Abstraction**: `MailService` interface — the concrete nodemailer transport is injected, making it swappable (SendGrid, SES, Mailpit for local dev).  
**Error handling**: SMTP failures throw `ServiceUnavailableError` → mapped to 503 response. Email sending is synchronous in v1 (no queue).

**Local dev**: Use [Mailpit](https://mailpit.axllent.org/) or [Ethereal](https://ethereal.email/) as a catch-all SMTP sink.

---

## PostgreSQL Client

**Library**: `pg` (node-postgres)  
**Pattern**: Shared connection pool via `pg.Pool`; parameterized queries exclusively (`$1`, `$2` placeholders) — no string interpolation.  
**Why not an ORM**: Keeps the dependency surface small for v1; SQL migrations are explicit and reviewable; ORM can be added later if complexity warrants.

---

## Testing Stack

| Tool | Role |
|------|------|
| `jest` | Test runner, assertion library |
| `ts-jest` | TypeScript transformer for Jest |
| `supertest` | HTTP integration tests against Express app |
| `@jest/globals` | Typed `describe`/`it`/`expect` |

**Coverage**: Jest `--coverage` with thresholds: `branches: 80, functions: 80, lines: 80, statements: 80` scoped to `src/modules/**`.

---

## Security References

| Topic | Reference |
|-------|-----------|
| Password hashing | OWASP Password Storage Cheat Sheet |
| JWT | OWASP JWT Cheat Sheet, RFC 7519 |
| Password reset | OWASP Forgot Password Cheat Sheet |
| General auth | OWASP Authentication Cheat Sheet |
| Input validation | OWASP Input Validation Cheat Sheet |
| Logging | OWASP Logging Cheat Sheet — never log credentials |
