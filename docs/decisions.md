# Clata Decisions and Approved Proposals

## Status vocabulary

- `K`: product decision from PRD.
- `A`: architecture decision accepted.
- `P-*`: proposal identifier retained for traceability; approval is recorded in the tables below.
- `T`: parameter requiring experiment.
- `TBD`: blocked; must not be silently assumed.

## Accepted baseline

| ID | Decision | Status | Source |
|---|---|---|---|
| D-001 | React Native + Expo | K | PRD |
| D-002 | SQLite local source of truth | K | PRD |
| D-003 | Standalone package per language-dialect | K | PRD |
| D-004 | Append-only progress events and derived replay | K | PRD |
| D-005 | Supabase Auth/Postgres for P1 | K | PRD |
| D-006 | Signed atomic package installation | K | PRD |
| D-007 | Vercel catalog/package hosting | K | PRD |
| D-008 | Expo Router, Zustand, and Zod | A | Owner approval |
| D-009 | Route directory separated from composition root | A | Owner approval |
| D-010 | Bahasa antarmuka sistem adalah Bahasa Indonesia | K | PRD / owner clarification |
| D-011 | `kata_dilihat` tidak menjadi syarat membuka sesi latihan | K | Owner clarification |
| D-012 | Akun tersedia mulai usia 10 tahun dengan consent wali untuk usia 10–17 | K | Owner clarification |
| D-013 | Ekstensi resmi package adalah `.clata`; `.zip` tetap diterima sebagai fallback berbagi file | K | Owner clarification |
| D-014 | AI dialogue memakai free-tier Gemini API dan Groq API melalui server-side provider router | K | Owner clarification |
| D-015 | AI dialogue tersedia mulai usia 10 tahun dengan consent wali untuk usia 10–17 | K | Owner clarification |

## Approved technical decisions (original proposal IDs)

| ID | Topic | Recommended option | Alternatives | Reason |
|---|---|---|---|---|
| P-001 | Audio | Opus mono sebagai format final | AAC/M4A fallback | Approved; kompatibilitas Android/iOS sudah dibuktikan |
| P-002 | Package signature | Ed25519 + SHA-256 dengan canonicalization JCS | ECDSA P-256; detached CMS | Approved; canonicalization ditetapkan di `content-package-spec.md` |
| P-003 | Supabase progress API | Trusted Edge Function dengan kontrak rinci | Direct client Postgres writes | Approved; kontrak ada di `api-contracts.md` |
| P-004 | Vercel hosting/logging | Vercel Free Tier for P0 and P1, dengan verifikasi asynchronous | Paid Vercel; different static host | Approved; backup hosting deferred |
| P-005 | Performance baseline | Android 8+ dan iOS 16.4+ | Android 8+ dan iOS 15+ | Approved; mengikuti support matrix Expo SDK 58 |
| P-006 | State library | Zustand with feature slices | Redux Toolkit, React context | Approved; small local UI state surface and low ceremony |
| P-007 | Content validation | JSON Schema + domain semantic validator | TypeScript-only validation | Approved; shared contract for mobile and content tools |
| P-008 | Routing boundary | Expo Router in `src/app/`, bootstrap/DI in `src/bootstrap/` | Root `app/` + `src/`; manual React Navigation | Approved; avoids route/composition-root collision |
| P-009 | Local database adapter | Expo SQLite behind `DatabasePort` | WatermelonDB, custom native module | Approved; preserves SQLite PRD while keeping domain vendor-free |
| P-010 | Reset semantics | Tombstone command/version; retain old events | Hard-delete local events | Approved; safer multi-device merge and auditability |

All items above are approved. Vercel terms, logs, retention, privacy, bandwidth, and usage limits are asynchronous verification work during P0/P1. Remaining technical validation work may proceed in parallel with implementation and must not block the initial architecture unless it affects data loss, security, or release compatibility.

## Asynchronous validation policy

The following work is intentionally performed alongside development: Vercel operational verification, performance benchmarks, package-size measurements, signing key rotation drill, store-policy review, Supabase deployment verification, and mastery calibration. Findings MUST be recorded in the relevant ADR or release evidence and MUST block release when they violate security, privacy, data integrity, or platform compatibility requirements.
