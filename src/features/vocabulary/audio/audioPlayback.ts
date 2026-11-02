/**
 * Resolusi audio aman untuk React Native / Expo SDK 58.
 * Menghindari native crash (ExoPlayer/AVPlayer) akibat invalid URI scheme.
 */

import dialogStartAudio from '../../../../content/packages/jawa-mataraman/source/audio/dialog-start.opus';
import kalimatSugengAudio from '../../../../content/packages/jawa-mataraman/source/audio/kalimat-sugeng.opus';
import kataSugengAudio from '../../../../content/packages/jawa-mataraman/source/audio/kata-sugeng.opus';
import { SettingsRepository } from '../../../infrastructure/database/settingsRepository';

export type AudioPlayStatus = 'idle' | 'loading' | 'playing' | 'unavailable' | 'error';

let cachedPlaybackRate = 1.0;
let isRateInitialized = false;

export function setCachedPlaybackRate(rate: number): void {
  cachedPlaybackRate = rate;
  isRateInitialized = true;
}

export function getCachedPlaybackRate(): number {
  return cachedPlaybackRate;
}

export async function syncPlaybackRateFromSettings(): Promise<number> {
  try {
    const settingsRepo = new SettingsRepository();
    const speed = await settingsRepo.getAudioSpeed();
    cachedPlaybackRate = speed === 'slow' ? 0.8 : 1.0;
    isRateInitialized = true;
    return cachedPlaybackRate;
  } catch {
    return cachedPlaybackRate;
  }
}

const BUNDLED_SAMPLE_AUDIO: Record<string, number> = {
  'audio/kata-sugeng.opus': kataSugengAudio,
  'audio/kalimat-sugeng.opus': kalimatSugengAudio,
  'audio/dialog-start.opus': dialogStartAudio,
  'kata-sugeng.opus': kataSugengAudio,
  'kalimat-sugeng.opus': kalimatSugengAudio,
  'dialog-start.opus': dialogStartAudio,
};

/**
 * Validasi dan resolusi path audio menjadi sumber yang aman untuk expo-audio.
 * Mengembalikan null jika path tidak valid atau tidak dapat diakses secara native.
 */
export function resolveAudioSource(audioPath?: string | number | null): number | { uri: string } | null {
  if (!audioPath) {
    return null;
  }

  // Jika sudah berupa asset ID (number)
  if (typeof audioPath === 'number') {
    return audioPath;
  }

  const cleanPath = audioPath.trim();
  if (!cleanPath) {
    return null;
  }

  // Cek apakah ada di bundled assets lokal
  if (BUNDLED_SAMPLE_AUDIO[cleanPath]) {
    return BUNDLED_SAMPLE_AUDIO[cleanPath];
  }

  // Cek apakah memiliki URI scheme yang valid
  const hasValidScheme = /^(file:\/\/|https?:\/\/|data:|content:\/\/|asset:\/\/)/i.test(cleanPath);
  if (hasValidScheme) {
    return { uri: cleanPath };
  }

  // Jika merupakan relative path tanpa mapping asset yang valid, jangan oper ke native player
  return null;
}

/**
 * Pemutar audio aman untuk React Native / Expo SDK 58.
 * - Memastikan resolusi URI/asset valid sebelum memanggil API native.
 * - Menangkap segala error native/JS secara aman tanpa memutus siklus aplikasi.
 * - Mengembalikan status 'unavailable' jika berkas audio belum ada/tidak didukung.
 * - Mendukung kecepatan pemutaran (playback rate) sesuai preferensi pengguna (Normal 1.0x / Lambat 0.8x).
 */
export async function playAudioSafe(
  audioInput?: string | number | null,
  onStatusChange?: (status: AudioPlayStatus) => void,
  customPlaybackRate?: number,
): Promise<boolean> {
  const resolvedSource = resolveAudioSource(audioInput);

  if (!resolvedSource) {
    onStatusChange?.('unavailable');
    setTimeout(() => {
      onStatusChange?.('idle');
    }, 1500);
    return false;
  }

  try {
    onStatusChange?.('loading');

    // Sinkronisasi preferensi kecepatan audio jika belum diinisialisasi
    if (customPlaybackRate === undefined && !isRateInitialized) {
      await syncPlaybackRateFromSettings();
    }

    const effectiveRate = customPlaybackRate ?? cachedPlaybackRate;

    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');

    if (setAudioModeAsync) {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
      } catch {
        // Abaikan jika platform tidak mendukung setAudioMode
      }
    }

    if (!createAudioPlayer) {
      onStatusChange?.('unavailable');
      setTimeout(() => {
        onStatusChange?.('idle');
      }, 1500);
      return false;
    }

    const player = createAudioPlayer(resolvedSource);
    if (!player) {
      onStatusChange?.('unavailable');
      setTimeout(() => {
        onStatusChange?.('idle');
      }, 1500);
      return false;
    }

    try {
      player.volume = 1.0;
    } catch {
      // Abaikan jika volume tidak dapat disetel secara manual
    }

    // Terapkan kecepatan pemutaran (playback rate) ke player
    try {
      if (typeof (player as { setPlaybackRate?: (r: number) => void }).setPlaybackRate === 'function') {
        (player as { setPlaybackRate: (r: number) => void }).setPlaybackRate(effectiveRate);
      }
      player.playbackRate = effectiveRate;
    } catch (err) {
      console.warn('[AudioPlayback] Peringatan saat mengatur kecepatan pemutaran:', err);
    }

    player.play();
    onStatusChange?.('playing');

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        if (typeof (player as { release?: () => void }).release === 'function') {
          (player as { release?: () => void }).release?.();
        }
      } catch {
        // Abaikan pelepasan player jika sudah dirilis
      }
      onStatusChange?.('idle');
    };

    // Dengarkan event selesai pemutaran jika didukung
    try {
      if (typeof (player as { addListener?: (event: string, cb: (status: { didJustFinish?: boolean }) => void) => { remove?: () => void } }).addListener === 'function') {
        const sub = (player as unknown as { addListener: (event: string, cb: (status: { didJustFinish?: boolean }) => void) => { remove?: () => void } }).addListener(
          'playbackStatusUpdate',
          (status) => {
            if (status?.didJustFinish) {
              sub?.remove?.();
              cleanup();
            }
          },
        );
      }
    } catch {
      // Abaikan jika listener gagal didaftarkan
    }

    // Timeout pengaman proporsional terhadap durasi dan kecepatan
    const durationSec = typeof player.duration === 'number' && player.duration > 0 ? player.duration : 1.5;
    const fallbackDurationMs = Math.max(2500, Math.round((durationSec / effectiveRate) * 1000 + 600));

    setTimeout(() => {
      cleanup();
    }, fallbackDurationMs);

    return true;
  } catch {
    // Tangani error native tanpa crashing app
    onStatusChange?.('unavailable');
    setTimeout(() => {
      onStatusChange?.('idle');
    }, 1500);
    return false;
  }
}
