# Flow: Authentication and Account (P1)

## Eligibility

Akun tersedia mulai usia **10 tahun**. Pengguna 10–17 tahun harus menyelesaikan persetujuan orang tua/wali sebelum identitas, progres, dan AI dialogue diproses server.

## Sign-in entry

`Profil → Akun → pilih metode masuk`.

Offline learning remains available without an account.

## Sign-in methods

- Email: register → guardian consent when required → confirmation email → confirmed login.
- Phone: E.164 number → OTP → guardian consent when required → verified session.
- Google: official OAuth → registered deep-link callback → guardian consent when required → session.

## Forgot password

```text
Masuk dengan email
→ Lupa password?
→ masukkan email
→ Kirim tautan
→ buka tautan reset
→ password baru
→ konfirmasi
→ kembali ke Akun
```

The response is intentionally neutral and does not reveal whether an email exists. Expired links provide a safe resend action. Passwords and reset tokens are handled by Supabase Auth and never stored by the app.

## Alternate paths

Unconfirmed email, invalid/expired OTP, OAuth cancellation, expired session, provider failure, invalid reset link, weak password, and guardian-consent pending show short recovery copy without exposing account existence or private data.

## Logout/switch

`Profil → Akun → Keluar → choose keep/delete local copy`.

Logout uses the warning bottom modal if local data deletion is selected. Default is keep local data. Switching accounts isolates outbox/progress and never uploads pending events to the new account automatically.

## Delete account

`Akun → Hapus akun → warning bottom modal → re-authenticate if needed → confirm twice → server deletion → success`.

Local data remains unless separately deleted.
