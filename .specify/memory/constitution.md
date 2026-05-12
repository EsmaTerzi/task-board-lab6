# Project Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Every module, function, and variable must have a single, clear responsibility; No magic numbers or strings — use named constants; Functions must be small, do one thing, and do it well; Avoid deep nesting — prefer early returns and guard clauses; Dead code must be removed immediately, not commented out; Code must be readable by humans first, machines second.

### II. TypeScript Strict Mode (NON-NEGOTIABLE)
All source files must be `.ts` or `.tsx` — no plain JavaScript allowed; `tsconfig.json` must enable `"strict": true` (covers `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.); No use of `any` type — use `unknown` with type guards where dynamic types are unavoidable; All function signatures must have explicit return types; Type assertions (`as`) require a comment explaining why they are safe.

### III. Testing Pyramid (NON-NEGOTIABLE)
Coverage target: **≥ 80% on all business logic** (services, domain models, utilities); Three-layer pyramid enforced — Unit → Integration → E2E; Unit tests are the foundation: fast, isolated, no I/O; Integration tests cover module boundaries and external adapters; E2E tests cover critical user journeys only — kept minimal and stable; Tests must run in CI on every pull request; No merging code that causes test regressions.

### IV. JSDoc Documentation (NON-NEGOTIABLE)
Every exported function, class, interface, and type must have a JSDoc comment; JSDoc must include: `@param` for each parameter, `@returns` description, `@throws` if applicable; Internal (non-exported) complex logic must also be commented; Examples (`@example`) are required for public utility functions; Documentation must stay in sync with code — outdated docs are treated as bugs.

### V. Simplicity
Start with the simplest solution that satisfies requirements; YAGNI — do not build for hypothetical future needs; Prefer composition over inheritance; Abstractions must earn their complexity through demonstrated reuse.

### VI. Testing Principles (NON-NEGOTIABLE)

#### Section 1 - Testing Philosophy
**Test-Driven Development (TDD) Approach**: All features must be developed using the RED-GREEN-REFACTOR cycle. Tests are written FIRST, before implementation code. Tests are generated from feature specifications and acceptance scenarios, not reverse-engineered from implementation. This ensures requirements are clarified before coding begins and reduces rework. TDD is mandatory for all business logic in services, utilities, and domain models.

**Benefits**: Clearer specifications, fewer bugs, safer refactoring, better code design.

#### Section 2 - Coverage Requirements
**Coverage Targets** (Jest/Vitest with TypeScript):
- **Line Coverage**: ≥ 80% on all business logic (services, utilities, domain models)
- **Branch Coverage**: ≥ 75% (all conditional paths tested)
- **Mutation Score**: ≥ 75% (test quality via mutation testing if available)
- **Static Anal1sis**: TypeScript strict mode + ESLint `@typescript-eslint` enforced in CI

**Testing Pyramid Distribution**:
- **Unit Tests** (~70%): Services, utilities, business logic, password hashing, JWT token generation/validation, database queries
- **Integration Tests** (~20%): Express.js route handlers, API endpoints, PostgreSQL transactions, bcrypt verification flows, email service integration
- **E2E Tests** (~10%): Critical user workflows (registration → login → password reset), JWT token lifecycle, session management

#### Section 3 - Test Types & Organization
**File Organization by Test Type**:

**Unit Tests** (`tests/unit/**/*.test.ts`):
- Mirror the exact structure of `src/`
- Example mapping:
  - `src/modules/auth/auth.service.ts` → `tests/unit/modules/auth/auth.service.test.ts`
  - `src/modules/auth/user.service.ts` → `tests/unit/modules/auth/user.service.test.ts`
  - `src/services/token.service.ts` → `tests/unit/services/token.service.test.ts`
  - `src/utils/password.ts` → `tests/unit/utils/password.test.ts`
- One test file per source file (1:1 mapping)
- Each test file is self-contained and can run independently

**Integration Tests** (`tests/integration/**/*.test.ts`):
- Group by feature/module (not strict 1:1 mirroring):
  - `tests/integration/auth/register.test.ts` (registration flow)
  - `tests/integration/auth/login.test.ts` (login flow)
  - `tests/integration/auth/password-reset.test.ts` (password reset flow)
  - `tests/integration/auth/session.test.ts` (session/logout flow)
- Each file tests a complete user journey or feature boundary
- May cover multiple source files (e.g., controller + service + middleware)

**E2E Tests** (`tests/e2e/**/*.spec.ts`):
- Use `.spec.ts` extension to distinguish from unit/integration tests
- Group by user journey:
  - `tests/e2e/user-registration-login.spec.ts` (new user signup → login)
  - `tests/e2e/password-recovery.spec.ts` (forgot password → reset → re-login)
  - `tests/e2e/session-lifecycle.spec.ts` (login → authenticated requests → logout)
- Each file represents one critical end-to-end workflow
- Minimal set: ~3-5 files maximum per feature

**Directory Structure**:
```typescript
tests/
├── unit/
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.service.test.ts
│   │       ├── user.service.test.ts
│   │       └── auth.schemas.test.ts
│   ├── services/
│   │   ├── token.service.test.ts
│   │   ├── password-reset.service.test.ts
│   │   └── mail.service.test.ts
│   └── utils/
│       └── password.test.ts
├── integration/
│   └── auth/
│       ├── register.test.ts
│       ├── login.test.ts
│       ├── password-reset.test.ts
│       └── session.test.ts
└── e2e/
    ├── user-registration-login.spec.ts
    ├── password-recovery.spec.ts
    └── session-lifecycle.spec.ts
```

#### Section 4 - Naming Conventions

**Test File Naming**:
- **Unit & Integration**: `{ComponentName}.test.ts`
  - Examples: `auth.service.test.ts`, `register.test.ts`, `password.test.ts`
- **E2E**: `{user-journey-name}.spec.ts`
  - Examples: `user-registration-login.spec.ts`, `password-recovery.spec.ts`
- **Avoid**: Generic names like `test.ts`, `tests.ts`, `spec.ts` (without descriptive prefix)

**Test Suite Naming** (describe blocks):
- Wrap all tests for a source file in one top-level `describe()`:
  - `describe('AuthService', ...)`
  - `describe('POST /auth/register', ...)` for routes
  - `describe('User Registration Flow', ...)` for E2E
- Use nested `describe()` for grouping related test cases:
  ```typescript
  describe('AuthService', () => {
    describe('login()', () => {
      // login-specific tests
    });
    describe('logout()', () => {
      // logout-specific tests
    });
  });
  ```

**Test Case Naming** (it/test):
- Use `it('should...')` or `test('should...')` format (both are identical in Jest)
- Always start with **"should"**: describes expected behavior
- Be specific and descriptive:
  - ✅ `should hash password with bcrypt cost 12`
  - ✅ `should return 401 if password is incorrect`
  - ✅ `should reject expired JWT tokens`
  - ❌ `should work` (too vague)
  - ❌ `positive test` (not descriptive)
  - ❌ `test edge case` (unclear edge case)
- Describe the **business outcome**, not implementation:
  - ✅ `should prevent duplicate email registrations`
  - ❌ `should check email uniqueness constraint`
- Include the condition (when) and outcome (then):
  - ✅ `should return 409 Conflict when email already exists`
  - ✅ `should create user record when registration succeeds`

**Naming Anti-Patterns to Avoid**:
- No test numbers: `test1`, `test2` ❌
- No generic terms: `basic test`, `advanced test` ❌
- No implementation details: `should populate password_hash field` → use `should securely hash password` ✅
- No "positive/negative": just be specific about the scenario ✅

#### Section 5 - Test Anatomy

**Primary Pattern: Arrange-Act-Assert (AAA)**

Every test must follow the AAA pattern for clarity and maintainability:

```typescript
test('should verify JWT token and extract userId', () => {
  // ARRANGE: Set up test data and dependencies
  const payload = { sub: 42, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
  const secret = process.env.JWT_SECRET || 'test-secret';
  const token = sign(payload, secret);

  // ACT: Call the function/method being tested
  const decoded = verify(token, secret);

  // ASSERT: Verify the outcome
  expect(decoded.sub).toBe(42);
  expect(decoded.iat).toBe(payload.iat);
});
```

**Setup & Teardown with beforeEach (NOT beforeAll)**:

- Use `beforeEach()` for **test-specific setup** (runs before each test independently)
- Use `afterEach()` for **test-specific cleanup** (runs after each test independently)
- **Avoid** `beforeAll()` / `afterAll()` for shared state (violates test independence)

```typescript
describe('UserService', () => {
  let mockDatabase: jest.Mock;

  beforeEach(() => {
    // Reset mocks BEFORE each test (fresh state)
    mockDatabase = jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
  });

  afterEach(() => {
    // Clean up AFTER each test (database transactions, file cleanup)
    jest.clearAllMocks();
  });

  test('should retrieve user by email', async () => {
    const user = await UserService.findByEmail('test@example.com');
    expect(user.id).toBe(1);
  });

  test('should handle database errors gracefully', async () => {
    mockDatabase.mockRejectedValueOnce(new Error('DB Connection Failed'));
    await expect(UserService.findByEmail('test@example.com')).rejects.toThrow();
  });
});
```

**Test Independence Requirement**:

Each test must be **completely independent** and runnable in any order:
- No shared global state between tests
- No test data dependencies (Test A doesn't require Test B to run first)
- Each test creates its own mock data, fixtures, and state
- Tests can run individually with `test.only()` and still pass
- Tests can be skipped without breaking other tests

```typescript
// ✅ Good: Each test is independent
describe('PasswordReset', () => {
  beforeEach(() => {
    // Fresh setup for each test
    resetTokenStore();
    jest.clearAllMocks();
  });

  test('should generate a reset token with 1-hour expiry', () => {
    const token = generateResetToken('user@example.com');
    expect(token).toMatch(/^[a-f0-9]{32}$/); // 128-bit hex
  });

  test('should reject expired reset tokens', async () => {
    const expiredToken = 'expired-token-abc123';
    const result = await validateResetToken(expiredToken);
    expect(result.isValid).toBe(false);
    // This test doesn't depend on the previous test
  });
});

// ❌ Bad: Second test depends on first test's side effects
describe('PasswordReset (antipattern)', () => {
  let resetToken: string;

  test('should generate a reset token', () => {
    resetToken = generateResetToken('user@example.com');
    expect(resetToken).toBeDefined();
  });

  test('should validate token from previous test', async () => {
    // ERROR: This test FAILS if run alone or before the first test!
    const result = await validateResetToken(resetToken);
    expect(result.isValid).toBe(true);
  });
});
```

**Single Assertion Per Test (When Possible)**:
- Aim for one primary assertion per test (tests one behavior)
- Multiple related assertions are acceptable if testing a single concept:
  ```typescript
  test('should hash password securely', async () => {
    const password = 'SecurePass123!';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password); // Password is hashed
    expect(hashed).toMatch(/^\$2[aby]\$/); // Uses bcrypt format
    expect(hashed.length).toBeGreaterThan(50); // Sufficient hash length
    // All three assertions validate the SAME behavior: secure hashing
  });
  ```

#### Section 6 - Mocking & Test Data

**What to Mock** (Unit Tests):
- **External Services**: Email provider, payment gateway, third-party APIs (Slack, GitHub, etc.)
- **Time-Dependent Functions**: `Date.now()`, `setTimeout()`, `setInterval()`
- **Random Data**: `Math.random()`, UUID generators (use fixed seeds or static values)
- **File I/O**: File system operations (use in-memory mocks)
- **Network Calls**: HTTP requests to external services (use `jest.mock()` or `nock`)

**Do NOT Mock** (Principle):
- Code you own (business logic, services, utilities)
- Simple standard library functions (Array methods, string operations)
- Language primitives (conditionals, loops)

**Stubbing Time-Dependent Functions**:
```typescript
// ✅ Good: Stub Date.now() for predictable results
const mockTimestamp = 1000000000; // Fixed timestamp
jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

test('should generate token with exp claim 24 hours from now', () => {
  const token = generateJWT({ sub: 1 });
  const decoded = verify(token, SECRET);
  
  expect(decoded.exp).toBe(mockTimestamp + 24 * 60 * 60 * 1000);
});
```

**Faking Infrastructure** (In-Memory Implementations):
- Use in-memory database for unit tests (no real PostgreSQL calls)
- Example: In-memory user store for password hashing tests
- Example: Fake email service that captures sent emails (don't send real emails)

```typescript
// ✅ Good: Fake email service for capturing emails
const sentEmails: Array<{ to: string; subject: string }> = [];

const fakeMailService = {
  sendEmail: async (to: string, subject: string, body: string) => {
    sentEmails.push({ to, subject });
    return { id: 'fake-email-' + Date.now() };
  }
};

jest.mock('../services/mail.service', () => fakeMailService);

test('should send password reset email', async () => {
  await requestPasswordReset('user@example.com');
  
  expect(sentEmails).toHaveLength(1);
  expect(sentEmails[0].to).toBe('user@example.com');
  expect(sentEmails[0].subject).toContain('reset');
});
```

**Test Fixtures & Helpers** (DRY Principle):

Extract common test data and setup into reusable helpers:

```typescript
// ✅ Good: Centralized test fixtures
const testFixtures = {
  createTestUser: (overrides?: Partial<User>): User => ({
    id: 1,
    email: 'test@example.com',
    password_hash: '$2b$12$...',
    created_at: new Date(),
    ...overrides
  }),

  createValidPassword: (): string => 'ValidPass123!@#',

  createValidEmail: (): string => `test-${Date.now()}@example.com`,

  setupMockBcrypt: () => {
    jest.mock('bcrypt', () => ({
      hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
      compare: jest.fn().mockResolvedValue(true)
    }));
  }
};

test('should hash password with cost 12', async () => {
  const user = testFixtures.createTestUser();
  const password = testFixtures.createValidPassword();
  
  const hashed = await hashPassword(password);
  expect(hashed).not.toBe(password);
});
```

**Mocking Patterns by Test Type**:

| Test Type | Mock Approach | Example |
|-----------|---------------|---------|
| **Unit** | Mock ALL external dependencies | `jest.mock('../db')`, `jest.mock('../mail')` |
| **Integration** | Mock ONLY external services (email, SMS) | Keep DB real, mock email |
| **E2E** | No mocks (or mock only unreliable services) | Real DB + API calls |

#### Section 7 - Quality Criteria (CRITICAL)

**What Makes a Good Test:**

A high-quality test has these essential characteristics:

**1. Tests Observable Behavior (Not Implementation Details)**
- ✅ "Should return 401 when password is incorrect" (observable: HTTP status)
- ❌ "Should call bcrypt.compare with correct parameters" (implementation detail)
- ✅ "Should create user record in database" (observable: database state)
- ❌ "Should call db.insert()" (implementation detail)

**Why**: Tests should verify **what** the system does, not **how** it does it. Implementation can change; behavior should remain stable.

```typescript
// ✅ Good: Tests observable behavior
test('should prevent duplicate email registration', async () => {
  const response = await register('user@example.com', 'password');
  expect(response.status).toBe(409); // Observable: HTTP response
});

// ❌ Bad: Tests implementation (which service method was called)
test('should call email uniqueness check', async () => {
  jest.spyOn(UserService, 'checkEmailExists');
  await register('user@example.com', 'password');
  expect(UserService.checkEmailExists).toHaveBeenCalled(); // Implementation detail
});
```

**2. Has Meaningful Assertions (Not Tautological)**
- ✅ `expect(result.status).toBe(201)` (verifies actual vs. expected)
- ❌ `expect(result).toBe(result)` (always true, useless)
- ✅ `expect(hashed).not.toBe(password)` (verifies transformation)
- ❌ `expect(hashed).toBeDefined()` (too vague without context)

**Tautological Test Anti-Pattern**:
```typescript
// ❌ Bad: Assertion is always true
test('should return token', async () => {
  const token = generateJWT({ sub: 1 });
  expect(token).toBe(token); // USELESS: always passes!
});

// ✅ Good: Assertion validates actual value
test('should return valid JWT token', async () => {
  const token = generateJWT({ sub: 1 });
  const decoded = verify(token, SECRET);
  expect(decoded.sub).toBe(1); // Validates token content
});
```

**3. Tests One Thing (Single Responsibility)**
- Each test should validate one behavior
- Multiple related assertions are OK if testing the **same concept**
- ✅ Test covers one business rule
- ❌ Test validates multiple unrelated behaviors

```typescript
// ✅ Good: Single responsibility
test('should hash password and store user', async () => {
  const result = await register('user@example.com', 'password');
  
  expect(result.id).toBeDefined();
  expect(result.password_hash).not.toBe('password');
  // Both assertions validate: "registration was successful and secure"
});

// ❌ Bad: Multiple unrelated concerns
test('should validate and register and send email and notify admin', async () => {
  // Too many behaviors; test will be brittle and hard to debug
});
```

**4. Is Fast**
- **Unit tests**: < 1 second (isolated, no I/O)
- **Integration tests**: < 5 seconds (with DB calls)
- **E2E tests**: < 30 seconds (can be slower, but should be stable)
- **Total suite**: Should run in < 2 minutes for fast feedback

Slow tests signal:
- ❌ Unit test doing I/O (should mock)
- ❌ Integration test with real HTTP calls (should mock external services)
- ❌ Test with unnecessary delays or fixed timeouts

**5. Is Deterministic** (Same Result Every Run)
- No randomness or time dependencies (use mocked time)
- No file system race conditions
- No shared state between tests
- No random test order dependencies

**Anti-Pattern - Flaky Test**:
```typescript
// ❌ Bad: Depends on time/randomness
test('should validate password reset token', async () => {
  const token = generateResetToken('user@example.com');
  
  // Sleep for 2 seconds - FLAKY! May timeout or vary in speed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await validateResetToken(token);
  expect(result.isValid).toBe(true);
});

// ✅ Good: Uses mocked time
test('should validate password reset token', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1000000);
  const token = generateResetToken('user@example.com', { expiresIn: 3600 });
  
  // Advance time by 1 hour (deterministic, fast)
  jest.spyOn(Date, 'now').mockReturnValue(1000000 + 3600 * 1000);
  
  const result = await validateResetToken(token);
  expect(result.isValid).toBe(false); // Token expired
});
```

---

**Quality Gates** (Non-Negotiable):

| Gate | Threshold | Tool | When Enforced |
|------|-----------|------|---------------|
| **Mutation Score** | ≥ 75% | Stryker Mutator | Pre-merge (CI) |
| **No Tautological Tests** | 0 | Manual review | Code review |
| **All Expected Values Validated by Humans** | 100% | Manual review | Code review |
| **Line Coverage** | ≥ 80% | Jest `--coverage` | Every push |
| **Branch Coverage** | ≥ 75% | Jest `--coverage` | Every push |

**Mutation Testing with Stryker** (TypeScript):

Mutation testing kills small code changes and verifies tests catch them:

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker
npx stryker run
```

