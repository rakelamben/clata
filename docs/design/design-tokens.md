# Clata Design Tokens

Status: final untuk light theme · Version: 1.0 · Platform: Android/iOS · UI language: Bahasa Indonesia

Dokumen ini adalah sumber tunggal token visual dan interaction untuk seluruh screen React Native + Expo. Dark theme belum menjadi scope implementasi P0/P1; jangan membuat token dark ad hoc sebelum keputusan visual berikutnya.

## Color palette — light theme

Gunakan semantic token di screen dan component. Hex berikut adalah source of truth palette Clata.

| Token | Hex | Penggunaan |
|---|---|---|
| `color.background` | `#FAFAFA` | Latar utama |
| `color.surface` | `#FFFFFF` | Card, sheet, input |
| `color.text.primary` | `#111111` | Heading dan body utama |
| `color.text.secondary` | `#4A4A4A` | Supporting text dan metadata |
| `color.border` | `#D9D9D9` | Divider dan boundary |
| `color.action.primary` | `#AD3603` | CTA utama |
| `color.action.primaryPressed` | `#0A2E44` | Pressed/focused primary |
| `color.brand.navy` | `#0A2E44` | Heading kuat, identity, focus |
| `color.brand.magenta` | `#960238` | Attention/error dengan teks |
| `color.brand.teal` | `#166868` | Success, progress, secondary action |
| `color.status.warning` | `#8A5200` | Warning dengan ikon dan teks |
| `color.status.error` | `#960238` | Error dengan ikon dan teks |
| `color.status.success` | `#166868` | Success dengan label/status |
| `color.focus` | `#0A2E44` | Focus indicator |
| `color.scrim` | `rgba(17,17,17,0.72)` | Modal/bottom sheet |

Contrast wajib diverifikasi pada ukuran aktual. Teks normal minimal 4.5:1; large text dan non-text UI minimal 3:1. Jangan memakai opacity sebagai satu-satunya pembeda state.

## Typography

Typography mengikuti `visual-system.md`:

| Token | Font | Ukuran awal | Penggunaan |
|---|---|---:|---|
| `type.display` | Gloock | 32–40sp | Hero dan heading utama |
| `type.heading` | Gloock | 24–28sp | Heading section |
| `type.title` | Lexend | 20sp | Judul card/screen |
| `type.body` | Public Sans | 16sp | Isi utama |
| `type.bodySmall` | Public Sans | 14sp | Metadata |
| `type.label` | Lexend | 13–14sp | Button, tab, control |
| `type.number` | Lexend | 24–32sp | Progress/streak/mastery |

Font native dibundel lokal dan tidak bergantung pada network runtime. Semua container teks mendukung text scaling sampai 200%; tinggi tidak boleh fixed jika berisi teks.

## Spacing and shape

| Token | Value |
|---|---:|
| `space-1` | 4 dp |
| `space-2` | 8 dp |
| `space-3` | 12 dp |
| `space-4` | 16 dp |
| `space-5` | 24 dp |
| `space-6` | 32 dp |
| `space-7` | 40 dp |
| `content-gutter-phone` | 20 dp |
| `content-gutter-large` | 24 dp |
| `radius-control` | 10 dp |
| `radius-card` | 12 dp |
| `radius-sheet` | 16 dp |
| `border-width` | 1 dp |

Gunakan radius pill hanya untuk status/chip. Shadow lembut dan hemat; elevation bukan satu-satunya pembeda hierarchy. Safe area dan bottom navigation inset selalu dihormati.

## Icons and touch targets

Library icon resmi: **Remix Icon** dengan gaya konsisten. Gunakan `@remixicon/react` bila target mendukungnya atau paket Remix Icon native yang setara untuk React Native. Jangan memakai emoji, icon campuran, atau glyph buatan sendiri untuk navigasi dan aksi.

| Token | Value |
|---|---:|
| `icon-sm` | 20 dp |
| `icon-md` | 24 dp |
| `icon-lg` | 32 dp |
| `touch-ios` | 44×44 pt |
| `touch-android` | 48×48 dp |
| `bottom-nav-height` | 64 dp + safe area |

Visual icon boleh 20–24 dp, tetapi hit area harus mengikuti platform. Icon-only control wajib memiliki accessible label, hint bila perlu, dan state `selected`, `pressed`, `disabled`, atau `busy`.

## Motion tokens

| Token | Duration | Penggunaan |
|---|---:|---|
| `motion-instant` | 0 ms | Reduced motion dan state penting |
| `motion-fast` | 120 ms | Press feedback, icon state |
| `motion-standard` | 200 ms | Expand/collapse, filter, feedback |
| `motion-emphasis` | 280 ms | Bottom sheet dan screen transition |
| `motion-slow` | 360 ms | Install/progress transition saja |

Press feedback harus terlihat dalam 80–150 ms tanpa menggeser layout. Reduced motion menghapus transform/scale dan menggunakan perubahan state instan atau fade ringan. Tidak ada autoplay audio atau animasi yang menghambat tugas.
