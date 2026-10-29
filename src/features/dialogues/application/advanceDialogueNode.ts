import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState, DialogueNode, DialogueEnding } from '../domain/dialogueTypes';
import type { Clock } from '../../../domain/ports/Clock';
import { advanceDialogueRun } from '../domain/dialogueGraphEngine';

export async function advanceDialogueNode(input: {
  dialogueRepository: DialogueRepository;
  clock: Clock;
  dialogue: DialogueGraph;
  runState: DialogueRunState;
}): Promise<RepositoryResult<{
  updatedState: DialogueRunState;
  nextStep: { type: 'node' | 'ending'; node?: DialogueNode; ending?: DialogueEnding };
}>> {
  const { dialogueRepository, clock, dialogue, runState } = input;
  const now = clock.now().toISOString();

  const { updatedState, nextStep } = advanceDialogueRun({
    dialogue,
    runState,
    now,
  });

  if (nextStep.type === 'ending' && nextStep.ending) {
    const completeRes = await dialogueRepository.completeDialogueRun({
      runState: updatedState,
      dialogue,
      score: updatedState.score ?? 1.0,
      endingId: nextStep.ending.id,
    });
    if (!completeRes.ok) return completeRes;
  } else {
    const saveRes = await dialogueRepository.saveActiveRun(updatedState);
    if (!saveRes.ok) return saveRes;
  }

  return { ok: true, data: { updatedState, nextStep } };
}
