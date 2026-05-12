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

## Technology Constraints

TypeScript ≥ 5.0 with `strict: true`; Node.js LTS for runtime; Jest (or Vitest) as the test framework; ESLint with `@typescript-eslint` rules enforced in CI; Prettier for consistent formatting — no manual style debates.

## Quality Gates

All PRs must pass: TypeScript compilation with zero errors, ESLint with zero warnings, test suite with ≥ 80% coverage on business logic, JSDoc presence check on exported symbols; Peer review required before merge; Constitution compliance verified during code review.

## Governance

This Constitution supersedes all other development practices; Amendments require: written rationale, team approval, and a migration plan for existing code; All PRs must verify compliance with these principles; Complexity beyond these standards must be explicitly justified.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12

