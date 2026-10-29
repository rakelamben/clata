# P0 Implementation Plan 3 — SQLite & Progress Engine

## 1. Tujuan

Mengubah SQLite menjadi source of truth lokal Clata dan membangun mesin progres yang dapat direplay secara deterministik. Plan ini melanjutkan handoff Plan 1 dan Plan 2:

- Plan 1 menyediakan `openDatabase`, `runMigrations`, `Clock`, `DeviceIdentity`, `Logger`, `RepositoryResult`, dan startup recovery boundary.
- Plan 2 menyediakan `PackageIdentity`, stable `(package_id, item_id)`, content package yang tervalidasi, installed package version, atomic package lifecycle, dan package update event.

Setelah plan ini selesai, aplikasi memiliki persistence lokal untuk paket, konten, settings, learning events, challenge state, derived progress, package archive metadata, dan restart-safe startup.

## 2. PRD scope

| Requirement | Implementasi |
|---|---|
| FR-12 | Log kata dilihat dengan aturan foreground dan durasi satu detik |
| FR-60 | Active days dan streak global |
| FR-61 | Statistik per bahasa-dialek dan jenis sesi |
| FR-62 | Strength, mastery, level, highest level |
| FR-80..82 | Persist installed package, content, version, update, package-scoped progress |
| FR-50 | Semua fitur P0 berjalan dengan data lokal tanpa akun |
| FR-52 | Local data warning dan data internal bukan cache |
| Architecture | SQLite source of truth, append-only events, rebuildable derived data |

## 3. Prasyarat dan batas scope

### Dari Plan 1

- `DependencyContainer` dan composition root.
- `StartupRunner` dengan step `openDatabase`, `runMigrations`, `rebuildDerivedCaches`.
- Error model dan logger tersanitasi.
- `Clock` dan `DeviceIdentity` ports.
- Repository result contract.

### Dari Plan 2

- `PackageIdentity`.
- `PackageArchiveEntry` dan package validation result.
- Package source yang telah melewati signature/checksum/content validation.
- Stable item ID.
- Install staging dan activation lifecycle.
- SemVer update result.

### Tidak termasuk

- Supabase sync, auth, outbox network behavior, dan server tombstone P1.
- AI dialogue.
- Package download/import UI P1.
- Full practice/vocabulary UI; plan ini hanya menyediakan repository/use case engine.

### P1-compatible tables included now

Walaupun network sync adalah P1, schema lokal berikut dibuat pada Plan 3 agar event transaction dan reset tidak perlu dirombak:

- `sync_outbox`.
- `sync_state`.
- `reset_commands`.

Plan 3 hanya membuat dan memelihara state lokalnya. Upload, pull, cursor network, dan server tombstone tetap dikerjakan Plan P1.

## 4. Keputusan storage

1. Gunakan `expo-sqlite` versi yang cocok dengan Expo SDK project melalui `npx expo install expo-sqlite`.
2. SQLite berada di internal app storage, bukan cache.
3. Foreign key selalu aktif.
4. Semua migration forward-only, transactional, dan bernomor.
5. Learning events append-only; operasi biasa tidak mengubah atau menghapus event.
6. Derived tables adalah cache yang boleh dihapus dan dibangun ulang.
7. Package content immutable setelah activation.
8. Package update menulis versi baru secara atomic dan tidak menghapus event lama.
9. Reset progres memakai reset command/tombstone lokal agar event lama tidak menghidupkan kembali progres saat P1 sync ditambahkan.
10. Semua waktu tersimpan sebagai UTC ISO-8601; `local_date` dihitung dari timezone perangkat ketika event dibuat.

## 5. Struktur folder target

```text
src/
  infrastructure/database/
    SQLiteDatabase.ts
    sqliteConfig.ts
    migrations/
      Migration.ts
      0001_initial.ts
      0002_progress_indexes.ts
      migrationRunner.ts
    repositories/
      SQLiteAppMetadataRepository.ts
      SQLitePackageRepository.ts
      SQLiteContentRepository.ts
      SQLiteLearningEventRepository.ts
      SQLiteProgressRepository.ts
      SQLiteSettingsRepository.ts
      SQLiteChallengeRepository.ts
    transaction.ts
    recoveryMarkers.ts
  domain/progress/
    learningEvent.ts
    eventPayloads.ts
    strength.ts
    mastery.ts
    streak.ts
    statistics.ts
    replay.ts
    contentPicker.ts
  features/progress/
    application/
      recordLearningEvent.ts
      rebuildProgress.ts
      getProgressSummary.ts
      resetPackageProgress.ts
    data/
      progressRepository.ts
  features/packages/
    application/
      persistInstalledPackage.ts
      updateInstalledPackage.ts
  data/mappers/
    sqliteMappers.ts

tests/
  unit/progress/
    strength.test.ts
    mastery.test.ts
    streak.test.ts
    replay.test.ts
    statistics.test.ts
  integration/database/
    migration.test.ts
    repository.test.ts
    transaction.test.ts
    package-persistence.test.ts
    progress-rebuild.test.ts
  property/progress/
    replay-order.test.ts
    idempotency.test.ts
    package-update.test.ts
```

## 6. SQLite schema

### 6.1 `app_metadata`

| Column | Type | Rule |
|---|---|---|
| `key` | TEXT | singleton/known keys |
| `value_json` | TEXT | validated JSON |
| `updated_at` | TEXT | UTC ISO-8601 |

Required keys:

