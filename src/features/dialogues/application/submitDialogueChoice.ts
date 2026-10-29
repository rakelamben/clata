import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState, DialogueChoice, DialogueNode, DialogueEnding } from '../domain/dialogueTypes';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';
import type { Clock } from '../../../domain/ports/Clock';
import { applyChoiceToRun } from '../domain/dialogueGraphEngine';

export async function submitDialogueChoice(input: {
  dialogueRepository: DialogueRepository;
  progressRepository: SQLiteProgressRepository;
  clock: Clock;
  deviceId: string;
  dialogue: DialogueGraph;
  runState: DialogueRunState;
  choiceIndex: number;
}): Promise<RepositoryResult<{
  updatedState: DialogueRunState;
  choice: DialogueChoice;
  isRepair: boolean;
  nextStep: { type: 'node' | 'ending' | 'repeat'; node?: DialogueNode; ending?: DialogueEnding };
}>> {
  const { dialogueRepository, progressRepository, clock, deviceId, dialogue, runState, choiceIndex } = input;
  const now = clock.now().toISOString();
  const today = now.slice(0, 10);

  const result = applyChoiceToRun({
    dialogue,
    runState,
    choiceIndex,
    now,
  });

  const { updatedState, choice, nextStep } = result;
  const choiceId = choice.id ?? `opt_${choiceIndex}`;

  // 1. Emit dialogue_choice event
  const choiceEvent = {
    eventId: `dlg_choice_${runState.runId}_${updatedState.sequence}`,
    localSequence: 0,
    deviceId,
    packageId: runState.packageId,
    itemId: runState.dialogueId,
    eventType: 'dialogue_choice' as const,
    source: 'dialogue' as const,
    weight: 1.0,
    sessionId: runState.sessionId,
    deviceTime: now,
    localDate: today,
    formulaVersion: 1,
    payload: {
      sessionId: runState.sessionId,
      runId: runState.runId,
      sequence: updatedState.sequence,
      packageVersion: runState.packageVersion,
      graphFingerprint: runState.graphFingerprint,
      dialogueId: runState.dialogueId,
      nodeId: runState.currentNodeId,
      choiceId,
      choiceType: choice.type,
      quality: choice.quality,
    },
  };

  await progressRepository.appendEvent(choiceEvent);

  // 2. If target word was exposed in choice or next step, emit word_viewed (curated_dialogue_target)
  if (nextStep.node?.targetWordIds && nextStep.node.targetWordIds.length > 0) {
    for (const wordId of nextStep.node.targetWordIds) {
      await progressRepository.appendEvent({
        eventId: `word_view_${runState.sessionId}_${wordId}_${updatedState.sequence}`,
        localSequence: 0,
        deviceId,
        packageId: runState.packageId,
        itemId: wordId,
        eventType: 'word_viewed' as const,
        source: 'dialogue' as const,
        weight: 1.0,
        sessionId: runState.sessionId,
        deviceTime: now,
        localDate: today,
        formulaVersion: 1,
        payload: {
          itemId: wordId,
          viewedFrom: 'curated_dialogue_target' as const,
          durationMs: 3000,
          foreground: true,
        },
      });
    }
  }

  // 3. If ending reached, complete the run via repository
  if (nextStep.type === 'ending' && nextStep.ending) {
    const completeRes = await dialogueRepository.completeDialogueRun({
      runState: updatedState,
      dialogue,
      score: updatedState.score ?? 1.0,
      endingId: nextStep.ending.id,
    });
    if (!completeRes.ok) return completeRes;
  } else {
    // Save updated active run
    const saveRes = await dialogueRepository.saveActiveRun(updatedState);
    if (!saveRes.ok) return saveRes;
  }

  return { ok: true, data: result };
}
