# Stitch Prompt — Practice

Use the global Clata prompt. Design the Latihan area with a concise session setup followed by a Guess the Word practice question screen.

First show a session setup screen with three simple options: **Guess the Word**, **Fill the Gap**, and **Dialog**. Do not gate any option based on words viewed. Dialog is a session type inside Latihan, not a bottom-navigation tab.

Top: back button, progress label **Soal 3 dari 10**, and a slim progress bar. Main prompt card includes a small audio button, the prompt **Apa arti kata ini?**, and the regional word **Mangan**.

Below, show four large answer cards with Indonesian labels. One card is selected with a clear border and selected state; do not rely on color alone. After submission, show a simple feedback panel titled **Benar** or **Coba lagi**, show the correct answer, a Putar/Berhenti audio toggle, and one example sentence. Bottom action is **Lanjut**.

Create visual states for loading, incorrect answer, empty package/content unavailable, interrupted session, and session summary. Do not show an insufficient-vocabulary gate based on `kata_dilihat`. Use no leaderboard, timer pressure, or punitive red screen.
