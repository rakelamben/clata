# P0 Implementation Plan 6 — Practice Sessions Offline

## 1. Tujuan

Plan 6 membangun vertical slice latihan offline setelah Plan 4 (onboarding/local profile) dan Plan 5 (vocabulary, search, viewed tracking, audio port):

- session setup pada tab **Latihan**;
- **Guess the Word** dengan empat pilihan;
- **Fill the Gap** dengan satu rumpang dan 3–4 pilihan;
- content picker yang deterministik dan package-scoped;
- feedback segera, contoh kalimat, dan audio opsional;
- `practice_answered`, `session_started`, dan `session_completed` melalui progress engine;
- session yang aman terhadap restart/process interruption;
- resume, mulai baru, exit confirmation, summary, retry/save-failure;
- seluruh alur berjalan offline dan tetap dapat digunakan minor.

Plan ini tidak mengimplementasikan curated dialogue atau challenge. Dialog menjadi Plan 7 dan menggunakan session shell serta pola persistence dari Plan 6.

## 2. Sumber keputusan dan aturan yang wajib dipatuhi

Dokumen ini mengikuti keputusan yang sudah diterima di repository:

- `docs/adr/0012-practice-session-availability.md`;
- `docs/design/flows/practice.md`;
- `docs/design/screen/practice.md`;
- `docs/design/screen/guess-the-word.md`;
- `docs/design/screen/fill-the-gap.md`;
- `docs/implementation_plan/imp_3.md`;
- `docs/implementation_plan/imp_5.md`.

### Availability rule

`kata_dilihat` **bukan gate** dan **tidak digunakan untuk mengisi bank sesi**. Pengguna baru boleh langsung membuka Guess the Word atau Fill the Gap selama package dan bank konten valid tersedia.

Progress yang sudah ada boleh digunakan untuk **prioritas** item, tetapi tidak boleh membuat sesi terkunci. Jika bank content kosong atau tidak cukup untuk membentuk soal valid, tampilkan empty/recovery state yang jujur.

### Pedagogical rule

- Guess the Word dapat memakai item package valid tanpa `word_viewed` sebelumnya.
- Fill the Gap dapat dimulai tanpa `word_viewed`; pemilihan kalimat ditentukan oleh validitas konten package, bukan exposure history.
- Distraktor selalu berasal dari bank content tervalidasi dan harus mempunyai tepat satu jawaban benar.
- `word_viewed` tetap hanya berasal dari vocabulary feed sesuai aturan Plan 5.
- Jawaban latihan menghasilkan event `practice_answered`; jangan membuat `word_viewed` secara implisit.

## 3. Requirements mapping

| Requirement | Implementasi Plan 6 | Evidence wajib |
|---|---|---|
| FR-20 | Guess the Word: kata→arti, arti→kata, audio→arti; empat opsi | domain, picker, component, offline E2E |
| FR-21 | Fill the Gap: satu rumpang, terjemahan, 3–4 opsi | content/question tests, component, E2E |
| FR-22 | Prioritas item berdasarkan hasil latihan dan progress snapshot | picker unit/property tests |
| FR-23 | Fallback ke item valid/lebih lemah saat bank prioritas kecil | fallback tests dan empty-state tests |
| FR-24 | Feedback segera, jawaban benar, contoh, audio opsional | application/component/E2E tests |
| FR-12 | Tidak ada answer event dari search/audio/viewed feed | event contract tests |
| FR-60..62 | Answer/session events masuk replay dan statistik | replay/integration tests |
| FR-50 | Semua session lokal dan offline | airplane-mode E2E |
| FR-54 | Minor dan adult memakai capability yang sama | capability/E2E test |
| FR-55 | Reset progress mengubah hasil replay tanpa menghapus event biasa | reset/replay integration test |

## 4. Scope

### Termasuk

1. Session setup:
   - package aktif dari local profile;
   - pilihan jenis latihan;
   - unit atau semua unit;
   - jumlah soal, default 10, maksimum 20;
   - arah soal untuk Guess the Word;
   - resume session terakhir yang belum selesai;
   - mulai baru dengan konfirmasi bila session aktif.