- `schema_version`.
- `device_id`.
- `install_state`.
- `onboarding_completed`.
- `last_startup_recovery`.

### 6.2 `installed_packages`

| Column | Type | Rule |
|---|---|---|
| `package_id` | TEXT | primary key |
| `language_id` | TEXT | immutable identity |
| `dialect_id` | TEXT | immutable identity |
| `package_version` | TEXT | SemVer |
| `schema_version` | INTEGER | supported schema |
| `source` | TEXT | bundled/download/file |
| `install_state` | TEXT | staging/active/failed/recoverable |
| `archive_checksum` | TEXT | unique when present |
| `content_path` | TEXT | private app storage path |
| `installed_at` | TEXT | UTC ISO-8601 |
| `updated_at` | TEXT | UTC ISO-8601 |

Constraints:

- Primary key `package_id`.
- Unique `(package_id, package_version)`.
- Active state index.
- Only one active version per package ID.
- Bundled Jawa-Mataraman cannot be removed.

Karena package update membutuhkan staging sementara versi lama tetap aktif, tambahkan `package_installations`:

| Column | Rule |
|---|---|
| `installation_id` | primary key |
| `package_id` | package scope |
| `target_version` | SemVer |
| `staging_path` | private temporary path |
| `archive_checksum` | candidate checksum |
| `state` | staging/validated/committing/failed |
| `commit_marker` | unique recovery token |
| `created_at` | UTC ISO-8601 |

`installed_packages` tetap hanya memiliki satu active row per `package_id`. `package_installations` menyimpan candidate state sampai commit selesai. Old active metadata/archive tetap ada sampai activation transaction berhasil.

### 6.3 `package_archives`

| Column | Type | Rule |
|---|---|---|
| `package_id` | TEXT | foreign key |
| `package_version` | TEXT | part of primary key |
| `archive_checksum` | TEXT | unique |
| `archive_size_bytes` | INTEGER | positive |
| `archive_path` | TEXT | private storage |
| `signature_key_id` | TEXT | key registry reference |
| `original_filename` | TEXT | metadata only |
| `created_at` | TEXT | UTC ISO-8601 |

Archive metadata is retained for P1 export. Plan 3 must not make the archive a cache-only file.

Primary key is `(package_id, package_version)`, with a unique checksum. `installed_packages.archive_checksum` points to the active archive version. Old archive metadata may be retained for rollback/export policy, while active content remains one version per package.

Add immutable `dialogue_graph_snapshots` keyed by `(package_id, package_version, dialogue_id, graph_fingerprint)`. It stores the validated canonical graph JSON and is never overwritten. Replay resolves `graphFingerprint` from this table, so historical dialogue events remain valid after active content replacement.

### 6.4 Content tables

Tables:

- `units`.
- `words`.
- `sentences`.
- `dialogues`.
- `challenges`.

Every content table uses `(package_id, item_id)` as primary key. Content fields are immutable and stored as typed columns where queried frequently, with validated JSON for nested structures.

Staging content is separate and uses `(installation_id, item_id)`:

- `staged_units`;
- `staged_words`;
- `staged_sentences`;
- `staged_dialogues`;
- `staged_challenges`.

`staged_dialogue_graph_snapshots` uses `(installation_id, package_version, dialogue_id, graph_fingerprint)` as its key and is copied into `dialogue_graph_snapshots` only during activation.

These tables are created in `0001_initial` and are never queried by feature repositories. Activation copies validated staging rows into active content tables in one database transaction, then deletes staging rows. This permits a higher package version with the same `package_id` to coexist with the current active version during validation.

Minimum indexes:

- `(package_id, unit_id, item_order)`.
- `(package_id, register)`.
- `(package_id, status)`.
- `(package_id, item_id)`.

### 6.5 `learning_events`

| Column | Rule |
|---|---|
| `event_id` | globally unique device-generated ULID; primary key |
| `local_sequence` | monotonically increasing SQLite commit sequence; unique |
| `device_id` | device identity |
| `package_id` | required package scope |
| `item_id` | nullable for session/day events |
| `event_type` | known enum; unknown rejected |
| `source` | vocabulary/practice/dialogue/system |
| `result` | normalized result value |
| `weight` | 1.0 for curated content, 0.5 for AI/P1 |
| `session_id` | nullable session grouping |
| `device_time` | UTC ISO-8601 |
| `received_time` | local receipt UTC |
| `local_date` | device-local `YYYY-MM-DD` |
| `formula_version` | replay formula version |
| `payload_json` | event-specific validated payload |
| `sync_status` | `local_only`/`pending`/`synced`/`error`; transport projection |

`app_event_sequence(singleton_id, next_sequence)` stores the next unused value. Allocation returns the current value, then increments the counter. Duplicate `event_id` returns the existing row and does not consume a sequence. Reset captures `boundary_local_sequence = next_sequence - 1` under the same write lock; replay ignores `local_sequence <= boundary_local_sequence`.

Common validation: `event_type`, `source`, and `sync_status` are closed enums; `source` is `vocabulary | practice | dialogue | system`; `result` is nullable for view/session/package events and otherwise a finite number in `[0,1]`; `weight` is `1.0` for curated content and `0.5` only for P1 AI events; `session_id` is nullable except for session-scoped events; all IDs are non-empty text; timestamps must parse as UTC ISO-8601; `local_date` must match the device timezone date at event creation.

