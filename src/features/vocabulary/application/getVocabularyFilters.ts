import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { VocabularyFilters, VocabularyRepository } from '../domain/vocabularyTypes';

export function getVocabularyFilters(repository: VocabularyRepository, packageId: string): Promise<RepositoryResult<VocabularyFilters>> {
  return repository.getFilters(packageId);
}
