# Definisi Register Bahasa Daerah (Clata)

Dalam aplikasi Clata, **register** adalah penanda **ragam tutur dan relasi sosial** pemakaian kata/kalimat dalam bahasa daerah, **bukan tingkatan kesulitan belajar**.

Tingkat kesulitan (`level`) telah dihapus sepenuhnya dari paket bahasa. Urutan belajar pengguna ditentukan secara sekuensial berdasarkan urutan unit (`order`).

---

## Tiga Nilai Register

Setiap kosakata, kalimat, dan dialog dalam paket bahasa **wajib** memiliki salah satu dari tiga nilai register berikut (tidak boleh kosong atau `null`):

| Nilai Register | Label Tampilan | Penjelasan Singkat | Sasaran & Konteks Pemakaian |
| :--- | :--- | :--- | :--- |
| `sopan` | **Sopan** | Untuk orang yang lebih tua atau dihormati | Dipakai saat berbicara kepada orang tua, guru, tokoh masyarakat, tamu, atau orang yang dihormati (dalam bahasa Jawa mencakup ragam *krama andhap* dan *krama inggil*). |
| `akrab` | **Akrab** | Untuk orang dekat atau sebaya | Dipakai dalam percakapan santai sehari-hari antar teman sebaya, keluarga dekat, atau orang yang sudah akrab (dalam bahasa Jawa setara dengan ragam *ngoko*). |
| `netral` | **Netral** | Bisa dipakai ke siapa saja | Kata dasar atau leksikon yang tidak memiliki pasangan bentuk tingkatan tutur, atau dapat digunakan secara fleksibel dalam situasi sopan maupun akrab tanpa melanggar tata krama kesantunan. |

---

## Catatan Pemakaian (`catatan`)

Untuk membedakan kata yang sama-sama berlabel `sopan` namun berbeda orientasi subjek tutur (misalnya kata untuk diri sendiri vs kata untuk orang yang dihormati), digunakan atribut teks bebas opsional: **`catatan`** (maksimal 120 karakter).

### Contoh pada Bahasa Jawa Mataraman:
- **`nedha`** (*sopan*): `"Untuk diri sendiri."` (krama andhap)
- **`dhahar`** (*sopan*): `"Untuk orang yang dihormati."` (krama inggil)
- **`tilem`** (*sopan*): `"Untuk diri sendiri."` (krama andhap)
- **`sare`** (*sopan*): `"Untuk orang yang dihormati."` (krama inggil)
- **`tindak`** (*sopan*): `"Untuk orang yang dihormati."` (krama inggil)

Kata yang tidak memiliki distingsi pasangan khusus tidak diberi atribut `catatan`.

---

## Implementasi Teknis

Konstanta dan tipe register didefinisikan secara terpusat pada file:
[`src/domain/Register.ts`](file:///d:/c/src/domain/Register.ts)

```typescript
export const REGISTERS = ['sopan', 'akrab', 'netral'] as const;
export type Register = (typeof REGISTERS)[number];
```
Semua modul validator, pemuat paket, logika kuis, dan antarmuka UI mengimpor dan menggunakan definisi tunggal ini.
