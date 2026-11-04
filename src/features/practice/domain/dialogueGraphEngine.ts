import type {
  DialogueEndingItem,
  DialogueItem,
  DialogueNodeItem,
} from '../../../domain/package/packageTypes';
import type {
  DialogueRunHistoryEntry,
  DialogueRunState,
  DialogueSelectedChoiceRecord,
  DialogueStepResult,
} from './dialogueTypes';

export function calculateDialogueScore(
  selectedChoices: readonly DialogueSelectedChoiceRecord[],
): number {
  if (selectedChoices.length === 0) return 1.0;

  let totalScore = 0;
  for (const choice of selectedChoices) {
    if (choice.type === 'comprehension') {
      totalScore += choice.attempt === 1 ? 1.0 : 0.5;
    } else {
      if (choice.quality === 'pas') {
        totalScore += 1.0;
      } else if (choice.quality === 'cukup-pas') {
        totalScore += 0.75;
      } else {
        totalScore += 0.5;
      }
    }
  }

  const average = totalScore / selectedChoices.length;
  return Math.round(average * 100) / 100;
}

export function resolveEnding(
  dialogue: DialogueItem,
  selectedChoices: readonly DialogueSelectedChoiceRecord[],
  targetId?: string,
): DialogueEndingItem | undefined {
  if (!dialogue.endings || dialogue.endings.length === 0) {
    return undefined;
  }

  // 1. Jika targetId persis cocok dengan id salah satu ending
  if (targetId) {
    const directEnding = dialogue.endings.find((e) => e.id === targetId);
    if (directEnding) return directEnding;
  }

  // 2. Jika targetId bernilai 'end' atau tidak spesifik, cocokkan berdasarkan kualitas kumulatif pilihan
  const hasKurangPas = selectedChoices.some(
    (c) => c.quality === 'kurang-pas' || c.attempt > 1,
  );

  if (hasKurangPas) {
    const kurangPasEnding = dialogue.endings.find((e) => e.quality === 'kurang-pas');
    if (kurangPasEnding) return kurangPasEnding;
  }

  const pasEnding = dialogue.endings.find((e) => e.quality === 'pas');
  return pasEnding || dialogue.endings[0];
}

export function initializeDialogueRun(dialogue: DialogueItem): DialogueRunState {
  const nodes = dialogue.nodes as DialogueNodeItem[];
  const initialNode = nodes[0];
  if (!initialNode) {
    throw new Error(`Dialog '${dialogue.id}' tidak memiliki node awal.`);
  }

  const history: DialogueRunHistoryEntry[] = [];

  // Jika node awal adalah ucapan lawan bicara / bukan dari user, masukkan ke history
  if (initialNode.speaker !== 'user' && initialNode.text) {
    history.push({
      nodeId: initialNode.id,
      speaker: initialNode.speaker,
      text: initialNode.text,
      translation: initialNode.translation,
      audio: initialNode.audio,
      isUser: false,
    });
  }

  return {
    dialogueId: dialogue.id,
    currentNodeId: initialNode.id,
    sequence: 0,
    status: 'in_progress',
    history,
    selectedChoices: [],
    activeRepair: null,
  };
}

export function getCurrentNode(
  dialogue: DialogueItem,
  runState: DialogueRunState,
): DialogueNodeItem | undefined {
  const nodes = dialogue.nodes as DialogueNodeItem[];
  return nodes.find((n) => n.id === runState.currentNodeId);
}

export function dismissRepairPrompt(runState: DialogueRunState): DialogueRunState {
  return {
    ...runState,
    activeRepair: null,
  };
}

export function advanceDialogueRun(
  dialogue: DialogueItem,
  runState: DialogueRunState,
): DialogueStepResult {
  if (runState.status !== 'in_progress') {
    throw new Error('Sesi percakapan sudah selesai.');
  }

  const currentNode = getCurrentNode(dialogue, runState);
  if (!currentNode) {
    throw new Error(`Node '${runState.currentNodeId}' tidak ditemukan.`);
  }

  const targetId = currentNode.next;

  // Cek apakah menuju ending
  if (!targetId || targetId === 'end' || dialogue.endings?.some((e) => e.id === targetId)) {
    const ending = resolveEnding(dialogue, runState.selectedChoices, targetId);
    const score = calculateDialogueScore(runState.selectedChoices);

    const updatedState: DialogueRunState = {
      ...runState,
      status: 'completed',
      endingId: ending?.id,
      completedEnding: ending,
      score,
      activeRepair: null,
    };

    return {
      updatedState,
      isRepair: false,
      nextStep: {
        type: 'ending',
        ending,
      },
    };
  }

  // Melangkah ke node target
  const nodes = dialogue.nodes as DialogueNodeItem[];
  const nextNode = nodes.find((n) => n.id === targetId);
  if (!nextNode) {
    throw new Error(`Node target '${targetId}' tidak ditemukan.`);
  }

  const history = [...runState.history];
  if (nextNode.text) {
    const isUserSpeaker = nextNode.speaker === 'user';
    const speakerLabel = isUserSpeaker
      ? 'user'
      : ((dialogue.partner || nextNode.speaker || dialogue.interlocutor || 'Lawan Bicara') as string);

    history.push({
      nodeId: nextNode.id,
      speaker: speakerLabel,
      text: nextNode.text,
      translation: nextNode.translation,
      audio: nextNode.audio,
      isUser: isUserSpeaker,
    });
  }

  const updatedState: DialogueRunState = {
    ...runState,
    currentNodeId: nextNode.id,
    sequence: runState.sequence + 1,
    history,
    activeRepair: null,
  };

  return {
    updatedState,
    isRepair: false,
    nextStep: {
      type: 'node',
      node: nextNode,
    },
  };
}

