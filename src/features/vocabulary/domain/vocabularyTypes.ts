import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';

export type AudioReference = {
  path: string;
  format: 'opus' | 'm4a' | 'aac';
  durationMs: number;
  channels: number;
  sampleRateHz: number;
  status: 'verified' | 'poc' | 'unavailable';
};

export type VocabularyWord = {
  packageId: string;
  packageVersion: string;
  id: string;
  unitId: string;
  curriculumOrder: number;
  lemma: string;
  meaning: string;
  partOfSpeech?: string;
  register: string;
  registerLabel?: string;
  theme?: string;
  level?: string;
  audio: AudioReference | null;
  status: 'verified' | 'poc' | 'draft';
};

export type VocabularyPageRequest = {
  packageId: string;
  cursor?: string;
  limit: number;
  query?: string;
  theme?: string;
  register?: string;
  source: 'vocabulary_feed' | 'dictionary';
};

export type VocabularyPage = {
  items: VocabularyWord[];
  nextCursor: string | null;
  totalMatching?: number;
};

export type VocabularyFilters = { themes: string[]; registers: string[] };

export interface VocabularyRepository {
  getFeedPage(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>>;
  search(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>>;
  getFilters(packageId: string): Promise<RepositoryResult<VocabularyFilters>>;
  getWord(packageId: string, itemId: string): Promise<RepositoryResult<VocabularyWord | null>>;
}
