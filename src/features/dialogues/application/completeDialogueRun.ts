import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState } from '../domain/dialogueTypes';

export async function completeDialogueRun(input: {
  dialogueRepository: DialogueRepository;
  runState: DialogueRunState;
  dialogue: DialogueGraph;
  score: number;
  endingId: string;
}): Promise<RepositoryResult<void>> {
  const { dialogueRepository, runState, dialogue, score, endingId } = input;
  return dialogueRepository.completeDialogueRun({
    runState,
    dialogue,
    score,
    endingId,
  });
}
