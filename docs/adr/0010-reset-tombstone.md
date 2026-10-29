# ADR 0010 — Reset Tombstones

Status: Accepted

## Context

Reset must propagate across devices without allowing older queued events to restore deleted progress.

## Decision

Represent reset as an authorized package-scoped command/tombstone/version. Retain historical events, but exclude events covered by the reset during replay.

## Consequences

Reset requires idempotency, ordering, server authorization, and dedicated offline/online tests.