Canonical P0 event names are the event types listed below; `source` values are `vocabulary`, `practice`, `dialogue`, and `system`. The P1 API mapping is: `word_viewed`→`viewed`, `sentence_viewed`→`viewed`, `practice_answered`→`answer_gtw`/`answer_fill_gap`, `dialogue_started`/`dialogue_choice`/`dialogue_completed`→`curated`, `session_started`/`session_completed`→`session`, `package_updated`→`package`, and `reset_commands`→`reset`. The API may use `source = curated` as a transport value only; local storage always uses `dialogue`. Required equality rules: `learning_events.item_id = payload.targetItemId` for practice answers, `session_id = payload.sessionId` for session/dialogue events, and package/item IDs must reference active or historically snapshotted content.

Indexes:

- Primary key `event_id`.
- `(package_id, item_id, event_type)`.
- `(device_time, event_id)`.
- `(local_date)`.
- `(sync_status)`.

### 6.6 Settings and challenge state

`settings`:

- `key`.
- `value_json`.
- `updated_at`.
- `local_only`.

`challenge_checks`:

- `(package_id, challenge_id)` primary key.
- `checked_at`.
- `variant` solo/social.

Challenge checks MUST NOT create learning events.

### 6.7 Derived tables

- `item_strength_cache`.
- `dialogue_scores`.
- `active_days`.
- `highest_levels`.
- `statistics_cache`.
- `rebuild_markers`.

`dialogue_scores` minimum:

- `(package_id, dialogue_id)` primary key;
- `best_score`;
- `completed_endings_json`;
- `last_completed_at`;
- `formula_version`;
- `recalculated_at`.

`statistics_cache` minimum:

- `(scope_type, scope_id, metric_key, metric_date)` primary key; `scope_id` is `global` or a package ID;
- `metric_value`;
- `scope` (`package` atau `global`);
- `formula_version`;
- `recalculated_at`.

Metrics P0: `sessions_started`, `sessions_completed`, `guess_accuracy`, `fill_gap_accuracy`, `dialogues_completed`, `active_days`, dan `new_items_since_update`. Session metrics require `exercise_type` and `completed` in session event payloads. Accuracy is `correct_answers / answered_questions` over the metric date window; seven-day accuracy uses the inclusive seven local dates ending at the requested date. `new_items_since_update` counts only item IDs introduced by the current package update, using a persisted `package_item_introductions(package_id, package_version, item_id, introduced_at)` table; it does not count older unreviewed items. AI-dialogue quota is explicitly deferred to the P1 AI dialogue plan because no AI dialogue source exists in P0; FR-61 traceability must mark this submetric as deferred rather than claim full P0 coverage.

`package_item_introductions` columns are `(package_id TEXT, package_version TEXT, item_id TEXT, item_type TEXT, meaning_fingerprint TEXT, introduced_at TEXT NOT NULL)` with primary key `(package_id, package_version, item_id, item_type)`. Fingerprints are SHA-256 of canonical meaning/translation fields. First install records every active item; later versions record new IDs and changed fingerprints exactly once.

### 6.8 P1-compatible sync tables

`sync_outbox`:

- `outbox_id` primary key;
- `kind` (`learning_event` or `reset_command`);
- nullable `event_id`;
- nullable `command_id`;
- `idempotency_key` TEXT NOT NULL UNIQUE; `event:{event_id}` for learning events and `reset:{command_id}` for reset commands;
- `account_id` nullable;
- unique idempotency key;
- `status` pending/uploading/succeeded/permanent_error;
- `attempt_count`;
- `next_retry_at`;
- `last_error_code`.

Constraint: exactly one of `event_id` and `command_id` is non-null, and the non-null value references the matching source table. P0 reset rows use `account_id = NULL`; account-bound learning rows are created only during P1 account binding.

SQLite constraints are mandatory: `CHECK ((kind = 'learning_event' AND event_id IS NOT NULL AND command_id IS NULL) OR (kind = 'reset_command' AND event_id IS NULL AND command_id IS NOT NULL))`, `CHECK (attempt_count >= 0)`, `CHECK (status IN ('pending','uploading','succeeded','permanent_error'))`, and `UNIQUE (idempotency_key)`. `event_id` and `command_id` use foreign keys with `ON DELETE RESTRICT`; outbox rows are never cascaded away with source events or reset commands.

`sync_state`:

- `(account_id, device_id)` unique;
- `pull_cursor` opaque nullable;
- `last_sync_at`;
- `state`.

`reset_commands`:

- `command_id` primary key;
- `package_id`;
- `issued_at`;
- `local_applied_at`;
- `server_ack_at` nullable;
- `tombstone_version`;
- `boundary_device_time`;
- `boundary_event_id`;
- `status` local_pending/server_acknowledged.

Add `package_reset_boundaries` with `package_id` primary key, `reset_command_id`, `boundary_local_sequence`, `boundary_device_time`, `boundary_event_id`, and `updated_at`. The authoritative reset boundary is `boundary_local_sequence`, captured from the SQLite commit sequence in the same write transaction. Replay ignores events with `local_sequence <= boundary_local_sequence`; device time remains metadata only. A repeated reset is idempotent by `command_id` and never moves the boundary backward. This makes a late/clock-skewed event committed after reset part of the new progress state.

Every reset command creates one local-only `sync_outbox` row with `kind = reset_command`, its `command_id`, `account_id = NULL`, and a stable idempotency key. On future login, the account context binds eligible local rows only after an explicit account merge decision. P0 learning events use `sync_status = local_only`, a transport-global local state. When P1 binds an account, it creates account-scoped outbox rows in a transaction and changes the projection to `pending`; P1 adds a per-account delivery table if multiple accounts require independent acknowledgments. P0 never sends these rows to a network.

