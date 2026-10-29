import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueGraph, DialogueListItem, DialogueRunState } from './dialogueTypes';

export interface DialogueRepository {
  listDialogues(packageId: string, unitId?: string): Promise<RepositoryResult<DialogueListItem[]>>;
  getDialogueGraph(packageId: string, dialogueId: string): Promise<RepositoryResult<DialogueGraph>>;
  getActiveRun(packageId: string): Promise<RepositoryResult<DialogueRunState | null>>;
  saveActiveRun(runState: DialogueRunState): Promise<RepositoryResult<void>>;
  clearActiveRun(sessionId: string): Promise<RepositoryResult<void>>;
  completeDialogueRun(input: {
    runState: DialogueRunState;
    dialogue: DialogueGraph;
    score: number;
    endingId: string;
  }): Promise<RepositoryResult<void>>;
}
