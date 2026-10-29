# P0 Implementation Plan 5 — Vocabulary & Audio

## 1. Tujuan dan Scope

Membangun vertical slice belajar pertama Clata untuk FR-10–12:

- Feed kosakata offline sesuai urutan kurikulum.
- Search offline dengan normalisasi ejaan.
- Filter tema dan register.
- Detail kata: lemma, arti Indonesia, kelas kata, register, tema, status, dan audio.
- Playback audio offline melalui port yang dapat diuji.
- Pencatatan `word_viewed` setelah kata terlihat minimal satu detik di foreground.
- Loading, empty, error, retry, offline, dan audio-unavailable state.
- Accessibility untuk feed dan kontrol audio.

Batas P0: tidak ada network, account, sync, AI, autoplay, recording, atau permission microphone. Opus mono adalah target utama; AAC/M4A hanya fallback setelah uji perangkat. Fixture audio POC 4-byte bukan bukti playback produksi.

## 2. Kondisi Saat Ini

- `src/app/(tabs)/kata.tsx` masih placeholder.
- `PackageRepository` baru menyediakan kata unit pertama.
- SQLite sudah memiliki `units`, `words`, dan `learning_events`.
- Progress repository sudah memvalidasi event `word_viewed` dan package scope.
- Bundled package Jawa–Mataraman sudah dipasang saat startup.
- `expo-audio` belum menjadi dependency.
- Audio `.opus` di content saat ini masih fixture POC yang tidak playable.

## 3. Arsitektur dan Data Flow

```text
Kata route → VocabularyScreen → application use cases
  → VocabularyRepository → SQLite words/units dengan package scope

AudioToggle → AudioPort → ExpoAudioAdapter → expo-audio singleton player
```

Invariant:

1. Route hanya merangkai UI dan mengambil capability dari runtime.
2. Domain tidak mengimpor React, Expo, SQLite, Zustand, atau API platform.
3. UI tidak mengakses SQLite, filesystem, atau native audio langsung.
4. Semua query vocabulary menerima `packageId`.
5. Search/dictionary tidak membuat learning event.
6. Hanya feed foreground yang dapat membuat `word_viewed`.
7. Hanya satu audio player aktif dalam aplikasi.
8. Audio path hanya berasal dari package tervalidasi.

## 4. File yang Dibuat/Diubah

### Domain

```text
src/features/vocabulary/domain/vocabularyTypes.ts
src/features/vocabulary/domain/searchNormalization.ts
src/features/vocabulary/domain/viewedRules.ts
src/features/vocabulary/domain/vocabularyErrors.ts
```

### Application dan data

```text
src/features/vocabulary/application/getVocabularyPage.ts
src/features/vocabulary/application/searchVocabulary.ts
src/features/vocabulary/application/getVocabularyFilters.ts
src/features/vocabulary/application/recordWordViewed.ts
src/features/vocabulary/application/playVocabularyAudio.ts
src/features/vocabulary/data/vocabularyRepository.ts
src/features/vocabulary/data/sqliteVocabularyRepository.ts
```

`PackageRepository.listFirstUnitWords()` boleh dipertahankan sebagai compatibility wrapper, tetapi UI baru harus menggunakan vocabulary repository.

### Presentation

```text
src/features/vocabulary/presentation/VocabularyScreen.tsx
src/features/vocabulary/presentation/WordFeedItem.tsx
src/features/vocabulary/presentation/AudioToggle.tsx
src/features/vocabulary/presentation/VocabularySearch.tsx
src/features/vocabulary/presentation/VocabularyFilterSheet.tsx
src/features/vocabulary/presentation/VocabularyStates.tsx
src/app/(tabs)/kata.tsx
```

### Audio dan wiring

```text
src/infrastructure/audio/AudioPort.ts
src/infrastructure/audio/ExpoAudioAdapter.ts
src/infrastructure/audio/audioTypes.ts
src/infrastructure/audio/audioErrors.ts
src/bootstrap/DependencyContainer.ts
src/bootstrap/AppBootstrap.tsx
```

## 5. Domain Contract

```ts
export type VocabularyWord = {
  packageId: string;
  id: string;
  unitId: string;
  curriculumOrder: number;
  lemma: string;
  meaning: string;
  partOfSpeech?: string;
  register: string;
  registerLabel?: string;
  theme?: string;
  level?: string;
  audio: AudioReference | null;
  status: 'verified' | 'poc' | 'draft';
};

export type AudioReference = {
  path: string;
  format: 'opus' | 'm4a' | 'aac';
  durationMs: number;
  channels: number;
  sampleRateHz: number;
  status: 'verified' | 'poc' | 'unavailable';
};
```

Metadata audio berasal dari payload package tervalidasi; aplikasi tidak boleh menebak metadata saat playback.