Configuration in `stryker.config.json`:
```json
{
  "testRunner": "jest",
  "testFramework": "jest",
  "reporters": ["html", "dashboard"],
  "thresholds": {
    "high": 90,
    "medium": 75,
    "low": 60
  }
}
```

**Example: Mutation Testing** (Why it matters):
```typescript
// Source code
function isPasswordStrong(pwd: string): boolean {
  return pwd.length >= 8; // ← Stryker will mutate this
}

// Mutation: pwd.length >= 8  →  pwd.length > 8
// If test only checks length === 8, mutation survives (BAD)
// If test checks length === 7 AND 8, mutation is killed (GOOD)

// ✅ Good: Catches mutation
test('should reject password with 7 characters', () => {
  expect(isPasswordStrong('Pass123')).toBe(false);
});

test('should accept password with 8 characters', () => {
  expect(isPasswordStrong('Pass1234')).toBe(true);
});
```

---

**Anti-Patterns to AVOID**:

| Anti-Pattern | Why It's Bad | Solution |
|--------------|-------------|----------|
| **Test Private Methods** | Brittle to refactoring; tests implementation not behavior | Test public API only |
| **Interdependent Tests** | Test order matters; breaks parallel execution | Use `beforeEach()` for fresh state |
| **Brittle Tests** | Break on refactoring (esp. if testing impl details) | Test observable behavior |
| **Flaky Tests** | Intermittent failures; undermines confidence | Use mocked time, avoid I/O, fix race conditions |
| **Tests Without Assertions** | Silently pass even if code is broken | Always include meaningful `expect()` |
| **Copy-Pasted Test Logic** | Maintenance nightmare; changes must be made in N places | Extract helpers and fixtures |

