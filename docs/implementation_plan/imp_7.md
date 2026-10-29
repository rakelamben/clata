# P0 Implementation Plan 7 — Curated Dialogue & Challenge

## 1. Tujuan

Plan 7 membangun vertical slice offline untuk percakapan kurasi (Curated Dialogue) dan tantangan dunia nyata (Challenges) sebagai pelengkap fitur pembelajaran P0 setelah Plan 5 (vocabulary/audio) dan Plan 6 (latihan offline: Guess the Word & Fill the Gap):

- session shell dan graph runner untuk **Curated Dialogue** pada tab **Latihan**;
- visual transcript percakapan berbasis giliran (turns) dengan speaker separation, terjemahan fleksibel, dan audio playback offline;
- titik pilihan kontekstual dengan pemisahan tegas antara uji **Register** (tingkat tutur) dan uji **Pemahaman** (relevansi konteks);
- mekanisme **Repair & Repetition** tanpa penalti berlebih saat pengguna memilih respons yang tidak nyambung;
- langkah reflektif opsional **Ucapkan Sendiri** tanpa rekaman audio dan tanpa permintaan izin mikrofon (`no microphone permission`);
- skoring deterministik berbasis replay log dan pengiriman event `dialogue_started`, `dialogue_choice`, dan `dialogue_completed`;
- kartu **Tantangan** (Challenges) dunia nyata pada tab **Tantangan** dengan opsi varian **Solo** dan **Sosial**;
- catatan keselamatan (safety notes) dan frasa penyelamat (rescue phrases) untuk memitigasi kecemasan sosial;
- penegakan invariant mutlak: **Challenge tidak pernah memengaruhi streak, mastery, statistik, atau memicu learning event**;
- penyimpanan lokal centang `Sudah kucoba` di perangkat;
- seluruh alur berjalan 100% offline dalam mode pesawat dan aman untuk anak/minor (FR-54).

Plan ini tidak mencakup dialog berbasis kecerdasan buatan (AI Dialogue) maupun sinkronisasi cloud. Fitur tersebut dialokasikan ke P1 (FR-40..45, FR-51A).

---

## 2. Sumber keputusan dan aturan yang wajib dipatuhi

Dokumen ini diturunkan langsung dari spesifikasi arsitektur dan desain yang telah disahkan:

- `PRD_clata.md` Bagian 7.3 (Dialog Berbasis Skenario), Bagian 7.8 (Tantangan Praktik Nyata), Bagian 9 (Penyimpanan dan Sinkronisasi), Bagian 11 (Keamanan dan Privasi), Bagian 13 (Pedoman Penulisan Konten), dan Bagian 17.2;
- `docs/spec.md`;
- `docs/content-package-spec.md`;
- `docs/data-model.md`;
- `docs/sqlite-schema.md`;
- `docs/design/flows/dialogue.md`;
- `docs/design/screen/dialogue.md`;
- `docs/design/flows/challenges.md`;
- `docs/design/screen/challenges.md`;
- `docs/design/accessibility.md`;
- `docs/implementation_plan/imp_3.md`;
- `docs/implementation_plan/imp_6.md`.

### Dialogue Rule & Principles

1. **Bebas Hambatan Emosional**: Dialog tidak menghukum pengguna atau memberi label "Salah!". Evaluasi menggunakan copy ramah: `Pilihanmu pas.`, `Pilihan ini bisa dipahami, tetapi tingkat tuturnya kurang sesuai.`, atau balasan heran sopan dari lawan bicara.
2. **Tanpa Mikrofon**: Aplikasi tidak pernah meminta izin mikrofon (`android.permission.RECORD_AUDIO`, `NSMicrophoneUsageDescription`). Tombol `Ucapkan sendiri` murni instruksi mandiri pengguna membaca nyaring di ruang privatnya.
3. **Graph Integrity**: Graf dialog wajib berupa Directed Acyclic Graph (DAG) untuk alur utama, dengan siklus balik berbatas (self-loop / repair loop) hanya terjadi pada node perbaikan saat memilih opsi tidak nyambung. Tidak boleh ada orphan node atau dead end tanpa ending.
4. **Offline Resilience**: Seluruh teks, struktur graf, dan aset audio terikat pada package instalasi lokal. Jika berkas audio hilang atau rusak, baris dialog tetap dapat dibaca dan diselesaikan secara visual tanpa hambatan.

### Challenge Rule & Principles

1. **No Progress Invariant**: Melakukan centang `Sudah kucoba` atau berpindah varian Solo/Sosial tidak menulis record ke tabel `learning_events`, tidak menaikkan active days / streak, tidak mengubah skor mastery, dan tidak masuk dalam kalkulasi statistik belajar.
2. **Social Independence**: Varian Solo selalu tersedia berdampingan dengan varian Sosial. Pengguna tidak diwajibkan memiliki lawan bicara di dunia nyata untuk menyelesaikan materi unit.
3. **Child & Minor Safety**: Tantangan tidak memuat aktivitas berisiko fisik, finansial, atau interaksi sosial yang membahayakan anak. Safety guidance wajib tampil jelas sebelum opsi centang.

---

## 3. Requirements mapping

| PRD | Ringkasan Persyaratan | Implementasi Plan 7 | Evidence & Test Wajib |
|---|---|---|---|
| **FR-30** | Dialog graf: giliran karakter (teks, audio, terjemahan), titik pilihan 2–3 opsi, cabang, ending. Metadata: lawan bicara, register, unit, tingkat (L1–L3), kata target. | `DialogueGraphRunner`, `DialogueTypes`, parser package snapshot | Contract test graf, schema snapshot validation test |
| **FR-31** | Jalur pilihan menentukan ending. Tiap ending memiliki feedback bahasa Indonesia terperinci mengenai pilihan yang pas dan kurang pas. Tidak ada dead end. | `DialogueEnding`, feedback evaluator, graph reachability validator | Graph reachability property test, unit test ending feedback |
| **FR-32** | Langkah *Ucapkan sendiri*: instruksi mengucapkan kalimat dengan keras, tanpa rekaman audio, tanpa evaluasi, dapat dilewati, tanpa izin mikrofon. | `SelfSpeakStep.tsx`, absence of microphone permission in manifests | Manifest review test, component interaction test |
| **FR-33** | Terjemahan baris dialog dapat dimunculkan/disembunyikan secara individual. Toggle tersimpan per sesi (P0 local runtime). | `DialogueLineBubble.tsx`, local state visibility toggle | Component interaction test, accessibility tree test |
| **FR-34** | Titik pilihan memiliki satu jenis uji: **Register** (semua opsi relevan, beda tingkat tutur) atau **Pemahaman** (opsi nyambung vs opsi tidak nyambung). | `DialogueChoicePoint`, choice validator | Unit test choice categorization, content validator test |
| **FR-35** | Repetition & repair: opsi tidak nyambung memicu respons perbaikan dari lawan bicara dan mengulang pertanyaan pada node yang sama tanpa batas. | `DialogueRunEngine` repair loop state handler | Repair state machine unit test, repetition loop test |
| **FR-70** | Kartu tantangan per unit dan tingkat, bersumber dari paket konten lokal, tampil secara offline. | `ChallengeCard.tsx`, `SQLiteChallengeRepository` | Offline query test, repository unit test |
| **FR-71** | Tantangan tidak memengaruhi streak, mastery, statistik, atau log belajar apa pun. Invariant mutlak. | Isolasi `challenge_checks` dari `learning_events` & progress engine | No-progress invariant integration test, event log isolation test |
| **FR-72** | Setiap tantangan memiliki varian Solo dan varian Sosial yang dapat dipilih pengguna. | `ChallengeVariantSelector.tsx`, data schema solo/social | Variant toggle component test |
| **FR-73** | Centang pribadi `Sudah kucoba` hanya tersimpan lokal dan tidak memicu sinkronisasi atau penghitungan angka. | Tabel SQLite `challenge_checks`, toggle use case | Local-only persistence test, sync exclusion test |
| **FR-50** | Semua data dan aset dapat diakses offline dalam mode pesawat. | Penyimpanan snapshot graf dan aset bundel lokal | Airplane-mode E2E test |
| **FR-54** | Kesetaraan fungsional untuk pengguna anak/minor dan dewasa. | Kesamaan capability, penegakan safety notes untuk minor | Minor profile persona verification test |
| **FR-60..62** | Progres dialog dihitung secara deterministik oleh progress engine melalui event replay. | Emisi event `dialogue_started`, `dialogue_choice`, `dialogue_completed` | Event schema test, replay derivation test |

