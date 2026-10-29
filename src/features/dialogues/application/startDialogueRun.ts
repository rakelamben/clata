import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState } from '../domain/dialogueTypes';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';
import type { Clock } from '../../../domain/ports/Clock';
import { initializeDialogueRun } from '../domain/dialogueGraphEngine';
import { validateDialogueGraph } from '../domain/dialogueGraphValidator';
import { createDialogueError } from '../domain/dialogueErrors';

export async function startDialogueRun(input: {
  dialogueRepository: DialogueRepository;
  progressRepository: SQLiteProgressRepository;
  clock: Clock;
  deviceId: string;
  packageId: string;
  dialogueId: string;
  packageVersion?: string;
}): Promise<RepositoryResult<{ runState: DialogueRunState; dialogue: DialogueGraph }>> {
  const { dialogueRepository, progressRepository, clock, deviceId, packageId, dialogueId, packageVersion } = input;

  const graphResult = await dialogueRepository.getDialogueGraph(packageId, dialogueId);
  if (!graphResult.ok) return graphResult;
  const dialogue = graphResult.data;

  // Validate graph rules
  const validation = validateDialogueGraph(dialogue);
  if (!validation.ok) {
    return {
      ok: false,
      error: createDialogueError('INVALID_DIALOG_GRAPH', 'Struktur graf dialog tidak memenuhi standar PRD.', {
        issues: validation.issues,
      }),
    };
  }

  const now = clock.now().toISOString();
  const today = now.slice(0, 10);
  const sessionId = `ses_dlg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const runId = `run_dlg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const runState = initializeDialogueRun({
    dialogue,
    sessionId,
    runId,
    packageId,
    packageVersion: packageVersion ?? dialogue.packageVersion ?? '1.0.0',
    graphFingerprint: dialogue.graphFingerprint ?? 'fingerprint_default',
    now,
  });

  // 1. Emit session_started event
  const sessionStartedEvent = {
    eventId: `ses_start_${sessionId}`,
    localSequence: 0,
    deviceId,
    packageId,
    eventType: 'session_started' as const,
    source: 'system' as const,
    weight: 1.0,
    sessionId,
    deviceTime: now,
    localDate: today,
    formulaVersion: 1,
    payload: {
      sessionId,
      exerciseType: 'dialogue' as const,
      completed: false,
      startedAt: now,
    },
  };
  await progressRepository.appendEvent(sessionStartedEvent);

  // 2. Emit dialogue_started event
  const dialogueStartedEvent = {
    eventId: `dlg_start_${runId}`,
    localSequence: 0,
    deviceId,
    packageId,
    itemId: dialogueId,
    eventType: 'dialogue_started' as const,
    source: 'dialogue' as const,
    weight: 1.0,
    sessionId,
    deviceTime: now,
    localDate: today,
    formulaVersion: 1,
    payload: {
      sessionId,
      runId,
      sequence: 0,
      packageVersion: runState.packageVersion,
      graphFingerprint: runState.graphFingerprint,
      dialogueId,
      startedAt: now,
    },
  };
  await progressRepository.appendEvent(dialogueStartedEvent);

  // 3. Save active run state
  const saveResult = await dialogueRepository.saveActiveRun(runState);
  if (!saveResult.ok) return saveResult;

  return { ok: true, data: { runState, dialogue } };
}