Derived `active_days` uses `(local_date, scope)` and a companion `active_day_package_words(local_date, package_id, item_id)` table. The global streak is calculated from the union of package-scoped qualifying words; package reset removes that package's active-day contribution through the reset boundary without changing other packages.

P0 uses these tables only for local reset and future sync compatibility. No network request is made.

Derived rows always include `calculated_at` and `formula_version`. They may be truncated and rebuilt from source.

## 7. Migration strategy

### Migration runner

1. Open database.
2. Enable foreign keys.
3. Read current schema version from `app_metadata`.
4. Run each missing migration in ascending order.
5. Wrap each migration in a transaction.
6. Write schema version only after migration succeeds.
7. On failure, rollback and return `MIGRATION_FAILED`.
8. Do not silently discard learning events.

### `0001_initial`

Creates:

- metadata;
- installed packages;
- package archives;
- all immutable content tables;
- all staged content tables;
- `app_event_sequence` and `dialogue_graph_snapshots`;
- `staged_dialogue_graph_snapshots`;
- `package_item_introductions`;
- learning events;
- settings;
- challenge checks;
- sync outbox/state and reset commands;
- derived tables;
- recovery markers.

### `0002_progress_indexes`

Creates replay, package/item, event date, and derived-cache indexes without changing source data.

`package_item_introductions` has primary key `(package_id, package_version, item_id, item_type)` and records only IDs absent from, or meaning-fingerprint changes relative to, the immediately preceding active package version. It is populated during package activation and is the source for `new_items_since_update`.

Supporting table contract:

- `app_event_sequence(singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1), next_sequence INTEGER NOT NULL CHECK (next_sequence >= 1))`.
- `package_reset_boundaries(package_id TEXT PRIMARY KEY, reset_command_id TEXT NOT NULL, boundary_local_sequence INTEGER NOT NULL, boundary_device_time TEXT NOT NULL, boundary_event_id TEXT NOT NULL, updated_at TEXT NOT NULL)`; FK to `reset_commands`, indexed by boundary sequence.
- `active_day_package_words(local_date TEXT, package_id TEXT, item_id TEXT, PRIMARY KEY (local_date, package_id, item_id))`; FKs to package/content, retained as rebuildable cache.
- `rebuild_markers(scope_type TEXT, scope_id TEXT, reason TEXT NOT NULL, requested_at TEXT NOT NULL, formula_version INTEGER NOT NULL, PRIMARY KEY (scope_type, scope_id))`; invalidated rows are rebuilt and then removed atomically.
- `package_installations` additionally requires `state CHECK (state IN ('staging','validated','committing','failed'))`, nonnegative archive size, and unique `commit_marker`.

### Migration safety

- Migration is forward-only.
- Risky migration creates a local snapshot/backup before mutation.
- Failed migration leaves the previous schema usable.
- Migration tests start from every supported schema version.
- Process kill tests run before commit and after commit.

## 8. Event contract

### Event types P0

- `word_viewed`.
- `sentence_viewed`.
- `practice_answered`.
- `dialogue_choice`.
- `dialogue_started`.
- `dialogue_completed`.
- `session_started`.
- `session_completed`.
- `package_updated`.

Challenge completion is intentionally absent from learning events.

`package_updated` payload:

```ts
{ packageId: string; fromVersion?: string; toVersion: string; archiveChecksum: string }
```

This event is written by the package activation transaction and is not accepted from UI callers.

### Event source and visibility rules

`word_viewed.viewedFrom` hanya menerima `vocabulary_feed` atau `curated_dialogue_target`. Hanya `vocabulary_feed` yang dapat menghasilkan active-day/streak. Dictionary/search preview tidak boleh membuat event.

Vocabulary view wajib memiliki `duration_ms >= 1000` dan `foreground: true`. First qualifying word view menginisialisasi strength `0.1`; first sentence display in Fill the Gap juga menginisialisasi sentence strength `0.1`. Repeated views tidak memberi initial credit kedua.

Session rules:

- `session_started` bukan completed session.
- Answer event ditulis segera dan tetap ada setelah process kill.
- Interrupted practice tidak menghasilkan `session_completed`.
- Interrupted dialogue tidak menghasilkan `dialogue_completed` atau dialogue score.
- Valid word-strength changes yang sudah tercatat tetap dipertahankan setelah interruption.

### Payload validation

Each event type has a schema. Examples:

`word_viewed`:

```ts
{ itemId: string; viewedFrom: 'vocabulary_feed' | 'curated_dialogue_target'; durationMs: number; foreground: true }
```

`sentence_viewed`:

```ts
{ itemId: string; viewedFrom: 'fill_the_gap'; firstDisplay: boolean; foreground: true }
```

`practice_answered`:

```ts
{ exerciseType: 'guess_the_word' | 'fill_the_gap'; correct: boolean; answerId: string; targetItemId: string }
```

`session_started`:

```ts
{ sessionId: string; exerciseType: 'vocabulary' | 'guess_the_word' | 'fill_the_gap' | 'dialogue'; completed: false; startedAt: string }
```

`session_completed`:

```ts
{ sessionId: string; exerciseType: 'vocabulary' | 'guess_the_word' | 'fill_the_gap' | 'dialogue'; completed: true; completedAt: string }
```

