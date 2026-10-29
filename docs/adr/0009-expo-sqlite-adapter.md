# ADR 0009 — SQLite Behind DatabasePort

Status: Accepted

## Context

SQLite is mandated by the PRD, but domain tests must not depend on Expo APIs.

## Decision

Use Expo SQLite behind a `DatabasePort` and repository interfaces.

## Consequences

Adapter-specific migration and transaction behavior requires integration tests; domain tests use fakes.
