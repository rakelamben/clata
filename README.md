# Clata

Clata adalah aplikasi mobile yang dibangun dengan Expo, React Native, dan TypeScript.

## Persiapan

Siapkan:

- Git
- Node.js dan npm
- Untuk Android: Android Studio, Android SDK, dan emulator atau perangkat Android
- Untuk iOS: macOS dan Xcode

## Clone dan install dependency

```bash
git clone https://github.com/rakelamben/clata.git
cd clata
npm ci
```

`npm ci` memasang dependency sesuai versi yang tercatat di `package-lock.json`.

## Menjalankan dan build aplikasi

### Android

Pastikan emulator sudah berjalan atau perangkat Android terhubung, lalu jalankan:

```bash
npm run android
```

Perintah ini membuat native project Android bila belum tersedia, membangun aplikasi, lalu memasangnya ke emulator atau perangkat yang terhubung.

### iOS

Di macOS dengan Xcode terpasang, jalankan:

```bash
npm run ios
```

### Web

Untuk menjalankan versi web:

```bash
npm run web
```

Untuk memulai Expo development server tanpa langsung memilih platform:

```bash
npm run start
```

Folder native yang dihasilkan Expo dan file build lokal tidak perlu di-commit.

## Pemeriksaan

```bash
npm test
npm run lint
npm run typecheck
npm run content:validate
```

## Spesifikasi Paket Bahasa

Paket bahasa daerah menggunakan Schema Version 2 (tanpa atribut `level`, register 3 nilai: `sopan`, `akrab`, `netral`, dan atribut opsional `catatan`). Lihat [docs/register-definition.md](docs/register-definition.md) dan [docs/content-package-spec.md](docs/content-package-spec.md).
