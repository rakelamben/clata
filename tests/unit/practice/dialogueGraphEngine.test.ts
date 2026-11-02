import { describe, expect, it } from 'vitest';
import type { DialogueItem } from '../../../src/domain/package/packageTypes';
import {
  advanceDialogueRun,
  applyChoiceToRun,
  calculateDialogueScore,
  dismissRepairPrompt,
  initializeDialogueRun,
  resolveEnding,
} from '../../../src/features/practice/domain/dialogueGraphEngine';

const sampleDialogue: DialogueItem = {
  id: 'dialog-test',
  title: 'Tes Sapaan',
  interlocutor: 'Tetangga',
  register: 'netral' as any,
  unit_id: 'unit-1',
  nodes: [
    {
      id: 'n0',
      speaker: 'user',
      text: 'Sugeng enjing, Pak.',
      translation: 'Selamat pagi, Pak.',
      audio: 'audio/dialog-start.opus',
      choices: [
        {
          text: 'Sugeng enjing, Pak.',
          translation: 'Selamat pagi, Pak.',
          quality: 'pas',
          type: 'register',
          next: 'n1',
          audio: 'audio/dialog-start.opus',
        },
        {
          text: 'Sugeng dalu, Pak.',
          translation: 'Selamat malam, Pak.',
          quality: 'kurang-pas',
          type: 'register',
          next: 'n1',
          audio: 'audio/dialog-start.opus',
        },
      ],
      next: 'n1',
    },
    {
      id: 'n1',
      speaker: 'neighbor',
      text: 'Sugeng enjing. Nembe badhe tindak pundi?',
      translation: 'Selamat pagi. Mau pergi ke mana?',
      audio: 'audio/dialog-start.opus',
      choices: [
        {
          text: 'Badhe tindak dhateng peken, Pak.',
          translation: 'Mau pergi ke pasar, Pak.',
          quality: 'pas',
          type: 'comprehension',
          next: 'n2',
          audio: 'audio/dialog-start.opus',
        },
        {
          text: 'Kula badhe sare sakniki.',
          translation: 'Saya mau tidur sekarang.',
          quality: 'tidak-nyambung',
          type: 'comprehension',
          next: 'n1',
          repair: {
            text: 'Ngapunten, mboten nyambung kalih situasi enjing.',
            translation: 'Maaf, kurang sesuai konteks jalan pagi.',
            audio: 'audio/dialog-start.opus',
          },
          audio: 'audio/dialog-start.opus',
        },
      ],
      next: 'n2',
    },
    {
      id: 'n2',
      speaker: 'user',
      text: 'Kula badhe mundhut sayur rumiyin.',
      translation: 'Saya mau beli sayur dulu.',
      audio: 'audio/dialog-start.opus',
      choices: [],
      next: 'end',
    },
  ],
  endings: [
    {
      id: 'end-pas',
      quality: 'pas',
      feedback: 'Sapaanmu dengan tetangga sangat santun dan pas.',
    },
    {
      id: 'end-kurang-pas',
      quality: 'kurang-pas',
      feedback: 'Pilihan sapaanmu terasa kurang pas untuk pagi hari.',
    },
  ],
};

