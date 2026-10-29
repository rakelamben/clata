import type {
  DialogueGraph,
  DialogueNode,
  DialogueChoice,
  DialogueRunState,
  DialogueRunHistoryEntry,
  DialogueEnding,
} from './dialogueTypes';
import { createDialogueError } from './dialogueErrors';

export function calculateDialogueScore(selectedChoices: DialogueRunState['selectedChoices']): number {
  if (selectedChoices.length === 0) return 1.0;

  let totalScore = 0;
  for (const choice of selectedChoices) {
    if (choice.type === 'comprehension') {
      // Direct connected on attempt 1 = 1.0, connected after 1+ repair attempts = 0.5
      totalScore += choice.attempt === 1 ? 1.0 : 0.5;
    } else {
      // Register choice
      if (choice.quality === 'pas') totalScore += 1.0;
      else if (choice.quality === 'cukup-pas') totalScore += 0.75;
      else totalScore += 0.5; // kurang-pas
    }
  }

  const score = totalScore / selectedChoices.length;
  return Math.round(score * 100) / 100;
}

export function initializeDialogueRun(input: {
  dialogue: DialogueGraph;
  sessionId: string;
  runId: string;
  packageId: string;
  packageVersion?: string;
  graphFingerprint?: string;
  now: string;
}): DialogueRunState {
  const { dialogue, sessionId, runId, packageId, packageVersion, graphFingerprint, now } = input;
  const initialNode = dialogue.nodes[0];
  if (!initialNode) {
    throw createDialogueError('INVALID_DIALOG_GRAPH', 'Dialog tidak memiliki node awal.');
  }

  const initialHistory: DialogueRunHistoryEntry = {
    nodeId: initialNode.id,
    speaker: initialNode.speaker,
    text: initialNode.text,
    translation: initialNode.translation,
    audio: initialNode.audio,
  };

  return {
    sessionId,
    runId,
    packageId,
    packageVersion: packageVersion ?? '1.0.0',
    graphFingerprint: graphFingerprint ?? 'fingerprint_default',
    dialogueId: dialogue.id,
    currentNodeId: initialNode.id,
    sequence: 0,
    status: 'in_progress',
    history: [initialHistory],
    selectedChoices: [],
    disconnectedAttempts: 0,
    startedAt: now,
    activeRepair: null,
  };
}

export function getCurrentNode(dialogue: DialogueGraph, runState: DialogueRunState): DialogueNode {
  const node = dialogue.nodes.find((n) => n.id === runState.currentNodeId);
  if (!node) {
    throw createDialogueError('NODE_NOT_FOUND', `Node aktif '${runState.currentNodeId}' tidak ditemukan dalam graf.`);
  }
  return node;
}

export function advanceDialogueRun(input: {
  dialogue: DialogueGraph;
  runState: DialogueRunState;
  now: string;
}): { updatedState: DialogueRunState; nextStep: { type: 'node' | 'ending'; node?: DialogueNode; ending?: DialogueEnding } } {
  const { dialogue, runState, now } = input;

  if (runState.status !== 'in_progress') {
    throw createDialogueError('RUN_ALREADY_COMPLETED', 'Sesi dialog sudah tidak aktif.');
  }

  const currentNode = getCurrentNode(dialogue, runState);
  if (currentNode.choices && currentNode.choices.length > 0) {
    throw createDialogueError('INVALID_CHOICE', 'Node saat ini memerlukan pemilihan opsi respons sebelum melanjutkan.');
  }

  const targetId = currentNode.next;
  if (!targetId) {
    // If no next, check if there is an ending
    const defaultEnding = dialogue.endings[0];
    if (defaultEnding) {
      const finalScore = calculateDialogueScore(runState.selectedChoices);
      const updated: DialogueRunState = {
        ...runState,
        status: 'completed',
        completedAt: now,
        endingId: defaultEnding.id,
        score: finalScore,
      };
      return { updatedState: updated, nextStep: { type: 'ending', ending: defaultEnding } };
    }
    throw createDialogueError('INVALID_DIALOG_GRAPH', 'Node tidak memiliki kelanjutan atau ending yang valid.');
  }

  // Check if target is an ending
  const ending = dialogue.endings.find((e) => e.id === targetId);
  if (ending) {
    const finalScore = calculateDialogueScore(runState.selectedChoices);
    const updated: DialogueRunState = {
      ...runState,
      status: 'completed',
      completedAt: now,
      endingId: ending.id,
      score: finalScore,
    };
    return { updatedState: updated, nextStep: { type: 'ending', ending } };
  }

  // Target is another node
  const nextNode = dialogue.nodes.find((n) => n.id === targetId);
  if (!nextNode) {
    throw createDialogueError('NODE_NOT_FOUND', `Node target '${targetId}' tidak ditemukan.`);
  }

  const newHistoryEntry: DialogueRunHistoryEntry = {
    nodeId: nextNode.id,
    speaker: nextNode.speaker,
    text: nextNode.text,
    translation: nextNode.translation,
    audio: nextNode.audio,
  };

  const updated: DialogueRunState = {
    ...runState,
    currentNodeId: nextNode.id,
    sequence: runState.sequence + 1,
    history: [...runState.history, newHistoryEntry],
    activeRepair: null,
  };

  return { updatedState: updated, nextStep: { type: 'node', node: nextNode } };
}

