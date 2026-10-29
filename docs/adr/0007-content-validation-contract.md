# ADR 0007 — Shared Content Validation

Status: Accepted

## Context

The mobile installer and content builder must enforce the same package contract.

## Decision

Use JSON Schema for structural validation and a domain semantic validator for references, graphs, register, audio, status, and release rules.

## Consequences

Schemas and fixtures are versioned and tested as contract artifacts.
