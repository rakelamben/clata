import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { WordViewRepository } from '../../../src/infrastructure/database/wordViewRepository';

describe('WordViewRepository', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: WordViewRepository;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new WordViewRepository(db);
  });

  it('records a new word view correctly', async () => {
    const record = await repo.recordWordView('jawa-mataraman', 'kata-nedha');

    expect(record.package_id).toBe('jawa-mataraman');
    expect(record.word_id).toBe('kata-nedha');
    expect(record.view_count).toBe(1);
    expect(record.first_viewed_at).toBeTruthy();
    expect(record.last_viewed_at).toBe(record.first_viewed_at);

    const fetched = await repo.getWordView('jawa-mataraman', 'kata-nedha');
    expect(fetched).toEqual(record);
  });

  it('increments view count and updates last_viewed_at on subsequent views', async () => {
    const first = await repo.recordWordView('jawa-mataraman', 'kata-nedha');
    const second = await repo.recordWordView('jawa-mataraman', 'kata-nedha');

    expect(second.view_count).toBe(2);
    expect(second.first_viewed_at).toBe(first.first_viewed_at);
    expect(new Date(second.last_viewed_at).getTime()).toBeGreaterThanOrEqual(
      new Date(first.last_viewed_at).getTime(),
    );
  });

  it('retrieves map of all viewed words for a package', async () => {
    await repo.recordWordView('jawa-mataraman', 'kata-1');
    await repo.recordWordView('jawa-mataraman', 'kata-2');
    await repo.recordWordView('sunda-priangan', 'kata-sunda');

    const map = await repo.getWordViewMap('jawa-mataraman');
    expect(map.size).toBe(2);
    expect(map.has('kata-1')).toBe(true);
    expect(map.has('kata-2')).toBe(true);
    expect(map.has('kata-sunda')).toBe(false);
  });
});