```ts
export type VocabularyPageRequest = {
  packageId: string;
  cursor?: string;
  limit: number;
  query?: string;
  theme?: string;
  register?: string;
  source: 'vocabulary_feed' | 'dictionary';
};

export type VocabularyPage = {
  items: VocabularyWord[];
  nextCursor: string | null;
  totalMatching?: number;
};

export interface VocabularyRepository {
  getFeedPage(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>>;
  search(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>>;
  getFilters(packageId: string): Promise<RepositoryResult<{ themes: string[]; registers: string[] }>>;
  getWord(packageId: string, itemId: string): Promise<RepositoryResult<VocabularyWord | null>>;
}
```

`limit` dibatasi maksimum 50. Urutan wajib `unit_order ASC`, `item_order ASC`, `item_id ASC` agar stabil. Repository join `words` dan `units`, lalu memetakan `payload_json` secara defensif. Payload malformed menjadi error/unavailable yang dapat dipulihkan, bukan crash layar.

## 6. Search Normalization

File: `src/features/vocabulary/domain/searchNormalization.ts`.

```ts
export function normalizeVocabularySearch(value: string): string;
```

Urutan:

1. lowercase;
2. Unicode `NFD`;
3. hapus combining marks;
4. `dh` menjadi `d`;
5. `th` menjadi `t`;
6. collapse whitespace;
7. trim.

Contoh: `é/è/ê → e`, `dhahar → dahar`, `thukul → tukul`.

Normalisasi diterapkan pada lemma, meaning, theme, dan register label. Teks tampilan asli tidak berubah. Query kosong berarti feed penuh. Search tidak menghasilkan `word_viewed`; filter exact value dapat digabung dengan search.

## 7. Viewed Event Contract

```ts
type WordViewedPayload = {
  itemId: string;
  viewedFrom: 'vocabulary_feed' | 'curated_dialogue_target';
  durationMs: number;
  foreground: true;
};
```

Event vocabulary memakai `eventType: 'word_viewed'`, `source: 'vocabulary'`, `weight: 1`, package scope, dan `viewedFrom: 'vocabulary_feed'`.

### Timing rules

- Gunakan `FlatList`/`SectionList` viewability callback.
- Visible berarti minimal 50% item terlihat.
- Timer mulai saat visible dan `AppState` active.
- Timer dibatalkan saat item tidak visible, app background, package berganti, atau unmount.
- Exposure minimal 1000 ms.
- Prefetch, skeleton, fast scroll, search preview, audio playback, dan background time tidak dihitung.
- Map `itemId → visibleSince` hanya berisi item visible.
- Satu item menghasilkan maksimal satu event per feed session.
- Persist melalui `SQLiteProgressRepository.appendEvent()`, bukan SQLite langsung.
- Kegagalan persist harus dilaporkan sebagai retry/save-failure, bukan dianggap sukses.

## 8. Audio Strategy

Gunakan API Expo SDK 58 yang sesuai dan pasang dengan:

```bash
npx expo install expo-audio
```

Native dependency memerlukan development build/EAS build; Expo Go saja tidak cukup untuk validasi final.

```ts
export type AudioPlaybackState =
  | 'idle' | 'loading' | 'playing' | 'stopped'
  | 'interrupted' | 'unavailable' | 'error';

export interface AudioPort {
  play(input: { itemId: string; uri: string; format: 'opus' | 'm4a' | 'aac' }): Promise<void>;
  stop(): Promise<void>;
  getState(): AudioPlaybackState;
  subscribe(listener: (state: AudioPlaybackState) => void): () => void;
  dispose(): void;
}
```

`ExpoAudioAdapter` harus memiliki satu player aplikasi, menghentikan item sebelumnya, replace source saat item berubah, replay dari posisi nol, expose state loading/playing/stopped/interrupted/error, dan dispose resource. Tidak ada autoplay, recording permission, background playback, atau lock-screen controls.

Resolver audio memetakan `packageId + packageVersion + audio.path` ke local file URI melalui path normalization. UI tidak boleh membangun path mentah.

Fixture 4-byte `Opus` hanya boleh dipakai untuk checksum/package tests. Adapter test memakai mock atau file audio valid. Device test wajib memakai Opus valid dan tidak boleh mengklaim fixture POC sebagai playback evidence.

## 9. UI dan Accessibility

`VocabularyScreen` menyediakan heading, feed, search, filter, incremental loading, skeleton, empty, error/retry, offline, dan audio-unavailable state.

`WordFeedItem` menampilkan lemma, arti, kelas kata, register, tema, dan satu audio toggle. Kontrol audio:

- idle/stopped: mulai;
- loading: disabled;
- playing: stop;
- unavailable: teks `Audio tidak tersedia`, bukan tombol rusak;
- error: retry.

Target kontrol minimal 44×44 pt iOS dan 48×48 dp Android. Label contoh: `Audio kata Sugeng, sedang diputar`. Screen reader membaca lemma, arti, register, dan action tanpa duplikasi. Status tidak boleh dibedakan dengan warna saja.

