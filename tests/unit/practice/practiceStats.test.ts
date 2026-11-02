import { describe, expect, it } from 'vitest';

import { computeUnitPracticeSummaries } from '../../../src/features/practice/domain/practiceStats';
import type {
  DialogueItem,
  SentenceItem,
  UnitItem,
  WordItem,
} from '../../../src/domain/package/packageTypes';

describe('Practice Stats - computeUnitPracticeSummaries', () => {
  it('returns empty array when packageData is null or undefined', () => {
    expect(computeUnitPracticeSummaries(null)).toEqual([]);
    expect(computeUnitPracticeSummaries(undefined)).toEqual([]);
  });

  it('accurately counts words, sentences, and dialogues per unit', () => {
    const mockUnits: UnitItem[] = [
      { unit_id: 'unit-1', order: 1, title: 'Salam & Sapaan' },
      { unit_id: 'unit-2', order: 2, title: 'Keluarga' },
    ];

    const mockWords = [
      { id: 'w1', unit_id: 'unit-1' },
      { id: 'w2', unit_id: 'unit-1' },
      { id: 'w3', unit_id: 'unit-2' },
    ] as WordItem[];

    const mockSentences = [
      { id: 's1', unit_id: 'unit-1' },
      { id: 's2', unit_id: 'unit-2' },
    ] as SentenceItem[];

    const mockDialogues = [
      { id: 'd1', unit_id: 'unit-1' },
      { id: 'd2', unit_id: 'unit-1' },
    ] as DialogueItem[];

    const result = computeUnitPracticeSummaries({
      units: mockUnits,
      words: mockWords,
      sentences: mockSentences,
      dialogues: mockDialogues,
    });

    expect(result).toHaveLength(2);

    // Unit 1: 2 kata + 1 kalimat + 2 dialog = 5 latihan
    expect(result[0]).toEqual({
      unit_id: 'unit-1',
      order: 1,
      title: 'Salam & Sapaan',
      exerciseCount: 5,
      wordsCount: 2,
      sentencesCount: 1,
      dialoguesCount: 2,
    });

    // Unit 2: 1 kata + 1 kalimat + 0 dialog = 2 latihan
    expect(result[1]).toEqual({
      unit_id: 'unit-2',
      order: 2,
      title: 'Keluarga',
      exerciseCount: 2,
      wordsCount: 1,
      sentencesCount: 1,
      dialoguesCount: 0,
    });
  });

  it('handles units with zero exercises gracefully', () => {
    const mockUnits: UnitItem[] = [
      { unit_id: 'unit-empty', order: 3, title: 'Unit Kosong' },
    ];

    const result = computeUnitPracticeSummaries({
      units: mockUnits,
      words: [],
      sentences: [],
      dialogues: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].exerciseCount).toBe(0);
    expect(result[0].wordsCount).toBe(0);
    expect(result[0].sentencesCount).toBe(0);
    expect(result[0].dialoguesCount).toBe(0);
  });
});
