# Clata Complete User Flows

Dokumen ini adalah indeks seluruh alur pengguna P0 dan P1. Detail tiap alur berada di `flows/`. Setiap flow wajib memiliki entry point, happy path, alternate path, error recovery, offline behavior, accessibility behavior, dan exit point.

## P0 flows

- [Onboarding and age gate](./flows/onboarding.md)
- [Kata feed and navigation](./flows/kata.md)
- [Vocabulary and audio](./flows/vocabulary.md)
- [Practice](./flows/practice.md)
- [Curated dialogue](./flows/dialogue.md)
- [Challenges](./flows/challenges.md)
- [Profile, progress, mastery, and streak](./flows/progress.md)
- [Settings, data, and recovery](./flows/settings-recovery.md)

## P1 flows

- [Authentication and account](./flows/account.md)
- [Synchronization](./flows/sync.md)
- [Language packages](./flows/packages.md)
- [AI dialogue](./flows/ai-dialogue.md)
- [Reminders and reports](./flows/reminders-reports.md)
- [Content publishing](./flows/content-publishing.md)

## Cross-cutting rules

- Semua flow tetap usable dengan font 200% dan screen reader.
- Network failure tidak boleh merusak P0 atau menghapus data lokal.
- Setiap destructive action memiliki dampak, konfirmasi kedua, dan recovery message.
- Setiap asynchronous operation memiliki loading, retry, cancel bila relevan, dan failure reason.
- Semua status penting disampaikan melalui teks/icon dan accessibility announcement, bukan warna saja.