**Code Example - Anti-Patterns**:
```typescript
// ❌ Anti-Pattern 1: Testing private method
test('should hash with bcrypt', () => {
  // DON'T: Don't test private method
  expect(userService['_hashPassword']('pass')).toBeDefined();
});

// ✅ Fix: Test public behavior
test('should create user with hashed password', async () => {
  const user = await userService.register('user@example.com', 'pass');
  expect(user.password_hash).not.toBe('pass');
});

// ❌ Anti-Pattern 2: Brittle test (tests implementation)
test('should call bcrypt.hash', async () => {
  jest.spyOn(bcrypt, 'hash');
  await userService.register('user@example.com', 'pass');
  expect(bcrypt.hash).toHaveBeenCalled(); // Breaks if impl changes
});

// ✅ Fix: Test observable behavior
test('should store hashed password in database', async () => {
  await userService.register('user@example.com', 'pass');
  const stored = await db.query('SELECT password_hash FROM users WHERE email = ?', ['user@example.com']);
  expect(stored[0].password_hash).not.toBe('pass');
});

// ❌ Anti-Pattern 3: Copy-pasted test logic
test('test 1', () => {
  const user = { id: 1, email: 'test@example.com', password_hash: '...' };
  expect(user.id).toBe(1);
});

test('test 2', () => {
  const user = { id: 1, email: 'test@example.com', password_hash: '...' }; // COPIED!
  expect(user.email).toBe('test@example.com');
});

// ✅ Fix: Extract helper
const createTestUser = (overrides) => ({ 
  id: 1, 
  email: 'test@example.com', 
  password_hash: '...', 
  ...overrides 
});

test('test 1', () => {
  const user = createTestUser();
  expect(user.id).toBe(1);
});

test('test 2', () => {
  const user = createTestUser();
  expect(user.email).toBe('test@example.com');
});
```