2. Guess the Word:
   - `word_to_meaning`;
   - `meaning_to_word`;
   - `audio_to_meaning` bila audio verified tersedia;
   - tepat empat opsi.
3. Fill the Gap:
   - tepat satu gap dari content package;
   - terjemahan Indonesia;
   - tiga atau empat opsi;
   - toggle terjemahan;
   - audio kalimat bila verified.
4. Content picker dan validasi ambiguity.
5. Durable session/question snapshot di SQLite.
6. Answer feedback dan summary.
7. `session_started`, `practice_answered`, `session_completed`.
8. Retry saat event atau session update gagal.
9. Accessibility, dynamic type 200%, offline, empty, error, dan interruption state.

### Tidak termasuk

- curated dialogue dan graph renderer;
- AI dialogue, account, sync, network, atau server state;
- challenge dan `challenge_checks`;
- recording/microphone/pronunciation scoring;
- adaptive question generation dengan model;
- penulisan content baru;
- streak/mastery UI lengkap;
- download/import package tambahan.

## 5. Arsitektur dan data flow

```text
Latihan route
  ↓
PracticeScreen / PracticeSetup
  ↓
application use cases
  ├─ get availability
  ├─ create/resume session
  ├─ get immutable question
  ├─ submit answer
  ├─ complete/abandon session
  └─ retry failed save
  ↓
domain picker + question validators
  ↓
SQLite content + progress snapshot
  ↓
SQLite practice session/question snapshot
  ↓
transaction coordinator
  ├─ learning_events
  └─ practice session counters/question answer
  ↓
replayProgress → strength/mastery/statistics
```

### Boundary rules

1. `src/app/` hanya route dan navigation composition.
2. Domain tidak mengimpor React, Expo, SQLite, atau native audio.
3. UI tidak mengakses SQLite atau `learning_events` langsung.
4. Semua content query menerima `packageId` dan, bila relevan, active `packageVersion`.
5. Question set immutable setelah session dibuat.
6. Jawaban benar dihitung application/domain layer, bukan UI.
7. Audio unavailable tidak menghalangi pengguna memilih dan mengirim jawaban.
8. Satu session hanya mempunyai satu question snapshot per index.
9. Satu question hanya boleh menghasilkan satu answer effect.
10. Sesi yang interrupted tidak otomatis menghasilkan `session_completed`.
11. Tidak ada network request pada Plan 6.

## 6. Domain contracts

### 6.1 Exercise types

```ts
export type PracticeExerciseType =
  | 'guess_the_word'
  | 'fill_the_gap';

export type GuessTheWordDirection =
  | 'word_to_meaning'
  | 'meaning_to_word'
  | 'audio_to_meaning';

export type PracticeSessionStatus =
  | 'created'
  | 'active'
  | 'completed'
  | 'interrupted'
  | 'abandoned';
```

### 6.2 Option contract

```ts
export type PracticeOption = {
  optionId: string;
  label: string;
  itemId: string;
};
```

`correctOptionId` hanya berada pada immutable question snapshot/application result. UI tidak boleh menentukan kebenaran dengan membandingkan label atau content payload.

### 6.3 Question contracts

```ts
export type SentencePreview = {
  sentenceId: string;
  text: string;
  translation?: string;
  audio?: AudioReference;
};

export type GuessTheWordQuestion = {
  type: 'guess_the_word';
  questionId: string;
  packageId: string;
  targetItemId: string;
  direction: GuessTheWordDirection;
  prompt: {
    lemma?: string;
    meaning?: string;
    audio?: AudioReference;
  };
  options: PracticeOption[];
  correctOptionId: string;
  exampleSentence?: SentencePreview;
};

export type FillTheGapQuestion = {
  type: 'fill_the_gap';
  questionId: string;
  packageId: string;
  sentenceId: string;
  missingWordId: string;
  beforeGap: string;
  afterGap: string;
  translation: string;
  options: PracticeOption[];
  correctOptionId: string;
  audio?: AudioReference;
};

export type PracticeQuestion =
  | GuessTheWordQuestion
  | FillTheGapQuestion;
```

