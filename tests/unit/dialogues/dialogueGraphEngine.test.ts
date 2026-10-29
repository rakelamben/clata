import { describe, expect, it } from 'vitest';
import {
  initializeDialogueRun,
  applyChoiceToRun,
  advanceDialogueRun,
} from '../../../src/features/dialogues/domain/dialogueGraphEngine';
import type { DialogueGraph } from '../../../src/features/dialogues/domain/dialogueTypes';

describe('dialogueGraphEngine', () => {
  const testGraph: DialogueGraph = {
    id: 'dlg-1',
    title: 'Menyapa Teman',
    level: 'L1',
    register: 'ngoko',
    interlocutor: 'Budi',
    nodes: [
      {
        id: 'n0',
        speaker: 'user',
        text: 'Piye kabare?',
        translation: 'Bagaimana kabarnya?',
        choices: [
          { text: 'Piye kabare?', translation: 'Bagaimana kabarnya?', quality: 'pas', type: 'register', next: 'n1' },
          { text: 'Kados pundi kabare?', translation: 'Bagaimana kabarnya?', quality: 'kurang-pas', type: 'register', next: 'n1' },
        ],
      },
      {
        id: 'n1',
        speaker: 'Budi',
        text: 'Apik wae, kowe?',
        translation: 'Baik saja, kamu?',
        choices: [
          { text: 'Aku ya apik.', translation: 'Aku juga baik.', quality: 'pas', type: 'comprehension', next: 'n2' },
          {
            text: 'Turu.',
            translation: 'Tidur.',
            quality: 'tidak-nyambung',
            type: 'comprehension',
            next: 'n1',
            repair: { text: 'Lho kok turu? Tak takoni kabarmu.', translation: 'Lho kok tidur? Kan aku tanya kabarmu.' },
          },
        ],
      },
      {
        id: 'n2',
        speaker: 'user',
        text: 'Syukurlah nek ngono.',
        translation: 'Syukurlah kalau begitu.',
        next: 'n3',
      },
      {
        id: 'n3',
        speaker: 'Budi',
        text: 'Yo wis, tak mangkat dhisik ya.',
        translation: 'Ya sudah, aku berangkat dulu ya.',
        next: 'n4',
      },
      {
        id: 'n4',
        speaker: 'user',
        text: 'Iyo, ati-ati.',
        translation: 'Iya, hati-hati.',
        next: 'n5',
      },
      {
        id: 'n5',
        speaker: 'Budi',
        text: 'Sip.',
        translation: 'Sip.',
        next: 'end-1',
      },
    ],
    endings: [
      { id: 'end-1', quality: 'pas', feedback: 'Percakapan akrab berjalan lancar.' },
    ],
  };

  it('initializes a run with sequence 0 on the first node', () => {
    const runState = initializeDialogueRun({
      dialogue: testGraph,
      sessionId: 'ses-1',
      runId: 'run-1',
      packageId: 'jawa-mataraman',
      now: '2026-10-29T20:00:00.000Z',
    });

    expect(runState.currentNodeId).toBe('n0');
    expect(runState.sequence).toBe(0);
    expect(runState.status).toBe('in_progress');
    expect(runState.history).toHaveLength(1);
    expect(runState.history[0].nodeId).toBe('n0');
  });

  it('handles tidak-nyambung choice by triggering repair and remaining on same node', () => {
    let runState = initializeDialogueRun({
      dialogue: testGraph,
      sessionId: 'ses-1',
      runId: 'run-1',
      packageId: 'jawa-mataraman',
      now: '2026-10-29T20:00:00.000Z',
    });

    // Advance to n1 via first choice
    const choice1Result = applyChoiceToRun({
      dialogue: testGraph,
      runState,
      choiceIndex: 0,
      now: '2026-10-29T20:00:10.000Z',
    });
    runState = choice1Result.updatedState;
    expect(runState.currentNodeId).toBe('n1');

    // On n1, pick choice 1 (tidak-nyambung)
    const repairResult = applyChoiceToRun({
      dialogue: testGraph,
      runState,
      choiceIndex: 1,
      now: '2026-10-29T20:00:20.000Z',
    });

    expect(repairResult.isRepair).toBe(true);
    expect(repairResult.nextStep.type).toBe('repeat');
    expect(repairResult.updatedState.currentNodeId).toBe('n1');
    expect(repairResult.updatedState.disconnectedAttempts).toBe(1);
    expect(repairResult.updatedState.activeRepair?.text).toContain('Lho kok turu?');
  });

  it('traverses to ending node and calculates deterministic score', () => {
    let runState = initializeDialogueRun({
      dialogue: testGraph,
      sessionId: 'ses-1',
      runId: 'run-1',
      packageId: 'jawa-mataraman',
      now: '2026-10-29T20:00:00.000Z',
    });

    // n0 -> choose 'pas'
    runState = applyChoiceToRun({
      dialogue: testGraph,
      runState,
      choiceIndex: 0,
      now: '2026-10-29T20:00:10.000Z',
    }).updatedState;
    expect(runState.currentNodeId).toBe('n1');

    // n1 -> choose 'pas'
    runState = applyChoiceToRun({
      dialogue: testGraph,
      runState,
      choiceIndex: 0,
      now: '2026-10-29T20:00:20.000Z',
    }).updatedState;
    expect(runState.currentNodeId).toBe('n2');

    // n2 -> advance
    runState = advanceDialogueRun({
      dialogue: testGraph,
      runState,
      now: '2026-10-29T20:00:25.000Z',
    }).updatedState;
    expect(runState.currentNodeId).toBe('n3');

    // n3 -> advance
    runState = advanceDialogueRun({
      dialogue: testGraph,
      runState,
      now: '2026-10-29T20:00:30.000Z',
    }).updatedState;
    expect(runState.currentNodeId).toBe('n4');

    // n4 -> advance
    runState = advanceDialogueRun({
      dialogue: testGraph,
      runState,
      now: '2026-10-29T20:00:35.000Z',
    }).updatedState;
    expect(runState.currentNodeId).toBe('n5');

    // n5 -> advance to ending
    const finalStep = advanceDialogueRun({
      dialogue: testGraph,
      runState,
      now: '2026-10-29T20:00:40.000Z',
    });

    expect(finalStep.nextStep.type).toBe('ending');
    expect(finalStep.updatedState.status).toBe('completed');
    expect(finalStep.updatedState.endingId).toBe('end-1');
    expect(finalStep.updatedState.score).toBe(1.0);
  });
});