#### Section 8 - Tools & Frameworks

**Static Analysis & Type Checking:**

- **TypeScript 5.0+** with `strict: true` in `tsconfig.json`
- **ESLint** with `@typescript-eslint` configuration
  - Command: `npm run lint`
  - Enforced in CI on every push and PR
- **Type checking** (no runtime required)
  - Command: `npm run type-check` (runs `tsc --noEmit`)
  - Zero errors mandatory before merge

**Unit & Integration Testing:**

- **Framework**: Jest 29.x or Vitest
- **Assertion Library**: Jest built-in `expect()`
- **Mocking & Spies**: Jest mocks/spies (no additional libraries needed)
- **Test Execution**:
  - All tests: `npm test` (runs unit + integration)
  - Unit tests only: `npm run test:unit` (`jest --testPathPattern=unit`)
  - Integration tests only: `npm run test:integration` (`jest --testPathPattern=integration`)

**E2E Testing (Future):**

- **Framework**: Playwright 1.40+ (recommended for REST APIs)
- **Optional**: Stagehand for AI-native browser automation
- **Execution**: `npm run test:e2e`
- **Note**: E2E tests are minimal for v1; expand post-launch

**Coverage & Quality Tools:**

- **Coverage Tool**: Jest built-in (v8/istanbul backend)
  - Command: `npm run test:coverage`
  - Thresholds: 80% line, 75% branch (enforced in Jest config)
  - Report: `coverage/` directory (HTML + LCOV formats)

