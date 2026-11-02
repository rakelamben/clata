import { describe, expect, it } from 'vitest';

import type { UnitItem, WordItem } from '../../../src/domain/package/packageTypes';
import type { WordViewRecord } from '../../../src/infrastructure/database/databaseTypes';
import {
  generateFeedBuffer,
  rankWordFeed,
} from '../../../src/features/vocabulary/domain/wordFeedRanker';

describe('wordFeedRanker', () => {
  const mockUnits: UnitItem[] = [
    { unit_id: 'unit-1', order: 1, title: 'Unit 1' },
    { unit_id: 'unit-2', order: 2, title: 'Unit 2' },
    { unit_id: 'unit-3', order: 3, title: 'Unit 3' },
  ];

  const createWord = (id: string, unit_id: string): WordItem => ({
    id,
    text: id,
    meaning: `Arti ${id}`,
    part_of_speech: 'noun',
    register: 'sopan',
    theme: 'daily',
    unit_id,
    audio: 'audio/sample.opus',
    status: 'poc',
  });

  const now = new Date('2026-11-01T12:00:00Z');

  it('ranks words accurately across 5 tiers without shuffle', () => {
    const wordUnit1New = createWord('w-u1-new', 'unit-2'); // Tier 1 (current unit, new)
    const wordUnit1OldView = createWord('w-u1-oldview', 'unit-2'); // Tier 2 (current unit, viewed 10 days ago)
    const wordUnit1RecentView = createWord('w-u1-recent', 'unit-2'); // Tier 3 (current unit, viewed 1 day ago)
    const wordUnit0Past = createWord('w-u0-past', 'unit-1'); // Tier 4 (past unit)
    const wordUnit2Future = createWord('w-u2-future', 'unit-3'); // Tier 5 (future unit)

    const words = [
      wordUnit2Future,
      wordUnit0Past,
      wordUnit1RecentView,
      wordUnit1OldView,
      wordUnit1New,
    ];

    const views = new Map<string, WordViewRecord>();

    // w-u1-oldview viewed 10 days ago (Tier 2)
    views.set('w-u1-oldview', {
      package_id: 'pkg-1',
      word_id: 'w-u1-oldview',
      view_count: 2,
      first_viewed_at: '2026-10-20T12:00:00Z',
      last_viewed_at: '2026-10-22T12:00:00Z',
    });

    // w-u1-recent viewed 1 day ago (Tier 3)
    views.set('w-u1-recent', {
      package_id: 'pkg-1',
      word_id: 'w-u1-recent',
      view_count: 1,
      first_viewed_at: '2026-10-31T12:00:00Z',
      last_viewed_at: '2026-10-31T12:00:00Z',
    });

    // w-u0-past viewed in the past (Tier 4)
    views.set('w-u0-past', {
      package_id: 'pkg-1',
      word_id: 'w-u0-past',
      view_count: 3,
      first_viewed_at: '2026-10-01T12:00:00Z',
      last_viewed_at: '2026-10-05T12:00:00Z',
    });

    const ranked = rankWordFeed(words, mockUnits, 'unit-2', views, {
      now,
      randomizeWithinTier: false,
    });

    expect(ranked.map((r) => r.word.id)).toEqual([
      'w-u1-new', // Tier 1
      'w-u1-oldview', // Tier 2
      'w-u1-recent', // Tier 3
      'w-u0-past', // Tier 4
      'w-u2-future', // Tier 5
    ]);

    expect(ranked.map((r) => r.tier)).toEqual([1, 2, 3, 4, 5]);
  });

  it('generates deterministic infinite feed buffer preserving order without mid-session reshuffle', () => {
    const word1 = createWord('w-1', 'unit-1');
    const word2 = createWord('w-2', 'unit-1');

    const base = rankWordFeed([word1, word2], mockUnits, 'unit-1', new Map(), {
      now,
      randomizeWithinTier: false,
    });

    const buffer = generateFeedBuffer(base, 5);
    expect(buffer.length).toBe(5);
    expect(buffer.map((b) => b.word.id)).toEqual(['w-1', 'w-2', 'w-1', 'w-2', 'w-1']);

    // Every item has a unique feedId
    const feedIds = new Set(buffer.map((b) => b.feedId));
    expect(feedIds.size).toBe(5);
  });
});
