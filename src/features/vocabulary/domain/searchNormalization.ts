export function normalizeVocabularySearch(value: string): string {
  return value
    .toLocaleLowerCase('id-ID')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesVocabularySearch(word: { lemma: string; meaning: string; theme?: string; registerLabel?: string }, query: string): boolean {
  const normalizedQuery = normalizeVocabularySearch(query);
  if (!normalizedQuery) return true;
  return [word.lemma, word.meaning, word.theme ?? '', word.registerLabel ?? '']
    .some((value) => normalizeVocabularySearch(value).includes(normalizedQuery));
}