The session payloads require `session_id` to equal `payload.sessionId`; a completion without a matching prior start is rejected. Interrupted sessions remain started but incomplete.

`dialogue_choice`:

```ts
{ sessionId: string; runId: string; sequence: number; packageVersion: string; graphFingerprint: string; dialogueId: string; nodeId: string; choiceId: string; choiceType: 'register' | 'comprehension'; quality: 'pas' | 'cukup' | 'kurang-pas' | 'tidak-nyambung' }
```

`dialogue_started`:

```ts
{ sessionId: string; runId: string; sequence: 0; packageVersion: string; graphFingerprint: string; dialogueId: string; startedAt: string }
```

`dialogue_completed`:

```ts
{ sessionId: string; runId: string; sequence: number; packageVersion: string; graphFingerprint: string; dialogueId: string; endingId: string; endingQuality: 'pas' | 'cukup' | 'kurang-pas'; completedAt: string }
```

`score` is never accepted from the client as a source value. Replay derives it from the ordered `dialogue_choice` events. For each choice point, the denominator is one choice point; repeated disconnected attempts do not add denominator entries. A comprehension point scores `1` if connected on attempt one and `0.5` if connected after one or more repair repetitions.

Dialogue replay validates each event against the installed dialogue graph: a `dialogue_started` event must use `sequence = 0`, a new `runId`, the package version and graph fingerprint active at start. `runId` binds exactly one package/dialogue/session. Subsequent sequence values must increase exactly by one, `nodeId` must equal the replay cursor, `choiceType` must equal the node definition, and `choiceId` must belong to that node. A disconnected comprehension choice emits a repair/repeat state and leaves the cursor unchanged. A connected choice advances to its declared target. Register nodes reject `tidak-nyambung`; comprehension nodes require the graph-defined connected/disconnected quality. `dialogue_completed` is accepted only when the replay cursor reaches the declared reachable ending. Attempt count is derived from prior disconnected choices in the same run; client-provided attempt numbers are not trusted.

If a package update changes a dialogue graph, it must use a new dialogue ID or preserve the exact graph fingerprint. Historical events are replayed against the fingerprinted graph version and are never validated against an incompatible current graph.

Dialogue scoring replay:

- Register: pas `1`, cukup `0.5`, kurang pas `0`.
- Comprehension: connected on first attempt `1`; connected after repeat `0.5`.
- Disconnected choice records repair/repeat but cannot advance to ending.
- Score is the average of choice-point scores only after an ending is reached.
- `dialogue_scores.best_score` is the maximum completed score.
- `completed_endings_json` is the set of reached ending IDs.
- No ending means no score.

Unknown event types, invalid package/item keys, invalid result ranges, and malformed payload JSON are rejected before insert.

## 9. Transaction boundaries

### Learning event write

One SQLite transaction must:

1. Validate event.
2. If the event ID is new, allocate `local_sequence` from `app_event_sequence` under the same write lock.
3. Insert event with `INSERT OR IGNORE` by `event_id`.
4. Invalidate affected derived cache rows.
5. Update rebuild marker.
6. Commit.

When an account context is active, the same transaction also inserts the corresponding `sync_outbox` row. In P0 learning events have no account and do not create upload rows; reset commands still create local-only rows so the future tombstone contract is durable.

If any step fails, no event or partial cache invalidation remains.

### Package activation

1. Write package/content to staging records.
2. Validate foreign references.
3. Persist archive metadata.
4. Delete/replace active content rows for the package from the staged candidate; obsolete item IDs disappear from active content but their learning events remain.
5. Activate package metadata and point it to the new archive version.
6. Mark old version inactive only after new version is valid.
7. Add package update event.
8. Mark rebuild required.
9. Commit.

Package content must never be visible between steps 1–7.

## 10. Reset semantics FR-55/P1 compatibility

P0 reset is user-visible destructive behavior: after confirmation, the selected package has no active learning progress, strength, score, active-day contribution, or statistics. To remain compatible with future sync, source events are not physically deleted by the normal reset transaction.

Reset transaction:

1. Insert a `reset_commands` row with a new command ID and package tombstone version.
2. In the same transaction, capture the current event frontier as `boundary_local_sequence` and upsert `package_reset_boundaries`.
3. Mark all package-local derived rows and global `active_days`/`statistics_cache` projections invalid.
4. Rebuild the package snapshot while ignoring events at or before the reset boundary.
5. Keep old events hidden from active replay when their `local_sequence` is less than or equal to the active boundary; they cannot resurrect progress locally.
6. Keep the command available for future P1 upload.

The event frontier and boundary are captured under the same SQLite write transaction as the reset command. A concurrent event either commits before the boundary and is excluded, or commits after the boundary and remains part of the new empty progress state. Replaying the same command does not move the boundary.

After commit, rebuild the affected package plus global active-day/streak/statistics projections in the same recovery queue. The UI cannot report the old global streak as final while the rebuild marker is pending.

If the product later requires physical deletion, it is a separate destructive maintenance operation and must not be used as the source of truth for sync. This satisfies FR-55 visible behavior while preserving the event audit needed for multi-device reconciliation.

## 11. Replay engine

### Ordering

General events are ordered by:

1. trusted normalized `device_time`;
2. `event_id` as deterministic tie-breaker.

