import type { UnitItem, WordItem } from '../../../domain/package/packageTypes';
import type { WordViewRecord } from '../../../infrastructure/database/databaseTypes';

export interface FeedWordEntry {
  feedId: string;
  word: WordItem;
  tier: 1 | 2 | 3 | 4 | 5;
  isViewed: boolean;
  lastViewedAt: string | null;
}

export interface RankFeedOptions {
  now?: Date;
  randomizeWithinTier?: boolean;
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/**
 * Memeringkat kata berdasarkan arsitektur 5-Tier Spaced Repetition Bucket:
 * - Tier 1 (100): Kata baru di unit aktif (!isViewed) -> Muncul paling atas
 * - Tier 2 (80): Kata di unit aktif dengan last_viewed >= 7 hari -> Penguatan retensi
 * - Tier 3 (60): Kata di unit aktif dengan last_viewed < 7 hari
 * - Tier 4 (40): Kata dari unit lampau yang sudah terselesaikan
 * - Tier 5 (20): Kata dari unit berikutnya (pratinjau masa depan)
 */
export function rankWordFeed(
  words: WordItem[],
  units: UnitItem[],
  currentUnitId: string,
  wordViews: Map<string, WordViewRecord>,
  options: RankFeedOptions = {},
): FeedWordEntry[] {
  if (words.length === 0) return [];

  const now = options.now ?? new Date();
  const shouldShuffle = options.randomizeWithinTier ?? true;

  // Petakan urutan unit
  const unitIndexMap = new Map<string, number>();
  units.forEach((u, idx) => {
    unitIndexMap.set(u.unit_id, idx);
  });

  const currentUnitIndex = unitIndexMap.get(currentUnitId) ?? 0;

  const tier1: FeedWordEntry[] = [];
  const tier2: FeedWordEntry[] = [];
  const tier3: FeedWordEntry[] = [];
  const tier4: FeedWordEntry[] = [];
  const tier5: FeedWordEntry[] = [];

  for (const word of words) {
    const viewRecord = wordViews.get(word.id);
    const isViewed = Boolean(viewRecord);
    const lastViewedAt = viewRecord?.last_viewed_at ?? null;

    let daysSince = Infinity;
    if (lastViewedAt) {
      const diffMs = now.getTime() - new Date(lastViewedAt).getTime();
      daysSince = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    }

    const wordUnitIndex = unitIndexMap.get(word.unit_id) ?? currentUnitIndex;
    const isCurrentUnit = word.unit_id === currentUnitId;

    if (isCurrentUnit) {
      if (!isViewed) {
        tier1.push({
          feedId: `${word.id}-init`,
          word,
          tier: 1,
          isViewed: false,
          lastViewedAt: null,
        });
      } else if (daysSince >= 7) {
        tier2.push({
          feedId: `${word.id}-init`,
          word,
          tier: 2,
          isViewed: true,
          lastViewedAt,
        });
      } else {
        tier3.push({
          feedId: `${word.id}-init`,
          word,
          tier: 3,
          isViewed: true,
          lastViewedAt,
        });
      }
    } else if (wordUnitIndex < currentUnitIndex) {
      tier4.push({
        feedId: `${word.id}-init`,
        word,
        tier: 4,
        isViewed,
        lastViewedAt,
      });
    } else {
      tier5.push({
        feedId: `${word.id}-init`,
        word,
        tier: 5,
        isViewed,
        lastViewedAt,
      });
    }
  }

  // Pengacakan ringan (gentle shuffle) hanya per tier untuk menjaga variasi di sesi baru
  const finalTier1 = shouldShuffle ? shuffleArray(tier1) : tier1;
  const finalTier2 = shouldShuffle ? shuffleArray(tier2) : tier2;
  const finalTier3 = shouldShuffle ? shuffleArray(tier3) : tier3;
  const finalTier4 = shouldShuffle ? shuffleArray(tier4) : tier4;
  const finalTier5 = shouldShuffle ? shuffleArray(tier5) : tier5;

  return [...finalTier1, ...finalTier2, ...finalTier3, ...finalTier4, ...finalTier5];
}

/**
 * Mengembangkan antrean feed secara deterministik & stabil untuk infinite scroll
 * tanpa melakukan re-shuffle acak di tengah aktivitas swipe pengguna.
 */
export function generateFeedBuffer(
  baseRanked: FeedWordEntry[],
  count: number,
  startIteration = 0,
): FeedWordEntry[] {
  if (baseRanked.length === 0 || count <= 0) return [];

  const buffer: FeedWordEntry[] = [];
  const baseLength = baseRanked.length;

  for (let i = 0; i < count; i++) {
    const itemIndex = i % baseLength;
    const cycle = startIteration + Math.floor(i / baseLength);
    const source = baseRanked[itemIndex]!;

    buffer.push({
      ...source,
      feedId: `${source.word.id}-c${cycle}-${i}`,
    });
  }

  return buffer;
}