---

## 4. Scope

### Termasuk (In Scope)

1. **Dialogue Graph Traversal Engine**:
   - Membaca snapshot graf canonical dari SQLite (`dialogue_graph_snapshots`);
   - Menjalankan alur turn-by-turn (speaker bubbles, teks bahasa daerah, terjemahan);
   - Memfasilitasi titik pilihan 2–3 opsi dengan tipe `register` dan `comprehension`;
   - State perbaikan kontekstual (`repair`) saat memilih opsi tidak nyambung, kembali ke node yang sama;
   - Transisi ke node ending dan penyajian umpan balik komprehensif;
   - Langkah instruksional `Ucapkan sendiri` yang dapat dilewati.
2. **Audio Playback**:
   - Pemutaran audio native offline via `AudioPort` pada baris dialog aktif dan rescue phrases;
   - Ikon volume toggle tunggal (putar / henti), auto-stop pemutaran sebelumnya jika baris baru diputar;
   - Graceful fallback jika berkas `.opus` tidak ada atau gagal dimuat: teks tetap lengkap dengan pesan informatif.
3. **Session Lifecycle & Recovery**:
   - Mulai sesi baru, simpan progress run aktif di SQLite, dan pulihkan sesi yang terputus (interrupted session);
   - Tombol keluar dengan dialog konfirmasi (`Yakin ingin keluar?`);
   - Sesi yang ditinggalkan tidak menghasilkan skor ending dan tidak memicu `dialogue_completed`.
4. **Challenge Vertical Slice**:
   - Antarmuka tab **Tantangan** dengan pemilih unit dan tingkat;
   - Presentasi kartu tantangan lengkap: judul, tingkat, estimasi waktu, instruksi ringkas (maksimal 3 kalimat), safety note, dan segmented control `Solo` / `Sosial`;
   - Panel frasa penyelamat (*rescue phrase*) yang merujuk ke kosakata/kalimat dasar Unit 1 dengan audio;
   - Centang interaktif `Sudah kucoba` dengan persistensi lokal murni di SQLite (`challenge_checks`).
5. **Accessibility & Responsive**:
   - Dukungan screen reader lengkap (TalkBack & VoiceOver) dengan urutan fokus logis;
   - Pengumuman perubahan giliran dan live region polite untuk umpan balik perbaikan;
   - Ukuran target sentuh minimum 48×48 dp / 44×44 pt;
   - Kontras warna WCAG 2.2 AA dan adaptasi Dynamic Type hingga 200%.

### Tidak Termasuk (Out of Scope)

1. **AI Dialogue (FR-40..45)**: Percakapan interaktif berbasis LLM dengan kuota harian dan otentikasi akun ditunda ke P1. Renderer P0 dirancang extensible agar dapat menerima model data yang sama di masa mendatang.
2. **Perekaman Suara / Evaluasi Speech-to-Text**: Aplikasi tidak memproses audio input pengguna, tidak melakukan analisis fonetik otomatis, dan tidak mendeklarasikan izin mikrofon pada platform Android maupun iOS.
3. **Sinkronisasi Server (FR-51A)**: Tidak ada transfer data centang tantangan atau sesi dialog ke backend Supabase pada fase P0.
4. **Modifikasi Mastery Langsung**: UI dialog tidak pernah memutasi tabel `item_strength_cache` atau `mastery` secara langsung. Semua mutasi harus melalui progress engine berbasis replay event log.

---

## 5. Arsitektur dan data flow

### 5.1 Diagram Arsitektur Komponen

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                              │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   DialogueRunScreen (Latihan) │  │   TantanganScreen (Tab Bar)    │ │
│  │  - TranscriptScrollView       │  │  - ChallengeCard               │ │
│  │  - DialogueLineBubble         │  │  - VariantSelector (Solo/Sos)  │ │
│  │  - ChoiceActionGroup          │  │  - RescuePhraseDrawer          │ │
│  │  - RepairFeedbackBanner       │  │  - LocalCheckButton            │ │
│  │  - SelfSpeakModal             │  │                                │ │
│  │  - DialogueSummarySheet       │  │                                │ │
│  └───────────────┬───────────────┘  └───────────────┬────────────────┘ │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Application Layer                               │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │     Dialogue Use Cases        │  │      Challenge Use Cases       │ │
│  │  - ListDialogues              │  │  - GetChallengesForUnit        │ │
│  │  - StartDialogueRun           │  │  - ToggleChallengeCheck        │ │
│  │  - SubmitDialogueChoice       │  │  - GetRescuePhraseContent      │ │
│  │  - ResumeDialogueRun          │  │                                │ │
│  │  - CompleteDialogueRun        │  │                                │ │
│  └───────────────┬───────────────┘  └───────────────┬────────────────┘ │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Domain Layer                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  - DialogueGraphEngine (DAG traversal, repair loop state)        │  │
│  │  - DialogueScoringRules (deterministic derivation from choices)  │  │
│  │  - DialogueGraphValidator (orphan/dead-end detection)            │  │
│  │  - ChallengeInvariants (guaranteed zero progress side effects)   │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Infrastructure & Data Layer                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   SQLiteDialogueRepository    │  │   SQLiteChallengeRepository    │ │
│  │  - dialogue_graph_snapshots   │  │  - challenges (content)        │ │
│  │  - active_dialogue_runs       │  │  - challenge_checks (local)    │ │
│  └───────────────┬───────────────┘  └────────────────────────────────┘ │
│                  ▼                                                     │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │      LearningEventBus         │  │           AudioPort            │ │
│  │  - dialogue_started           │  │  - play(fileUri)               │ │
│  │  - dialogue_choice            │  │  - stop()                      │ │
│  │  - dialogue_completed         │  │  - getPlaybackState()          │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Alur Data Traversal Graf Dialog

