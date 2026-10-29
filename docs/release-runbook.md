# Clata Release Runbook

## P0 gate

1. Verify PRD traceability and all P0 acceptance criteria.
2. Run migration-from-every-supported-version tests.
3. Build contains only the Jawa-Mataraman bundle.
4. Run full airplane-mode journey.
5. Verify package size, startup, audio latency, accessibility, and crash target.
6. Verify privacy policy, About, licenses, age gate, backup disclosure, and store forms.
7. Archive build, test report, package checksum, and release notes.

## P1 gate

Additionally verify Supabase RLS, email/OTP/Google redirects, account deletion, sync conflict scenarios, catalog signature, Vercel Free Tier retention/privacy/bandwidth, package download/import/export, and key custody. Backup hosting is not required for this phase.

## Rollback

Keep the previous application and package versions. A failed package release is removed from the catalog but never replaces an installed valid version. A database/server migration needs a documented forward recovery; destructive rollback is prohibited without explicit approval.
