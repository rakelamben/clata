import { describe, expect, it } from 'vitest';
import { validateDialogueGraph } from '../../../src/features/dialogues/domain/dialogueGraphValidator';
import type { DialogueGraph } from '../../../src/features/dialogues/domain/dialogueTypes';

describe('dialogueGraphValidator', () => {
  const validGraph: DialogueGraph = {
    id: 'dialog-test',
    title: 'Test Sapaan',
    level: 'L1',
    register: 'neutral',
    interlocutor: 'neighbor',
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
        next: 'n1',
      },
      {
        id: 'n1',
        speaker: 'neighbor',
        text: 'Sugeng enjing.',
        translation: 'Selamat pagi.',
        choices: [
          { text: 'Nggih.', translation: 'Ya.', quality: 'pas', type: 'comprehension', next: 'n2' },
          {
            text: 'Mangan.',
            translation: 'Makan.',
            quality: 'tidak-nyambung',
            type: 'comprehension',
            next: 'n1',
            repair: { text: 'Maaf?', translation: 'Maaf?' },
          },
        ],
        next: 'n2',
      },
      { id: 'n2', speaker: 'user', text: 'Kados pundi kabare?', translation: 'Bagaimana kabarnya?', next: 'n3' },
      { id: 'n3', speaker: 'neighbor', text: 'Pangestunipun sae.', translation: 'Kabar baik.', next: 'n4' },
      { id: 'n4', speaker: 'user', text: 'Matur nuwun.', translation: 'Terima kasih.', next: 'n5' },
      { id: 'n5', speaker: 'neighbor', text: 'Sami-sami.', translation: 'Sama-sama.', next: 'end' },
    ],
    endings: [
      { id: 'end', quality: 'pas', feedback: 'Percakapan berhasil dengan sopan.' },
    ],
  };

  it('passes validation for a fully compliant graph', () => {
    const result = validateDialogueGraph(validGraph);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects graph with fewer than 6 turns', () => {
    const invalid = { ...validGraph, nodes: validGraph.nodes.slice(0, 4) };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_DIALOG_TURNS')).toBe(true);
  });

  it('rejects graph with missing ending feedback', () => {
    const invalid: DialogueGraph = {
      ...validGraph,
      endings: [{ id: 'end', quality: 'pas', feedback: '' }],
    };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'MISSING_ENDING_FEEDBACK')).toBe(true);
  });

  it('rejects register choice containing tidak-nyambung option', () => {
    const invalid: DialogueGraph = {
      ...validGraph,
      nodes: [
        {
          ...validGraph.nodes[0],
          choices: [
            { text: 'Sugeng enjing.', translation: 'Selamat pagi.', quality: 'pas', type: 'register', next: 'n1' },
            { text: 'Ngawur.', translation: 'Sembarangan.', quality: 'tidak-nyambung', type: 'register', next: 'n1' },
          ],
        },
        ...validGraph.nodes.slice(1),
      ],
    };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_REGISTER_OPTION')).toBe(true);
  });

  it('rejects comprehension choice without repair response on tidak-nyambung', () => {
    const invalid: DialogueGraph = {
      ...validGraph,
      nodes: [
        validGraph.nodes[0],
        {
          ...validGraph.nodes[1],
          choices: [
            { text: 'Nggih.', translation: 'Ya.', quality: 'pas', type: 'comprehension', next: 'n2' },
            { text: 'Mangan.', translation: 'Makan.', quality: 'tidak-nyambung', type: 'comprehension', next: 'n1' }, // Missing repair
          ],
        },
        ...validGraph.nodes.slice(2),
      ],
    };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'MISSING_REPAIR_RESPONSE')).toBe(true);
  });

  it('rejects comprehension choice where repair does not loop back to the same node', () => {
    const invalid: DialogueGraph = {
      ...validGraph,
      nodes: [
        validGraph.nodes[0],
        {
          ...validGraph.nodes[1],
          choices: [
            { text: 'Nggih.', translation: 'Ya.', quality: 'pas', type: 'comprehension', next: 'n2' },
            {
              text: 'Mangan.',
              translation: 'Makan.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'n3', // Invalid target, must be n1
              repair: { text: 'Maaf?', translation: 'Maaf?' },
            },
          ],
        },
        ...validGraph.nodes.slice(2),
      ],
    };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_REPAIR_NEXT')).toBe(true);
  });

  it('detects orphan nodes unreachable from initial node', () => {
    const invalid: DialogueGraph = {
      ...validGraph,
      nodes: [
        ...validGraph.nodes,
        { id: 'orphan_node', speaker: 'neighbor', text: 'Tak terjangkau.', translation: 'Unreachable.' },
      ],
    };
    const result = validateDialogueGraph(invalid);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'ORPHAN_NODE')).toBe(true);
  });
});
