import type { DialogueEndingItem, DialogueNodeItem, DialogueRepairItem } from '../../../domain/package/packageTypes';

export type DialogueChoiceQuality = 'pas' | 'cukup-pas' | 'kurang-pas' | 'tidak-nyambung' | string;

export interface DialogueRunHistoryEntry {
  nodeId: string;
  speaker: string;
  text: string;
  translation: string;
  audio?: string;
  isUser: boolean;
  isRepair?: boolean;
  coachingNote?: string;
}

export interface DialogueSelectedChoiceRecord {
  nodeId: string;
  choiceId: string;
  quality: DialogueChoiceQuality;
  type: string;
  attempt: number;
}

export interface DialogueRunState {
  dialogueId: string;
  currentNodeId: string;
  sequence: number;
  status: 'in_progress' | 'completed';
  history: DialogueRunHistoryEntry[];
  selectedChoices: DialogueSelectedChoiceRecord[];
  activeRepair: DialogueRepairItem | null;
  score?: number;
  endingId?: string;
  completedEnding?: DialogueEndingItem | null;
}

export interface DialogueStepResult {
  updatedState: DialogueRunState;
  isRepair: boolean;
  nextStep: {
    type: 'node' | 'ending' | 'repeat';
    node?: DialogueNodeItem;
    ending?: DialogueEndingItem;
  };
}
