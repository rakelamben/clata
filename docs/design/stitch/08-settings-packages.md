# Stitch Prompt — Settings and Language Packages

Use the global Clata prompt. Create a settings screen in Bahasa Indonesia with grouped list sections.

Place the settings section below the progress components inside the **Profil** tab. Show a clean vertical list of buttons: **Paket Bahasa**, **Audio dan aksesibilitas**, **Pengingat**, **Data dan progres**, **Akun**, and **Tentang Clata**.

For the Paket Bahasa screen, show an installed package row with language, dialect, version, size, and source. Add a progress-available row titled **Progres tersedia — pasang paket untuk melanjutkan**. The main action is **Unggah paket**, opening a bottom sheet with **Pilih file dari perangkat**. Accept `.clata` packages and `.zip` compatibility files. When online, show catalog cards with size, version, and button **Unduh dan pasang**. When offline, hide download buttons and show **Tidak ada internet. Kamu tetap bisa mengunggah paket dari file.**

Include **Bagikan paket**, and a secondary destructive **Hapus paket** only for additional packages. Destructive actions open a warning bottom modal with short warning copy and two-step confirmation; do not use a solid error-colored action. Show file picker, download/install progress, cancel button, validation error, storage-full error, and successful installation states.
