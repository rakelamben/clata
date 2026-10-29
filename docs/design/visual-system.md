# Visual System

Status: final light theme · Version: 1.0 · Platform: Android/iOS · UI language: Bahasa Indonesia

## Arah visual

Clata menggunakan arah visual **editorial Nusantara yang berani, hangat, dan modern**. Dasar visual dibuat netral hitam/putih agar konten pembelajaran menjadi fokus. Warna brand dipakai sebagai aksen terukur pada tindakan utama, status, navigasi, dan komponen kecil—bukan sebagai latar penuh di semua layar.

Karakter yang diinginkan:

- berkarakter dan mudah dikenali;
- terasa seperti aplikasi belajar, bukan aplikasi korporat;
- dewasa tetapi tetap ramah untuk pengguna muda;
- memiliki kontras kuat tanpa menjadi agresif;
- tidak memakai ornamen budaya secara stereotip atau dekoratif berlebihan.

## Font

### Display — Gloock

Gunakan **Gloock** untuk judul layar, hero onboarding, heading besar, dan momen brand. Gloock tidak digunakan untuk paragraf panjang, label kecil, tombol, atau data teknis.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gloock&family=Lexend:wght@100..900&display=swap" rel="stylesheet">
```

### Body and UI — Public Sans + Lexend

Gunakan **Public Sans** untuk paragraf, arti kata, instruksi, error, dan teks informatif. Gunakan **Lexend** untuk tombol, tab, chip, label, angka progres, dan elemen UI yang perlu dipindai cepat.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gloock&family=Lexend:wght@100..900&family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

Pada aplikasi React Native, tautan di atas adalah referensi font web/prototipe. Implementasi native harus memakai paket font lokal yang setara, bukan mengandalkan network saat runtime. Font family tetap diberi nama token `font.display`, `font.body`, dan `font.ui`.

## Color tokens

Warna dasar aplikasi adalah hitam, putih, dan transparansinya. Empat warna berikut adalah warna brand/aksen normatif:

| Token | Tujuan | Nilai |
|---|---|---|
| `color.brand.orange` | primary action, CTA utama | `#AD3603` |
| `color.brand.navy` | brand kuat, header, teks pada bidang terang | `#0A2E44` |
| `color.brand.magenta` | aksen sekunder, highlight khusus | `#960238` |
| `color.brand.teal` | success, progress positif, secondary action | `#166868` |
| `color.neutral.0` | putih murni | `#FFFFFF` |
| `color.neutral.50` | latar utama | `#FAFAFA` |
| `color.neutral.100` | surface/kartu | `#F2F2F2` |
| `color.neutral.200` | border/divider | `#D9D9D9` |
| `color.neutral.700` | teks sekunder | `#4A4A4A` |
| `color.neutral.950` | teks utama | `#111111` |

### Semantic mapping

| Semantic token | Mapping |
|---|---|
| `color.background` | `neutral.50` |
| `color.surface` | `neutral.0` |
| `color.text.primary` | `neutral.950` |
| `color.text.secondary` | `neutral.700` |
| `color.action.primary` | `brand.orange` |
| `color.action.primaryPressed` | `brand.navy` |
| `color.action.secondary` | `brand.teal` |
| `color.status.success` | `brand.teal` |
| `color.status.attention` | `brand.magenta` |
| `color.status.error` | `brand.magenta` dengan ikon dan teks error |
| `color.focus` | `brand.navy` |

### Transparansi

Gunakan transparansi hanya untuk layering, bukan untuk teks utama:

- `brand.navy.08` — tint ringan pada background;
- `brand.orange.12` — selected/pressed surface;
- `brand.magenta.12` — attention surface;
- `brand.teal.12` — success surface;
- `neutral.950.06` — divider/scrim ringan;
- `neutral.950.72` — modal scrim.

Opacity tidak boleh menjadi satu-satunya pembeda status. Semua status menyertakan teks, ikon, atau bentuk yang jelas.

## Contrast and accessibility

- Normal text MUST mencapai kontras minimal 4.5:1.
- Large text dan UI graphics MUST mencapai minimal 3:1.
- Gunakan teks putih di atas `brand.orange`, `brand.navy`, `brand.magenta`, atau `brand.teal` hanya setelah divalidasi pada ukuran aktual.
- Jangan gunakan `brand.orange` sebagai teks kecil di atas putih tanpa pemeriksaan kontras.
- Target sentuh minimum 44×44 pt iOS dan 48×48 dp Android.
- Body text minimum 16sp; caption minimum 14sp dan tidak boleh memuat instruksi penting.
- Dynamic type/font scale 200% tidak boleh memotong label atau CTA.

## Typography scale

| Token | Font | Ukuran awal | Penggunaan |
|---|---|---:|---|
| `type.display` | Gloock | 32–40sp | hero/heading utama |
| `type.heading` | Gloock | 24–28sp | heading section |
| `type.title` | Lexend | 20sp | judul card/screen pendek |
| `type.body` | Public Sans | 16sp | isi utama |
| `type.bodySmall` | Public Sans | 14sp | metadata/secondary text |
| `type.label` | Lexend | 13–14sp | button, tab, badge |
| `type.number` | Lexend | 24–32sp | mastery/streak/progress |

Line height body sekitar 1.45–1.6. Gloock tidak digunakan untuk kalimat panjang atau angka statistik kecil.

## Spacing, shape, and layout

- Spacing rhythm: `4, 8, 12, 16, 24, 32, 40` dp.
- Horizontal screen padding: 20 dp pada phone dan 24 dp pada layar besar.
- Radius: 10 dp untuk control, 12 dp untuk card, 16 dp untuk sheet; pill hanya untuk badge/status.
- Border: 1 dp dengan `neutral.200` atau semantic focus color.
- Shadow lembut dan hemat; jangan menjadikan shadow sebagai satu-satunya pembeda.
- Safe area selalu dihormati.
- Satu primary action per screen.
- Konten panjang memakai scroll container dan inset agar tidak tertutup bottom navigation.

## Brand usage

- `brand.orange`: tindakan utama yang ingin dilakukan pengguna sekarang.
- `brand.navy`: identitas, heading kuat, focus, dan pressed state.
- `brand.teal`: progress positif, success, dan aksi sekunder.
- `brand.magenta`: perhatian, highlight terbatas, dan error state dengan label tekstual.
- Jangan memakai keempat warna sebagai empat tombol setara pada satu layar.
- Jangan memakai gradien brand sebagai default.
- Jangan memakai emoji sebagai ikon navigasi atau aksi.

## Motion

- Tap feedback muncul dalam 80–150 ms.
- `motion-fast` 120 ms, `motion-standard` 200 ms, `motion-emphasis` 280 ms, dan `motion-slow` 360 ms.
- Motion digunakan untuk install, audio, feedback jawaban, dan perpindahan konteks.
- Tidak ada autoplay audio atau animasi yang menghambat tugas.
- Reduced motion mematikan transform kompleks dan mempertahankan perubahan state secara instan.

## Icon library

Semua icon UI memakai **Remix Icon**. Gunakan satu gaya visual yang konsisten, icon dekoratif hidden dari accessibility tree, dan icon-only control memiliki accessible label serta hit area platform penuh.
