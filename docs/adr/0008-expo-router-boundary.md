# ADR 0008 — Expo Router Boundary

Status: Accepted

## Context

Expo Router route files must not become the application composition root.

## Decision

Use `src/app/` for routes and `src/bootstrap/` for composition root, providers, migrations, and startup recovery.

## Consequences

Routes remain thin and framework-specific code does not leak into domain/application layers.
