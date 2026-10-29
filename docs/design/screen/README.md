# Screen Specifications

Dokumen screen adalah kontrak UX/UI implementasi-neutral untuk aplikasi React Native + Expo. Setiap dokumen menjelaskan tujuan, entry/exit, layout dari safe area ke bottom navigation, komponen, UX copy, interaction, state normal/loading/empty/error/offline/recovery, accessibility tree, WCAG 2.2 mapping, dan acceptance criteria.

Token visual global berada di [Design Tokens](../design-tokens.md), sedangkan aturan focus dan native semantics berada di [Accessibility Focus Contract](../accessibility-focus-contract.md).

## Aturan global

- UI menggunakan Bahasa Indonesia yang singkat, suportif, dan tidak menyalahkan pengguna.
- Semua screen menghormati safe area, bottom navigation, landscape, Dynamic Type/text scaling besar, dan reduced motion.
- Native control diprioritaskan. Target sentuh minimal 44×44 pt di iOS dan 48×48 dp di Android; icon-only control wajib memiliki accessibility label dan state tekstual.
- Fokus/screen-reader order mengikuti urutan visual; modal dan bottom sheet menahan focus, memiliki aksi batal/close, lalu mengembalikan focus ke trigger.
- Error tidak hanya memakai merah; selalu ada teks yang menjelaskan masalah dan langkah pemulihan.
- Status dinamis diumumkan polite hanya ketika bermakna; skeleton tidak dibacakan satu per satu.
- Audio selalu memakai satu icon volume toggle: play, stop, lalu play dari awal. Tidak ada replay button terpisah.
- Destructive action memakai warning bottom modal dan konfirmasi dua langkah.
- Search/filter hanya berada di Kamus/Data Kata, bukan ScrollableWordFeed.

Screen names are implementation-neutral; route names follow the final Expo Router structure.

- [Onboarding](./onboarding.md)
- [Kata Feed / Entry Screen](./home.md)
- [Vocabulary](./vocabulary.md)
- [Practice](./practice.md)
- [Guess the Word session](./guess-the-word.md)
- [Fill the Gap session](./fill-the-gap.md)
- [Dialogue](./dialogue.md)
- [Challenges](./challenges.md)
- [Profil / Kemajuan Belajar](./progress.md)
- [Settings and packages](./settings.md)
- [Audio dan aksesibilitas](./audio-accessibility.md)
- [Pengingat](./reminders.md)
- [Data dan progres](./data-progress.md)
- [Tentang Clata](./about.md)
- [Account and authentication](./account.md)
- [Package management](./packages.md)
- [AI dialogue](./ai-dialogue.md)
- [AI safety states](./ai-safety-states.md)
