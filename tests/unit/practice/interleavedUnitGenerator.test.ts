import { describe, expect, it } from 'vitest';

import { generateInterleavedUnitSessions } from '../../../src/features/practice/domain/interleavedUnitGenerator';

describe('Practice Domain - generateInterleavedUnitSessions', () => {
  it('returns empty array when there are no items in unit', () => {
    expect(generateInterleavedUnitSessions('unit-1', [], [], [])).toEqual([]);
  });

  it('correctly interleaves words, sentences, and dialogues for 30 words, 12 sentences, 6 dialogues', () => {
    const mockWords = Array.from({ length: 30 }, (_, i) => ({ id: `w-${i + 1}` }));
    const mockSentences = Array.from({ length: 12 }, (_, i) => ({ id: `s-${i + 1}` }));
    const mockDialogues = Array.from({ length: 6 }, (_, i) => ({
      id: `d-${i + 1}`,
      title: `Judul Dialog ${i + 1}`,
    }));

    const result = generateInterleavedUnitSessions(
      'unit-1',
      mockWords,
      mockSentences,
      mockDialogues,
    );

    // 30 words / 10 = 3 sessions
    // 12 sentences / 6 = 2 sessions
    // 6 dialogues = 6 sessions
    // Total sessions = 11
    expect(result).toHaveLength(11);

    // Sesi 1: Tebak Kata Bagian 1
    expect(result[0].type).toBe('word_guess');
    expect(result[0].title).toBe('Tebak Kata • Bagian 1');
    expect(result[0].itemCount).toBe(10);
    expect(result[0].orderIndex).toBe(1);

    // Sesi 2: Kalimat Bagian 1
    expect(result[1].type).toBe('fill_gap');
    expect(result[1].title).toBe('Kalimat • Bagian 1');
    expect(result[1].itemCount).toBe(6);
    expect(result[1].orderIndex).toBe(2);

    // Sesi 3: Percakapan 1
    expect(result[2].type).toBe('dialogue');
    expect(result[2].title).toBe('Percakapan • Judul Dialog 1');
    expect(result[2].itemCount).toBe(1);
    expect(result[2].orderIndex).toBe(3);

    // Sesi 4: Tebak Kata Bagian 2
    expect(result[3].type).toBe('word_guess');
    expect(result[3].title).toBe('Tebak Kata • Bagian 2');
    expect(result[3].itemCount).toBe(10);

    // Sesi 5: Kalimat Bagian 2
    expect(result[4].type).toBe('fill_gap');
    expect(result[4].title).toBe('Kalimat • Bagian 2');
    expect(result[4].itemCount).toBe(6);

    // Sesi 6: Percakapan 2
    expect(result[5].type).toBe('dialogue');
    expect(result[5].title).toBe('Percakapan • Judul Dialog 2');

    // Sesi 7: Tebak Kata Bagian 3
    expect(result[6].type).toBe('word_guess');
    expect(result[6].title).toBe('Tebak Kata • Bagian 3');
    expect(result[6].itemCount).toBe(10);

    // Sisa dialog (3 s.d. 6)
    expect(result[7].title).toBe('Percakapan • Judul Dialog 3');
    expect(result[8].title).toBe('Percakapan • Judul Dialog 4');
    expect(result[9].title).toBe('Percakapan • Judul Dialog 5');
    expect(result[10].title).toBe('Percakapan • Judul Dialog 6');
  });

  it('handles units with only words and sentences gracefully', () => {
    const mockWords = [{ id: 'w-1' }, { id: 'w-2' }];
    const mockSentences = [{ id: 's-1' }];

    const result = generateInterleavedUnitSessions('unit-2', mockWords, mockSentences, []);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('word_guess');
    expect(result[1].type).toBe('fill_gap');
  });
});
