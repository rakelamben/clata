# Interaction Patterns

## Navigation

- Root navigation: onboarding → main app.
- Main app memakai bottom navigation: **Kata**, **Latihan**, **Tantangan**, **Profil**.
- **Pengaturan** berada di dalam tab **Profil**.
- **Dialog** berada di dalam menu **Latihan**, bukan tab utama.
- Back selalu mengembalikan konteks sebelumnya dan tidak menghapus progres.
- Session belajar yang terputus tidak dipaksa dilanjutkan; tampilkan pilihan mulai ulang.

## Action hierarchy

- Primary: satu tombol solid dengan label kerja, misalnya `Mulai belajar`.
- Secondary: outline/text button.
- Destructive: jangan gunakan warna error solid. Gunakan outline/neutral surface, label sederhana dan eksplisit, ikon pendukung, serta konfirmasi dua langkah melalui warning bottom modal.
- Icon-only control hanya boleh dipakai bila label aksesibel tersedia.
- Semua icon UI menggunakan Remix Icon; visual icon tidak menentukan hit area.
- Motion memakai token `motion-fast` 120 ms, `motion-standard` 200 ms, `motion-emphasis` 280 ms, dan `motion-slow` 360 ms dari `design-tokens.md`.
- UX copy selalu disederhanakan: gunakan kata kerja langsung, kalimat pendek, dan hindari istilah teknis.
- Jangan mengulang label, status, atau penjelasan yang sama pada setiap card bila konteks screen sudah jelas.

## Audio

Audio hanya memiliki satu control toggle **Putar/Berhenti**. Saat audio berubah dari play → stop → play, suara dimulai dari awal. Audio baru menghentikan audio sebelumnya. State yang diperlukan: idle, loading, playing, stopped, unavailable, dan interrupted. Dialog AI menampilkan `Tanpa audio` tanpa tombol audio rusak.

## Feedback

- Benar: feedback singkat, misalnya `Benar`.
- Salah: tampilkan jawaban benar dan arahan singkat, tanpa nada menghukum.
- Status non-blocking memakai banner/toast yang juga diumumkan screen reader.
- Feedback dan error selalu memakai UX copy sederhana: apa yang terjadi dan satu tindakan berikutnya.

## Confirmation

Reset, hapus data, hapus paket, dan pilihan `Gunakan data akun saja` memakai warning bottom modal dengan label dampak. Tombol destructive tidak boleh menjadi default focus.

## Offline

Status offline hanya muncul sebagai label sementara ketika relevan, lalu menghilang agar tidak mengganggu. Status offline juga dapat dilihat dari tab **Profil**. Jangan menampilkan error network untuk screen yang memang sepenuhnya offline. Pada layar Paket Bahasa, bedakan `Tidak ada internet`, `Server belum tersedia`, dan `Belum ada paket`.