Current POC `kalimat.json` dan audio hanya menjadi content fixture. String audio tanpa verified metadata tetap `unavailable`; soal text tetap usable.

### 6.4 Session contract

```ts
export type PracticeSession = {
  sessionId: string;
  packageId: string;
  exerciseType: PracticeExerciseType;
  unitId?: string;
  direction?: GuessTheWordDirection;
  questionIds: string[];
  questionCount: number;
  currentIndex: number;
  answeredCount: number;
  correctCount: number;
  status: PracticeSessionStatus;
  startedAt: string;
  completedAt?: string;
};
```

`questionIds` dan urutan soal dibekukan saat create session. Restart tidak boleh melakukan re-pick.

## 7. Content picker rules

### 7.1 Candidate source

Guess the Word mengambil candidate dari `words` aktif yang:

- `package_id` sesuai;
- optional `unit_id` sesuai filter;
- payload valid;
- status content dapat digunakan;
- memiliki field yang diperlukan oleh direction.

Fill the Gap mengambil candidate dari `sentences` aktif yang:

- `package_id` sesuai;
- optional `unit_id` sesuai;
- `gap` menunjuk ke word valid pada package yang sama;
- tepat satu gap dapat direpresentasikan;
- `translation` tersedia;
- sentence status bukan malformed.

### 7.2 Prioritas progress

Prioritas hanya memengaruhi urutan candidate, bukan availability gate:

1. item dengan `lastResult = 0`;
2. item dengan effective strength terendah;
3. item yang belum pernah dijawab;
4. item baru pada unit yang dipilih;
5. candidate valid lain sebagai pengisi.

Effective strength untuk sorting:

```text
effectiveStrength = strength × 0.97 ^ daysSinceLastReview
```

Decay ini hanya untuk prioritas picker. Nilai mastery yang ditampilkan tetap mengikuti aturan progress engine.

Jika progress cache belum siap, picker memakai deterministic fallback berdasarkan `unit_order`, `item_order`, dan `item_id`.

### 7.3 Guess the Word

- Tepat empat opsi.
- Tepat satu `correctOptionId`.
- Target tidak boleh menjadi distractor.
- Option ID harus unik dalam question.
- Label jawaban tidak boleh identik setelah search normalization.
- Distractor fallback berurutan:
  1. part of speech + register + theme;
  2. part of speech + register;
  3. part of speech;
  4. candidate valid package.
- Bila kurang dari empat distractor aman, candidate ditolak dan picker mencoba target lain.
- Untuk `audio_to_meaning`, hanya word dengan audio `verified` yang dapat menjadi prompt audio. Jika tidak ada bank audio valid, setup menonaktifkan arah tersebut dengan alasan yang jelas.

### 7.4 Fill the Gap

- Tepat satu gap.
- Tepat satu opsi yang melengkapi kalimat menurut validator content.
- Tiga atau empat opsi.
- Distractor memiliki register dan part of speech kompatibel bila metadata tersedia.
- Distractor tidak boleh membuat kalimat alternatif yang juga valid.
- Opsi disimpan dalam question snapshot sehingga urutan tidak berubah setelah restart.
- `word_viewed` tidak dibutuhkan untuk membuka atau memilih session.

### 7.5 Determinism

Picker menerima seed dari `sessionId` atau seed eksplisit. Dengan input content/progress yang sama:

- target set sama;
- urutan question sama;
- urutan options sama;
- restart tidak mengubah answer key.

Session baru boleh mempunyai seed berbeda. Tie-breaker terakhir selalu stable ID, bukan urutan hasil SQLite tanpa `ORDER BY`.

## 8. Question validation

Tambahkan validator murni yang dijalankan sebelum question disimpan:

```ts
export type QuestionValidationResult =
  | { ok: true }
  | { ok: false; reason: 'EMPTY_OPTIONS' | 'DUPLICATE_OPTION' | 'AMBIGUOUS' | 'INVALID_TARGET' | 'INVALID_SENTENCE' | 'MISSING_METADATA' };
```

