# API Contracts: User Authentication System

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)
**Created**: 2026-05-12
**Base path**: `/auth`

---

## `POST /auth/register`

Register a new user account.

**Request**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Secret1!"
}
```

**Validation rules**:
- `email`: valid RFC 5322 format; normalized to lowercase before processing
- `password`: ≥ 8 characters, ≥ 1 uppercase letter, ≥ 1 number, ≥ 1 special character

**Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `201 Created` | `{ "id": "<uuid>" }` | Account created successfully |
| `400 Bad Request` | `{ "errors": { "fieldErrors": { "email": [...], "password": [...] } } }` | Validation failed |
| `409 Conflict` | `{ "message": "An account with this email already exists." }` | Email already registered |

---

## `POST /auth/login`

Authenticate with email and password; receive a JWT access token.

**Request**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Secret1!"
}
```

**Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | `{ "accessToken": "<jwt>" }` | Credentials valid |
| `400 Bad Request` | `{ "errors": { ... } }` | Validation failed (malformed body) |
| `401 Unauthorized` | `{ "message": "Invalid credentials." }` | Wrong password **or** unknown email (identical response) |

**Security note**: The `401` response body and timing are identical for wrong password and unknown email — prevents user enumeration.

---

## `POST /auth/logout`

Invalidate the current JWT by adding its `jti` to the blocklist.

**Request**
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `204 No Content` | _(none)_ | Token successfully blocklisted |
| `401 Unauthorized` | `{ "message": "Unauthorized." }` | Missing, malformed, or expired token |

---

## `POST /auth/password-reset/request`

Request a password reset email for a given address.

**Request**
```http
POST /auth/password-reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | `{ "message": "If this email is registered, a reset link has been sent." }` | Always (registered or not) |
| `400 Bad Request` | `{ "errors": { ... } }` | Validation failed (invalid email format) |
| `503 Service Unavailable` | `{ "message": "Email service unavailable. Please try again later." }` | SMTP failure |

**Security note**: The `200` response is returned regardless of whether the email is registered — prevents email enumeration.

---

## `POST /auth/password-reset/confirm`

Confirm a password reset using the token from the reset email.

**Request**
```http
POST /auth/password-reset/confirm
Content-Type: application/json

{
  "token": "<raw-reset-token>",
  "newPassword": "NewSecret1!"
}
```

**Validation rules**:
- `token`: non-empty string
- `newPassword`: same complexity rules as registration (≥ 8 chars, uppercase, number, special character)

**Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | `{ "message": "Password updated successfully." }` | Password changed; all sessions invalidated |
| `400 Bad Request` | `{ "message": "Reset token is invalid, expired, or already used." }` | Token not found, expired, or already consumed |
| `400 Bad Request` | `{ "errors": { ... } }` | Validation failed (weak password) |

**Side effects on success**:
1. `users.password_hash` updated with new bcrypt hash.
2. `password_reset_tokens.used_at` set to `now()`.
3. All active JWTs for the user are added to `token_blocklist`.

---

## Authentication Middleware

Protected endpoints must include a valid JWT in the `Authorization` header.

**Header format**: `Authorization: Bearer <accessToken>`

**Middleware behaviour**:

| Condition | Response |
|-----------|----------|
| Valid, non-expired, non-blocklisted token | Passes; `req.user` populated with `{ sub, jti, iat, exp }` |
| Missing header | `401 Unauthorized` |
| Malformed token (not valid JWT) | `401 Unauthorized` |
| Expired token | `401 Unauthorized` |
| Blocklisted token | `401 Unauthorized` |

All `401` responses from middleware use body: `{ "message": "Unauthorized." }`