Uji layar kecil, font scale 200%, TalkBack, VoiceOver, silent mode, interruption, dan audio unavailable.

## 10. Error dan Offline Handling

- Tidak ada package aktif → setup/empty state.
- Query database gagal → recoverable error + retry.
- Payload kata malformed → skip hanya jika aman; selain itu content error.
- Audio reference/file hilang atau metadata invalid → unavailable.
- Player load gagal → retryable audio error.
- App background/interruption → stopped/interrupted.
- Viewed event gagal → status penyimpanan jujur dan retry.

Feed harus berjalan tanpa network setelah package terpasang.

## 11. Testing Strategy

### Unit

- Normalisasi diakritik, `dh`, `th`, whitespace.
- Display text tidak berubah.
- Empty query dan kombinasi filter/search.
- Duration 999/1000/1001 ms.
- Foreground/background, fast scroll, audio tidak dihitung.
- Duplicate exposure satu session hanya satu event.
- Replay tidak menggandakan initial strength.

### Application/repository

- Package scope wajib.
- Urutan kurikulum dan cursor stabil.
- Payload malformed defensif.
- Search tidak memanggil append event.
- Exposure menghasilkan payload event tepat.
- Kegagalan persist dilaporkan.

### Audio adapter

Mock `expo-audio` untuk play pertama, stop/replace, replay dari nol, unavailable, load error, interruption, dan dispose.

### Integration/device/E2E

- Query words dari SQLite setelah package install.
- Resolve audio URI lokal.
- Append/reject viewed event dan rebuild progress.
- Restart mempertahankan event.
- Airplane mode vocabulary browsing.
- Opus valid Android/iOS development build.
- Satu audio aktif, interruption, silent mode, missing audio, TalkBack/VoiceOver.

## 12. Risks and Mitigations

| Risiko | Mitigasi |
|---|---|
| Fixture POC tidak playable | Pisahkan fixture package dan audio test valid |
| Decoder Opus berbeda | Uji Android/iOS nyata; fallback hanya berdasarkan evidence |
| Banyak player boros memory | Satu application-level player |
| Background time terhitung | AppState-aware timer |
| Search false match | Unit test normalisasi dan display text asli |
| Payload berubah | Defensive mapper dan package validation |
| Audio path traversal | Resolver path tervalidasi dan package-scoped |
| Event hilang setelah unmount | Command terpusat dan persistence awaited |
| Duplicate pagination | Cursor stabil dan in-flight guard |
| Native module tidak masuk build | `expo install`, development build, doctor, device test |

## 13. Build Sequence

1. Audit package aktif, rows `words/units`, `appendEvent`, dan audio paths.
2. Tambahkan domain vocabulary dan search normalization.
3. Implementasikan defensive mapper dan SQLite repository.
4. Implementasikan feed, search, filter, cursor, dan package scope.
5. Implementasikan viewability controller dan `recordWordViewed`.
6. Tambahkan `expo-audio` dan `AudioPort` singleton.
7. Wire repository dan adapter ke dependency container.
8. Ganti placeholder `kata.tsx` dengan feature screen.
9. Tambahkan semua loading/empty/error/offline/unavailable/accessibility states.
10. Tambahkan fixture audio valid untuk adapter/device test.
11. Jalankan lint, typecheck, test, dan doctor.
12. Build development client dan uji Android/iOS.
13. Jalankan offline E2E dan accessibility checks.
14. Perbarui traceability dan handoff contract untuk Plan 6–7.

## 14. Definition of Done

- [ ] FR-10, FR-11, FR-12 memiliki module, test, dan traceability evidence.
- [ ] Vocabulary package aktif tampil sesuai urutan kurikulum.
- [ ] Search offline menerapkan normalisasi yang ditentukan.
- [ ] Filter tema/register dapat digabung dengan search.
- [ ] Search/dictionary tidak membuat viewed event.
- [ ] Visible minimal satu detik di foreground menghasilkan `word_viewed` valid.
- [ ] Fast scroll, background, prefetch, dan audio tidak menghasilkan viewed event.
- [ ] Viewed event bertahan setelah restart dan masuk replay progress.
- [ ] Audio melalui `AudioPort` dapat diputar offline pada device yang diuji.
- [ ] Hanya satu audio aktif pada satu waktu.
- [ ] Interruption dan silent mode ditangani.
- [ ] Missing/invalid audio menampilkan state jelas tanpa tombol rusak.
- [ ] Metadata audio memuat format, durasi, channel, dan sample rate.
- [ ] Fixture POC tidak menjadi playback evidence.
- [ ] Accessibility labels, touch targets, dynamic text, dan screen reader lulus.
- [ ] Unit, application, repository, integration, component, device, dan offline E2E lulus.
- [ ] `npx expo lint`, `npx tsc --noEmit`, `npm test`, dan `npx expo-doctor` lulus.