Validator wajib memeriksa:

- package ID konsisten pada target dan options;
- option count sesuai type;
- correct option ada dan tepat satu;
- item ID tidak duplicate;
- label tidak duplicate setelah normalization;
- Fill the Gap hanya satu placeholder;
- sentence dan word berasal dari active package yang sama;
- audio hanya direferensikan jika metadata valid;
- question ID deterministic dan unik dalam session.

Question yang gagal validation dilewati oleh picker dan dicatat sebagai recoverable content issue melalui logger tanpa membocorkan payload sensitif.

## 9. SQLite migration

Tambahkan `src/infrastructure/database/migrations/0003_practice_sessions.ts` dan daftarkan di `migrationRunner.ts` setelah migration 0002.

### 9.1 `practice_sessions`

```sql
CREATE TABLE practice_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  package_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('guess_the_word', 'fill_the_gap')),
  unit_id TEXT,
  direction TEXT,
  question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 20),
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  answered_count INTEGER NOT NULL DEFAULT 0 CHECK (answered_count >= 0),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('created','active','completed','interrupted','abandoned')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (package_id) REFERENCES installed_packages(package_id)
);

CREATE INDEX idx_practice_sessions_active
  ON practice_sessions(package_id, status);
```

### 9.2 `practice_questions`

```sql
CREATE TABLE practice_questions (
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL CHECK (question_index >= 0),
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('guess_the_word', 'fill_the_gap')),
  target_item_id TEXT,
  sentence_id TEXT,
  question_json TEXT NOT NULL,
  answered INTEGER NOT NULL DEFAULT 0 CHECK (answered IN (0,1)),
  selected_option_id TEXT,
  correct INTEGER,
  PRIMARY KEY (session_id, question_index),
  UNIQUE (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES practice_sessions(session_id) ON DELETE CASCADE
);
```

### Migration invariants

- Migration forward-only, transactional, dan tidak mengubah `learning_events`.
- Session snapshot bukan source of truth untuk mastery; event tetap source of truth.
- Session incomplete tetap dapat dibaca setelah restart.
- `practice_questions` tidak boleh diisi partial tanpa session parent.
- Delete/reset progress tidak menghapus event secara normal; reset boundary dari Plan 3 tetap berlaku.
- Cleanup session lama adalah maintenance terpisah dan tidak boleh dijalankan pada setiap startup.

## 10. Event contract dan atomicity

### 10.1 `session_started`

```ts
{
  eventType: 'session_started',
  source: 'practice',
  packageId,
  sessionId,
  payload: {
    sessionId,
    exerciseType,
    questionCount,
    completed: false
  }
}
```

Event dibuat sekali saat session berhasil dibuat. Jika session row atau event gagal, session tidak boleh terlihat `active`.

### 10.2 `practice_answered`

```ts
{
  eventId: `practice:${sessionId}:${questionId}`,
  eventType: 'practice_answered',
  source: 'practice',
  packageId,
  itemId: targetItemId,
  sessionId,
  result: correct ? 1 : 0,
  weight: 1,
  formulaVersion: 1,
  payload: {
    sessionId,
    questionId,
    exerciseType,
    targetItemId,
    answerId: selectedOptionId,
    correct
  }
}
```

### 10.3 `session_completed`

```ts
{
  eventType: 'session_completed',
  source: 'practice',
  packageId,
  sessionId,
  payload: {
    sessionId,
    exerciseType,
    questionCount,
    correctCount,
    completed: true
  }
}
```

Completion hanya boleh dibuat sekali setelah semua question answered dan session update berhasil.

### 10.4 Transaction boundary

Submit answer harus atomic:

```text
BEGIN
  validate session/question/option
  if event_id sudah ada:
    baca hasil existing dan jangan tambah counter
  else:
    validate LearningEvent
    append learning event + local sequence
    mark question answered
    update session counters/current index
  COMMIT
```