- **Mutation Testing**: Stryker Mutator (TypeScript-specific)
  - Package: `@stryker-mutator/core` + `@stryker-mutator/typescript-checker`
  - Command: `npm run test:mutation`
  - Threshold: 75% mutation score minimum (CI blocking for main branch)
  - Configuration: `stryker.config.json` (root of project)

**NPM Scripts** (package.json):

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/ tests/ --max-warnings 0",
    "lint:fix": "eslint src/ tests/ --fix",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:coverage": "jest --coverage",
    "test:mutation": "stryker run",
    "pre-commit": "npm run type-check && npm run lint && npm run test:unit"
  }
}
```

**Pre-Commit Hook** (Husky + lint-staged):

Before committing, enforce:
1. Type checking: `npm run type-check` (must pass)
2. Linting: `npm run lint` (must pass with zero warnings)
3. Unit tests: `npm run test:unit` (must pass)

**Example .husky/pre-commit**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm run lint
npm run test:unit
```

**CI/CD Pipeline** (GitHub Actions / Main Branch):

On every push to `main` branch, run ALL validations:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22.x'
          cache: 'npm'
      
      - run: npm install
      - run: npm run type-check        # TypeScript: zero errors
      - run: npm run lint              # ESLint: zero warnings
      - run: npm run test:unit         # Unit tests: must pass
      - run: npm run test:integration  # Integration tests: must pass
      - run: npm run test:coverage     # Coverage: ≥80% line, ≥75% branch
      - run: npm run test:mutation     # Mutation: ≥75% score (main branch only)
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

