import { describe, expect, it, vi } from 'vitest';
import { startDialogueRun } from '../../../src/features/dialogues/application/startDialogueRun';
import { submitDialogueChoice } from '../../../src/features/dialogues/application/submitDialogueChoice';
import { abandonDialogueRun } from '../../../src/features/dialogues/application/abandonDialogueRun';
import type { DialogueRepository } from '../../../src/features/dialogues/domain/dialogueRepository';
import type { DialogueGraph, DialogueRunState } from '../../../src/features/dialogues/domain/dialogueTypes';
import type { SQLiteProgressRepository } from '../../../src/features/progress/data/progressRepository';
import type { Clock } from '../../../src/domain/ports/Clock';

describe('dialogueUseCases', () => {
  const sampleGraph: DialogueGraph = {
    id: 'dlg-sapaan',
    title: 'Sapaan Pagi',
    level: 'L1',
    register: 'neutral',
    interlocutor: 'Tetangga',
    nodes: [
      {
        id: 'n0',
        speaker: 'user',
        text: 'Sugeng enjing.',
        translation: 'Selamat pagi.',
        choices: [
          { text: 'Sugeng enjing.', translation: 'Selamat pagi.', quality: 'pas', type: 'register', next: 'n1' },
          { text: 'Sugeng dalu.', translation: 'Selamat malam.', quality: 'kurang-pas', type: 'register', next: 'n1' },
        ],
      },
      {
        id: 'n1',
        speaker: 'Tetangga',
        text: 'Sugeng enjing ugi.',
        translation: 'Selamat pagi juga.',
        choices: [
          { text: 'Nggih.', translation: 'Ya.', quality: 'pas', type: 'comprehension', next: 'n2' },
          { text: 'Turu.', translation: 'Tidur.', quality: 'tidak-nyambung', type: 'comprehension', next: 'n1', repair: { text: 'Pripun?', translation: 'Bagaimana?' } },
        ],
      },
      { id: 'n2', speaker: 'user', text: 'Kados pundi kabare?', translation: 'Bagaimana kabarnya?', next: 'n3' },
      { id: 'n3', speaker: 'Tetangga', text: 'Sae.', translation: 'Baik.', next: 'n4' },
      { id: 'n4', speaker: 'user', text: 'Matur nuwun.', translation: 'Terima kasih.', next: 'n5' },
      { id: 'n5', speaker: 'Tetangga', text: 'Sami-sami.', translation: 'Sama-sama.', next: 'end-1' },
    ],
    endings: [{ id: 'end-1', quality: 'pas', feedback: 'Bagus sekali.' }],
  };

  const mockRepo: DialogueRepository = {
    listDialogues: vi.fn(),
    getDialogueGraph: vi.fn().mockResolvedValue({ ok: true, data: sampleGraph }),
    getActiveRun: vi.fn().mockResolvedValue({ ok: true, data: null }),
    saveActiveRun: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    clearActiveRun: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    completeDialogueRun: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
  };

  const mockProgress = {
    appendEvent: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
  } as unknown as SQLiteProgressRepository;

  const mockClock: Clock = {
    now: () => new Date('2026-10-29T20:00:00.000Z'),
  };

  it('starts dialogue run and emits dialogue_started and session_started events', async () => {
    const result = await startDialogueRun({
      dialogueRepository: mockRepo,
      progressRepository: mockProgress,
      clock: mockClock,
      deviceId: 'dev-1',
      packageId: 'jawa-mataraman',
      dialogueId: 'dlg-sapaan',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.runState.currentNodeId).toBe('n0');
    expect(mockProgress.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'session_started' }),
    );
    expect(mockProgress.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dialogue_started' }),
    );
    expect(mockRepo.saveActiveRun).toHaveBeenCalled();
  });

  it('submits a choice and updates state', async () => {
    const runState: DialogueRunState = {
      sessionId: 'ses-1',
      runId: 'run-1',
      packageId: 'jawa-mataraman',
      packageVersion: '1.0.0',
      graphFingerprint: 'fp-1',
      dialogueId: 'dlg-sapaan',
      currentNodeId: 'n0',
      sequence: 0,
      status: 'in_progress',
      history: [{ nodeId: 'n0', speaker: 'user', text: 'Sugeng enjing.', translation: 'Selamat pagi.' }],
      selectedChoices: [],
      disconnectedAttempts: 0,
      startedAt: '2026-10-29T20:00:00.000Z',
    };

    const result = await submitDialogueChoice({
      dialogueRepository: mockRepo,
      progressRepository: mockProgress,
      clock: mockClock,
      deviceId: 'dev-1',
      dialogue: sampleGraph,
      runState,
      choiceIndex: 0, // pas
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.updatedState.currentNodeId).toBe('n1');
    expect(mockProgress.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dialogue_choice' }),
    );
  });

  it('clears active run on abandon', async () => {
    const result = await abandonDialogueRun(mockRepo, 'ses-1');
    expect(result.ok).toBe(true);
    expect(mockRepo.clearActiveRun).toHaveBeenCalledWith('ses-1');
  });
});
