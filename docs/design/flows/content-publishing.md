# Flow: Content Publishing

## Tujuan

Menyusun, memvalidasi, memverifikasi, membangun, menandatangani, dan menerbitkan package bahasa Clata. Semua konten rilis harus dapat digunakan offline, memiliki provenance, dan lolos validasi otomatis serta manusia.

## Publishing flow

```text
Spreadsheet/JSON sumber
→ normalisasi ID dan metadata
→ JSON Schema validation
→ semantic/content validation
→ review kontributor
→ verifikasi penutur
→ audio/license check
→ build .clata
→ checksum SHA-256
→ signature Ed25519
→ catalog validation
→ deploy katalog/package ke Vercel
```

Package resmi menggunakan ekstensi `.clata`; `.zip` diterima sebagai fallback berbagi file. POC dan P1 memakai Vercel Free Tier untuk file statis sesuai keputusan proyek.

## Shared metadata

Semua item memiliki metadata berikut bila relevan:

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | unik di dalam package, stabil sepanjang koreksi ejaan/audio |
| `package_id` | string | identitas kombinasi bahasa-dialek |
| `unit_id` | string | harus mengarah ke unit valid |
| `level` | `L1 \| L2 \| L3` | tingkat kesulitan |
| `register` | `akrab \| netral \| halus` | skala internal; pemetaan lokal ada di manifest |
| `status_verifikasi` | enum | `poc`, `draft`, `diajukan`, `ditinjau`, `terverifikasi`, `terbit` |
| `sumber` | string[] | sumber kandidat/provenance |
| `metode` | enum | `manual`, `kamus`, `korpus`, `draf_ai`, `poc` |
| `kontributor_id` | string | pengaju item |
| `verifier_id` | string[] | verifier berbeda dari kontributor |
| `versi_item` | semver/string | perubahan kecil tetap mempertahankan ID |
| `audio_id` | string/null | mengarah ke audio package |
| `catatan_editor` | string/null | internal, tidak selalu dikirim ke app |

## Model data kata

File: `kata.json`

```json
{
  "id": "jv-mtr-u1-word-001",
  "package_id": "jv-mtr",
  "unit_id": "u1",
  "lema": "Sugeng",
  "arti_id": "selamat",
  "istilah_penerang": null,
  "kelas_kata": "ungkapan",
  "register": "halus",
  "label_register_lokal": "krama",
  "tema": "sapaan",
  "tingkat": "L1",
  "contoh_kalimat_id": ["jv-mtr-u1-sentence-001"],
  "audio_id": "audio-jv-mtr-u1-word-001",
  "status_verifikasi": "terverifikasi",
  "sumber": ["source-a", "source-b"],
  "metode": "manual",
  "kontributor_id": "contributor-001",
  "verifier_id": ["verifier-001"],
  "versi_item": "1.0.0",
  "keterangan_variasi": null
}
```

Rules: satu lema memiliki satu arti utama; arti berbeda dibuat sebagai item baru; audio wajib untuk rilis publik; register badge tidak perlu ditampilkan UI tetapi field tetap wajib di data.

## Model data kalimat dan Fill the Gap

File: `kalimat.json`

Fill the Gap tidak memiliki bank item terpisah. Soal dibuat runtime dari kalimat valid dan kata rumpang yang diizinkan.

```json
{
  "id": "jv-mtr-u1-sentence-001",
  "package_id": "jv-mtr",
  "unit_id": "u1",
  "teks": "Sugeng enjang, sampun dhahar?",
  "terjemahan_id": "Selamat pagi, sudah makan?",
  "kata_isi_ids": ["jv-mtr-u1-word-001", "jv-mtr-u1-word-002"],
  "kata_rumpang_ids": ["jv-mtr-u1-word-002"],
  "register": "halus",
  "tingkat": "L1",
  "audio_id": "audio-jv-mtr-u1-sentence-001",
  "status_verifikasi": "terverifikasi",
  "verifier_id": ["verifier-001"]
}
```

Validation: satu rumpang per soal, semua kata isi valid, terjemahan tersedia, panjang sesuai level, dan tidak boleh ada dua jawaban benar.

## Model data Guess the Word

Guess the Word adalah **soal turunan**, bukan file konten terpisah. Picker mengambil kata dari `kata.json` berdasarkan package, unit, tema, register, kekuatan, dan aturan prioritas.

```json
{
  "question_type": "guess_the_word",
  "direction": "word_to_meaning",
  "answer_item_id": "jv-mtr-u1-word-001",
  "option_item_ids": [
    "jv-mtr-u1-word-001",
    "jv-mtr-u1-word-004",
    "jv-mtr-u1-word-007",
    "jv-mtr-u1-word-009"
  ],
  "audio_item_id": null,
  "unit_id": "u1",
  "session_size": 10
}
```