```text
User menekan 'Mulai dialog'
        ↓
StartDialogueRunUseCase
        ↓ Buat runId baru, sequence = 0, fetch canonical snapshot
Tulis event 'dialogue_started' ke database via AppendEvent
        ↓
Tampilkan Node Awal (n0)
        ↓
[Audio diputar jika pengguna menekan toggle volume]
        ↓
Apakah node memiliki pilihan (choices)?
  ├── TIDAK: User menekan 'Lanjut' → Pindah ke node.next → Render node berikutnya
  └── YA: Tampilkan kartu opsi (2-3 pilihan)
        ↓
User memilih opsi
        ↓
SubmitDialogueChoiceUseCase
        ↓ Validasi tipe pilihan (register vs comprehension)
Tulis event 'dialogue_choice' (sequence N+1)
        ↓
Evaluasi Kualitas Opsi:
  ├── 'tidak-nyambung' (Hanya ada di comprehension):
  │     → Tampilkan balasan repair dari lawan bicara
  │     → Pertahankan cursor pada node saat ini
  │     → Izinkan pengguna memilih kembali opsi nyambung
  │
  └── 'pas' / 'cukup-pas' / 'kurang-pas':
        → Kunci pilihan, tampilkan umpan balik register/konteks
        → Tampilkan prompt reflektif 'Ucapkan sendiri' (opsional, dapat dilewati)
        → Pindah ke choice.next
        ↓
Apakah target adalah Ending?
  ├── TIDAK: Render node berikutnya
  └── YA:
        ↓
Tulis event 'dialogue_completed' (sequence akhir)
Hitung skor dialog akhir secara deterministik
Tampilkan DialogueSummaryScreen dengan feedback lengkap
```

---

## 6. Domain contracts

Semua tipe domain ditempatkan di `src/features/dialogues/domain/` dan `src/features/challenges/domain/` tanpa ketergantungan pada React, Expo, SQLite, atau framework luar.

### 6.1 Dialogue Domain Contracts

```typescript
// src/features/dialogues/domain/dialogueTypes.ts

export type DialogueSpeakerRole = 'user' | 'interlocutor';

export type DialogueRegister = 'ngoko' | 'krama' | 'krama_inggil' | 'neutral';

export type DialogueLevel = 'L1' | 'L2' | 'L3';

export type DialogueChoiceType = 'register' | 'comprehension';

export type DialogueChoiceQuality = 'pas' | 'cukup-pas' | 'kurang-pas' | 'tidak-nyambung';

export type DialogueEndingQuality = 'pas' | 'cukup-pas' | 'kurang-pas';

export type DialogueRepairResponse = {
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
};

export type DialogueChoice = {
  readonly id: string;
  readonly text: string;
  readonly translation: string;
  readonly quality: DialogueChoiceQuality;
  readonly type: DialogueChoiceType;
  readonly next: string; // Target node ID atau ending ID
  readonly repair?: DialogueRepairResponse;
  readonly feedbackExplanation?: string;
};

export type DialogueNode = {
  readonly id: string;
  readonly speakerRole: DialogueSpeakerRole;
  readonly speakerName: string;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly choices?: readonly DialogueChoice[];
  readonly next?: string; // Default next node jika tidak ada pilihan
  readonly targetWordIds?: readonly string[];
};

export type DialogueEnding = {
  readonly id: string;
  readonly quality: DialogueEndingQuality;
  readonly feedback: string;
  readonly learningPoints?: readonly string[];
};

export type DialogueGraph = {
  readonly id: string;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly graphFingerprint: string;
  readonly title: string;
  readonly unitId: string;
  readonly level: DialogueLevel;
  readonly register: DialogueRegister;
  readonly interlocutorTitle: string;
  readonly contextDescription: string;
  readonly targetWordIds: readonly string[];
  readonly maxNewWords: number;
  readonly initialNodeId: string;
  readonly nodes: readonly DialogueNode[];
  readonly endings: readonly DialogueEnding[];
};

export type DialogueRunStatus = 'in_progress' | 'completed' | 'interrupted' | 'abandoned';

export type DialogueRunHistoryEntry = {
  readonly nodeId: string;
  readonly speakerName: string;
  readonly speakerRole: DialogueSpeakerRole;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly chosenOptionId?: string;
  readonly chosenOptionText?: string;
  readonly choiceQuality?: DialogueChoiceQuality;
  readonly repairShown?: DialogueRepairResponse;
};

export type DialogueRunState = {
  readonly runId: string;
  readonly sessionId: string;
  readonly packageId: string;
  readonly dialogueId: string;
  readonly graphFingerprint: string;
  readonly packageVersion: string;
  readonly currentNodeId: string;
  readonly sequence: number;
  readonly status: DialogueRunStatus;
  readonly history: readonly DialogueRunHistoryEntry[];
  readonly selectedChoices: readonly {
    readonly nodeId: string;
    readonly choiceId: string;
    readonly quality: DialogueChoiceQuality;
    readonly attempt: number;
  }[];
  readonly disconnectedAttempts: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly endingId?: string;
};
```

### 6.2 Challenge Domain Contracts

```typescript
// src/features/challenges/domain/challengeTypes.ts

export type ChallengeVariantType = 'solo' | 'social';

export type ChallengeLevel = 'L1' | 'L2' | 'L3';

export type RescuePhrase = {
  readonly id: string;
  readonly wordOrSentenceId: string;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly registerLabel: string;
};

export type Challenge = {
  readonly id: string;
  readonly packageId: string;
  readonly unitId: string;
  readonly level: ChallengeLevel;
  readonly title: string;
  readonly estimatedDurationMinutes: number;
  readonly objective: string;
  readonly instructionsSolo: string;
  readonly instructionsSocial: string;
  readonly registerNote: string;
  readonly safetyGuidance: string;
  readonly rescuePhrases: readonly RescuePhrase[];
  readonly status: 'draft' | 'active' | 'retired';
};

export type ChallengeCheckRecord = {
  readonly packageId: string;
  readonly challengeId: string;
  readonly checkedAt: string;
  readonly selectedVariant: ChallengeVariantType;
};
```

---

## 7. Dialogue graph validation & execution rules

### 7.1 Aturan Validasi Struktur Graf (Package & Builder Level)

Setiap graf dialog kurasi yang lolos verifikasi package builder dan stage validator wajib memenuhi kriteria berikut:

