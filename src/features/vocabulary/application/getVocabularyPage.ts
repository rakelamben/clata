import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { VocabularyPage, VocabularyPageRequest, VocabularyRepository } from '../domain/vocabularyTypes';

export function getVocabularyPage(repository: VocabularyRepository, request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>> {
  return repository.getFeedPage({ ...request, source: 'vocabulary_feed' });
}
