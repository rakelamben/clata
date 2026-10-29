import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { VocabularyPage, VocabularyPageRequest, VocabularyRepository } from '../domain/vocabularyTypes';

export function searchVocabulary(repository: VocabularyRepository, request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>> {
  return repository.search({ ...request, source: 'dictionary' });
}
