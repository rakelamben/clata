# ADR 0001 — Audio Format

Status: Accepted

## Context

Packages must remain small and audio must work on Android and iOS.

## Decision

Use Opus mono as the final format. AAC/M4A is retained only as a future fallback if a newly supported platform loses compatibility.

## Consequences

Compatibility on the target Android and iOS platforms has been verified. Playback interruption, silent mode behavior, duration, and package size remain regression tests.
