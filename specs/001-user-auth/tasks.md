# Tasks: User Authentication System

**Input**: `specs/001-user-auth/spec.md`, `specs/001-user-auth/plan.md`
**Branch**: `001-user-auth`
**Prerequisites**: plan.md ✅ spec.md ✅

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US?]**: User story (US1=Registration, US2=Login/JWT, US3=Password Reset, US4=Session/Logout)

---

## Phase 1: Project Setup

**Purpose**: Initialize project scaffolding, tooling, and config before any feature work.

- [ ] T001 Initialize Node.js project — `npm init`, install all production + dev dependencies (`express`, `bcrypt`, `jsonwebtoken`, `pg`, `zod`, `nodemailer`, `dotenv`, `jest`, `ts-jest`, `supertest`, `@types/*`)
- [ ] T002 [P] Create `tsconfig.json` with `strict: true`, `rootDir: src`, `outDir: dist`, path aliases
- [ ] T003 [P] Configure ESLint — `@typescript-eslint/recommended` + `eslint-plugin-jsdoc` rules
- [ ] T004 [P] Configure Prettier and add `.prettierrc`
- [ ] T005 [P] Create `jest.config.ts` with `ts-jest`, coverage thresholds (80% branches/functions/lines/statements on `src/modules/**`)
- [ ] T006 [P] Create `.env.example` with all required variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_COST`, `SMTP_*`)
- [ ] T007 Add `package.json` scripts: `build`, `start`, `dev`, `test`, `test:coverage`, `lint`

**Checkpoint**: `npm run lint` and `npm test` run without errors (zero test files yet).

---

## Phase 2: Foundation (Blocking — must complete before user stories)

**Purpose**: Shared infrastructure all services depend on.

- [ ] T008 Create `src/config/auth.config.ts` — export typed constants: `BCRYPT_COST`, `JWT_SECRET`, `JWT_EXPIRES_IN` (24h), `RESET_TOKEN_TTL_HOURS` (1h); validate all env vars at startup
- [ ] T009 [P] Create `src/config/db.config.ts` — PostgreSQL connection pool via `pg`; export typed `query()` helper
- [ ] T010 Create `src/db/migrations/001_create_users.sql` — `users` table (`id UUID PK`, `email VARCHAR UNIQUE`, `password_hash TEXT`, `created_at`, `updated_at`)
- [ ] T011 [P] Create `src/db/migrations/002_create_password_reset_tokens.sql` — `password_reset_tokens` table
- [ ] T012 [P] Create `src/db/migrations/003_create_token_blocklist.sql` — `token_blocklist` table
- [ ] T013 Create migration runner script or apply migrations manually; confirm all 3 tables exist in DB
- [ ] T014 Create `src/modules/auth/auth.types.ts` — interfaces: `User`, `NewUser`, `AuthTokenPayload`, `PasswordResetToken`, `BlocklistEntry`
- [ ] T015 [P] Create `src/modules/auth/auth.schemas.ts` — Zod schemas: `RegisterSchema`, `LoginSchema`, `ResetRequestSchema`, `ResetConfirmSchema`
- [ ] T016 Create `src/middleware/validate.ts` — generic Zod validation middleware; returns 400 with field errors on failure
- [ ] T017 [P] Create `tests/helpers/db.helper.ts` — test DB connection, `truncateAll()` for test isolation
- [ ] T018 [P] Create `tests/helpers/jwt.helper.ts` — helpers: `makeExpiredToken()`, `makeTokenWithJti()`, `decodeToken()`

**Checkpoint**: DB connects, migrations applied, types and schemas compile with zero errors.

---

## Phase 3: User Story 1 — New User Registration (Priority: P1) 🎯 MVP

**Goal**: Any client can POST valid credentials and receive a user ID; duplicates and invalid input are rejected.

**Independent Test**: `POST /auth/register` with valid body → 201 + `{ id }`. Duplicate email → 409. Invalid input → 400.

### Tests (write first — must fail before implementation)

- [ ] T019 [US1] Write unit tests for `UserService` in `tests/unit/user.service.test.ts`:
  - `register()` happy path → returns created user
  - `register()` duplicate email → throws conflict error
  - `register()` password stored as bcrypt hash, never plaintext
  - `findByEmail()` found and not-found cases
- [ ] T020 [US1] Write integration tests for registration in `tests/integration/register.test.ts`:
  - Valid body → 201 + `{ id }`
  - Duplicate email → 409
  - Invalid email format → 400
  - Weak password → 400
  - Email with uppercase → normalized, no duplicate created

### Implementation

- [ ] T021 [US1] Implement `src/modules/auth/user.service.ts` — `register(dto)`: normalize email, validate uniqueness, hash password (bcrypt cost 12), insert user, return `{ id }`; `findByEmail(email)`: lookup by normalized email (depends on T008, T009, T014)
- [ ] T022 [US1] Implement `src/modules/auth/auth.controller.ts` `register` handler — parse body via `RegisterSchema`, call `UserService.register()`, map errors to HTTP responses
- [ ] T023 [US1] Create `src/modules/auth/auth.router.ts` — mount `POST /auth/register`
- [ ] T024 [US1] Create `src/app.ts` — Express app factory, mount auth router, global error handler
- [ ] T025 [US1] Confirm unit tests pass; confirm integration tests pass

**Checkpoint**: Registration works end-to-end. Run `npm test -- register` — all green.

---

## Phase 4: User Story 2 — Login with JWT Token (Priority: P1) 🎯 MVP

**Goal**: Registered users can log in and receive a signed JWT; invalid credentials are rejected without leaking which field is wrong.

**Independent Test**: `POST /auth/login` with correct credentials → 200 + `{ accessToken }`. Wrong password or unknown email → 401 (identical response).

### Tests (write first — must fail before implementation)

- [ ] T026 [US2] Write unit tests for `TokenService` in `tests/unit/token.service.test.ts`:
  - `issue()` returns JWT with correct `exp` (+24h) and `jti`
  - `verify()` accepts valid token, rejects expired, rejects malformed, rejects `alg: none`
  - `isBlocklisted()` returns false for new token
- [ ] T027 [US2] Write unit tests for `AuthService.login()` in `tests/unit/auth.service.test.ts`:
  - Correct credentials → returns access token
  - Wrong password → throws unauthorized (bcrypt always runs)
  - Unknown email → throws unauthorized (dummy hash comparison — same timing)
- [ ] T028 [US2] Write integration tests in `tests/integration/login.test.ts`:
  - Valid credentials → 200 + `{ accessToken }`
  - Wrong password → 401; body identical to unknown email response
  - Unknown email → 401; body identical to wrong password response
  - Malformed JWT on protected route → 401 (not 500)
  - Expired JWT on protected route → 401

### Implementation

- [ ] T029 [US2] Implement `src/modules/auth/token.service.ts` — `issue(userId)`: sign JWT HS256 with `jti` + `exp`; `verify(token)`: validate signature, expiry, blocklist; `isBlocklisted(jti)`: query `token_blocklist`
- [ ] T030 [US2] Implement `AuthService.login(dto)` in `src/modules/auth/auth.service.ts` — normalize email, `findByEmail()`, dummy-hash if not found (constant-time), `bcrypt.compare()`, issue JWT
- [ ] T031 [US2] Implement `src/middleware/authenticate.ts` — extract Bearer token, call `TokenService.verify()`, attach payload to `req.user`
- [ ] T032 [US2] Add `POST /auth/login` to `auth.router.ts` and `login` handler to `auth.controller.ts`
- [ ] T033 [US2] Confirm all unit and integration tests pass

**Checkpoint**: Login works end-to-end; enumeration tests pass; `alg: none` test passes.

---

## Phase 5: User Story 3 — Password Reset via Email (Priority: P2)

**Goal**: Users can request a reset link by email and use it to set a new password; expired/used tokens are rejected; email enumeration is prevented.

**Independent Test**: Request reset for known email → token generated + email sent. Follow link with valid token → password updated, all sessions invalidated.

### Tests (write first — must fail before implementation)

- [ ] T034 [US3] Write unit tests for `PasswordResetService` in `tests/unit/password-reset.service.test.ts`:
  - `requestReset()` known email → generates token, stores hash, calls `MailService.send()`
  - `requestReset()` unknown email → returns without error (no mail sent, same response)
  - `confirmReset()` valid token → updates password, marks token used, invalidates sessions
  - `confirmReset()` expired token → throws bad request
  - `confirmReset()` used token → throws bad request
  - `confirmReset()` re-use of same token after success → throws bad request
- [ ] T035 [US3] Write integration tests in `tests/integration/password-reset.test.ts`:
  - Request with registered email → 200 (same message)
  - Request with unregistered email → 200 (same message — enumeration prevention)
  - Confirm with valid token → 200, old JWT rejected, new login works with new password
  - Confirm with expired token → 400
  - Confirm with used token → 400

### Implementation

- [ ] T036 [US3] Create `src/modules/auth/mail.service.ts` — `MailService` interface (`send(to, subject, html): Promise<void>`); nodemailer implementation; throw `ServiceUnavailableError` on SMTP failure
- [ ] T037 [US3] Implement `PasswordResetService` in `src/modules/auth/password-reset.service.ts` — `requestReset(email)`: generate `crypto.randomBytes(32)`, store SHA-256 hash with 1h TTL, send email; `confirmReset(rawToken, newPassword)`: hash token, lookup, validate expiry+used, update password, mark used, call `TokenService.revokeAllForUser(userId)`
- [ ] T038 [US3] Implement `TokenService.revokeAllForUser(userId)` — insert all active JTIs for user into blocklist (requires tracking issued tokens per user or clearing by userId field)
- [ ] T039 [US3] Add `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm` to router and controller
- [ ] T040 [US3] Confirm all unit and integration tests pass

**Checkpoint**: Password reset flow works end-to-end; all sessions revoked on reset; enumeration tests pass.

---

## Phase 6: User Story 4 — Session Management & Logout (Priority: P2)

**Goal**: Sessions expire after 24 hours automatically; explicit logout blocklists the token immediately.

**Independent Test**: Logout with valid token → 204; same token rejected on next request. Expired token → 401.

### Tests (write first — must fail before implementation)

- [ ] T041 [US4] Write unit tests for `AuthService.logout()` in `tests/unit/auth.service.test.ts`:
  - Valid token → `jti` added to blocklist
  - Token already blocklisted → no duplicate insert (idempotent)
- [ ] T042 [US4] Write integration tests in `tests/integration/session.test.ts`:
  - Valid token → `POST /auth/logout` returns 204
  - Same token used after logout → 401
  - Manually expired token (via `jwt.helper.ts`) → 401 on protected endpoint
  - Token with `exp` claim exactly 24h from `iat` → verified in payload

### Implementation

- [ ] T043 [US4] Implement `AuthService.logout(token)` in `auth.service.ts` — verify token, insert `jti` + `expires_at` into `token_blocklist` (upsert to be idempotent)
- [ ] T044 [US4] Add `POST /auth/logout` to router and controller (requires `authenticate` middleware)
- [ ] T045 [US4] Add blocklist cleanup job (or SQL function) to delete expired rows from `token_blocklist` — documented in `plan.md` as operational concern
- [ ] T046 [US4] Confirm all unit and integration tests pass

**Checkpoint**: Full auth lifecycle works — register → login → use protected route → logout → token rejected.

---

## Phase 7: Security Hardening & Polish

**Purpose**: Verify all security checklist items; cross-cutting concerns.

- [ ] T047 Work through all items in `checklists/security-review.md` — mark each SEC item `[x]` or add a note
- [ ] T048 [P] Run `npm audit` — resolve any high/critical CVEs
- [ ] T049 [P] Add startup env-var validation to `src/config/auth.config.ts` — app exits with clear error if `JWT_SECRET` or `DATABASE_URL` is missing
- [ ] T050 [P] Confirm `Authorization` header is redacted in any request logging middleware
- [ ] T051 Verify SEC015 (timing attack): add explicit test asserting login response time is consistent for unknown email vs. wrong password
- [ ] T052 Run `npm run test:coverage` — confirm ≥ 80% on branches/functions/lines in `src/modules/**`
- [ ] T053 Run `npm run lint` — zero warnings
- [ ] T054 Update spec.md `Status` field from `Draft` to `Ready for Review`

**Checkpoint**: All checklist items green, coverage ≥ 80%, lint clean.

---

## Phase 8: Rate Limiting *(pending clarification)*

> ⚠️ Rate limiting requirements raised in `/speckit.clarify`. Awaiting decisions on:
> - Middleware vs. API gateway (Q1)
> - Per-endpoint limits (Q2)
> - IP-only vs. IP + email scope (Q3)
>
> Tasks will be added here once clarification is resolved.

---

## Summary

| Phase | Tasks | Depends On |
|-------|-------|-----------|
| 1 — Setup | T001–T007 | — |
| 2 — Foundation | T008–T018 | Phase 1 |
| 3 — Registration (US1, P1) | T019–T025 | Phase 2 |
| 4 — Login/JWT (US2, P1) | T026–T033 | Phase 3 |
| 5 — Password Reset (US3, P2) | T034–T040 | Phase 4 |
| 6 — Session/Logout (US4, P2) | T041–T046 | Phase 4 |
| 7 — Security & Polish | T047–T054 | Phases 3–6 |
| 8 — Rate Limiting | TBD | Clarification |
