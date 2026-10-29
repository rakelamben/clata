# Clata Supabase Schema Design (P1)

Supabase Auth remains the identity source. Application tables use `auth.users.id` as `user_id`. All application tables enable RLS.

## Tables

### `public.profiles`

`user_id uuid primary key references auth.users(id) on delete cascade`, `display_name text null`, `timezone text not null`, `created_at timestamptz`, `updated_at timestamptz`.

The client may read/update only its own row. Phone/email are not copied here.

### `public.learning_events`

`event_id text primary key`, `user_id uuid not null`, `device_id text not null`, `package_id text not null`, `item_id text null`, `event_type text not null`, `source text not null`, `result numeric null`, `weight numeric null`, `session_id text null`, `device_time timestamptz not null`, `received_at timestamptz not null default now()`, `local_date date not null`, `formula_version integer not null`, `payload jsonb not null default '{}'`, `created_at timestamptz not null`.

Unique `(user_id, event_id)`. Index `(user_id, received_at, event_id)`, `(user_id, package_id, item_id)`, and `(user_id, local_date)`.

### `public.sync_batches`

`id uuid primary key`, `user_id uuid not null`, `idempotency_key text not null`, `device_id text not null`, `received_at timestamptz not null`, `status text not null`, `result jsonb not null`.

Unique `(user_id, idempotency_key)`. This prevents retried batches from duplicating effects.

### `public.reset_commands`

`command_id text primary key`, `user_id uuid not null`, `package_id text not null`, `server_sequence bigint generated`, `requested_at timestamptz`, `status text`, `reason text`.

Unique `(user_id, command_id)`. Index `(user_id, package_id, server_sequence)`.

### `public.sync_cursors`

`user_id uuid primary key`, `last_sequence bigint not null default 0`, `updated_at timestamptz not null`.

This is server state; clients receive opaque cursors rather than reading this table directly.

## RLS

Direct client access is limited to the minimum profile operations. Learning events, sync batches, reset commands, and cursors are accessed through trusted Edge Functions. Every policy uses `auth.uid() = user_id`; service-role access is server-only.

## Server invariants

- Event ownership comes from the JWT.
- Duplicate event IDs are idempotent only when the immutable payload matches; mismatches are rejected.
- Reset commands are monotonic per package.
- Device times more than 24 hours ahead are normalized according to the PRD.
- Account deletion cascades application data and is auditable without retaining sensitive payloads.
