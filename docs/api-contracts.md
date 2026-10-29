# Clata API Contracts (P1)

These operations are implemented through trusted Supabase Edge Functions, except the official Supabase Auth flows. Direct client writes to progress tables are prohibited.

## Required operations

- auth callback/session refresh;
- password reset request and password update through Supabase Auth;
- profile upsert with timezone;
- progress batch push/pull;
- reset package command;
- delete account;
- signed catalog fetch;
- package download metadata.
- AI dialogue generation through a trusted provider router;
- AI sentence report queue.

## Supabase Edge Function contracts

All functions require a valid Supabase access token. The server derives `user_id` from the token and never trusts a client-supplied owner ID.

### `progress-push`

`POST /functions/v1/progress-push`

Request:

```json
{
  "idempotency_key": "ulid",
  "device_id": "device-ulid",
  "events": [
    {
      "event_id": "ulid",
      "package_id": "jv-mtr",
      "item_id": "word-u1-001",
      "event_type": "answer_gtw",
      "source": "curated",
      "result": 1,
      "weight": 1,
      "session_id": "ulid",
      "device_time": "2026-10-28T10:00:00.000Z",
      "local_date": "2026-10-28",
      "formula_version": 1,
      "payload": {}
    }
  ]
}
```

Response returns `accepted_event_ids`, `already_accepted_event_ids`, `rejected_events` with safe reason codes, and a `server_cursor`. The operation is atomic per event and idempotent by `event_id`.

### `progress-pull`

`POST /functions/v1/progress-pull`

Request: `{ "cursor": "opaque-or-null", "limit": 500 }`.

Response: `{ "events": [], "reset_commands": [], "next_cursor": "opaque", "has_more": false }`.

The cursor is opaque, scoped to the authenticated user, and must not be constructed by the client.

### `reset-package-progress`

`POST /functions/v1/reset-package-progress`

Request: `{ "package_id": "jv-mtr", "command_id": "ulid", "reason": "user_requested" }`.

The function authorizes the user, writes an idempotent package-scoped reset command/tombstone, and returns its server sequence. Existing events are retained but excluded from replay when covered by the reset command.

### `ai-dialogue-generate`

`POST /functions/v1/ai-dialogue-generate`

Requires an authenticated user aged 10+ with verified guardian consent when the user is 10–17, plus an available server-side daily quota. The request contains only the selected package/unit context, allowed bank item IDs, conversation constraints, and a request idempotency key. It MUST NOT contain birth year, phone number, email, guardian identity, or unrelated learning history.

The Edge Function routes to the configured free-tier Gemini model first and Groq model second when the first provider times out, rate-limits, or fails. Provider credentials and model IDs exist only in server secrets/configuration. The function validates the generated schema, word-bank membership, register, word limits, and age/content safety before returning it. Provider errors are normalized to safe application error codes.

Response shape:

```json
{
  "dialogue": {},
  "label": "ai_unverified",
  "audio_policy": "bank_only",
  "quota": { "used": 1, "limit": 3 }
}
```

### `ai-dialogue-report`

`POST /functions/v1/ai-dialogue-report`

Accepts authenticated report metadata: package ID, item/dialogue ID, generated line ID, package version, and user note. It is idempotent, stores no provider secret, and queues offline reports for later submission.

### `delete-account`

`POST /functions/v1/delete-account`

Requires a recent authenticated session or re-authentication. It deletes application rows and then requests Supabase Auth user deletion. The response exposes only completion/failure category, never provider internals.

## Contract rules

- Every request has a timeout, correlation ID, and safe error code.
- Progress push uses idempotency keys and bounded batches.
- Pull uses opaque cursor pagination; clients do not assume sort order beyond the contract.
- Server validates authenticated ownership for every user-owned row.
- Client never sends birth year, local-only challenge checks, or unrelated package data.
- Server errors expose actionable categories, not provider internals.
- AI provider fallback and model selection are server-side implementation details and are never trusted from client input.
- AI generation has a hard timeout, bounded retries, maximum response size, and validation before rendering.
- OpenAPI/JSON Schema or equivalent machine-readable contracts MUST be committed before P1 integration.
- Request and response schemas MUST reject unknown critical fields, enforce maximum batch size, validate package/item identifiers, and cap payload size.
- Edge Functions MUST use server time for received timestamps and cap device timestamps according to the PRD's 24-hour rule.
