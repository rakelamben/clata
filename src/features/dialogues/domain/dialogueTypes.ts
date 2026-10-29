export type DialogueSpeakerRole = 'user' | 'interlocutor';

export type DialogueRegister = 'ngoko' | 'krama' | 'krama_inggil' | 'neutral';

export type DialogueLevel = 'L1' | 'L2' | 'L3';

export type DialogueChoiceType = 'register' | 'comprehension';

export type DialogueChoiceQuality = 'pas' | 'cukup-pas' | 'kurang-pas' | 'tidak-nyambung';

export type DialogueEndingQuality = 'pas' | 'cukup-pas' | 'kurang-pas';

export type DialogueRepairResponse = {
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
};

export type DialogueChoice = {
  readonly id?: string;
  readonly text: string;
  readonly translation: string;
  readonly quality: DialogueChoiceQuality;
  readonly type: DialogueChoiceType;
  readonly next: string; // Target node ID or ending ID
  readonly repair?: DialogueRepairResponse;
  readonly feedbackExplanation?: string;
};

export type DialogueNode = {
  readonly id: string;
  readonly speaker: string; // 'user' or interlocutor name (e.g. 'neighbor')
  readonly speakerRole?: DialogueSpeakerRole;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly choices?: readonly DialogueChoice[];
  readonly next?: string; // Default next node if no choices
  readonly targetWordIds?: readonly string[];
};

export type DialogueEnding = {
  readonly id: string;
  readonly quality: DialogueEndingQuality;
  readonly feedback: string;
  readonly learningPoints?: readonly string[];
};

export type DialogueGraph = {
  readonly id: string;
  readonly title: string;
  readonly unit_id?: string;
  readonly unitId?: string;
  readonly level: DialogueLevel;
  readonly register: DialogueRegister;
  readonly interlocutor: string;
  readonly interlocutorTitle?: string;
  readonly contextDescription?: string;
  readonly target_word_ids?: readonly string[];
  readonly targetWordIds?: readonly string[];
  readonly maxNewWords?: number;
  readonly nodes: readonly DialogueNode[];
  readonly endings: readonly DialogueEnding[];
  readonly packageId?: string;
  readonly packageVersion?: string;
  readonly graphFingerprint?: string;
};

export type DialogueRunStatus = 'in_progress' | 'completed' | 'interrupted' | 'abandoned';

export type DialogueRunHistoryEntry = {
  readonly nodeId: string;
  readonly speaker: string;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly chosenOptionText?: string;
  readonly choiceQuality?: DialogueChoiceQuality;
  readonly repairShown?: DialogueRepairResponse;
};

export type DialogueRunChoiceRecord = {
  readonly nodeId: string;
  readonly choiceId: string;
  readonly quality: DialogueChoiceQuality;
  readonly type: DialogueChoiceType;
  readonly attempt: number;
};

export type DialogueRunState = {
  readonly sessionId: string;
  readonly runId: string;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly graphFingerprint: string;
  readonly dialogueId: string;
  readonly currentNodeId: string;
  readonly sequence: number;
  readonly status: DialogueRunStatus;
  readonly history: readonly DialogueRunHistoryEntry[];
  readonly selectedChoices: readonly DialogueRunChoiceRecord[];
  readonly disconnectedAttempts: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly endingId?: string;
  readonly activeRepair?: DialogueRepairResponse | null;
  readonly score?: number;
};

export type DialogueListItem = {
  readonly id: string;
  readonly title: string;
  readonly unitId: string;
  readonly level: DialogueLevel;
  readonly register: DialogueRegister;
  readonly interlocutor: string;
  readonly contextDescription?: string;
  readonly turnCount: number;
  readonly isCompleted: boolean;
  readonly bestScore?: number;
};
