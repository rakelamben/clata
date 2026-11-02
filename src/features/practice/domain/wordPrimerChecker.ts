import type { WordItem } from '../../../domain/package/packageTypes';
import type { WordViewRecord } from '../../../infrastructure/database/databaseTypes';

export const PRIMER_STALE_THRESHOLD_DAYS = 7;
export const PRIMER_STALE_THRESHOLD_MS = PRIMER_STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Memeriksa apakah suatu kata perlu ditampilkan di layar primer ("Kamu harus tahu kata ini"):
 * 1. Belum pernah dilihat sama sekali (!record)
 * 2. ATAU terakhir dilihat > 7 hari yang lalu (stale / forgetting curve)
 */
export function isWordDueForPrimer(
  record?: WordViewRecord | null,
  nowMs = Date.now(),
): boolean {
  if (!record || !record.last_viewed_at) {
    return true;
  }

  const lastViewedMs = new Date(record.last_viewed_at).getTime();
  if (Number.isNaN(lastViewedMs)) {
    return true;
  }

  return nowMs - lastViewedMs > PRIMER_STALE_THRESHOLD_MS;
}

/**
 * Memfilter kata-kata yang perlu ditampilkan di layar primer dari daftar kata kandidat
 */
export function getWordsDueForPrimer(
  candidateWords: WordItem[],
  viewedMap: Map<string, WordViewRecord>,
  nowMs = Date.now(),
): WordItem[] {
  return candidateWords.filter((word) => {
    const record = viewedMap.get(word.id);
    return isWordDueForPrimer(record, nowMs);
  });
}