**Node.js & npm Compatibility:**

- **Node.js**: LTS 22.x (or latest LTS)
- **npm**: 10.x+ (comes with Node.js LTS)
- **All commands**: Compatible with `npm` (cross-platform: macOS, Linux, Windows)
- **No system binaries required**: All tools are npm packages

**Tool Installation** (package.json devDependencies):

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.x",
    "@typescript-eslint/parser": "^6.x",
    "eslint": "^8.x",
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "typescript": "^5.x",
    "@stryker-mutator/core": "^7.x",
    "@stryker-mutator/typescript-checker": "^7.x",
    "supertest": "^6.x"
  }
}
```

#### Section 9 - Unit Testing Standards
**Scope**: Services, utilities, business logic, domain models (auth.service.ts, user.service.ts, token.service.ts, password-reset.service.ts, mail.service.ts).

**Requirements**:
- Each test file mirrors source structure: `src/services/auth.service.ts` → `tests/unit/auth.service.test.ts`
- Tests are isolated: no external I/O, no database calls, no HTTP requests
- Use `jest.mock()` for external dependencies (database, email, JWT libraries)
- Each test covers one behavior: "should hash password with bcrypt cost 12" (single assertion if possible)
- Arrange-Act-Assert (AAA) pattern enforced
- No `any` types in test files; use TypeScript `as` assertions only when necessary with explanatory comments

**Examples**:
```typescript
// ✅ Good: Single responsibility
test('should hash password with bcrypt cost 12', async () => {
  const password = 'ValidPassword123!';
  const hashed = await hashPassword(password);
  expect(hashed).not.toBe(password);
  expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
});

