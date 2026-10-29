import { describe, expect, it } from 'vitest';

import { matchesVocabularySearch, normalizeVocabularySearch } from '../../../src/features/vocabulary/domain/searchNormalization';

describe('vocabulary search normalization', () => {
  it('normalizes accents and Javanese digraphs', () => {
    expect(normalizeVocabularySearch('É dhahar THUKUL')).toBe('e dahar tukul');
  });

  it('matches normalized display fields without changing source text', () => {
    const word = { lemma: 'Dhahar', meaning: 'Makan', theme: 'Harian', registerLabel: 'Netral' };
    expect(matchesVocabularySearch(word, 'dahar')).toBe(true);
    expect(word.lemma).toBe('Dhahar');
  });
});
