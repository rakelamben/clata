# Stitch Prompt — Account

Use the global Clata prompt. Design an account screen for users aged 10+; show a concise guardian-consent state for users aged 10–17 before server processing is enabled.

Signed-out state: heading **Simpan progresmu di akun**, concise privacy explanation, and three equal method buttons: **Masuk dengan email**, **Masuk dengan nomor telepon**, and **Lanjutkan dengan Google**. Do not make account mandatory for offline learning.

Signed-in state: show masked account identity, timezone setting, sync status card with states **Tersinkron**, **Menunggu sinkronisasi**, and **Sinkronisasi gagal**, plus buttons **Keluar** and **Hapus akun**.

Create error variants for email confirmation pending, invalid OTP, expired session, and OAuth cancelled. Destructive delete flow must have a two-step confirmation modal.
