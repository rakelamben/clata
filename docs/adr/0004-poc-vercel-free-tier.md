# ADR 0004 — Vercel Free Tier for P0 and P1

Status: Accepted with scope limitation

## Context

The PRD selects Vercel for static catalog/package hosting, and the initial P0/P1 stages should avoid hosting cost.

## Decision

Use Vercel Free Tier for P0 and P1 static catalog/package distribution. Do not build a backup host yet. Monitor terms, bandwidth, access logs, anonymization, retention, privacy policy, and operational limits throughout these phases.

## Consequences

Package distribution must remain small and non-critical. A backup hosting strategy is a later operational task, triggered by scale, policy, reliability, or cost constraints.
