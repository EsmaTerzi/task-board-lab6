# Feature Specification: User Authentication System

**Feature Branch**: `001-user-authentication`  
**Created**: 2026-05-12  
**Status**: Draft  
**Input**: User description: "User registration (email/password), Login with JWT tokens, Password reset via email, Session management (24-hour expiry)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registration (Priority: P1)

A new visitor wants to create an account using their email address and a password so they can access the application.

**Why this priority**: Registration is the entry point of the entire authentication system. Without it, no other auth feature has users to operate on.

**Independent Test**: Can be fully tested by submitting a registration form with valid email/password and verifying the user record is created and a success response is returned.

**Acceptance Scenarios**:

1. **Given** a visitor provides a valid email and a password meeting complexity requirements, **When** they submit the registration form, **Then** a new account is created and a 201 response with the user's ID is returned.
2. **Given** a visitor provides an email that is already registered, **When** they submit the form, **Then** a 409 Conflict error is returned with a clear message.
3. **Given** a visitor provides an invalid email format or a weak password, **When** they submit the form, **Then** a 400 Bad Request error is returned listing the validation failures.
4. **Given** a registration succeeds, **When** the account is created, **Then** the password is stored as a bcrypt hash — never in plaintext.

---

### User Story 2 - Login with JWT Token (Priority: P1)

A registered user wants to log in with their email and password and receive a JWT token to authenticate subsequent requests.

**Why this priority**: Login is the core session-creation mechanism. All protected features depend on it.

**Independent Test**: Can be fully tested by logging in with valid credentials and verifying a signed JWT is returned; separately verify that invalid credentials are rejected.

**Acceptance Scenarios**:

1. **Given** a registered user provides correct email and password, **When** they submit the login form, **Then** a 200 response is returned containing a signed JWT access token with a 24-hour expiry.
2. **Given** a user provides a correct email but wrong password, **When** they submit login, **Then** a 401 Unauthorized error is returned — no indication of which field is wrong (to prevent enumeration).
3. **Given** a user provides an email that does not exist, **When** they submit login, **Then** a 401 Unauthorized error is returned (same response as wrong password).
4. **Given** a user holds a valid JWT, **When** they make a request to a protected endpoint with it in the `Authorization: Bearer` header, **Then** the request is processed successfully.
5. **Given** a user holds an expired JWT, **When** they make a request to a protected endpoint, **Then** a 401 Unauthorized error is returned.

---

### User Story 3 - Password Reset via Email (Priority: P2)

A user who has forgotten their password wants to reset it by receiving a time-limited reset link to their registered email address.

**Why this priority**: High user-impact recovery path. Blocks user access if unavailable but is not required for initial login flow.

**Independent Test**: Can be fully tested by requesting a reset for a known email, verifying a token is generated and emailed, then using the token to set a new password.

**Acceptance Scenarios**:

1. **Given** a user submits a password reset request with a registered email, **When** the request is processed, **Then** a reset token is generated, stored with a 1-hour expiry, and an email with a reset link is sent.
2. **Given** a user submits a reset request with an email that is not registered, **When** the request is processed, **Then** a 200 OK response is returned (same as success — prevents email enumeration).
3. **Given** a user follows the reset link with a valid, unexpired token and provides a new password, **When** they submit, **Then** the password is updated, the token is invalidated, and all existing sessions for that user are revoked.
4. **Given** a user follows a reset link with an expired or already-used token, **When** they submit, **Then** a 400 Bad Request error is returned.

---

### User Story 4 - Session Management & Expiry (Priority: P2)

A logged-in user's session should automatically expire after 24 hours of inactivity to protect their account.

**Why this priority**: Security requirement that ensures abandoned sessions do not remain valid indefinitely.

**Independent Test**: Can be fully tested by issuing a JWT, manipulating its `exp` claim in tests, and verifying the middleware rejects expired tokens.

**Acceptance Scenarios**:

1. **Given** a JWT is issued at login, **When** it is inspected, **Then** it contains an `exp` claim set to exactly 24 hours from issuance.
2. **Given** 24 hours have passed since a JWT was issued, **When** the user makes a request with that token, **Then** a 401 Unauthorized response is returned.
3. **Given** a user explicitly logs out, **When** logout is called, **Then** their token is added to a blocklist and rejected on subsequent requests even if not yet expired.
4. **Given** a password reset completes, **When** the operation finishes, **Then** all active sessions (tokens) for that user are invalidated.

---

### Edge Cases

- What happens when registration is attempted with an email containing uppercase letters? (Must be normalized to lowercase before storage)
- What happens when a JWT is structurally malformed (not a valid JWT string)? (Must return 401, not 500)
- What happens when the email service is unavailable during password reset? (Must return 503 and not silently swallow the error)
- What happens when the same reset token is used twice? (Must be rejected on the second use)
- What happens when a user registers, then attempts to register again with the same email? (Must return 409, not leak whether account exists via timing)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register with a unique email address and a password meeting minimum complexity (≥ 8 characters, at least one uppercase, one number, one special character).
- **FR-002**: System MUST store passwords as bcrypt hashes with a minimum cost factor of 12 — plaintext passwords must never be persisted or logged.
- **FR-003**: System MUST issue a signed JWT access token upon successful login, with a 24-hour expiry (`exp` claim).
- **FR-004**: System MUST validate the JWT signature and expiry on every protected endpoint request.
- **FR-005**: System MUST generate a cryptographically secure, single-use password reset token with a 1-hour TTL.
- **FR-006**: System MUST send the password reset link to the user's registered email address.
- **FR-007**: System MUST invalidate all active sessions for a user upon successful password reset.
- **FR-008**: System MUST support explicit logout by blocklisting the active token until its natural expiry.
- **FR-009**: System MUST return identical responses for "email not found" and "wrong password" scenarios to prevent user enumeration.
- **FR-010**: System MUST normalize email addresses to lowercase before storage and comparison.

### Key Entities

- **User**: Represents a registered account. Key attributes: `id` (UUID), `email` (unique, lowercase), `passwordHash` (bcrypt), `createdAt`, `updatedAt`.
- **PasswordResetToken**: Represents a pending reset request. Key attributes: `id` (UUID), `userId` (FK), `tokenHash` (hashed for storage), `expiresAt`, `usedAt`.
- **TokenBlocklist**: Represents invalidated JWTs. Key attributes: `jti` (JWT ID claim), `expiresAt` (for cleanup).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration in under 3 seconds (p95 response time).
- **SC-002**: Login endpoint responds in under 500 ms (p95), accounting for bcrypt verification.
- **SC-003**: Password reset email is delivered within 60 seconds of the reset request.
- **SC-004**: Business logic (UserService, AuthService, TokenService) achieves ≥ 80% test coverage as required by the Constitution.
- **SC-005**: Zero plaintext passwords appear in logs, error messages, or API responses — verified by automated secret scanning.
- **SC-006**: All four user stories pass their acceptance scenarios in CI before merge.

## Assumptions

- Email delivery is handled by an external SMTP provider (e.g., SendGrid, SES) — the auth system calls a `MailService` interface; the provider is injected.
- Refresh tokens are out of scope for v1; only access tokens with 24-hour expiry are used.
- The application is a single-region deployment for v1 — a shared in-memory or Redis store is acceptable for the token blocklist.
- Rate limiting on login and password-reset endpoints is a separate infrastructure concern (e.g., API gateway) and is out of scope for this spec.
- All source files will be `.ts` with `strict: true` enabled per the Project Constitution.
- All exported functions and classes will carry JSDoc comments per the Project Constitution.