describe('dialogueGraphEngine', () => {
  it('berhasil menginisialisasi dialog awal', () => {
    const state = initializeDialogueRun(sampleDialogue);
    expect(state.dialogueId).toBe('dialog-test');
    expect(state.currentNodeId).toBe('n0');
    expect(state.status).toBe('in_progress');
    expect(state.activeRepair).toBeNull();
    // Karena n0 adalah ucapan user yang belum dipilih, history masih kosong
    expect(state.history).toHaveLength(0);
  });

  it('memproses pilihan user yang pas dan memajukan giliran', () => {
    const state = initializeDialogueRun(sampleDialogue);
    const result = applyChoiceToRun(sampleDialogue, state, 0); // Opsi 'Sugeng enjing, Pak.'

    expect(result.isRepair).toBe(false);
    expect(result.nextStep.type).toBe('node');
    expect(result.updatedState.currentNodeId).toBe('n1');

    // History berisi: 1. Balon user ("Sugeng enjing"), 2. Balon tetangga ("Sugeng enjing. Nembe badhe...")
    expect(result.updatedState.history).toHaveLength(2);
    expect(result.updatedState.history[0].isUser).toBe(true);
    expect(result.updatedState.history[0].text).toBe('Sugeng enjing, Pak.');
    expect(result.updatedState.history[1].isUser).toBe(false);
    expect(result.updatedState.history[1].text).toContain('tindak pundi');
  });

  it('memicu repair prompt ketika user memilih respons tidak nyambung', () => {
    const state = initializeDialogueRun(sampleDialogue);
    const step1 = applyChoiceToRun(sampleDialogue, state, 0); // Menuju n1

    // Pada n1, user memilih opsi ke-2 ('Kula badhe sare sakniki' -> tidak-nyambung)
    const step2 = applyChoiceToRun(sampleDialogue, step1.updatedState, 1);

    expect(step2.isRepair).toBe(true);
    expect(step2.nextStep.type).toBe('repeat');
    expect(step2.updatedState.currentNodeId).toBe('n1'); // Tetap di n1
    expect(step2.updatedState.activeRepair).not.toBeNull();
    expect(step2.updatedState.activeRepair?.text).toContain('mboten nyambung');

    // Memastikan ucapan salah dan reaksi heran lawan bicara tercatat di history dengan isRepair: true
    const lastHistory = step2.updatedState.history.slice(-2);
    expect(lastHistory[0].isUser).toBe(true);
    expect(lastHistory[0].isRepair).toBe(true);
    expect(lastHistory[0].text).toBe('Kula badhe sare sakniki.');
    expect(lastHistory[1].isUser).toBe(false);
    expect(lastHistory[1].isRepair).toBe(true);
    expect(lastHistory[1].text).toContain('mboten nyambung');

    // Dismiss repair
    const dismissed = dismissRepairPrompt(step2.updatedState);
    expect(dismissed.activeRepair).toBeNull();
  });

  it('menyelesaikan dialog hingga ending dan menghitung skor 100% saat semua pilihan pas', () => {
    const state = initializeDialogueRun(sampleDialogue);
    const step1 = applyChoiceToRun(sampleDialogue, state, 0); // n0 -> n1 (pas)
    const step2 = applyChoiceToRun(sampleDialogue, step1.updatedState, 0); // n1 -> n2 (pas)

    // n2 tidak punya choices, melangkah dengan advanceDialogueRun
    const step3 = advanceDialogueRun(sampleDialogue, step2.updatedState);

    expect(step3.updatedState.status).toBe('completed');
    expect(step3.updatedState.completedEnding?.id).toBe('end-pas');
    expect(step3.updatedState.score).toBe(1.0);
  });

  it('menghitung skor lebih rendah dan ending kurang pas jika ada pilihan kurang pas', () => {
    const state = initializeDialogueRun(sampleDialogue);
    const step1 = applyChoiceToRun(sampleDialogue, state, 1); // n0 -> n1 (kurang-pas)

    expect(step1.updatedState.history[0].coachingNote).toBe(
      'Kalimat kurang pas untuk situasi percakapan ini, gunakan: "Sugeng enjing, Pak."',
    );

    const step2 = applyChoiceToRun(sampleDialogue, step1.updatedState, 0); // n1 -> n2 (pas)
    const step3 = advanceDialogueRun(sampleDialogue, step2.updatedState);

    expect(step3.updatedState.status).toBe('completed');
    expect(step3.updatedState.completedEnding?.id).toBe('end-kurang-pas');
    expect(step3.updatedState.score).toBeLessThan(1.0);
  });

  it('menghitung calculateDialogueScore dan resolveEnding dengan benar', () => {
    const perfectScore = calculateDialogueScore([
      { nodeId: 'n0', choiceId: 'c0', quality: 'pas', type: 'register', attempt: 1 },
      { nodeId: 'n1', choiceId: 'c1', quality: 'pas', type: 'comprehension', attempt: 1 },
    ]);
    expect(perfectScore).toBe(1.0);

    const ending = resolveEnding(sampleDialogue, [
      { nodeId: 'n0', choiceId: 'c0', quality: 'pas', type: 'register', attempt: 1 },
    ]);
    expect(ending?.id).toBe('end-pas');
  });
});
