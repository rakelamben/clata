import { describe, expect, it, vi } from 'vitest';
import { getChallenges } from '../../../src/features/challenges/application/getChallenges';
import { toggleChallengeCheck } from '../../../src/features/challenges/application/toggleChallengeCheck';
import type { ChallengeRepository } from '../../../src/features/challenges/domain/challengeRepository';

describe('challengeUseCases', () => {
  const mockRepo: ChallengeRepository = {
    getChallenges: vi.fn().mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'ch-1',
          packageId: 'jawa-mataraman',
          unitId: 'unit-1',
          level: 'L1',
          title: 'Sapa Tetangga',
          solo: 'Ucapkan salam mandiri.',
          social: 'Sapa tetangga depan rumah.',
          isChecked: false,
        },
      ],
    }),
    toggleChallengeCheck: vi.fn().mockResolvedValue({
      ok: true,
      data: { isChecked: true },
    }),
  };

  it('fetches challenges for package and unit', async () => {
    const result = await getChallenges(mockRepo, 'jawa-mataraman', 'unit-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('ch-1');
    expect(mockRepo.getChallenges).toHaveBeenCalledWith('jawa-mataraman', 'unit-1', undefined);
  });

  it('toggles challenge check state locally', async () => {
    const result = await toggleChallengeCheck({
      repository: mockRepo,
      packageId: 'jawa-mataraman',
      challengeId: 'ch-1',
      variant: 'solo',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.isChecked).toBe(true);
    expect(mockRepo.toggleChallengeCheck).toHaveBeenCalledWith({
      packageId: 'jawa-mataraman',
      challengeId: 'ch-1',
      variant: 'solo',
    });
  });
});
