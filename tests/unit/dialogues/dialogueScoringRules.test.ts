import { describe, expect, it } from 'vitest';
import { calculateDialogueScore } from '../../../src/features/dialogues/domain/dialogueGraphEngine';
import type { DialogueRunState } from '../../../src/features/dialogues/domain/dialogueTypes';

describe('dialogueScoringRules', () => {
  it('returns 1.0 for perfect choices on first attempt', () => {
    const choices: DialogueRunState['selectedChoices'] = [
      { nodeId: 'n0', choiceId: 'c1', quality: 'pas', type: 'register', attempt: 1 },
      { nodeId: 'n1', choiceId: 'c2', quality: 'pas', type: 'comprehension', attempt: 1 },
    ];
    expect(calculateDialogueScore(choices)).toBe(1.0);
  });

  it('awards 0.5 for comprehension connected after repair attempts', () => {
    const choices: DialogueRunState['selectedChoices'] = [
      { nodeId: 'n0', choiceId: 'c1', quality: 'pas', type: 'register', attempt: 1 }, // 1.0
      { nodeId: 'n1', choiceId: 'c2', quality: 'pas', type: 'comprehension', attempt: 2 }, // 0.5 (was repeated)
    ];
    expect(calculateDialogueScore(choices)).toBe(0.75);
  });

  it('weights register qualities appropriately (cukup=0.75, kurang=0.5)', () => {
    const choices: DialogueRunState['selectedChoices'] = [
      { nodeId: 'n0', choiceId: 'c1', quality: 'kurang-pas', type: 'register', attempt: 1 }, // 0.5
      { nodeId: 'n1', choiceId: 'c2', quality: 'cukup-pas', type: 'register', attempt: 1 }, // 0.75
    ];
    // (0.5 + 0.75) / 2 = 0.625 -> 0.63
    expect(calculateDialogueScore(choices)).toBe(0.63);
  });
});