Agar tetap mengikuti boundary `SQLiteProgressRepository.appendEvent()`, tambahkan salah satu API berikut, bukan akses SQLite dari UI:

- `appendEventWithin(transaction, event)` untuk memakai transaction yang sudah dibuka; atau
- `appendPracticeAnswer(input)` pada application/data coordinator yang memakai validator progress bersama dan satu transaction database.

Jika commit gagal, question tetap unanswered, counter tidak berubah, dan UI menampilkan `Jawaban belum tersimpan` dengan `Coba lagi`.

## 11. Interfaces dan application use cases

### Practice repository

```ts
export interface PracticeRepository {
  createSession(input: CreatePracticeSessionInput): Promise<RepositoryResult<PracticeSession>>;
  getSession(sessionId: string): Promise<RepositoryResult<PracticeSession | null>>;
  getInterruptedSession(packageId: string): Promise<RepositoryResult<PracticeSession | null>>;
  getQuestion(sessionId: string, index: number): Promise<RepositoryResult<PracticeQuestion | null>>;
  submitAnswer(input: SubmitPracticeAnswerInput): Promise<RepositoryResult<PracticeAnswerResult>>;
  completeSession(sessionId: string): Promise<RepositoryResult<void>>;
  abandonSession(sessionId: string): Promise<RepositoryResult<void>>;
}
```

Repository tidak boleh menerima label jawaban sebagai sumber kebenaran; input answer hanya `sessionId`, `questionId`, dan `optionId`.

### Use cases

```ts
export type CreatePracticeSessionInput = {
  packageId: string;
  exerciseType: PracticeExerciseType;
  unitId?: string;
  questionCount?: number;
  direction?: GuessTheWordDirection;
};

export type SubmitPracticeAnswerInput = {
  sessionId: string;
  questionId: string;
  optionId: string;
};

export type PracticeAnswerResult = {
  correct: boolean;
  correctOptionId: string;
  answerLabel: string;
  exampleSentence?: SentencePreview;
  nextIndex: number;
  sessionCompleted: boolean;
};
```

File use case:

```text
src/features/practice/application/getPracticeAvailability.ts
src/features/practice/application/createPracticeSession.ts
src/features/practice/application/getPracticeQuestion.ts
src/features/practice/application/submitPracticeAnswer.ts
src/features/practice/application/completePracticeSession.ts
src/features/practice/application/loadInterruptedSession.ts
src/features/practice/application/abandonPracticeSession.ts
```

Use case wajib mengembalikan `RepositoryResult`, bukan throw untuk keadaan content/user yang dapat dipulihkan.

## 12. File yang dibuat

### Domain

```text
src/features/practice/domain/practiceTypes.ts
src/features/practice/domain/practiceErrors.ts
src/features/practice/domain/practiceRules.ts
src/features/practice/domain/practiceSession.ts
src/features/practice/domain/contentPicker.ts
src/features/practice/domain/questionValidation.ts
src/features/practice/domain/guessTheWord.ts
src/features/practice/domain/fillTheGap.ts
```

### Application/data

```text
src/features/practice/application/getPracticeAvailability.ts
src/features/practice/application/createPracticeSession.ts
src/features/practice/application/getPracticeQuestion.ts
src/features/practice/application/submitPracticeAnswer.ts
src/features/practice/application/completePracticeSession.ts
src/features/practice/application/loadInterruptedSession.ts
src/features/practice/application/abandonPracticeSession.ts
src/features/practice/data/practiceRepository.ts
src/features/practice/data/sqlitePracticeRepository.ts
src/features/practice/data/practiceMappers.ts
```

### Presentation/routes

```text
src/features/practice/presentation/PracticeScreen.tsx
src/features/practice/presentation/PracticeSetup.tsx
src/features/practice/presentation/PracticeQuestionScreen.tsx
src/features/practice/presentation/GuessTheWordQuestion.tsx
src/features/practice/presentation/FillTheGapQuestion.tsx
src/features/practice/presentation/AnswerOption.tsx
src/features/practice/presentation/PracticeFeedback.tsx
src/features/practice/presentation/PracticeSummary.tsx
src/features/practice/presentation/PracticeStates.tsx
src/features/practice/presentation/InterruptedSessionCard.tsx
src/app/(tabs)/latihan.tsx
src/app/practice/[sessionId].tsx
```

