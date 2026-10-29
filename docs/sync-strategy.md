# Clata Sync Strategy (P1)

## Principles

- Local SQLite write completes before network sync.
- Sync is idempotent by `event_id` and account ID.
- Merge is event union, never whole-snapshot overwrite.
- Derived values are rebuilt after merge.
- Offline learning never waits for or fails because of sync.

## Client lifecycle

1. Create event locally.
2. Insert event and outbox row in one transaction.
3. Trigger sync after login, foreground, connectivity recovery, or grouped progress changes.
4. Upload outbox batches with an idempotency key.
5. Pull server changes from a cursor with pagination.
6. Apply unseen events transactionally.
7. Advance cursor and acknowledge outbox rows.
8. Replay derived progress.

## Retry

Use bounded exponential backoff with jitter. Permanent validation/auth errors stop retrying and require user action. Network/timeouts remain pending. Sync status must be visible without blocking P0.

## Merge rules

- Events: set union by `event_id`.
- Strength: replay complete merged answer log.
- Active dates/endings: set union.
- Best score/highest level: maximum.
- Settings: per-key last-write-wins using server-normalized time.
- Reset: signed/authorized command plus package tombstone/version; older events are ignored for that package.

## Account transitions

Initial login preserves local data and merges it with the account. `Use account data only` is destructive and requires confirmation. Logout keeps local data by default but blocks upload until the same account returns. Switching accounts requires an explicit context decision; local outbox MUST NOT upload automatically to another account.

## Supabase boundary

Client-facing tables use RLS and `user_id = auth.uid()`. Progress push, pull, and reset run through trusted Supabase Edge Functions. Direct client writes to progress tables are prohibited. Cursor, batch size, payload shape, and endpoint contract are specified in `api-contracts.md`.
