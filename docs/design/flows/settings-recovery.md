# Flow: Settings, Data, and Recovery

## Settings

`Profil → progress components → vertical settings action list`.

Settings berada di tab Profil, tepat di bawah komponen progress, dan ditampilkan sebagai list vertikal tombol:

- `Paket Bahasa`;
- `Audio dan aksesibilitas`;
- `Pengingat`;
- `Akun` (P1);
- `Data dan progres`;
- `Tentang Clata`.

## Reset package

`Profil → Data dan progres → Reset package → warning bottom modal → first confirmation → second explicit confirmation → reset locally or queue synced reset → success`.

## Delete all data

`Profil → Data dan progres → Hapus semua data → warning bottom modal → explain package/progress loss → two confirmations → clear → onboarding`.

## Recovery

- Database migration failure: rollback and show recovery action.
- Corrupt package: keep previous package active.
- Storage full: explain required space and offer package cleanup.
- Unknown error: safe message, retry, and support/report path.

Every destructive flow uses a warning bottom modal, has an accessible focus/announcement order, and returns focus to its trigger after closing.
