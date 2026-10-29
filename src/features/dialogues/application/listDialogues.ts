import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueListItem } from '../domain/dialogueTypes';

export async function listDialogues(
  repository: DialogueRepository,
  packageId: string,
  unitId?: string,
): Promise<RepositoryResult<DialogueListItem[]>> {
  return repository.listDialogues(packageId, unitId);
}
