# Clata Content Authoring Rules

## Workflow

`draft → submitted → reviewed → verified → published`; revision returns an item to `draft`.

Contributors and verifiers MUST be different people. Public packages MUST contain no `poc` or unverified item.

## Required provenance

Every item records source, method, contributor, verifier, revision, license/consent metadata, register, unit, and audio status. Text follows the approved orthography and register mapping in the package manifest.

## Validation

The builder MUST validate IDs, references, sentence word coverage, dialogue graph reachability, distractor rules, challenge safety, audio duration/format, verifier status, manifest counts, checksums, signature, and package size.

AI MAY draft candidates or check consistency but MUST NOT be the sole linguistic source or verifier. Audio requires written consent and is not automatically open-licensed.

## Publishing checklist

Human verification complete, audio consent present, no prohibited topics, no orphan references, package fixture tests pass, release version incremented, and signing occurs outside daily development credentials.
