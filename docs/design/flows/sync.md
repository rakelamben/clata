# Flow: Synchronization (P1)

## Entry and visibility

Sync is a background capability for signed-in users aged 10+ with required guardian consent where applicable. It is not a separate tab or screen. Users see its concise status in **Profil**, alongside progress and account information.

```text
Profil → status sinkronisasi → detail/retry bila diperlukan
```

Learning remains usable while sync is pending or unavailable. Do not show a persistent offline banner across learning screens.

## Initial account merge

```text
Login
→ detect local snapshot
→ explain local/account data
→ merge data OR choose account data only
→ save seven-day recovery snapshot
→ sync
→ update Profil status
```

`Gunakan data akun saja` is destructive and opens a warning bottom modal with two-step confirmation. Initial merge never silently overwrites local data.

## Normal lifecycle

- Local event is saved first, then queued.
- Sync triggers on login, foreground, connectivity recovery, and grouped changes.
- Status values: `Tersinkron`, `Menunggu sinkronisasi`, `Menyinkronkan`, `Belum tersinkron`, and `Coba lagi`.
- Retry uses backoff; offline learning continues.
- Status is shown as concise text in Profil and announced politely only when meaningful.
- A successful sync does not interrupt audio, practice, dialogue, or scrolling.

## Package progress

Progress for a package can exist without that package installed. Profil and Paket Bahasa show `Progres tersedia — pasang paket untuk melanjutkan`. Installing the matching package restores local mastery/statistics without deleting events.

## Reset across devices

`Profil → Pengaturan → Data dan progres → Reset package → warning bottom modal → confirm twice → queue/server reset → status pending → success`.

Reset uses a server-authorized tombstone/version and prevents old events from resurrecting progress. The action does not affect other packages.

## Logout and account switch

`Profil → Akun → Keluar → choose keep/delete local copy`.

Default is keep local data. Pending events remain isolated and cannot upload to another account automatically. Switching account requires an explicit context decision.

## Failure and recovery

- No internet: keep local events and show no persistent learning-screen banner.
- Server unavailable: show concise `Belum tersinkron` in Profil with `Coba lagi`.
- Session expired: request re-authentication only when sync/account action needs it.
- Duplicate retry: idempotency prevents duplicate events.
- Conflict: merge events and rebuild derived progress; never replace the whole local snapshot silently.

## Accessibility

- Profil exposes sync status as readable text, not color alone.
- Retry has an explicit label and does not move focus unexpectedly.
- Sync announcements are polite and throttled.
- Warning bottom modal traps accessibility focus and returns it to the triggering action.