Dialogue events are validated per run by `(run_id, sequence)`. A valid run is converted into one ordered effect group: the group anchor is the global ordering tuple of `dialogue_started`, and choices are applied inside the group by sequence. The group is then merged with non-dialogue events by `(anchor_device_time, anchor_event_id, run_id)`. This prevents a late/clock-skewed choice from applying before an earlier choice while retaining deterministic interleaving with practice/view events. Events from an incomplete or invalid run do not produce a dialogue score.

Device clock skew is not corrected in P0; events remain deterministic and `local_date` is preserved from creation time.

### Strength formula

For words and sentences:

```text
initial viewed strength = 0.1
new_strength = old_strength + 0.3 × weight × (result − old_strength)
```

Rules:

- Curated content weight = `1.0`.
- AI weight = `0.5` for P1 compatibility.
- Guess the Word updates word strength.
- Fill the Gap updates sentence strength only.
- Curated dialogue updates target word strength only on a pas choice.
- Dialog choice quality alone does not update word strength unless explicitly pas.
- Replaying the same event twice has no additional effect.

### Derived mastery

```text
Kosakata = average word strength
Kalimat  = average sentence strength
Dialog   = average best curated dialogue score
Mastery  = 100 × (0.5 × Kosakata + 0.25 × Kalimat + 0.25 × Dialog)
```

Levels:

- L1: 0–19.
- L2: 20–39.
- L3: 40–59.
- L4: 60–79.
- L5: 80–100.

Mastery is calculated per `(package_id)`/language-dialect combination and never stored as the source of truth.

### Package update replay

- New item IDs enter with zero strength and zero score.
- Removed items remain in `learning_events` but are excluded from the active package divisor.
- Changed-meaning IDs are new items. Each content row carries a canonical `meaning_fingerprint`; an existing item ID is treated as changed when the fingerprint differs from the immediately preceding package version, and an introduction row is written for that version.
- On first installation, every active content item is recorded in `package_item_introductions`; subsequent versions record only new IDs and IDs whose canonical meaning fingerprint changed.
- Stable IDs preserve historical events through package version update.
- Highest level ever reached is retained separately.
- `package_updated` invalidates all package derived caches.

### Replay formula registry and picker inputs

Supported `formula_version` starts at `1`. The replay engine dispatches every answer event through a versioned formula registry. Unknown formula versions are not silently interpreted: rebuild enters a recoverable error and preserves the last valid derived snapshot until a migration is available.

The event writer in the application layer assigns the current immutable `formula_version = 1` to every answer event. The registry is append-only: changing a formula creates version `2` and a migration/replay adapter; it never changes the meaning of version `1` events. Existing events are not rewritten during normal replay.

The derived progress query also exposes:

- effective strength `strength × 0.97^(days_since_last_review)` for prioritization only;
- last answer result;
- last review date;
- viewed-but-never-answered state;
- current unit berjalan: first ordered unit below 80% viewed, or explicitly selected unit for the current session;
- whether at least six eligible viewed words exist for distractor generation.

These values are inputs for Plan 6 content picker and must not change displayed mastery through decay.

## 12. Streak engine

Active day is created when the user views ten unique words in the vocabulary screen, each visible for at least one second while foregrounded.

Rules:

- Word viewed in curated dialogue does not count toward streak.
- Active days are global across package/dialect.
- `local_date` comes from the device timezone at event creation.
- Same date is idempotent.
- Streak counts consecutive active dates through today or yesterday.
- No streak freeze in P0.
- Background/screen-off time does not count toward visibility duration.

## 13. Statistics engine

Per package/dialect calculate:

- sessions by exercise type;
- accuracy for the last seven days;
- dialogues completed by ending;
- current mastery and level;
- highest level;
- new items since package update.

Challenge checks and challenge completion never appear in statistics.

### Performance acceptance

On a supported 3 GB Android device, replaying 50,000 learning events must complete in under two seconds after the database query result is available. The benchmark is recorded at `artifacts/performance/progress-replay-50k.json`; index/query timing and rebuild timing are reported separately.

The fixture generator uses a fixed seed, the same package ID, 50,000 deterministic ULIDs, and formula version 1. Run five warm repetitions after one cold run; report median and p95 for query and replay. The gate passes only when p95 replay is below two seconds on the baseline device/OS listed in the release matrix. Command: `npm run benchmark:progress`.

## 14. Progress repository API

```ts
export interface ProgressRepository {
  appendEvent(event: LearningEvent): Promise<RepositoryResult<void>>;
  getEvents(scope?: ProgressScope): Promise<RepositoryResult<LearningEvent[]>>;
  rebuild(scope?: ProgressScope): Promise<RepositoryResult<ProgressSnapshot>>;
  getSnapshot(packageId: string): Promise<RepositoryResult<ProgressSnapshot>>;
  resetPackage(packageId: string): Promise<RepositoryResult<void>>;
}
```

Repository invariants:

- No UI access to SQLite.
- All package/item keys are explicit.
- `appendEvent` is idempotent by `event_id`.
- `rebuild` can safely run repeatedly.
- `resetPackage` records a command/tombstone and invalidates derived data.

## 15. Package persistence integration

Replace Plan 2 `InMemoryPackageStorage` with a SQLite/filesystem adapter:

- `installed_packages` stores active metadata.
- `package_archives` stores original archive path/checksum.
- Content tables store immutable parsed content.
- Staging markers survive process kill.
- Active version remains queryable until atomic activation succeeds.
- `recoverPackageInstall` reads markers and resolves staging after restart.
- Package removal in future P1 deletes content/archive but not learning events.

Package update must call `rebuildProgress(packageId)` after commit, not before.

