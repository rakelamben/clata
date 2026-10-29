# ADR 0006 — Zustand Feature State

Status: Accepted

## Context

Clata needs small cross-screen UI state while SQLite remains the data source of truth.

## Decision

Use Zustand with feature-scoped slices. Domain and repositories remain independent of Zustand.

## Consequences

Global state is limited to UI/session coordination; persisted learning data must use use cases and repositories.