### Database/tests

```text
src/infrastructure/database/migrations/0003_practice_sessions.ts
tests/unit/practice/contentPicker.test.ts
tests/unit/practice/guessTheWord.test.ts
tests/unit/practice/fillTheGap.test.ts
tests/unit/practice/questionValidation.test.ts
tests/unit/practice/sessionRules.test.ts
tests/unit/practice/practiceAvailability.test.ts
tests/integration/practice/session-persistence.test.ts
tests/integration/practice/answer-event.test.ts
tests/integration/practice/interruption.test.ts
tests/integration/practice/replay.test.ts
tests/integration/database/practice-migration.test.ts
tests/property/practice/picker-determinism.test.ts
tests/property/practice/no-ambiguous-question.test.ts
tests/property/practice/idempotent-answer.test.ts
tests/component/practice/PracticeSetup.test.tsx
tests/component/practice/PracticeQuestion.test.tsx
tests/component/practice/PracticeFeedback.test.tsx
tests/e2e/practice/offline-practice.spec.ts
tests/e2e/practice/interrupted-session.spec.ts
tests/e2e/practice/accessibility.spec.ts
```

## 13. File existing yang dimodifikasi

| File | Perubahan |
|---|---|
| `src/bootstrap/DependencyContainer.ts` | Tambahkan `practiceRepository`/capability practice dan transaction boundary yang diperlukan |
| `src/bootstrap/AppBootstrap.tsx` | Wire SQLite practice repository setelah database siap |
| `src/infrastructure/database/migrations/migrationRunner.ts` | Daftarkan migration 0003 |
| `src/features/progress/data/progressRepository.ts` | Reuse validator event dan expose transaction-safe append untuk practice |
| `src/domain/progress/learningEvent.ts` | Tegaskan payload/type contract practice dan session events bila diperlukan |
| `src/domain/progress/replay.ts` | Pastikan practice events dan session events direplay sesuai formula yang ada |
| `src/app/(tabs)/latihan.tsx` | Ganti placeholder dengan `PracticeScreen` |
| `docs/data-model.md` | Dokumentasikan session snapshot vs event source of truth |
| `docs/architecture.md` | Tambahkan practice data flow dan transaction boundary |
| `docs/requirements-traceability.md` | Tambahkan evidence FR-20..24 |
| `docs/design/flows/practice.md` | Sinkronkan state/recovery bila implementasi menemukan gap |
| `docs/implementation_plan/README.md` | Tandai Plan 6 sebagai blueprint/implemented sesuai status aktual |

## 14. Presentation state dan accessibility

### Setup state

```text
loading
ready
empty-package
empty-bank
content-unavailable
error
offline
```

### Session state

```text
question-loading
question-ready
option-selected
submitting
feedback-correct
feedback-incorrect
audio-loading
audio-playing
audio-stopped
audio-unavailable
save-failed
interrupted
summary
```

### Accessibility contract

- Heading `Latihan` pada setup.
- Tiga session card adalah button dengan nama dan deskripsi yang jelas.
- Session heading: `Soal X dari Y`.
- Opsi jawaban diekspos sebagai radio-like group dengan `selected` state.
- Tombol `Periksa jawaban` disabled sebelum opsi dipilih dan minimal 44 pt/48 dp.
- Feedback memakai polite live region; tidak mengandalkan warna.
- Fokus pindah ke feedback setelah submit.
- Fokus pindah ke heading question berikutnya setelah `Lanjut`.
- Audio memakai label play/stop dan state unavailable yang jelas.
- Fill the Gap dibaca screen reader sebagai kalimat dengan satu kata rumpang, bukan karakter underscore.
- Layout tetap usable pada font scale 200%, layar kecil, portrait, dan landscape.
- Exit button meminta konfirmasi jika session sudah dimulai.

