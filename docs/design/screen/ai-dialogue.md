# Screen: AI Dialogue

## Tujuan dan entry

AI Dialogue dibuka dari `Latihan → session setup → Dialog AI` bila package dan layanan memenuhi syarat. Fitur ini tersedia mulai usia 10 tahun; usia 10–17 memerlukan guardian consent, dan seluruh pengguna memerlukan akun serta koneksi online. Provider dan model tidak pernah ditampilkan di UI.

## Struktur layout

Sebelum memulai, tampilkan explanation card: tujuan latihan, kebutuhan online, batas kuota, penggunaan data secara ringkas, dan action `Mulai dialog`. Jika gate belum terpenuhi, tampilkan reason-first state dengan action yang relevan: `Masuk`, `Mulai persetujuan wali`, atau `Coba lagi saat online`.

Renderer setelah mulai sama dengan Dialogue kurasi: header context, transcript scroll region, label `Dialog AI`, baris AI, terjemahan toggle, icon volume hanya untuk audio bank yang tersedia, choice cards, dan `Laporkan respons`. Baris hasil AI yang tidak memiliki audio selalu menampilkan teks `Tanpa audio`; jangan menyediakan tombol replay palsu.

## Generation, fallback, dan report

Saat generating, tampilkan `Menyiapkan respons...` dan jangan memindahkan focus berulang. Jika provider primary gagal, fallback terjadi server-side tanpa menyebut provider. Jika validasi respons gagal, lakukan retry terbatas lalu gunakan curated fallback dengan copy `Kami menampilkan dialog kurasi agar latihan tetap berjalan.` Untuk timeout, respons tidak relevan, unsafe response, prompt terlalu panjang, dan report failure, gunakan [AI safety states](./ai-safety-states.md). Report action membuka form dengan kategori wajib, detail opsional, cancel, validasi, dan submit; report queued memberi konfirmasi tanpa membocorkan data sensitif.

## State

`locked by age`, `guardian consent pending`, `account required`, `offline`, `quota available`, `quota exhausted`, `generating`, `provider fallback`, `validation retry`, `curated fallback`, `AI result`, `audio unavailable`, `report form`, `report queued`, dan `service error`.

Quota exhausted harus menjelaskan kapan dapat mencoba lagi atau menawarkan dialog kurasi. Jangan memaksa pengguna membeli atau mengulang input yang sudah tersedia.

## Accessibility tree dan privacy copy

Heading `Dialog AI`; eligibility/status; quota text; online state; transcript dengan speaker; `Tanpa audio`; choices; report button dengan hint `Laporkan respons yang tidak sesuai atau tidak aman`; serta polite live region untuk satu respons baru. Fokus berpindah ke respons baru setelah generation selesai dan kembali ke trigger setelah report ditutup. Gunakan bahasa aman, tidak mempermalukan, dan jangan membacakan provider/model/API detail.

## Acceptance dan WCAG

Screen tetap usable dengan screen reader, switch access, Dynamic Type besar, reduced motion, dan target 44×44 pt iOS atau 48×48 dp Android. Loading, fallback, quota, dan error dibedakan secara tekstual; tidak ada color-only status atau auto-playing audio. Mencakup WCAG 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.1, 3.3.3, 4.1.2, dan 4.1.3.

Flow detail: [AI dialogue](../flows/ai-dialogue.md).