Before staging activation, compare `(package_id, package_version, archive_checksum)`:

- same version and same checksum: return idempotent success without rewriting active content;
- same version and different checksum: return `DUPLICATE_PACKAGE_VERSION` and preserve the active package;
- lower version: return `LOWER_PACKAGE_VERSION`;
- higher version: continue staged replacement.

### Package persistence port

```ts
export interface PackagePersistence {
  stageValidatedPackage(input: {
    installationId: string;
    identity: PackageIdentity;
    archive: { path: string; checksum: string; sizeBytes: number; keyId: string };
    content: ParsedPackageContent;
  }): Promise<RepositoryResult<{ installationId: string }>>;
  activateStagedPackage(installationId: string): Promise<RepositoryResult<void>>;
  rollbackStagedPackage(installationId: string): Promise<RepositoryResult<void>>;
  recoverInstallMarkers(): Promise<RepositoryResult<void>>;
  getActivePackage(packageId: string): Promise<RepositoryResult<PackageIdentity | null>>;
}
```

`stageValidatedPackage` writes `package_installations`, staged typed content rows, archive metadata, and a commit marker in one transaction. Filesystem moves occur before the activation transaction; a marker records whether the move and database commit completed. `activateStagedPackage` owns one SQLite transaction that replaces active rows, updates `installed_packages`, appends `package_updated`, allocates its `local_sequence`, and marks derived rebuild required. The package repository receives the same transaction-scoped database handle used by the event repository; it must not open a second connection or commit package rows separately. Recovery either completes a fully staged candidate or removes only candidate files/rows. It never removes the previous active package. `rollbackStagedPackage` is idempotent and cannot target an active installation.

Recovery truth table:

| Marker state | DB state | Recovery action |
|---|---|---|
| `staged` | candidate rows only | remove candidate rows/files; keep old active |
| `files-ready` | candidate rows + archive path | verify archive checksum, then continue activation or rollback candidate |
| `db-committing` | process may have died during transaction | reopen SQLite, inspect committed state; retry activation if candidate rows/archive validate, otherwise delete only candidate state |
| `db-committed` | new active row committed | verify archive exists/checksum; finish cleanup of old candidate |
| `cleanup-pending` | new active valid | remove only old archive after new archive is verified |

The active row is never committed with a missing or mismatched archive. Final archive rename uses a temporary path and an atomic filesystem rename before the `files-ready` marker. Recovery is deterministic: valid candidate plus no active replacement completes activation; invalid/incomplete candidate is deleted; a valid committed active row is retained. There is no attempt to roll back a transaction after process death because SQLite has already resolved its transaction on reopen.

`ParsedPackageContent` is produced by the Plan 2 parser and contains units, words, sentences, dialogues, challenges, and canonical `dialogue_graph_snapshots` with stable IDs/fingerprints. `stageValidatedPackage` inserts snapshots into staging; activation moves them into the immutable snapshot table before active dialogue rows are replaced. No raw unvalidated JSON is inserted into SQLite. Activation fails if any historical snapshot is missing or its fingerprint does not match the package manifest.

## 16. Startup integration

Update Plan 1 composition root:

1. Register SQLite adapter.
2. Run `openDatabase`.
3. Run migrations.
4. Recover package staging markers.
5. Rebuild invalid derived caches.
6. Verify/install bundled package using Plan 2.
7. Persist package/content inside SQLite transaction.
8. Set production configuration ready only after all required adapters exist.

Startup failure must show recovery and preserve the previous active package/database.

## 17. Files to create/modify

### Create

| File | Purpose |
|---|---|
| `src/infrastructure/database/SQLiteDatabase.ts` | Expo SQLite adapter |
| `src/infrastructure/database/sqliteConfig.ts` | Database config and PRAGMAs |
| `src/infrastructure/database/migrations/Migration.ts` | Migration contract |
| `src/infrastructure/database/migrations/0001_initial.ts` | Initial schema |
| `src/infrastructure/database/migrations/0002_progress_indexes.ts` | Index migration |
| `src/infrastructure/database/migrations/migrationRunner.ts` | Transactional runner |
| `src/infrastructure/database/transaction.ts` | Transaction helper |
| `src/infrastructure/database/recoveryMarkers.ts` | Persistent recovery markers |
| `src/infrastructure/database/repositories/*` | SQLite repositories |
| `src/domain/progress/*.ts` | Replay, strength, mastery, streak, statistics rules |
| `src/features/progress/application/*.ts` | Progress use cases |
| `src/features/packages/application/persistInstalledPackage.ts` | Persist validated content |
| `src/features/packages/application/updateInstalledPackage.ts` | Atomic package update |
| `tests/unit/progress/*.test.ts` | Domain rule tests |
| `tests/integration/database/*.test.ts` | SQLite/migration/repository tests |
| `tests/property/progress/*.test.ts` | Replay/idempotency/update properties |

### Modify

| File | Change |
|---|---|
| `src/bootstrap/DependencyContainer.ts` | Register database, migrations, repositories, progress engine |
| `src/bootstrap/AppBootstrap.tsx` | Wire real startup steps and production readiness |
| `src/bootstrap/startupRecovery.ts` | Use persistent package/database recovery |
| `src/features/packages/infrastructure/inMemoryPackageStorage.ts` | Replace for production with SQLite/filesystem adapter |
| `src/features/packages/application/installPackage.ts` | Commit package/content transaction |
| `docs/sqlite-schema.md` | Record exact SQL and migration versions |
| `docs/data-model.md` | Record implemented repository/derived-cache mapping |
| `docs/requirements-traceability.md` | Add FR-12, FR-60..62, FR-80..82 evidence |
| `docs/architecture.md` | Mark SQLite source of truth implemented |
| `package.json` | Add Expo SQLite dependency and migration/test scripts |

