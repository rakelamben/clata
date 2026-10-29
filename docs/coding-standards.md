# Clata Coding Standards

## TypeScript

- `strict: true`; avoid `any`, prefer `unknown` plus narrowing.
- External data MUST be parsed with a runtime schema before entering domain code.
- Domain functions SHOULD be pure and deterministic.
- Inject clock, ID generator, random source, filesystem, network, and database ports.
- Use explicit return types for public functions and ports.
- Avoid hidden mutation; return new domain values.

## Async and errors

- Use `async/await`; do not ignore rejected promises.
- Use typed domain/application errors with a safe user-facing mapper.
- Cancellation and retry behavior MUST be explicit for filesystem and network operations.
- Never expose raw SQL, provider errors, tokens, or stack traces to users.

## React Native

- Components receive data and callbacks, never repositories.
- Stable list keys MUST use domain IDs, never array indexes.
- Avoid unnecessary global state; transient state stays in the component.
- Every interactive control needs an accessibility label and deterministic disabled/loading state.

## Data and logging

- SQL MUST use bound parameters.
- Dates are ISO strings at boundaries; local date semantics follow the PRD.
- Logs MUST exclude tokens, OTP, email, phone, birth year, learning payloads, and raw package contents.

## Tooling and review

ESLint, Prettier, TypeScript, tests, and dependency audit are required quality gates. Commits use Conventional Commits, e.g. `feat(vocabulary): record viewed word`. PRs MUST document offline behavior, migrations, security impact, and tests.
