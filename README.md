# Clata

Clata adalah aplikasi mobile untuk belajar bahasa daerah, dimulai dari bahasa Jawa Mataraman. Aplikasi dirancang **offline-first**: materi dan aktivitas belajar utama dapat berjalan tanpa koneksi internet.

> **Status:** proyek masih dalam pengembangan. Dokumentasi produk memuat rencana untuk beberapa fitur yang belum tersedia; lihat [status implementasi](docs/requirements-traceability.md) sebelum menganggap fitur tertentu sudah siap.

## Fitur

- Belajar kosakata dengan konteks ragam tutur: **sopan**, **akrab**, dan **netral**.
- Latihan, dialog interaktif, dan tantangan belajar.
- Paket materi bahasa yang divalidasi dan dapat digunakan secara lokal.
- Fondasi penyimpanan lokal dengan SQLite.
- Alat untuk memvalidasi dan membangun paket konten `.clata`.

Ketersediaan dan kelengkapan fitur dapat berubah selama pengembangan. Login, sinkronisasi akun, dan katalog unduhan online tercatat sebagai rencana fase berikutnya, bukan prasyarat untuk alur offline inti.

## Teknologi

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- React Native 0.88 dan React 19
- TypeScript
- Expo Router
- SQLite melalui `expo-sqlite`
- Vitest untuk pengujian

## Persyaratan pengembangan

- Git
- Node.js dan npm
- Android: Android Studio, Android SDK, serta emulator atau perangkat Android
- iOS: macOS, Xcode, serta simulator atau perangkat iOS

Gunakan versi Node.js LTS yang kompatibel dengan Expo SDK 58 dan dependency proyek.

## Menyiapkan proyek

```bash
git clone https://github.com/rakelamben/clata.git
cd clata
npm ci
```

`npm ci` memasang dependency sesuai `package-lock.json`. Jalankan perintah berikut dari direktori proyek.

## Menjalankan aplikasi

### Development server

```bash
npm run start
```

Ikuti instruksi Expo CLI di terminal untuk membuka aplikasi pada target yang tersedia.

### Android

Pastikan Android SDK tersedia dan emulator sudah berjalan atau perangkat Android terhubung:

```bash
npm run android
```

Perintah ini menjalankan `expo run:android`. Karena aplikasi menggunakan modul native, pengujian penuh memerlukan development build; jangan mengasumsikan semua fitur tersedia di Expo Go.

### iOS

Di macOS dengan Xcode dan iOS Simulator terpasang:

```bash
npm run ios
```

Perintah ini menjalankan `expo run:ios`.

### Web

```bash
npm run web
```

Versi web tersedia melalui Expo, tetapi dukungan setiap fitur native dapat berbeda dari Android dan iOS.

Folder native hasil generate, seperti `android/` dan `ios/`, serta output build lokal tidak perlu ditambahkan ke Git.

## Perintah proyek

| Perintah | Kegunaan |
|---|---|
| `npm run start` | Menjalankan Expo development server |
| `npm run android` | Membuat dan menjalankan development build Android |
| `npm run ios` | Membuat dan menjalankan development build iOS (macOS) |
| `npm run web` | Menjalankan aplikasi untuk web |
| `npm test` | Menjalankan seluruh test Vitest satu kali |
| `npm run test:watch` | Menjalankan test Vitest dalam mode watch |
| `npm run lint` | Menjalankan lint Expo |
| `npm run typecheck` | Memeriksa tipe TypeScript tanpa membuat output |
| `npm run doctor` | Menjalankan Expo Doctor untuk memeriksa konfigurasi dan dependency |
| `npm run content:validate` | Memvalidasi paket konten sumber |
| `npm run content:build:dev` | Membangun paket bertanda tangan development untuk pengujian lokal |
| `npm run content:build` | Membangun paket menggunakan kunci privat dari environment |
| `npm run package:simulate` | Menjalankan simulasi instalasi paket secara lokal |

Pemeriksaan dasar sebelum mengirim perubahan:

```bash
npm test
npm run lint
npm run typecheck
npm run content:validate
```

## Konten dan paket bahasa

Materi sumber dan contoh paket disimpan di `content/packages/`. Tooling pembuat paket berada di `tools/content-builder/`. Hasil `.clata` dibuat ke `artifacts/`, yang merupakan output lokal dan tidak dilacak Git.

Paket menggunakan Schema Version 2. Beberapa aturan utamanya:

- Setiap paket merepresentasikan satu kombinasi bahasa dan dialek.
- Ragam tutur menggunakan `sopan`, `akrab`, atau `netral`; tingkat kesulitan belajar tidak disimpan sebagai `level`.
- Arsip memuat manifest, data unit dan materi, serta metadata audio yang relevan.
- Paket memverifikasi integritas dengan SHA-256 dan tanda tangan Ed25519.

Untuk memvalidasi direktori sumber lain:

```bash
npm run content:validate -- path/ke/direktori-sumber
```

Untuk membangun paket dari direktori sumber tertentu:

```bash
npm run content:build:dev -- path/ke/direktori-sumber artifacts/packages/contoh.clata
```

Build development memakai kunci khusus pengujian dan **bukan** untuk menerbitkan paket publik. Build rilis memerlukan `CLATA_PACKAGE_PRIVATE_KEY` dan `CLATA_PACKAGE_KEY_ID`; jangan menyimpan atau meng-commit kunci privat ke repository. Detail format dan kebijakan konten ada di [spesifikasi paket](docs/content-package-spec.md), [aturan penulisan konten](docs/content-authoring.md), dan [definisi register](docs/register-definition.md).

## Struktur repository

```text
src/
  app/                 # Route Expo Router
  bootstrap/           # Startup dan composition root aplikasi
  features/            # Fitur aplikasi
  domain/              # Aturan dan model domain
  data/                # Repository, DTO, dan mapper
  infrastructure/      # Adapter SQLite, audio, filesystem, dan lainnya
  shared/              # Komponen dan utilitas bersama
content/packages/      # Sumber dan fixture materi bahasa
tools/content-builder/ # Validasi dan pembuatan paket konten
tests/                 # Unit, integration, contract, dan E2E tests
docs/                  # Arsitektur, spesifikasi, dan panduan proyek
```

Route berada di `src/app/`; kode non-route berada di luar direktori tersebut. Lihat [panduan struktur folder](docs/folder-structure.md) dan [arsitektur](docs/architecture.md) untuk batas dependensi dan tanggung jawab modul.

## Dokumentasi

- [Arsitektur aplikasi](docs/architecture.md)
- [Spesifikasi paket konten](docs/content-package-spec.md)
- [Panduan penulisan konten](docs/content-authoring.md)
- [Definisi register bahasa](docs/register-definition.md)
- [Strategi pengujian](docs/testing-strategy.md)
- [Status implementasi dan keterlacakan persyaratan](docs/requirements-traceability.md)
- [Struktur folder dan batas impor](docs/folder-structure.md)

## Kontribusi

Sebelum mengirim perubahan, jalankan test, lint, dan typecheck yang relevan. Untuk perubahan pada paket bahasa, jalankan juga validasi konten. Ikuti aturan arsitektur dan penamaan di [panduan struktur folder](docs/folder-structure.md), serta tambahkan atau perbarui test untuk perilaku yang berubah.

## Lisensi

Lihat [LICENSE](LICENSE) untuk ketentuan penggunaan kode. Lisensi kode tidak otomatis berlaku untuk rekaman audio atau materi paket bahasa; periksa metadata dan ketentuan lisensi masing-masing konten.