// ✅ Good: Isolated, no I/O
test('should verify JWT token and extract userId', () => {
  const payload = { sub: 42, iat: 1000, exp: 2000 };
  const token = sign(payload, SECRET);
  const decoded = verify(token, SECRET);
  expect(decoded.sub).toBe(42);
});
```

#### Section 10 - Integration Testing Standards
**Scope**: Express.js route handlers (auth.router.ts), API endpoints, database transactions, external adapter integration.

**Requirements**:
- Test files: `tests/integration/register.test.ts`, `login.test.ts`, `password-reset.test.ts`, `session.test.ts`
- Use `supertest` for HTTP testing: `request(app).post('/auth/register')`
- Use real (or in-memory) PostgreSQL database for integration tests; no mocking of database layer
- Test full request/response cycle: valid input → success response; invalid input → error response
- Test side effects: user record created, password hashed, email sent, token blocklist updated
- Transactions must roll back after each test (`beforeEach()`/`afterEach()` cleanup)

**Examples**:
```typescript
// ✅ Good: Full HTTP + Database cycle
test('POST /auth/register creates user and returns 201', async () => {
  const response = await request(app)
    .post('/auth/register')
    .send({ email: 'user@example.com', password: 'SecurePass123!' });
  
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('userId');
  
  // Verify side effect: user in database
  const user = await db.query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
  expect(user.rows.length).toBe(1);
  expect(user.rows[0].password_hash).not.toBe('SecurePass123!');
});
```

#### Section 11 - E2E Testing Standards
**Scope**: Critical user workflows only (registration → login → password reset lifecycle).

**Requirements**:
- Test files: `tests/e2e/user-registration-login.test.ts` (one file per critical workflow)
- Keep E2E tests minimal and stable: ~3-5 critical journeys maximum
- Tests run against deployed/staging environment or integration-test database
- Test realistic user sequences: register new user → login with credentials → request password reset → verify email link → reset password → login with new password
- Avoid testing implementation details; focus on user-observable outcomes

**Implementation**:
- Use Jest + Supertest for REST API E2E testing
- Run in CI after unit and integration tests pass
- Failures in E2E should not block merges if infrastructure is the issue (use conditional skip)

#### Section 12 - Mock & Spy Strategy (Advanced)
**Mocking Policy**:
- **DO Mock** (Unit Tests): Database, HTTP clients, external APIs, email service
- **DO NOT Mock** (Integration Tests): Database layer, HTTP routing, business logic
- **Selective Mocking** (E2E Tests): Mock only external services (email delivery), keep database real

**Jest Mocking Patterns**:
```typescript
// ✅ Unit test: Mock database for isolation
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1, email: 'user@example.com' }] })
}));

