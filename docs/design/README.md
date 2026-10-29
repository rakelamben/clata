# Clata UX/UI Design System

Status: visual baseline finalized · Version: 1.0 · Platform: Android/iOS · Theme: light · System language: Bahasa Indonesia · Audience: pemula bahasa daerah

## Tujuan desain

Clata harus terasa seperti teman latihan yang hangat, tidak menghakimi, dan mudah dipakai dalam kondisi offline. Satu tujuan utama per layar: pengguna selalu tahu apa yang bisa dilakukan berikutnya.

## Prinsip

1. **Lisan dulu** — audio selalu dekat dengan kata/kalimat.
2. **Satu fokus** — layar tidak menampilkan lebih banyak pilihan daripada yang dibutuhkan.
3. **Aman untuk mencoba** — kesalahan memberi arahan, bukan hukuman.
4. **Offline terlihat** — status jaringan jelas tetapi tidak mengganggu.
5. **Budaya dengan hormat** — gunakan warna, motif, dan bahasa sebagai aksen; jangan memakai stereotip visual.
6. **Aksesibel sejak awal** — ukuran teks, screen reader, kontras, target sentuh, dan reduced motion adalah bagian dari layout.

## Dokumen desain

- [Visual system](./visual-system.md)
- [Design tokens](./design-tokens.md)
- [Interaction patterns](./interaction-patterns.md)
- [Components](./components.md)
- [Accessibility](./accessibility.md)
- [Accessibility focus contract](./accessibility-focus-contract.md)
- [User flows](./user-flows.md)
- [Screen specifications](./screen/README.md)

## Aturan implementasi

- Screen hanya mengatur komposisi dan state UI; aturan belajar berada di use case/domain.
- Semua screen harus mendefinisikan `loading`, `success`, `empty`, `error`, dan `offline` bila relevan.
- Komponen memakai design token, bukan nilai warna/spacing ad hoc.
- Teks UI bahasa Indonesia. Istilah bahasa daerah hanya berasal dari content package.
- System language tidak mengikuti locale perangkat pada MVP/P1; seluruh UI tetap Bahasa Indonesia.
- Prototype visual boleh memakai fixture, tetapi tidak boleh mengubah kontrak domain.

## Definition of ready untuk screen

Screen boleh diimplementasikan bila tujuan, entry/exit point, hierarchy, state, aksi utama, error recovery, accessibility tree, dan acceptance criteria telah ditulis.
