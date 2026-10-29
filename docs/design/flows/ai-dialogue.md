# Flow: AI Dialogue (P1)

`Latihan → Dialog AI → account/age gate → online check → quota check → trusted Edge Function → Gemini free model → Groq free model fallback → validate → render shared dialogue UI`.

- No account or under 10: explain access limitation and offer curated dialogue. Users aged 10–17 may use AI after required guardian consent; users aged 18+ may use it with normal account access.
- Offline: no generation; offer curated dialogue.
- Fourth session: show quota message and curated fallback.
- Validation failure: regenerate up to two times, then curated fallback.
- Generation uses free-tier Gemini API and Groq API through a trusted server function. The app never calls either provider directly.
- Gemini is the default provider; Groq is the fallback for timeout, provider error, or rate limit. Provider/model names are not shown in user-facing copy.
- Provider API keys and model IDs are server configuration, never app configuration.
- Every result displays `Dibuat AI, belum diverifikasi penutur`.
- Report action queues offline and sends when online.
- No native audio is shown for AI lines; bank audio remains playable through the same volume-icon toggle used by curated dialogue.