// ✅ Integration test: Real database, mock email service
jest.mock('../services/mail.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
}));
```

**Spy Usage**:
- Use `jest.spyOn()` to verify side effects: "password hashing was called with cost 12"
- Verify external calls: "bcrypt.compare was called with correct hash"
- Do not spy on internal implementation details unless testing a specific contract

#### Section 13 - CI/CD Testing Gates
**Automated Validation** (GitHub Actions / CI/CD Pipeline):
- **On every push**:
  - TypeScript compilation: `tsc --noEmit` (must pass with zero errors)
  - ESLint: `eslint src/ tests/` (must pass with zero warnings)
  - Jest unit tests: `jest --testPathPattern=unit` (must pass)
  - Jest integration tests: `jest --testPathPattern=integration` (must pass)
  - Coverage check: `jest --coverage --collectCoverageFrom='src/**/*.ts'` (≥80% line, ≥75% branch)
  
- **Before merge** (Pull Request checks):
  - All CI checks must pass
  - Coverage report must meet thresholds
  - No test regressions (compare with main branch baseline)
  - JSDoc check on exported symbols (ESLint `jsdoc` plugin)
  
- **Allowed failures**:
  - E2E tests may be skipped if environment is unavailable (mark with `test.skip()` with reason comment)
  - Mutation testing is recommended but not blocking for v1

**Jest Configuration** (`jest.config.ts`):
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 75,
      lines: 80,
      functions: 80,
      statements: 80
    }
  }
};
```

---

## Technology Constraints

TypeScript ≥ 5.0 with `strict: true`; Node.js LTS for runtime; Jest (or Vitest) as the test framework; ESLint with `@typescript-eslint` rules enforced in CI; Prettier for consistent formatting — no manual style debates.

## Quality Gates

All PRs must pass: TypeScript compilation with zero errors, ESLint with zero warnings, test suite with ≥ 80% coverage on business logic, JSDoc presence check on exported symbols; Peer review required before merge; Constitution compliance verified during code review.

## Governance

This Constitution supersedes all other development practices; Amendments require: written rationale, team approval, and a migration plan for existing code; All PRs must verify compliance with these principles; Complexity beyond these standards must be explicitly justified.

**Version**: 1.3.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12