1. **Jumlah Giliran (Turn Count)**: Minimal 6 giliran dan maksimal 10 giliran dari node awal (`initialNodeId`) hingga mencapai ending.
2. **Titik Pilihan (Choice Points)**: Tepat memiliki 2 hingga 3 titik pilihan dalam satu graf. Setiap titik pilihan wajib menyediakan 2 atau 3 opsi respons.
3. **Pemisahan Uji Register vs Pemahaman (FR-34)**:
   - Titik pilihan bertipe `register`: Seluruh opsi (2–3) wajib relevan secara isi percakapan dan hanya berbeda derajat kesantunan (`pas`, `cukup-pas`, atau `kurang-pas`). Titik ini **dilarang memuat opsi `tidak-nyambung`**.
   - Titik pilihan bertipe `comprehension`: Wajib memuat minimal 1 opsi relevan (`pas`) dan minimal 1 opsi tidak relevan (`tidak-nyambung`).
4. **Repair Response Mandatory (FR-35)**:
   - Setiap opsi dengan kualitas `tidak-nyambung` **wajib** menyertakan objek `repair` yang memuat teks dan terjemahan reaksi lawan bicara.
   - Properti `next` pada opsi `tidak-nyambung` **harus selalu menunjuk kembali ke `node.id` yang sama**.
5. **Ketiadaan Orphan Node dan Dead End**:
   - Seluruh node dalam daftar `nodes` harus dapat dijangkau (*reachable*) dari `initialNodeId`.
   - Tidak boleh ada node buntu: setiap node harus memiliki `next` yang valid, atau `choices` yang seluruh target `next`-nya valid menuju node lain atau `endings`.
6. **Validitas Ending (FR-31)**:
   - Minimal terdapat 1 ending terdaftar di `endings`.
   - Setiap ending wajib memiliki teks `feedback` bahasa Indonesia yang menjelaskan evaluasi pilihan pengguna secara mendidik.
7. **Batasan Kata Baru**:
   - Jumlah kata baru (`maxNewWords`) maksimal 5 kata per skenario dialog, dan seluruhnya harus terdaftar dalam `target_word_ids` yang merujuk pada kata valid di unit paket tersebut.

### 7.2 Aturan Eksekusi State Machine Traversal

```text
┌─────────────────┐       Lanjut        ┌─────────────────┐
│   Node Dialog   ├────────────────────►│   Node Dialog   │
│ (Tanpa Pilihan) │                     │    Berikutnya   │
└────────┬────────┘                     └─────────────────┘
         │
         │ Terdapat Choices
         ▼
┌─────────────────┐
│ Titik Pilihan   │
└────────┬────────┘
         │
         ├────────────────────────────────────────┬────────────────────────────────────────┐
         │ Opsi: 'pas' / 'cukup-pas' / 'kurang'   │ Opsi: 'tidak-nyambung'                 │
         ▼                                        ▼                                        │
┌─────────────────┐                      ┌─────────────────┐                               │
│ Tampilkan Kunci │                      │ Tampilkan Balas │                               │
│ & Feedback Opsi │                      │ Repair & Ulang  │                               │
└────────┬────────┘                      └────────┬────────┘                               │
         │                                        │ (Loop kembali ke Node yang sama)       │
         │                                        └────────────────────────────────────────┘
         ▼
┌─────────────────┐       Lanjut        ┌─────────────────┐       Ending        ┌─────────────────┐
│ Ucapkan Sendiri ├────────────────────►│   Node / Ending ├────────────────────►│  Summary Sheet  │
│   (Opsional)    │                     │    Berikutnya   │                     │ & Simpan Record │
└─────────────────┘                     └─────────────────┘                     └─────────────────┘
```

- **Idempotensi Pilihan**: Sekali pengguna menekan opsi pilihan, tombol pilihan terkunci (`disabled`) untuk mencegah double-event atau mutasi state ganda.
- **Repair Loop**: Saat opsi `tidak-nyambung` dipilih, counter `disconnectedAttempts` bertambah satu. State machine merender ucapan lawan bicara (misal: *"Pangapunten, kula mboten mangertos maksudipun..."*). Setelah pengguna menekan tombol *Coba Lagi*, form pilihan pada node yang sama dirender ulang.
- **Skoring Replay Deterministik**:
  - Poin pemahaman: `1.0` jika langsung memilih opsi nyambung pada kesempatan pertama; `0.5` jika berhasil nyambung setelah melewati 1 kali atau lebih balasan repair.
  - Poin register: `1.0` untuk kualitas `pas`, `0.75` untuk `cukup-pas`, dan `0.5` untuk `kurang-pas`.
  - Skor akhir dialog adalah rata-rata tertimbang dari seluruh choice point yang diselesaikan.

---

## 8. Challenge rules & invariants

### 8.1 Aturan Struktur Tantangan (FR-70..72)

1. **Paket Berisi Tantangan**: Setiap unit pembelajaran memuat kartu tantangan bergradasi tingkat (`L1`, `L2`, `L3`) yang terverifikasi dalam berkas `challenge.json`.
2. **Ketersediaan Dua Varian**:
   - **Varian Solo**: Dirancang untuk pengguna yang berlatih mandiri (misal: *"Ucapkan sapaan Sugeng Enjang saat melihat tetangga dari kejauhan atau di depan cermin"*).
   - **Varian Sosial**: Dirancang untuk interaksi langsung (misal: *"Sapalah penjual di warung langgananmu menggunakan frasa Sugeng Enjang"*).
   - Tidak ada kartu tantangan yang memaksakan keberadaan mitra tutur jika pengguna memilih varian Solo.
3. **Instruksi Bersahaja**: Instruksi tantangan dirumuskan dalam maksimal 3 kalimat lugas, menghindari jargon linguistik atau tuntutan keberanian yang menghakimi.
4. **Catatan Keselamatan Anak & Remaja (Minor Safety)**:
   - Instruksi tidak mengarahkan interaksi dengan orang asing di tempat sepi atau situasi berisiko.
   - Komponen UI menampilkan peringatan keselamatan (*safety note*) secara mencolok sebelum tombol centang penyelesaian dapat diakses.
5. **Frasa Penyelamat (Rescue Phrases)**:
   - Setiap kartu tantangan menyediakan 1–3 frasa penyelamat yang bersumber dari materi dasar Unit 1.
   - Frasa ini berfungsi sebagai bantuan darurat jika pengguna merasa canggung atau buntu saat mempraktikkan tantangan di lapangan.

