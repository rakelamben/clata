import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState } from '../domain/dialogueTypes';

export async function resumeDialogueRun(input: {
  dialogueRepository: DialogueRepository;
  packageId: string;
}): Promise<RepositoryResult<{ runState: DialogueRunState; dialogue: DialogueGraph } | null>> {
  const { dialogueRepository, packageId } = input;

  const activeResult = await dialogueRepository.getActiveRun(packageId);
  if (!activeResult.ok) return activeResult;
  if (!activeResult.data) return { ok: true, data: null };

  const runState = activeResult.data;
  const graphResult = await dialogueRepository.getDialogueGraph(packageId, runState.dialogueId);
  if (!graphResult.ok) return graphResult;

  return { ok: true, data: { runState, dialogue: graphResult.data } };
}
