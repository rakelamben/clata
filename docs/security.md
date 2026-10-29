# Clata Security and Privacy Standard

## Threat boundaries

Untrusted inputs are package files, catalog responses, deep links, OAuth callbacks, AI text, user text, and local files shared by other apps. Trusted assets are signed release packages, validated domain data, and server functions after session/ownership checks.

## Mandatory controls

- Private keys, `service_role`, OAuth secrets, and SMS credentials live only in a secret manager/server.
- Supabase anon key is public configuration only; RLS MUST be enabled and tested.
- Tokens and OTP are handled by official auth storage and never logged.
- ZIP extraction MUST block path traversal, duplicate paths, excessive entries, and decompression bombs.
- Signature/checksum verification MUST occur before trusting package contents.
- Temporary files are cleaned after success, cancellation, failure, and recovery.
- Deep links validate scheme, host, state, nonce, and expected callback.
- Logs exclude PII, birth year, learning payloads, tokens, and package content.
- No account means no P0 network request; catalog/download requests carry no birth year or progress.
- Delete-account uses a trusted server function and has auditable completion/error states.
- Gemini and Groq API keys live only in server secrets; the mobile app never calls either provider directly.
- AI requests are minimized to package/content constraints and must not include birth year, email, phone number, or unrelated personal data.
- Generated AI output is untrusted until schema, bank membership, register, length, and safety validation pass.

## Privacy invariants

Birth year remains local. Account, sync, and AI dialogue may be used from age 10 only after required guardian consent for ages 10–17. Download log retention/anonymization, OS backup disclosure, Supabase providers, and deletion retention MUST match the published privacy policy.

## Operational security

Before P1: RLS tests with two accounts, dependency audit, key custody/backup, rotation/revocation drill, secret scan, incident contact, and deletion verification MUST pass. Package signing uses Ed25519/SHA-256. Vercel Free Tier is permitted for P0 and P1, with ongoing hosting, retention, privacy, terms, and bandwidth review. Backup hosting is deferred.