### 8.2 Invariant Mutlak Tanpa Dampak Progres (FR-71)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Tantangan Action Invariant                      │
│                                                                        │
│   User Action:                                                         │
│   - Membaca kartu tantangan                                            │
│   - Berpindah tab Solo <-> Sosial                                      │
│   - Membuka frasa penyelamat & memutar audio                           │
│   - Menekan checkbox 'Sudah kucoba'                                    │
│   - Membatalkan checkbox 'Sudah kucoba'                                │
│                                                                        │
│   DIJAMIN SECARA ARSITEKTURAL:                                         │
│   ❌ TIDAK menulis baris ke tabel `learning_events`                   │
│   ❌ TIDAK menambah hari aktif atau streak                             │
│   ❌ TIDAK mengubah angka `item_strength_cache` atau `mastery`        │
│   ❌ TIDAK masuk ke perhitungan ringkasan statistik progres            │
│   ❌ TIDAK dikirimkan ke antrean sinkronisasi server (P1 sync)         │
│                                                                        │
│   HANYA memutasi tabel lokal: `challenge_checks`                       │
└────────────────────────────────────────────────────────────────────────┘
```

Pelanggaran terhadap invariant ini diklasifikasikan sebagai cacat arsitektur kritis (critical defect). Test otomatis wajib memverifikasi bahwa setelah aksi centang tantangan dilakukan, `COUNT(*)` pada `learning_events` tidak bertambah.

---

## 9. Audio playback & offline fallback

### 9.1 Mekanisme Audio Port

Audio pada dialog dan frasa penyelamat tantangan menggunakan implementasi abstraksi `AudioPort` yang memanfaatkan file lokal terbundel:

1. **Single Playback Focus**: Hanya ada satu sumber audio yang dapat bersuara dalam satu waktu. Memulai pemutaran audio pada baris dialog baru secara otomatis memanggil `audioPort.stop()` pada audio yang sedang aktif.
2. **Kontrol Ikon Volume Tunggal**:
   - UI tidak menyediakan tombol replay, timeline slider, atau pengatur kecepatan playback.
   - Cukup satu icon volume toggle: status berhenti (ikon speaker outline) dan status memutar (ikon speaker terisi / animasi gelombang warna primer).
   - Menekan ikon saat memutar akan menghentikan audio. Menekan kembali akan memutar ulang dari awal berkas (`00:00`).
3. **Format Berkas & Lokasi**:
   - Seluruh audio dikemas dalam format `.opus` terkompresi hemat daya.
   - URI berkas diselesaikan melalui path direktori package terinstal: `file://.../packages/{packageId}/audio/{filename}`.

### 9.2 Offline Fallback & Graceful Degradation

Jika berkas audio tidak ditemukan, checksum berkas tidak cocok, atau decoder perangkat mengalami kegagalan:

1. Antarmuka **tidak boleh crash atau berhenti berfungsi**.
2. Ikon volume menampilkan indikator disabled dengan status `Audio tidak tersedia`.
3. Teks bahasa daerah dan terjemahan bahasa Indonesia tetap tampil 100% lengkap.
4. Pengguna tetap dapat melanjutkan giliran percakapan, memilih respons, dan menyelesaikan skenario dialog tanpa hambatan.
5. Pada screen reader, tombol audio mengumumkan: *"Audio belum tersedia. Kamu tetap bisa melanjutkan percakapan."*

---

## 10. SQLite persistence & schema

### 10.1 Skema Tabel Terkait Plan 7

Penyimpanan SQLite mengikuti blueprint dari `docs/sqlite-schema.md` dan `imp_3.md`:

```sql
-- 1. Snapshot Graf Dialog Imutabel (Sudah ada di blueprint Plan 3)
CREATE TABLE IF NOT EXISTS dialogue_graph_snapshots (
  package_id TEXT NOT NULL,
  package_version TEXT NOT NULL,
  dialogue_id TEXT NOT NULL,
  graph_fingerprint TEXT NOT NULL,
  graph_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (package_id, package_version, dialogue_id, graph_fingerprint)
);

-- 2. Ringkasan Skor Dialog Terbaik (Tabel Progres Turunan)
CREATE TABLE IF NOT EXISTS dialogue_scores (
  package_id TEXT NOT NULL,
  dialogue_id TEXT NOT NULL,
  best_score REAL NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 1,
  last_completed_at TEXT NOT NULL,
  PRIMARY KEY (package_id, dialogue_id)
);

-- 3. Status Sesi Dialog Aktif / Terputus (Untuk Interruption Recovery)
CREATE TABLE IF NOT EXISTS active_dialogue_runs (
  session_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL,
  package_version TEXT NOT NULL,
  graph_fingerprint TEXT NOT NULL,
  dialogue_id TEXT NOT NULL,
  current_node_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  disconnected_attempts INTEGER NOT NULL DEFAULT 0,
  run_state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Centang Tantangan Lokal (Local-Only State, Tidak Disinkronkan)
CREATE TABLE IF NOT EXISTS challenge_checks (
  package_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  selected_variant TEXT NOT NULL CHECK(selected_variant IN ('solo', 'social')),
  PRIMARY KEY (package_id, challenge_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_checks_pkg ON challenge_checks(package_id);
```

### 10.2 Migrasi Database `0004_dialogues_and_challenges.ts`

Sebuah migrasi baru disiapkan di `src/infrastructure/database/migrations/0004_dialogues_and_challenges.ts` untuk memastikan tabel `active_dialogue_runs` dan `challenge_checks` diinisialisasi jika belum ada pada versi skema saat ini.

---

## 11. Event contract dan atomicity

### 11.1 Format Event Dialog

Event dialog dicatat ke dalam tabel imutabel `learning_events` menggunakan format baku:

#### `dialogue_started`
```json
{
  "eventId": "evt_dlg_start_01J...",
  "eventType": "dialogue_started",
  "source": "dialogue",
  "packageId": "jawa-mataraman",
  "itemId": "dialog-sapaan",
  "sessionId": "ses_01J...",
  "payload": {
    "sessionId": "ses_01J...",
    "runId": "run_01J...",
    "sequence": 0,
    "packageVersion": "1.0.0",
    "graphFingerprint": "sha256:abcd...",
    "dialogueId": "dialog-sapaan",
    "startedAt": "2026-10-29T20:30:00.000Z"
  },
  "timestamp": "2026-10-29T20:30:00.000Z",
  "syncStatus": "pending"
}
```

#### `dialogue_choice`
```json
{
  "eventId": "evt_dlg_choice_01J...",
  "eventType": "dialogue_choice",
  "source": "dialogue",
  "packageId": "jawa-mataraman",
  "itemId": "dialog-sapaan",
  "sessionId": "ses_01J...",
  "payload": {
    "sessionId": "ses_01J...",
    "runId": "run_01J...",
    "sequence": 1,
    "packageVersion": "1.0.0",
    "graphFingerprint": "sha256:abcd...",
    "dialogueId": "dialog-sapaan",
    "nodeId": "n0",
    "choiceId": "opt-1",
    "choiceType": "register",
    "quality": "pas",
    "attempt": 1
  },
  "timestamp": "2026-10-29T20:30:15.000Z",
  "syncStatus": "pending"
}
```

