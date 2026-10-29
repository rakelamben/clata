# ADR 0002 — Package Signature

Status: Accepted

## Context

Packages may arrive from downloads or untrusted file sharing and must be authentic.

## Decision

Use Ed25519 signatures with a `key_id`. Sign UTF-8 JCS/RFC 8785 canonical JSON containing the manifest and normalized SHA-256 file checksum list. Embed active and backup public keys in the app; keep private keys outside the repository and daily devices.

## Consequences

Canonicalization, key rotation, revocation, and invalid-signature fixtures are release requirements.