## 15. Error, recovery, dan interruption

### Empty/content

- Package belum tersedia: `Paket belajar belum tersedia.` + action pemulihan.
- Bank kosong: `Belum ada materi untuk sesi ini.` + pilih materi lain/pasang package.
- Audio unavailable: `Audio tidak tersedia. Kamu tetap bisa menjawab.`
- Soal gagal dibuat: `Soal belum siap. Coba lagi.`

### Save failure

Jika append event atau update session gagal:

1. pilihan tetap terlihat;
2. question belum dianggap answered;
3. counter tidak bertambah;
4. UI menampilkan `Jawaban belum tersimpan.`;
5. user dapat `Coba lagi`;
6. retry memakai event ID yang sama agar idempotent.

### Process interruption

- Event answer yang sudah commit tetap ada.
- Session status tidak boleh `completed` kecuali completion transaction commit.
- Saat startup/tab Latihan dibuka, tampilkan `Sesi terakhir belum selesai.`.
- `Lanjutkan` membaca question snapshot pertama yang belum answered.
- `Mulai baru` meminta konfirmasi dan menandai session lama `abandoned`; tidak menghapus learning events.

## 16. Testing matrix

### Domain/picker

- empat opsi Guess the Word dan tepat satu jawaban;
- tiga arah Guess the Word;
- 3–4 opsi Fill the Gap;
- satu gap dan sentence metadata valid;
- duplicate/ambiguous label ditolak;
- target tidak menjadi distractor;
- deterministic seed;
- package/unit isolation;
- low-strength dan last-wrong priority;
- fallback saat bank prioritas kecil;
- empty state saat bank benar-benar tidak cukup;
- session dapat dibuat tanpa `word_viewed`.

### Application/event

- correct menghasilkan `result = 1`;
- wrong menghasilkan `result = 0`;
- payload `targetItemId`, `exerciseType`, `sessionId` valid;
- retry answer tidak menggandakan event/counter/strength;
- session started hanya sekali;
- session completed hanya setelah seluruh question answered;
- interrupted session tidak menambah completed count;
- search/audio/viewed tidak menghasilkan practice answer event;
- reset boundary mencegah event lama menghidupkan mastery aktif.

### SQLite/integration

- migration fresh database;
- upgrade dari schema version 2;
- migration rollback saat create table gagal;
- create session + questions atomic;
- answer event + question update + session counter atomic;
- partial transaction tidak terlihat;
- active package scope;
- restart membaca session dan question snapshot;
- stale/unknown session atau option ditolak;
- duplicate submit idempotent.

### UI/E2E

- airplane mode: setup → 10 soal → feedback → summary;
- pengguna baru langsung membuka latihan;
- Guess the Word semua direction yang tersedia;
- Fill the Gap dengan translation toggle;
- audio unavailable tetap dapat menjawab;
- save failure dan retry;
- process kill lalu resume;
- exit confirmation;
- minor dan adult;
- screen reader, selected/disabled state, focus flow;
- dynamic type 200% dan layar kecil.

## 17. Build sequence

1. **Audit content dan progress**
   - audit payload `kata.json`/`kalimat.json`;
   - audit `replayProgress`, event validator, dan transaction API;
   - putuskan field mana yang wajib untuk POC dan mana yang unavailable.
2. **Domain contracts dan pure rules**
   - type session/question/option;
   - normalization, deterministic seed, picker, distractor fallback;
   - question validator;
   - unit/property tests terlebih dahulu.
3. **SQLite migration dan mappers**
   - migration 0003;
   - session/question mappers;
   - migration and transaction tests.
4. **Repository dan atomic event coordinator**
   - create/resume/get question;
   - submit answer atomic;
   - complete/abandon;
   - package scope dan idempotency tests.
5. **Application use cases**
   - availability, create, load, submit, complete, resume, abandon;
   - error mapping dan retry contract.
6. **Runtime wiring**
   - dependency container;
   - startup migration registration;
   - selected package dari profile.
7. **Presentation setup dan session shell**
   - tab Latihan;
   - setup cards;
   - navigation `/practice/[sessionId]`;
   - interrupted session card.