#### `dialogue_completed`
```json
{
  "eventId": "evt_dlg_done_01J...",
  "eventType": "dialogue_completed",
  "source": "dialogue",
  "packageId": "jawa-mataraman",
  "itemId": "dialog-sapaan",
  "sessionId": "ses_01J...",
  "payload": {
    "sessionId": "ses_01J...",
    "runId": "run_01J...",
    "sequence": 4,
    "packageVersion": "1.0.0",
    "graphFingerprint": "sha256:abcd...",
    "dialogueId": "dialog-sapaan",
    "endingId": "end-sukses",
    "endingQuality": "pas",
    "score": 1.0,
    "completedAt": "2026-10-29T20:31:00.000Z"
  },
  "timestamp": "2026-10-29T20:31:00.000Z",
  "syncStatus": "pending"
}
```

#### Paparan Kosakata Target (`word_viewed`)
Jika pada baris dialog yang dilalui terdapat `targetWordIds`, aplikasi memicu event `word_viewed` dengan tag eksplisit:
`{ "itemId": "kata-sugeng", "viewedFrom": "curated_dialogue_target", "durationMs": 3000, "foreground": true }`.
Sesuai aturan Plan 3 dan Plan 5, paparan ini menaikkan exposure kata tetapi **tidak memicu pertambahan streak hari aktif**.

### 11.2 Atomisitas Penyelesaian Dialog

Saat dialog mencapai ending, operasi berikut dieksekusi dalam **satu transaksi database SQLite tunggal**:
1. Tulis event `dialogue_completed` ke tabel `learning_events`;
2. Perbarui tabel `dialogue_scores` (menggunakan `MAX(best_score, new_score)` dan menambah `completed_count`);
3. Hapus baris dari tabel `active_dialogue_runs` untuk sesi tersebut;
4. Tulis event `session_completed` untuk menutup session shell Latihan.

Jika transaksi gagal di tengah jalan, seluruh mutasi di-rollback dan dialog tetap berada pada status `in_progress` sehingga tidak terjadi inkonsistensi data.

---

## 12. Interfaces dan application use cases

### 12.1 Dialogue Application Use Cases

```typescript
// 1. List Available Dialogues
export interface ListDialoguesUseCase {
  execute(input: { packageId: string; unitId?: string }): Promise<RepositoryResult<{
    dialogues: {
      id: string;
      title: string;
      unitId: string;
      level: DialogueLevel;
      register: DialogueRegister;
      interlocutorTitle: string;
      contextDescription: string;
      estimatedTurns: number;
      bestScore?: number;
      isCompleted: boolean;
    }[];
  }>>;
}

// 2. Start Dialogue Run
export interface StartDialogueRunUseCase {
  execute(input: { packageId: string; dialogueId: string }): Promise<RepositoryResult<{
    runState: DialogueRunState;
    initialNode: DialogueNode;
  }>>;
}

// 3. Submit Dialogue Choice
export interface SubmitDialogueChoiceUseCase {
  execute(input: {
    sessionId: string;
    nodeId: string;
    choiceId: string;
  }): Promise<RepositoryResult<{
    evaluation: {
      quality: DialogueChoiceQuality;
      isRepeat: boolean;
      repairResponse?: DialogueRepairResponse;
      feedbackText: string;
    };
    nextStep: {
      type: 'node' | 'ending';
      node?: DialogueNode;
      ending?: DialogueEnding;
    };
    updatedRunState: DialogueRunState;
  }>>;
}

// 4. Complete Dialogue Run
export interface CompleteDialogueRunUseCase {
  execute(input: { sessionId: string; endingId: string }): Promise<RepositoryResult<{
    finalScore: number;
    ending: DialogueEnding;
  }>>;
}

// 5. Abandon / Exit Dialogue Run
export interface AbandonDialogueRunUseCase {
  execute(input: { sessionId: string }): Promise<RepositoryResult<void>>;
}

// 6. Resume Interrupted Dialogue
export interface ResumeDialogueRunUseCase {
  execute(input: { packageId: string }): Promise<RepositoryResult<DialogueRunState | null>>;
}
```

### 12.2 Challenge Application Use Cases

```typescript
// 1. Get Challenges for Unit
export interface GetChallengesUseCase {
  execute(input: { packageId: string; unitId?: string; level?: ChallengeLevel }): Promise<RepositoryResult<{
    challenges: (Challenge & { isChecked: boolean; checkedVariant?: ChallengeVariantType })[];
    units: { id: string; title: string }[];
  }>>;
}

// 2. Toggle Challenge Check (Local-only mutation)
export interface ToggleChallengeCheckUseCase {
  execute(input: {
    packageId: string;
    challengeId: string;
    variant: ChallengeVariantType;
  }): Promise<RepositoryResult<{ isChecked: boolean }>>;
}
```

---

## 13. File yang dibuat

```text
src/features/dialogues/
├── application/
│   ├── abandonDialogueRun.ts
│   ├── completeDialogueRun.ts
│   ├── listDialogues.ts
│   ├── resumeDialogueRun.ts
│   ├── startDialogueRun.ts
│   └── submitDialogueChoice.ts
├── data/
│   └── sqliteDialogueRepository.ts
├── domain/
│   ├── dialogueErrors.ts
│   ├── dialogueGraphEngine.ts
│   ├── dialogueGraphValidator.ts
│   ├── dialogueScoringRules.ts
│   └── dialogueTypes.ts
└── presentation/
    ├── ChoiceActionGroup.tsx
    ├── DialogueFeedbackModal.tsx
    ├── DialogueLineBubble.tsx
    ├── DialogueRunScreen.tsx
    ├── DialogueSetupView.tsx
    ├── DialogueStates.tsx
    ├── DialogueSummarySheet.tsx
    └── SelfSpeakStep.tsx

src/features/challenges/
├── application/
│   ├── getChallenges.ts
│   └── toggleChallengeCheck.ts
├── data/
│   └── sqliteChallengeRepository.ts
├── domain/
│   ├── challengeErrors.ts
│   ├── challengeInvariants.ts
│   └── challengeTypes.ts
└── presentation/
    ├── ChallengeCard.tsx
    ├── ChallengeFilterBar.tsx
    ├── ChallengeStates.tsx
    ├── RescuePhraseDrawer.tsx
    └── VariantSelector.tsx

src/infrastructure/database/migrations/
└── 0004_dialogues_and_challenges.ts

src/app/
└── dialogue/
    └── [dialogueId].tsx

tests/unit/dialogues/
├── dialogueGraphEngine.test.ts
├── dialogueGraphValidator.test.ts
├── dialogueScoringRules.test.ts
└── dialogueUseCases.test.ts

tests/unit/challenges/
├── challengeInvariants.test.ts
└── challengeUseCases.test.ts

tests/integration/dialogues/
└── dialogueSqlitePersistence.test.ts

tests/integration/challenges/
└── challengeSqlitePersistence.test.ts
```

---

## 14. File existing yang dimodifikasi

