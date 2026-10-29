# Clata Content Package Specification

## Archive

The package is a ZIP archive named `.clata`; a `.zip` file is accepted as a sharing/compatibility fallback. One archive represents exactly one language-dialect combination and has no package dependency.

```text
manifest.json
unit.json
kata.json
kalimat.json
dialog.json
challenge.json
audio/
tanda-tangan
```

## Manifest contract

The manifest MUST include `package_id`, `language_id`, `dialect_id`, `package_version`, `schema_version`, `minimum_app_version`, `register_mapping`, `orthography_reference`, `created_at`, `item_counts`, `files`, `key_id`, and `signature_reference`.

`files` contains normalized archive paths, byte sizes, and SHA-256 checksums. Archive paths MUST use `/`, be relative, and never contain `..`.

## Validation order

1. Check file size, archive entry count, and safe paths.
2. Read only the minimum manifest envelope.
3. Check supported schema/app version.
4. Verify signature over canonical manifest plus file checksums.
5. Verify every checksum and declared size.
6. Verify supported language/dialect and package version.
7. Verify item references, graph reachability, audio references, and content rules.
8. Reject public release packages containing `poc` or missing verifier metadata.
9. Check free storage and install atomically.

Signatures use Ed25519 with a `key_id`. The signed message is a UTF-8 JSON Canonicalization Scheme (JCS / RFC 8785) serialization of the manifest envelope plus the normalized file checksum list. File checksums use SHA-256. The application contains active and backup public keys; private keys remain outside the repository and daily development devices.

### Canonical signature contract

1. Archive paths are normalized to `/` and sorted lexicographically by UTF-8 byte order.
2. Every file entry contains `path`, `size_bytes`, and lowercase `sha256`.
3. The signature input is a JCS object with `manifest` and `files`; the `signature` field is excluded from the signed object.
4. JSON is encoded as UTF-8 without BOM; no whitespace, trailing newline, or locale-dependent formatting is allowed.
5. Ed25519 signs the canonical bytes directly.
6. `tanda-tangan` contains `algorithm`, `key_id`, `encoding: base64url`, and `signature`.
7. Verification rejects unknown algorithms, unknown/revoked key IDs, duplicate paths, checksum mismatch, and non-canonical representations.

## Content rules

IDs are unique inside a package. Dialog graphs must have no orphan nodes or dead ends. Challenge references must resolve to package items. Audio metadata must declare format, duration, channel count, and sample rate. Item status and license metadata are mandatory.

## Failure behavior

Invalid, lower-version, duplicate-version, corrupt, unsigned, or unsupported packages MUST be rejected with a reason code. Existing package, progress, and archive MUST remain unchanged.
