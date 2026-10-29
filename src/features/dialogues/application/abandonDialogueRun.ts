import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';

export async function abandonDialogueRun(
  dialogueRepository: DialogueRepository,
  sessionId: string,
): Promise<RepositoryResult<void>> {
  return dialogueRepository.clearActiveRun(sessionId);
}