1. **`src/app/(tabs)/tantangan.tsx`**:
   - Menghubungkan antarmuka placeholder dengan `TantanganScreen` asli yang mengonsumsi `useChallenges` hook, `ChallengeCard`, filter unit/tingkat, dan aksi centang lokal.
2. **`src/app/(tabs)/latihan.tsx`**:
   - Mengintegrasikan kartu pemilihan mode sesi `Dialog` berdampingan dengan `Tebak Kata` dan `Lengkapi Kalimat`.
   - Mengarahkan navigasi ke rute `/dialogue/[dialogueId]` saat skenario dipilih.
3. **`src/bootstrap/DependencyContainer.ts`**:
   - Mendaftarkan singleton repositori: `SQLiteDialogueRepository` dan `SQLiteChallengeRepository`.
   - Mendaftarkan seluruh use cases percakapan dan tantangan ke dalam container runtime.
4. **`src/bootstrap/AppBootstrap.tsx`**:
   - Menambahkan migrasi `0004_dialogues_and_challenges.ts` ke urutan startup database.
5. **`tools/content-builder/src/validateContent.ts`**:
   - Memperketat validasi graf dialog (6–10 turns, 2–3 choices, no orphans, reachable endings, valid repair definitions).
6. **`docs/implementation_plan/README.md`**:
   - Memperbarui tautan detail implementasi Plan 7.

---

## 15. Presentation state dan accessibility

### 15.1 Curated Dialogue Presentation & Accessibility

1. **Header & Context**:
   - Menyajikan judul skenario, nama lawan bicara, tingkat tutur (misal: *Ngoko Lugu*), serta indikator giliran (misal: *Giliran 3 dari 8*).
   - Tombol Tutup/Keluar dengan konfirmasi modal.
2. **Transcript Scroll Region**:
   - Bubble ucapan terpisah antara lawan bicara (kiri, netral) dan pengguna (kanan, brand accent).
   - Speaker diidentifikasi melalui label nama teks tebal dan avatar ikon, bukan warna semata.
   - Tombol terjemahan per baris dengan state jelas: *"Tampilkan terjemahan"* / *"Sembunyikan terjemahan"*.
   - Tombol volume toggle dengan label aksesibilitas: `accessibilityLabel="Putar audio kalimat"` dan `accessibilityState={{ busy: isPlaying }}`.
3. **Choice Region**:
   - Ditampilkan sebagai tumpukan kartu pilihan vertikal yang mudah ditekan dengan jempol satu tangan.
   - Ukuran target sentuh minimal 48×48 dp.
   - Pilihan yang dipilih mendapatkan indikator checklist dan label pembaca layar yang menyebutkan evaluasi kualitas.
4. **Repair Response Presentation**:
   - Saat opsi tidak nyambung dipilih, muncul bubble reaksi lawan bicara dengan animasi lembut dan nada polite.
   - Screen reader menerima pengumuman live region polite: *"Lawan bicara heran dan belum paham maksudmu. Silakan pilih kembali respons yang nyambung."*
5. **Ucapkan Sendiri (Self-Speak)**:
   - Disajikan sebagai kartu dialog reflektif setelah memilih opsi yang pas.
   - Menampilkan teks kalimat target dalam huruf besar yang mudah dibaca.
   - Tombol eksplisit: `Selesai Mengucapkan` dan `Lewati`. Tidak ada countdown paksaan dan tidak ada rekaman.

### 15.2 Challenges Presentation & Accessibility

1. **Header & Refinement**:
   - Header safe area dengan copy penenang: `Coba sedikit demi sedikit, sesuai kenyamananmu.`
   - Filter horizontal untuk unit dan level yang dapat digulir.
2. **Challenge Card Structure**:
   - Kartu tunggal fokus dengan elevasi halus dan border kontras tinggi.
   - Segmented control `Solo` / `Sosial` dengan `accessibilityRole="tablist"`. Berpindah varian memperbarui teks instruksi secara instan tanpa menggeser scroll pengguna.
   - Kotak peringatan keselamatan (*Safety Note*) dengan latar kuning lembut dan ikon peringatan RemixIcon (`ri-shield-check-line` / `ri-alert-line`).
   - Drawer expandable untuk *Frasa Penyelamat* dengan tombol dengarkan audio.
3. **Checkbox `Sudah kucoba`**:
   - Komponen checkbox native dengan target sentuh luas (min 48×48 dp).
   - Supporting text di bawah checkbox: *"Dicatat hanya di perangkat ini. Tidak mengubah nilai apa pun."*
   - Saat dicentang, TalkBack/VoiceOver mengumumkan: *"Tantangan ditandai sudah dicoba secara lokal."*

---

## 16. Error, recovery, dan interruption

1. **Process Kill / Interruption Saat Dialog Berjalan**:
   - Setiap kali node berubah atau pilihan dikirimkan, snapshot ringkas disimpan ke tabel `active_dialogue_runs`.
   - Jika pengguna menutup aplikasi paksa atau menerima panggilan telepon lalu membuka kembali tab Latihan, sistem mendeteksi sesi terputus.
   - Ditampilkan prompt: *"Kamu memiliki percakapan yang belum selesai."* dengan dua opsi aksi:
     - **Lanjutkan**: Memulihkan graf pada node terakhir dan riwayat bubble yang sudah lewat;
     - **Mulai Baru**: Menghapus `active_dialogue_runs` tanpa mencatat penalti atau skor buruk.
2. **Aset Audio Rusak / Corrupt**:
   - Jika audio decoder melaporkan error atau file berukuran 0 byte, `AudioPort` mengembalikan error terkontrol `{ ok: false, reason: 'AUDIO_UNAVAILABLE' }`.
   - UI menangkap error ini dan mengubah state ikon volume menjadi disabled dengan label *"Audio belum tersedia"*, tanpa menghentikan alur interaksi teks.
3. **Paket Diperbarui di Tengah Sesi (Package Update During Active Run)**:
   - Graf dialog aktif terikat pada `graphFingerprint` dan `packageVersion` yang disimpan di `active_dialogue_runs`.
   - Replay engine membaca graf dari snapshot historis imutabel `dialogue_graph_snapshots`, sehingga perubahan isi paket baru tidak merusak konsistensi sesi yang sedang berjalan.

---

## 17. Testing matrix

