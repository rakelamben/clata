import { describe, expect, it } from 'vitest';

import type { WordItem } from '../../../src/domain/package/packageTypes';
import type { WordViewRecord } from '../../../src/infrastructure/database/databaseTypes';
import {
  getWordsDueForPrimer,
  isWordDueForPrimer,
} from '../../../src/features/practice/domain/wordPrimerChecker';

describe('wordPrimerChecker', () => {
  const now = new Date('2026-11-02T00:00:00.000Z').getTime();

  it('returns true if word has never been viewed (no record or empty date)', () => {
    expect(isWordDueForPrimer(undefined, now)).toBe(true);
    expect(isWordDueForPrimer(null, now)).toBe(true);
    expect(
      isWordDueForPrimer(
        {
          package_id: 'jawa-mataraman',
          word_id: 'kata-1',
          view_count: 0,
          first_viewed_at: '',
          last_viewed_at: '',
        },
        now,
      ),
    );
  });

  it('returns false if word was viewed recently (within 7 days)', () => {
    // Viewed 2 days ago
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    const rec: WordViewRecord = {
      package_id: 'jawa-mataraman',
      word_id: 'kata-1',
      view_count: 3,
      first_viewed_at: twoDaysAgo,
      last_viewed_at: twoDaysAgo,
    };

    expect(isWordDueForPrimer(rec, now)).toBe(false);
  });

  it('returns true if word was last viewed more than 7 days ago', () => {
    // Viewed 8 days ago
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
    const rec: WordViewRecord = {
      package_id: 'jawa-mataraman',
      word_id: 'kata-1',
      view_count: 5,
      first_viewed_at: eightDaysAgo,
      last_viewed_at: eightDaysAgo,
    };

    expect(isWordDueForPrimer(rec, now)).toBe(true);
  });

  it('filters candidate words correctly using getWordsDueForPrimer', () => {
    const candidateWords: WordItem[] = [
      {
        id: 'kata-sugeng',
        text: 'sugeng',
        meaning: 'selamat',
        part_of_speech: 'interjection',
        register: 'sopan',
        theme: 'greeting',
        unit_id: 'unit-1',
        audio: '',
        status: 'poc',
      },
      {
        id: 'kata-enjing',
        text: 'enjing',
        meaning: 'pagi',
        part_of_speech: 'noun',
        register: 'sopan',
        theme: 'time',
        unit_id: 'unit-1',
        audio: '',
        status: 'poc',
      },
      {
        id: 'kata-dalu',
        text: 'dalu',
        meaning: 'malam',
        part_of_speech: 'noun',
        register: 'sopan',
        theme: 'time',
        unit_id: 'unit-1',
        audio: '',
        status: 'poc',
      },
    ];

    const viewedMap = new Map<string, WordViewRecord>();
    // kata-sugeng: viewed yesterday (fresh)
    viewedMap.set('kata-sugeng', {
      package_id: 'jawa-mataraman',
      word_id: 'kata-sugeng',
      view_count: 2,
      first_viewed_at: new Date(now - 86400000).toISOString(),
      last_viewed_at: new Date(now - 86400000).toISOString(),
    });
    // kata-enjing: viewed 10 days ago (stale > 7 days)
    viewedMap.set('kata-enjing', {
      package_id: 'jawa-mataraman',
      word_id: 'kata-enjing',
      view_count: 1,
      first_viewed_at: new Date(now - 10 * 86400000).toISOString(),
      last_viewed_at: new Date(now - 10 * 86400000).toISOString(),
    });
    // kata-dalu: never viewed (not in map)

    const dueWords = getWordsDueForPrimer(candidateWords, viewedMap, now);
    expect(dueWords.map((w) => w.id)).toEqual(['kata-enjing', 'kata-dalu']);
  });
});