export function dismissRepairPrompt(runState: DialogueRunState): DialogueRunState {
  return {
    ...runState,
    activeRepair: null,
  };
}

export function applyChoiceToRun(input: {
  dialogue: DialogueGraph;
  runState: DialogueRunState;
  choiceIndex: number;
  now: string;
}): {
  updatedState: DialogueRunState;
  choice: DialogueChoice;
  isRepair: boolean;
  nextStep: { type: 'node' | 'ending' | 'repeat'; node?: DialogueNode; ending?: DialogueEnding };
} {
  const { dialogue, runState, choiceIndex, now } = input;

  if (runState.status !== 'in_progress') {
    throw createDialogueError('RUN_ALREADY_COMPLETED', 'Sesi dialog sudah selesai atau tidak aktif.');
  }

  const currentNode = getCurrentNode(dialogue, runState);
  if (!currentNode.choices || currentNode.choices.length === 0) {
    throw createDialogueError('INVALID_CHOICE', `Node '${currentNode.id}' tidak memiliki pilihan.`);
  }

  const choice = currentNode.choices[choiceIndex];
  if (!choice) {
    throw createDialogueError('INVALID_CHOICE', `Pilihan dengan indeks ${choiceIndex} tidak ditemukan pada node '${currentNode.id}'.`);
  }

  const choiceId = choice.id ?? `choice_${choiceIndex}`;
  const choiceAttemptsOnNode = runState.selectedChoices.filter((c) => c.nodeId === currentNode.id).length + 1;

  // Case 1: Pilihan Tidak Nyambung (Comprehension Repair Loop)
  if (choice.quality === 'tidak-nyambung') {
    const repairResponse = choice.repair ?? {
      text: 'Pangapunten, kula mboten mangertos maksudipun.',
      translation: 'Maaf, saya tidak mengerti maksudnya.',
    };

    const repairHistoryEntry: DialogueRunHistoryEntry = {
      nodeId: currentNode.id,
      speaker: currentNode.speaker === 'user' ? (dialogue.interlocutor || 'lawan bicara') : currentNode.speaker,
      text: repairResponse.text,
      translation: repairResponse.translation,
      audio: repairResponse.audio,
      chosenOptionText: choice.text,
      choiceQuality: choice.quality,
      repairShown: repairResponse,
    };

    const updated: DialogueRunState = {
      ...runState,
      sequence: runState.sequence + 1,
      disconnectedAttempts: runState.disconnectedAttempts + 1,
      activeRepair: repairResponse,
      history: [...runState.history, repairHistoryEntry],
    };

    return {
      updatedState: updated,
      choice,
      isRepair: true,
      nextStep: { type: 'repeat', node: currentNode },
    };
  }

  // Case 2: Pilihan Nyambung (pas / cukup-pas / kurang-pas)
  const choiceRecord = {
    nodeId: currentNode.id,
    choiceId,
    quality: choice.quality,
    type: choice.type,
    attempt: choiceAttemptsOnNode,
  };

  const choiceHistoryEntry: DialogueRunHistoryEntry = {
    nodeId: currentNode.id,
    speaker: 'user',
    text: choice.text,
    translation: choice.translation,
    chosenOptionText: choice.text,
    choiceQuality: choice.quality,
  };

  const selectedChoices = [...runState.selectedChoices, choiceRecord];
  const targetId = choice.next;

  // Check if target is an Ending
  const ending = dialogue.endings.find((e) => e.id === targetId);
  if (ending) {
    const finalScore = calculateDialogueScore(selectedChoices);
    const updated: DialogueRunState = {
      ...runState,
      sequence: runState.sequence + 1,
      status: 'completed',
      completedAt: now,
      endingId: ending.id,
      selectedChoices,
      history: [...runState.history, choiceHistoryEntry],
      activeRepair: null,
      score: finalScore,
    };

    return {
      updatedState: updated,
      choice,
      isRepair: false,
      nextStep: { type: 'ending', ending },
    };
  }

  // Target is another Node
  const nextNode = dialogue.nodes.find((n) => n.id === targetId);
  if (!nextNode) {
    throw createDialogueError('NODE_NOT_FOUND', `Node tujuan '${targetId}' tidak ditemukan.`);
  }

  const nextNodeHistoryEntry: DialogueRunHistoryEntry = {
    nodeId: nextNode.id,
    speaker: nextNode.speaker,
    text: nextNode.text,
    translation: nextNode.translation,
    audio: nextNode.audio,
  };

  const updated: DialogueRunState = {
    ...runState,
    currentNodeId: nextNode.id,
    sequence: runState.sequence + 1,
    selectedChoices,
    history: [...runState.history, choiceHistoryEntry, nextNodeHistoryEntry],
    activeRepair: null,
  };

  return {
    updatedState: updated,
    choice,
    isRepair: false,
    nextStep: { type: 'node', node: nextNode },
  };
}