| Level Pengujian | Target Uji | Skenario yang Diverifikasi | File Test |
|---|---|---|---|
| **Domain Unit** | `dialogueGraphEngine` | Traversal lurus, transisi ke ending, validasi target node | `tests/unit/dialogues/dialogueGraphEngine.test.ts` |
| **Domain Unit** | `dialogueGraphValidator` | Penolakan graf dengan orphan node, dead end, turn < 6 atau > 10 | `tests/unit/dialogues/dialogueGraphValidator.test.ts` |
| **Domain Unit** | `dialogueScoringRules` | Perhitungan deterministik skor: pas=1.0, repair repetition=0.5 | `tests/unit/dialogues/dialogueScoringRules.test.ts` |
| **Domain Unit** | `challengeInvariants` | Verifikasi bahwa aksi challenge menghasilkan 0 event dan 0 mutasi progres | `tests/unit/challenges/challengeInvariants.test.ts` |
| **Application Unit** | `submitDialogueChoice` | Validasi tipe choice, pencegahan double submit, emit event | `tests/unit/dialogues/dialogueUseCases.test.ts` |
| **Application Unit** | `toggleChallengeCheck` | Mutasi idempotens centang lokal di database | `tests/unit/challenges/challengeUseCases.test.ts` |
| **Property Test** | Traversal Fuzzing | 100 random choice paths pada graf valid selalu mencapai ending | `tests/property/dialogues/graphTraversal.test.ts` |
| **Integration** | `SQLiteDialogueRepository` | Simpan snapshot, persistensi active run, resume run setelah restart | `tests/integration/dialogues/dialogueSqlitePersistence.test.ts` |
| **Integration** | `SQLiteChallengeRepository` | Query challenge per unit, persistensi centang lokal | `tests/integration/challenges/challengeSqlitePersistence.test.ts` |
| **Accessibility** | VoiceOver / TalkBack | Urutan fokus bubble, pengumuman repair live region, label audio | `tests/component/dialogues/dialogueAccessibility.test.tsx` |
| **Offline E2E** | Mode Pesawat | Pengguna membuka dialog, menyelesaikan turn, mencoba tantangan tanpa koneksi internet | `tests/e2e/curatedDialogueAndChallengeOffline.test.ts` |

---

## 18. Build sequence

Pekerjaan implementasi Plan 7 dibagi ke dalam 10 langkah terurut:

1. **Langkah 1: Database Migration**: Buat berkas migrasi `0004_dialogues_and_challenges.ts` untuk tabel `active_dialogue_runs` dan `challenge_checks`.
2. **Langkah 2: Domain Contracts & Graph Validator**: Tulis modul tipe `dialogueTypes.ts`, `challengeTypes.ts`, dan implementasikan `dialogueGraphValidator.ts`.
3. **Langkah 3: Dialogue Graph Engine & Scoring Rules**: Bangun state machine penelusuran graf dan kalkulasi skor deterministik di domain layer.
4. **Langkah 4: Repositories (Data Layer)**: Implementasikan `SQLiteDialogueRepository` dan `SQLiteChallengeRepository` dengan transaksi atomic.
5. **Langkah 5: Use Cases (Application Layer)**: Implementasikan seluruh use case untuk percakapan (start, submit, complete, resume, abandon) dan tantangan (get, toggle check).
6. **Langkah 6: Wiring Dependency Injection**: Daftarkan service dan use cases ke `DependencyContainer.ts` dan hubungkan migrasi pada `AppBootstrap.tsx`.
7. **Langkah 7: Presentation Components Dialog**: Bangun komponen UI dialog (`DialogueLineBubble`, `ChoiceActionGroup`, `SelfSpeakStep`, `DialogueSummarySheet`).
8. **Langkah 8: Screen Integration Dialog**: Bangun `DialogueRunScreen` pada rute `src/app/dialogue/[dialogueId].tsx` dan hubungkan entry point di tab Latihan.
9. **Langkah 9: Presentation Components & Screen Tantangan**: Bangun `ChallengeCard`, `VariantSelector`, `RescuePhraseDrawer`, dan integrasikan ke `src/app/(tabs)/tantangan.tsx`.
10. **Langkah 10: Pengujian & Verifikasi**: Jalankan seluruh unit test, integration test, verification no-progress invariant, dan typecheck.

---

## 19. Invariants yang harus dijaga

1. **No Microphone Rule**: Tidak ada import modul recording audio native dan tidak ada request izin mikrofon di runtime.
2. **No Challenge Progress Rule**: Centang tantangan tidak boleh menghasilkan baris pada tabel `learning_events` atau mengubah nilai `mastery`.
3. **No Orphan Node**: Seluruh node dalam graf dialog harus dapat dicapai dari node awal.
4. **No Dead End**: Seluruh jalur percakapan harus berujung pada node ending yang memiliki teks feedback.
5. **Bounded Repair**: Opsi tidak nyambung hanya mengulang node aktif yang sama tanpa membuat cabang atau node baru di database.
6. **Register Purity**: Titik pilihan bertipe register tidak boleh memuat opsi dengan kualitas `tidak-nyambung`.
7. **Comprehension Validity**: Titik pilihan bertipe pemahaman wajib memiliki minimal 1 opsi nyambung dan 1 opsi tidak-nyambung.
8. **Solo Variant Guarantee**: Setiap kartu tantangan wajib menyediakan opsi varian Solo yang mandiri.
9. **Minor Safety Priority**: Catatan keselamatan wajib ditampilkan sebelum interaksi centang pada kartu tantangan.
10. **Offline Completeness**: Dialog dan tantangan dapat diselesaikan dari awal hingga akhir dalam mode pesawat.
11. **Audio Independence**: Ketiadaan berkas audio tidak boleh menghalangi penyelesaian dialog atau tantangan.
12. **Idempotent Choice Submission**: Tombol opsi terkunci seketika setelah ditekan untuk mencegah duplikasi event.
13. **Deterministik Scoring**: Nilai akhir dialog harus dapat dihitung ulang secara identik dari log urutan `dialogue_choice`.
14. **Exposure Isolation**: Paparan kata dalam dialog kurasi dicatat dengan `viewedFrom: 'curated_dialogue_target'` dan tidak menaikkan streak.
15. **Local-Only Challenge State**: Status centang `Sudah kucoba` tidak dimasukkan ke dalam payload sinkronisasi.
16. **Session Interruption Safety**: Sesi dialog yang ditinggalkan dapat dipulihkan atau dibatalkan tanpa merusak konsistensi data.

---

## 20. Handoff ke Plan 8

Setelah Plan 7 selesai diimplementasikan:
- Seluruh vertikal pembelajaran offline P0 (Kosakata, Tebak Kata, Lengkapi Kalimat, Dialog Kurasi, dan Tantangan) telah lengkap.
- **Plan 8 (Settings, QA & P0 Release Gate)** akan:
  - Mengimplementasikan alur konfirmasi dua langkah untuk Reset Progres per paket dan Hapus Semua Data Lokal (FR-55..56);
  - Membangun halaman About lengkap dengan versi aplikasi, paket terpasang, kredit dialek, lisensi, kebijakan privasi, dan batasan usia anak;
  - Melakukan audit aksesibilitas komprehensif (Dynamic Type 200%, kontras warna, pembaca layar TalkBack/VoiceOver);
  - Menjalankan suite pengujian end-to-end full airplane mode journey dari instalasi paket awal hingga penyelesaian seluruh jenis sesi;
  - Mengumpulkan seluruh artefak bukti verifikasi untuk membuka gerbang rilis P0 (*Release Gate*).