export function applyChoiceToRun(
  dialogue: DialogueItem,
  runState: DialogueRunState,
  choiceIndex: number,
): DialogueStepResult {
  if (runState.status !== 'in_progress') {
    throw new Error('Sesi percakapan sudah selesai.');
  }

  const currentNode = getCurrentNode(dialogue, runState);
  if (!currentNode || !currentNode.choices || currentNode.choices.length === 0) {
    throw new Error(`Node '${runState.currentNodeId}' tidak memiliki pilihan.`);
  }

  const choice = currentNode.choices[choiceIndex];
  if (!choice) {
    throw new Error(`Pilihan dengan indeks ${choiceIndex} tidak ditemukan.`);
  }

  const attempt =
    runState.selectedChoices.filter((c) => c.nodeId === currentNode.id).length + 1;

  // Kasus 1: Pilihan Tidak Nyambung (Comprehension Repair Loop)
  if (choice.quality === 'tidak-nyambung') {
    const repair = choice.repair ?? {
      text: 'Ngapunten, mboten nyambung kalih konteks percakapan.',
      translation: 'Maaf, kurang sesuai konteks percakapan.',
      audio: choice.audio,
    };

    const userRepairEntry: DialogueRunHistoryEntry = {
      nodeId: currentNode.id,
      speaker: 'user',
      text: choice.text,
      translation: choice.translation,
      audio: choice.audio,
      isUser: true,
      isRepair: true,
    };

    const partnerSpeaker = (dialogue.partner ||
      dialogue.interlocutor ||
      currentNode.speaker ||
      'Lawan Bicara') as string;
    const partnerRepairEntry: DialogueRunHistoryEntry = {
      nodeId: currentNode.id,
      speaker: partnerSpeaker,
      text: repair.text,
      translation: repair.translation,
      audio: repair.audio,
      isUser: false,
      isRepair: true,
    };

    const updatedState: DialogueRunState = {
      ...runState,
      history: [...runState.history, userRepairEntry, partnerRepairEntry],
      activeRepair: repair,
    };

    return {
      updatedState,
      isRepair: true,
      nextStep: {
        type: 'repeat',
        node: currentNode,
      },
    };
  }

  // Kasus 2: Pilihan Valid ('pas' / 'cukup-pas' / 'kurang-pas')
  const choiceRecord: DialogueSelectedChoiceRecord = {
    nodeId: currentNode.id,
    choiceId: `choice_${choiceIndex}`,
    quality: choice.quality,
    type: choice.type || 'register',
    attempt,
  };

  let coachingNote: string | undefined;
  if (choice.quality === 'kurang-pas') {
    const idealChoice = currentNode.choices.find((c) => c.quality === 'pas');
    if (idealChoice) {
      coachingNote = `Kalimat kurang pas untuk situasi percakapan ini, gunakan: "${idealChoice.text}"`;
    } else {
      coachingNote = 'Kalimat kurang pas untuk situasi percakapan ini.';
    }
  }

  const selectedChoices = [...runState.selectedChoices, choiceRecord];
  const history: DialogueRunHistoryEntry[] = [
    ...runState.history,
    {
      nodeId: currentNode.id,
      speaker: 'user',
      text: choice.text,
      translation: choice.translation,
      audio: choice.audio,
      isUser: true,
      coachingNote,
    },
  ];

  const targetId = choice.next || currentNode.next;

  // Cek apakah mencapai ending
  if (!targetId || targetId === 'end' || dialogue.endings?.some((e) => e.id === targetId)) {
    const ending = resolveEnding(dialogue, selectedChoices, targetId);
    const score = calculateDialogueScore(selectedChoices);

    const updatedState: DialogueRunState = {
      ...runState,
      sequence: runState.sequence + 1,
      status: 'completed',
      endingId: ending?.id,
      completedEnding: ending,
      score,
      selectedChoices,
      history,
      activeRepair: null,
    };

    return {
      updatedState,
      isRepair: false,
      nextStep: {
        type: 'ending',
        ending,
      },
    };
  }

  // Melangkah ke node target
  const nodes = dialogue.nodes as DialogueNodeItem[];
  const nextNode = nodes.find((n) => n.id === targetId);
  if (!nextNode) {
    throw new Error(`Node target '${targetId}' tidak ditemukan.`);
  }

  // Jika node target memiliki teks, masukkan ke history
  if (nextNode.text) {
    const isUserSpeaker = nextNode.speaker === 'user';
    const speakerLabel = isUserSpeaker
      ? 'user'
      : ((dialogue.partner || nextNode.speaker || dialogue.interlocutor || 'Lawan Bicara') as string);

    history.push({
      nodeId: nextNode.id,
      speaker: speakerLabel,
      text: nextNode.text,
      translation: nextNode.translation,
      audio: nextNode.audio,
      isUser: isUserSpeaker,
    });
  }

  const updatedState: DialogueRunState = {
    ...runState,
    currentNodeId: nextNode.id,
    sequence: runState.sequence + 1,
    selectedChoices,
    history,
    activeRepair: null,
  };

  return {
    updatedState,
    isRepair: false,
    nextStep: {
      type: 'node',
      node: nextNode,
    },
  };
}
