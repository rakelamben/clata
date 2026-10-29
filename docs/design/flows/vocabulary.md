# Flow: Vocabulary and Audio

`Kata → scroll feed → open Kamus via top-right icon → search/filter data kata → return to feed → tap volume icon → continue/enter practice`.

- Search and filters exist only in Kamus/Data Kata and work offline.
- Kamus/Data Kata tidak memiliki syarat streak; syarat streak hanya berlaku pada ScrollableWordFeed.
- A word viewed for at least one second in foreground records `kata_dilihat` once for the relevant rule.
- Audio states: idle, loading, playing, stopped, unavailable, interrupted. Play after stop starts from the beginning.
- Audio unavailable is explicit and does not block reading.
- Search empty state offers clear filters and return to full list.
- Audio does not determine streak eligibility.
- Screen reader announces lemma, meaning, register, and audio action without decorative duplication.