Supported directions: kata → arti, arti → kata, dan audio → arti. Distraktor harus berasal dari bank valid dan tidak boleh menciptakan jawaban baru. `kata_dilihat` tidak menjadi syarat membuka sesi; eligibility session ditentukan oleh package/bank yang valid.

## Model data dialog kurasi

File: `dialog.json`

```json
{
  "id": "jv-mtr-u1-dialog-001",
  "package_id": "jv-mtr",
  "unit_id": "u1",
  "judul": "Di warung",
  "lawan_bicara": "penjual",
  "register": "netral",
  "tingkat": "L1",
  "kata_target_ids": ["jv-mtr-u1-word-004"],
  "start_node_id": "node-001",
  "nodes": [
    {
      "id": "node-001",
      "speaker": "penjual",
      "teks": "Sugeng enjang.",
      "terjemahan_id": "Selamat pagi.",
      "audio_id": "audio-dialog-001-node-001",
      "choices": [
        {
          "id": "choice-001",
          "teks": "Sugeng enjang.",
          "terjemahan_id": "Selamat pagi.",
          "jenis_uji": "register",
          "kualitas": "pas",
          "next_node_id": "node-002"
        },
        {
          "id": "choice-002",
          "teks": "Heh, kowe.",
          "terjemahan_id": "Hei, kamu.",
          "jenis_uji": "register",
          "kualitas": "kurang_pas",
          "repair": {
            "teks": "Maaf, bisa diulangi?",
            "terjemahan_id": "Maaf, bisa diulangi?",
            "audio_id": "audio-dialog-001-repair-001"
          },
          "repeat_node_id": "node-001"
        }
      ]
    }
  ],
  "endings": [
    {
      "id": "ending-001",
      "kualitas": "pas",
      "feedback_id": "Pilihanmu pas."
    }
  ]
}
```

Validation: 6–10 giliran, 2–3 choice points, semua node terjangkau, semua jalur berakhir, register konsisten, repair hanya pada opsi tidak terkait/kurang pas yang relevan, dan tidak ada pilihan yang ambigu.

## Model data challenge

File: `challenge.json`

```json
{
  "id": "jv-mtr-u1-challenge-001",
  "package_id": "jv-mtr",
  "unit_id": "u1",
  "tingkat": "ringan",
  "judul": "Salam pagi pertama",
  "tujuan": "Berani menyapa dengan suara keras.",
  "instruksi": "Sapa satu orang di rumah dengan salam pagi yang kamu pelajari.",
  "frasa_bantu_ids": ["jv-mtr-u1-word-001"],
  "lawan_bicara_disarankan": "keluarga",
  "register": "halus",
  "varian_solo": "Ucapkan salam itu tiga kali dengan suara keras.",
  "varian_sosial": "Sapa anggota keluarga yang lebih tua.",
  "kriteria_selesai": "Aku sudah mencoba mengucapkannya.",
  "jika_macet_ids": ["jv-mtr-u1-word-003"],
  "durasi_menit": 5,
  "risiko_sosial": "rendah",
  "catatan_keamanan": "Untuk pengguna di bawah 18 tahun, lakukan bersama keluarga.",
  "status_verifikasi": "terverifikasi"
}
```

Challenge tidak menghasilkan learning event dan tidak memengaruhi mastery, streak, atau statistik.

## Model data audio

Audio package menyimpan satu file per kata, kalimat, baris dialog, dan repair response.

```json
{
  "audio_id": "audio-jv-mtr-u1-word-001",
  "path": "audio/jv-mtr-u1-word-001.opus",
  "format": "opus",
  "channels": 1,
  "duration_ms": 1800,
  "sample_rate": 48000,
  "speaker_id": "speaker-001",
  "consent_id": "consent-001",
  "status_audio": "verified"
}
```

Audio POC diberi status jelas dan tidak boleh masuk public release tanpa verifikasi serta consent.

## Manifest package

Manifest `.clata` mencatat `package_id`, bahasa, dialek, versi, schema version, minimum app version, register mapping, orthography reference, item counts, file sizes/checksums, `key_id`, provenance/license summary, dan signature reference.

## Validation gates

1. JSON Schema dan tipe data.
2. ID unik dan semua referensi terselesaikan.
3. Semantic rules kata/kalimat/dialog/challenge.
4. Audio, consent, license, dan verifier.
5. Tidak ada `poc` pada public release.
6. Ukuran package dan file valid.
7. Checksum SHA-256.
8. Signature Ed25519 dengan canonical JCS.
9. Catalog entry dan minimum app version.

## Status publishing

`draft → diajukan → ditinjau → terverifikasi → terbit`.

POC boleh memuat `poc` dalam internal bundle. Public catalog hanya memuat package bertanda tangan, terverifikasi, dan berstatus `terbit`. Kegagalan deploy Vercel tidak mengubah package yang sudah terpasang.