## 18. Test matrix

### Migration

- Fresh database creates all required tables/indexes.
- Every supported schema version migrates forward.
- Foreign keys are enabled.
- Failed migration rolls back.
- Process kill before commit preserves previous schema.
- Process kill after commit does not repeat migration.
- Unknown schema version enters recovery state.

### Repository and transaction

- Event insert and cache invalidation commit together.
- Event insert rollback leaves no event.
- Duplicate `event_id` is idempotent.
- Unknown event type is rejected.
- Invalid payload is rejected.
- Package content cannot be partially visible.
- Archive metadata remains linked to active package.

### Replay/property

- Replay twice yields identical snapshot.
- Different event insertion order yields identical result after ordering.
- Duplicate events do not change result.
- Package update preserves stable-ID progress.
- Package update replaces obsolete active content without deleting source events.
- Removed items are excluded from divisor but events remain.
- Changed IDs start at zero.
- Reset prevents old local events from rebuilding active progress.
- Reset boundary capture is atomic under concurrent event writes.
- Reset command creates an idempotent sync outbox command row.
- Event sequence allocation is transactional and duplicate events consume no sequence.
- Dialogue replay rejects invalid run sequence, node, choice, and unreachable ending.
- Dialogue history remains replayable after a package update through package version and graph fingerprint.
- Strength remains within 0–1.
- Mastery remains within 0–100.
- Streak is idempotent per local date.

### Failure/recovery

- Disk full during migration.
- Disk full during package activation.
- Database open failure.
- Corrupt database.
- Process kill during package/content transaction.
- Interrupted staging recovery.
- Invalid derived cache rebuild.
- App restart after every recovery state.

## 19. Acceptance criteria

Plan 3 selesai bila:

1. SQLite menjadi source of truth lokal dan bukan cache.
2. Semua required tables, keys, indexes, foreign keys, dan migrations tersedia.
3. Startup membuka database dan menjalankan migration transactional.
4. Package content dan archive metadata tersimpan durable.
5. Learning events append-only dan idempotent.
6. Event payload tervalidasi sebelum insert.
7. Event insert, cache invalidation, dan rebuild marker atomic.
8. Replay deterministik dan dapat membangun ulang semua derived progress.
9. Strength, mastery, level, streak, dan statistik mengikuti PRD.
10. Package update mempertahankan stable-ID progress dan menangani item baru/hilang/berubah.
11. Reset package menghapus/rebuild derived progress tanpa menghapus source event secara tidak aman.
12. Interrupted database/package work dapat dipulihkan tanpa menghapus active data.
13. Plan 2 in-memory storage tidak dipakai untuk production.
14. Unit, integration, property, migration, dan failure tests lulus.
15. `npm test`, `npm run typecheck`, `npm run lint`, dan `npm run doctor` lulus.
16. FR-12, FR-60, FR-61, FR-62, FR-80, FR-81, dan FR-82 memiliki evidence exact.

## 20. Risiko dan mitigasi

| Risiko | Level | Mitigasi |
|---|---|---|
| Migration merusak atau menghilangkan event | Critical | Transaction, snapshot, forward-only migration, kill tests |
| Derived cache menjadi source of truth | High | Replay test dan cache rebuild command |
| Duplicate event menggandakan progres | High | Unique event ID dan idempotent insert |
| Device clock menghasilkan urutan berbeda | High | UTC normalized time plus event ID tie-breaker |
| Package update menghilangkan progres | High | Stable-ID update tests dan event preservation |
| SQLite transaction tidak atomic dengan package storage | High | Shared install marker dan commit protocol |
| Disk penuh saat commit | High | Preflight capacity, rollback, recovery marker |
| Replay performa buruk | Medium | Indexed event queries, derived cache, rebuild marker |
| Reset dihidupkan lagi oleh event lama | High | Reset command/tombstone sejak P0, P1-compatible schema |
| Expo SQLite API tidak sesuai SDK | High | Verifikasi docs SDK 58, adapter contract, development build |

## 21. Definition of Done

- SQLite adapter nyata terdaftar di composition root.
- Migrations transactional dan diuji dari setiap supported version.
- Package/content/archive persistence durable.
- Startup recovery membaca persistent markers.
- Learning event contract dan repository tersedia.
- Replay engine deterministik.
- Derived caches dapat dibuang dan dibangun ulang.
- Strength, mastery, streak, statistik, reset, dan package update diuji.
- Production tidak lagi memakai in-memory package storage.
- Typecheck, lint, doctor, unit, integration, property, migration, dan failure tests lulus.
- Dokumentasi schema, data model, architecture, dan traceability diperbarui.

## 22. Handoff ke Plan 4 — Onboarding & Local Profile

Plan 4 dapat memakai:

- `app_metadata` untuk onboarding state dan age gate local data.
- `settings` repository.
- `installed_packages` untuk status package bundel.
- `getVocabularyPage`/content repository dari package scope.
- Warning local data berdasarkan adanya local progress.
- `completeOnboarding` yang durable setelah package installation sukses.
- Progress snapshot untuk entry ke Kosakata unit 1.
