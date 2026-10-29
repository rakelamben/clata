# ADR 0003 — Trusted Supabase Progress Functions

Status: Accepted

## Context

Progress synchronization needs validation, batching, idempotency, tombstones, and ownership checks.

## Decision

Use trusted Supabase Edge Functions for progress push, pull, and reset. Direct client writes to progress tables are prohibited.

## Consequences

The client uses SQLite first and treats functions as sync transport. RLS remains mandatory for all client-facing tables.
