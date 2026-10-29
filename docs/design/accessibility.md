# Accessibility Design Rules

Target: WCAG 2.2 AA principles adapted to React Native, TalkBack, and VoiceOver.

- Native controls are preferred over custom gesture-only controls.
- Touch target minimum 44×44 pt iOS atau 48×48 dp Android dengan adequate spacing.
- Body text starts at 16sp and supports 200% scaling.
- Contrast: normal text 4.5:1; large text/UI graphics 3:1 minimum.
- No status or answer meaning is conveyed by color alone.
- Every icon-only button has an `accessibilityLabel` and an action hint where needed.
- Icon-only controls are allowed only when their purpose is meaningful and their accessible label is concise; decorative icons and symbols are excluded from the accessibility tree.
- Selected answer uses `accessibilityState={{ selected: true }}`.
- Disabled and loading states expose `accessibilityState`.
- Dynamic feedback uses polite announcements; do not interrupt active audio unnecessarily.
- Modal dialogs trap focus/accessibility navigation and return focus to the trigger after closing.
- Audio is optional for progress; transcripts/text are always available. The audio control is a single volume-icon toggle with `playing`/`stopped` state; it has no separate replay control.
- A playing volume icon may use the active brand color, but the accessible state must also announce `sedang diputar` or `berhenti`.
- Register information is exposed through a meaningful info icon with a short label such as `Tingkat tutur kata: halus`; the tooltip contains only concise supporting information.
- The Kata screen exposes a labeled top-right `Buka Kamus` icon button. Search and filters are located in Kamus/Data Kata, not in the scroll feed.
- The Kata feed is announced as a scrollable region. When it loops to the first item, announce the transition only when necessary and do not create an infinite repetitive announcement loop.
- Skeleton loading is announced once per meaningful region, for example `Memuat daftar kata`; individual skeleton items are not announced.
- Spinner loading exposes the action being performed, such as `Memasang paket`, and its busy state.
- Temporary offline labels may be announced when relevant; do not keep a persistent offline announcement on every screen.
- `Ucapkan sendiri` never requests microphone permission.
- Test with TalkBack, VoiceOver, font scale 200%, reduced motion, and color-blind simulation.
- Follow the shared [focus contract](./accessibility-focus-contract.md) for screen transitions, sheets, filters, feedback, and errors.
- Use the shared [design tokens](./design-tokens.md); do not introduce screen-specific color or spacing values.

## Accessibility tree expectations

A typical WordFeedItem should announce: `Kata, [lema]. [arti]. Tombol audio [lema], [sedang diputar/berhenti]. Tombol info tingkat tutur.` It must not announce decorative icons, register badges, repeated status text, or duplicate visible text. The info tooltip should return accessibility focus to its trigger when dismissed.