8. **Question UI**
   - shared answer option;
   - Guess the Word;
   - Fill the Gap;
   - feedback/audio/summary.
9. **Accessibility and recovery hardening**
   - focus management;
   - live region;
   - dynamic type;
   - save failure, empty, offline, process interruption.
10. **Verification and evidence**
    - unit/integration/property/component/E2E;
    - `npm test`;
    - `npm run typecheck`;
    - `npm run lint`;
    - `npx expo-doctor`;
    - development-build validation bila audio valid tersedia.

## 18. Invariants yang harus dijaga

1. Semua query content dan progress memiliki `packageId`.
2. Session question set immutable setelah dibuat.
3. UI tidak menentukan jawaban benar.
4. Event answer idempotent berdasarkan `practice:${sessionId}:${questionId}`.
5. Submit ulang tidak menggandakan strength atau counter.
6. `session_started` bukan completion.
7. `session_completed` hanya dibuat satu kali setelah seluruh soal selesai.
8. Crash sebelum commit tidak menghasilkan answer parsial.
9. Crash setelah commit tidak membuat jawaban hilang saat resume.
10. `word_viewed` bukan syarat membuka session dan bukan source bank picker.
11. Audio unavailable tidak memblokir latihan.
12. Challenge tidak memakai event practice.
13. Reset progress memakai boundary/replay, bukan penghapusan event biasa.
14. Tidak ada microphone permission.
15. Tidak ada network dependency.
16. Minor memperoleh alur yang sama dengan adult setelah age gate lolos.

## 19. Acceptance criteria

Plan 6 dianggap selesai bila:

1. Tab Latihan tidak lagi placeholder.
2. Guess the Word dapat dimulai offline oleh pengguna baru.
3. Fill the Gap dapat dimulai offline oleh pengguna baru.
4. Default session memiliki 10 soal bila bank valid mencukupi.
5. Guess the Word memiliki tepat empat opsi dan satu jawaban benar.
6. Tiga direction Guess the Word memiliki prompt yang benar.
7. Fill the Gap memiliki tepat satu gap dan satu jawaban benar.
8. Distraktor berasal dari package aktif dan tidak ambigu.
9. Session tidak menggunakan `word_viewed` sebagai gate atau bank source.
10. Picker memprioritaskan progress tanpa menghilangkan fallback content valid.
11. Question set tetap sama setelah restart.
12. Jawaban tersimpan sebagai `practice_answered` dengan package/session/item scope.
13. Jawaban benar/salah memengaruhi replay sesuai formula yang ada.
14. Duplicate submit tidak menggandakan event atau strength.
15. Save failure tidak diklaim sukses dan dapat di-retry.
16. Interrupted session dapat dilanjutkan tanpa menandai completed.
17. Summary hanya muncul setelah completion transaction berhasil.
18. Feedback menampilkan jawaban benar dan contoh/audio bila tersedia.
19. Audio unavailable tetap membuat fungsi jawab usable.
20. Empty/error/offline states memiliki tindakan pemulihan.
21. Accessibility focus flow, semantics, target size, dan font scale 200% lulus.
22. Package isolation lulus untuk content, session, event, dan progress.
23. `npm test`, `npm run typecheck`, `npm run lint`, dan `npx expo-doctor` lulus.
24. FR-20..24 memiliki module, contract, test, dan evidence pada traceability.

## 20. Handoff ke Plan 7

Plan 6 harus meninggalkan capability berikut untuk Plan 7:

- session setup/navigation pattern;
- interrupted-session persistence dan resume;
- answer option, feedback, audio, focus, dan summary components;
- transaction-safe event persistence;
- package-scoped content access;
- progress snapshot/picker seam;
- error/retry/accessibility conventions.

Plan 7 kemudian menambahkan curated dialogue graph, register/comprehension choices, repair response, dialogue audio, dan event `dialogue_started`, `dialogue_choice`, serta `dialogue_completed` tanpa mengubah source-of-truth progress yang sudah dibangun.
