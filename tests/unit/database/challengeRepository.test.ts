import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { ChallengeRepository } from '../../../src/infrastructure/database/challengeRepository';

describe('ChallengeRepository', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: ChallengeRepository;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new ChallengeRepository(db);
  });

  it('returns null when challenge has not been checked', async () => {
    const progress = await repo.getChallengeProgress('jawa-mataraman', 'ch-1');
    expect(progress).toBeNull();
  });

  it('toggles challenge from unchecked to completed', async () => {
    const saved = await repo.toggleChallenge('jawa-mataraman', 'ch-1', 'solo');
    expect(saved.package_id).toBe('jawa-mataraman');
    expect(saved.challenge_id).toBe('ch-1');
    expect(saved.is_completed).toBe(1);
    expect(saved.completed_variant).toBe('solo');
    expect(saved.completed_at).toBeTruthy();

    const fetched = await repo.getChallengeProgress('jawa-mataraman', 'ch-1');
    expect(fetched).not.toBeNull();
    expect(fetched?.is_completed).toBe(1);
  });

  it('toggles challenge back to uncompleted when called again', async () => {
    await repo.toggleChallenge('jawa-mataraman', 'ch-1', 'social');
    const toggled = await repo.toggleChallenge('jawa-mataraman', 'ch-1', 'social');

    expect(toggled.is_completed).toBe(0);
    expect(toggled.completed_at).toBeNull();
  });

  it('retrieves challenge progress map for a package', async () => {
    await repo.toggleChallenge('pkg-1', 'c-1', 'solo');
    await repo.toggleChallenge('pkg-1', 'c-2', 'social');
    await repo.toggleChallenge('pkg-2', 'c-3', 'solo');

    const map = await repo.getChallengeProgressMap('pkg-1');
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['c-1'].is_completed).toBe(1);
    expect(map['c-2'].completed_variant).toBe('social');
    expect(map['c-3']).toBeUndefined();
  });

  it('resets challenge record', async () => {
    await repo.toggleChallenge('pkg-1', 'c-1', 'solo');
    await repo.resetChallenge('pkg-1', 'c-1');

    const progress = await repo.getChallengeProgress('pkg-1', 'c-1');
    expect(progress).toBeNull();
  });
});
