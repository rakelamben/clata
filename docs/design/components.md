# Component Patterns

## Design intent

Komponen Clata harus menjaga layar tetap tenang dan fokus pada kata/aksi utama. Hindari ikon dekoratif, simbol yang tidak bermakna, badge berlebihan, dan teks status yang hanya mengulang informasi yang sudah jelas dari konteks.

## Foundation components

`Screen`, `ScreenHeader`, `PrimaryButton`, `SecondaryButton`, `IconButton`, `Text`, `Surface`, `Divider`, `BottomSheet`, `Dialog`, `EmptyState`, `ErrorState`, `SkeletonLoading`, `SpinnerLoading`, `ProgressBar`.

Semua icon component menggunakan **Remix Icon**. Icon visual menggunakan token `icon-sm/md/lg`; hit area mengikuti `touch-ios` atau `touch-android` dari `design-tokens.md`.

`Badge` hanya digunakan jika status benar-benar membantu keputusan pengguna. Jangan gunakan badge untuk register.

## Warning bottom modal

Semua tindakan destruktif memakai bottom modal peringatan, bukan modal penuh yang agresif dan bukan solid error surface. Modal berisi judul singkat, satu kalimat dampak, tombol `Batal`, dan tombol konfirmasi dengan label tindakan yang spesifik. Konfirmasi kedua diperlukan untuk reset, hapus data, hapus package, dan penggunaan `Gunakan data akun saja`. Focus/accessibility focus dikembalikan ke tombol pemicu saat modal ditutup.

## Learning components

`AudioToggle`, `ScrollableWordFeed`, `WordFeedItem`, `RegisterInfoButton`, `RegisterTooltip`, `MeaningBlock`, `AnswerOption`, `FeedbackPanel`, `DialogueBubble`, `ChoiceCard`, `MasteryBar`, `ChallengeCard`.

Komponen berikut tidak digunakan lagi:

- `RegisterBadge` atau badge register dalam setiap card;
- ikon dekoratif tanpa fungsi;
- label status berulang bila konteks sudah jelas;
- control replay audio terpisah.

## Loading components

### Skeleton loading

Gunakan `SkeletonLoading` untuk mempertahankan struktur layout saat konten belum siap. Skeleton harus menyerupai bentuk konten aktual, tidak memakai teks palsu, dan tidak membuat layout bergeser ketika konten muncul.

Gunakan skeleton untuk daftar kata, package list, progress summary, dan card yang memuat data lokal atau katalog. Skeleton memiliki satu label aksesibel seperti `Memuat daftar kata`, bukan pengumuman untuk setiap item.

### Spinner loading

Gunakan `SpinnerLoading` untuk aksi singkat yang sedang berjalan, misalnya validasi tombol, instalasi, atau pergantian state. Sertakan teks sederhana seperti `Memasang paket` bila proses lebih dari sesaat.

Jangan menampilkan skeleton dan spinner pada area yang sama secara bersamaan kecuali spinner menunjukkan aksi aktif di atas konten yang sudah tersedia.

## ScrollableWordFeed — menu Kata

Menu **Kata** menggunakan **Infinite Vertical Scrollable Feed**, bukan `FlatList`. Feed ini hanya bertugas sebagai pengalaman scroll kata yang bersih; pencarian dan filter tidak berada di screen ini.

### Behavior

- Feed berjalan vertikal penuh dengan satu item kata sebagai fokus utama.
- Item berikutnya dimuat bertahap dari local repository.
- Semua item tetap berasal dari package; tidak ada item yang digenerate.
- Prefetch dilakukan sebelum pengguna mencapai akhir batch.
- Loading batch berikutnya memakai skeleton item di bagian bawah.
- Jika semua item selesai, feed kembali ke item pertama dan melanjutkan siklus secara mulus.
- Error pemuatan memakai satu aksi `Coba lagi`.
- Kata dianggap dilihat setelah tampil minimal satu detik di foreground, bukan karena diprefetch.
- Scroll position dipulihkan saat kembali dari tooltip atau Kamus.

### Feed controls

- Feed tidak memiliki tombol aksi destruktif atau kontrol yang mengubah state isi feed.
- Hanya floating action kecil atau status sementara yang boleh muncul di atas feed.
- Tombol ikon kecil di pojok kanan atas membuka screen **Kamus**.
- Feed tidak menampilkan search field atau filter chip.

## Kamus / Data Kata

Screen **Kamus** adalah tempat untuk mencari dan memfilter seluruh data kata. Screen ini dibuka dari tombol ikon kecil di pojok kanan atas `ScrollableWordFeed`.

Kamus menyediakan search, filter tema, filter tingkat tutur, dan hasil list biasa. Kembali dari Kamus mengembalikan pengguna ke posisi feed sebelumnya.

### Layout WordFeedItem

Urutan visual:

1. kata daerah sebagai fokus terbesar;
2. icon volume sebagai toggle audio;
3. arti Indonesia;
4. kelas kata bila relevan;
5. tombol ikon informasi untuk membuka tooltip register.

Jangan menampilkan register badge, label status, atau ikon dekoratif di setiap item.

### Implementation contract

Nama komponen konseptual: `ScrollableWordFeed`. Implementasi native boleh memakai `ScrollView` atau virtualized custom feed dengan windowing, tetapi tidak boleh memakai `FlatList` sebagai komponen menu Kata. Feed wajib hemat memori untuk package besar.

## RegisterInfoButton and tooltip

Register ditampilkan melalui satu icon button informasi yang bermakna dan dapat diklik. Label aksesibel singkat, misalnya `Tingkat tutur kata: halus`.

Tooltip/bottom sheet hanya menampilkan nama register dan satu penjelasan singkat dalam Bahasa Indonesia. Contoh lawan bicara hanya ditampilkan bila benar-benar diperlukan. Tooltip ditutup dengan `Tutup`, tap di luar, atau back; focus dikembalikan ke tombol info.

## AudioToggle

Audio hanya memiliki satu kontrol toggle berupa icon volume; tidak ada teks `Putar`, `Berhenti`, atau tombol replay terpisah:

- idle: icon volume normal;
- playing: icon volume dengan warna aktif brand;
- stopped: icon volume normal, mulai dari awal saat ditekan;
- loading: disabled + spinner kecil;
- unavailable: teks `Audio tidak tersedia`, tanpa tombol rusak;
- interrupted: kembali ke idle secara aman.

Audio baru menghentikan audio sebelumnya. Tombol memiliki target minimal 44×44 pt iOS atau 48×48 dp Android dan accessibility label singkat yang menyebut kata/kalimat, misalnya `Audio kata Sugeng`.

## General component rules

- Components menerima data/callbacks; tidak fetch repository.
- Components expose `label`, `hint`, `disabled`, `loading`, `selected`, dan `accessibilityState`.
- Interactive target minimum 44×44 pt iOS atau 48×48 dp Android.
- Pressed, disabled, loading, selected, error, dan focus state harus dirancang.
- Hindari nested pressables dan invisible touch zones.
- Decorative icons dikeluarkan dari accessibility tree.
- Meaningful icons memiliki accessible label; bila tidak memberi informasi, hapus.
- Jangan mengulang penjelasan yang sama di setiap card bila header screen sudah menjelaskannya.
- Feedback copy singkat: `Benar`, `Coba lagi`, `Audio tidak tersedia`, `Coba lagi nanti`.

## Component accessibility tree

Setiap komponen interaktif mendefinisikan role, accessible name, state, hint, dan announcement behavior. Loading/dynamic content diumumkan sekali per operasi bermakna, bukan per item yang dirender.
