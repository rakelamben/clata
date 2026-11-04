import { isValidRegister, REGISTERS } from '../Register';

export type ContentValidationIssue = { code: string; path: string; message: string };

type Item = Record<string, unknown>;

export function validateContent(content: {
  units: Item[];
  words: Item[];
  sentences: Item[];
  dialogues: Item[];
  challenges: Item[];
  publicRelease?: boolean;
  availableAudioFiles?: Set<string> | string[];
}) {
  const issues: ContentValidationIssue[] = [];
  const ids = new Set<string>();
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });

  const audioFileSet = content.availableAudioFiles
    ? new Set(Array.from(content.availableAudioFiles).map((p) => p.replace(/\\/g, '/')))
    : undefined;

  const checkAudio = (audioPath: unknown, location: string) => {
    if (audioFileSet && typeof audioPath === 'string' && audioPath.trim()) {
      const normalized = audioPath.replace(/\\/g, '/');
      if (!audioFileSet.has(normalized)) {
        add('MISSING_AUDIO_FILE', location, `Berkas audio "${audioPath}" tidak ditemukan dalam paket.`);
      }
    }
  };

  const contentCollections: Record<string, Item[]> = {
    units: content.units,
    words: content.words,
    sentences: content.sentences,
    dialogues: content.dialogues,
    challenges: content.challenges,
  };

  for (const [collectionName, items] of Object.entries(contentCollections)) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      // Larangan keras atribut level
      if (item.level !== undefined) {
        add(
          'FORBIDDEN_FIELD_LEVEL',
          `${collectionName}[${index}]`,
          'Atribut level dilarang dalam paket data. Tingkat kesulitan telah dihapus; urutan belajar hanya mengikuti order unit.',
        );
      }

      const id = typeof item.id === 'string' ? item.id : typeof item.unit_id === 'string' ? item.unit_id : undefined;
      if (!id) add('MISSING_ID', `${collectionName}[${index}]`, 'Stable ID is required.');
      else if (ids.has(id)) add('DUPLICATE_ID', `${collectionName}[${index}]`, `Duplicate ID: ${id}`);
      else ids.add(id);

      if (content.publicRelease && item.status === 'poc') add('UNVERIFIED_PUBLIC_CONTENT', `${collectionName}[${index}]`, 'POC content cannot be published.');
      if (content.publicRelease && (!item.verifier || !item.license)) add('MISSING_PROVENANCE', `${collectionName}[${index}]`, 'Verifier and license metadata are required.');
      if (content.publicRelease && collectionName !== 'units' && (!item.audio || !item.source || !item.contributor || !item.revision)) {
        add('MISSING_ITEM_METADATA', `${collectionName}[${index}]`, 'Source, contributor, revision, and audio metadata are required.');
      }
    });
  }

  // Validasi units: pastikan order ada dan berupa angka, serta kumpulkan unit_id yang valid
  const unitIdSet = new Set<string>();
  for (const [index, unit] of content.units.entries()) {
    if (typeof unit.order !== 'number') {
      add('MISSING_UNIT_ORDER', `units[${index}]`, 'Unit wajib memiliki atribut order berupa angka.');
    }
    if (typeof unit.unit_id === 'string') {
      unitIdSet.add(unit.unit_id);
    }
  }

  for (const [index, word] of content.words.entries()) {
    if (typeof word.register === 'string') {
      if (!isValidRegister(word.register)) {
        add(
          'INVALID_REGISTER',
          `words[${index}].register`,
          `Register "${word.register}" tidak valid. Harus salah satu dari: ${REGISTERS.join(', ')}.`,
        );
      }
    }
    if (typeof word.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(word.unit_id)) {
      add('INVALID_UNIT_ID_REF', `words[${index}]`, `unit_id "${word.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }
    checkAudio(word.audio, `words[${index}].audio`);
  }

  for (const [index, sentence] of content.sentences.entries()) {
    if (typeof sentence.register === 'string') {
      if (!isValidRegister(sentence.register)) {
        add(
          'INVALID_REGISTER',
          `sentences[${index}].register`,
          `Register "${sentence.register}" tidak valid. Harus salah satu dari: ${REGISTERS.join(', ')}.`,
        );
      }
    }
    if (typeof sentence.text === 'string' && sentence.text.includes('___')) {
      add('FORBIDDEN_RUMPANG_IN_SENTENCE', `sentences[${index}]`, 'Kalimat tidak boleh mengandung tanda rumpang "___".');
    }
    if (!sentence.focus_word_id || typeof sentence.focus_word_id !== 'string') {
      add('MISSING_FOCUS_WORD_ID', `sentences[${index}]`, 'Kalimat wajib memiliki atribut focus_word_id.');
    }
    if (typeof sentence.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(sentence.unit_id)) {
      add('INVALID_UNIT_ID_REF', `sentences[${index}]`, `unit_id "${sentence.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }
    checkAudio(sentence.audio, `sentences[${index}].audio`);
  }

  // Validasi dialog
  for (const [index, dialogue] of content.dialogues.entries()) {
    if (typeof dialogue.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(dialogue.unit_id)) {
      add('INVALID_UNIT_ID_REF', `dialogues[${index}]`, `unit_id "${dialogue.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }

    const nodes = Array.isArray(dialogue.nodes) ? (dialogue.nodes as Item[]) : [];
    const endings = Array.isArray(dialogue.endings) ? (dialogue.endings as Item[]) : [];
    const nodeIdSet = new Set<string>();
    const endingIdSet = new Set<string>(endings.map((e) => String(e.id)));

    for (const node of nodes) {
      if (typeof node.id === 'string') nodeIdSet.add(node.id);
    }

    for (const [nodeIndex, node] of nodes.entries()) {
      const nodePath = `dialogues[${index}].nodes[nodeIndex]`;
      checkAudio(node.audio, `${nodePath}.audio`);

      if (typeof node.next === 'string' && node.next !== 'end' && !nodeIdSet.has(node.next) && !endingIdSet.has(node.next)) {
        add('INVALID_DIALOG_GRAPH', nodePath, `Pointer next "${node.next}" tidak valid (harus ID node, ID ending, atau "end").`);
      }

      const nodeChoices = Array.isArray(node.choices) ? (node.choices as Item[]) : [];
      for (const [choiceIndex, choice] of nodeChoices.entries()) {
        const choicePath = `dialogues[${index}].nodes[${nodeIndex}].choices[${choiceIndex}]`;
        if (typeof choice.audio !== 'string' || choice.audio.trim().length === 0) {
          add('MISSING_CHOICE_AUDIO', choicePath, 'Setiap pilihan (choice) wajib memiliki atribut audio berupa string path audio.');
        } else {
          checkAudio(choice.audio, `${choicePath}.audio`);
        }

        if (typeof choice.next === 'string' && choice.next !== 'end' && !nodeIdSet.has(choice.next) && !endingIdSet.has(choice.next)) {
          add('INVALID_DIALOG_GRAPH', choicePath, `Choice pointer next "${choice.next}" tidak valid (harus ID node, ID ending, atau "end").`);
        }

        if (choice.repair !== undefined && choice.repair !== null) {
          const repair = choice.repair as Item;
          if (typeof repair.audio !== 'string' || repair.audio.trim().length === 0) {
            add('MISSING_REPAIR_AUDIO', `${choicePath}.repair`, 'Objek repair wajib memiliki atribut audio berupa string path audio.');
          } else {
            checkAudio(repair.audio, `${choicePath}.repair.audio`);
          }
          if (typeof repair.next === 'string' && repair.next !== 'end' && !nodeIdSet.has(repair.next) && !endingIdSet.has(repair.next)) {
            add('INVALID_DIALOG_GRAPH', `${choicePath}.repair`, `Repair pointer next "${repair.next}" tidak valid.`);
          }
        }
      }
    }

    if (endings.length < 2) {
      add(
        'INSUFFICIENT_DIALOG_ENDINGS',
        `dialogues[${index}]`,
        'Dialog wajib memiliki minimal 2 ending (minimal ending "pas" dan "kurang-pas").',
      );
    } else {
      const qualities = new Set(endings.map((e) => e.quality));
      if (!qualities.has('pas')) {
        add('MISSING_PAS_ENDING', `dialogues[${index}]`, 'Dialog wajib memiliki minimal satu ending dengan quality "pas".');
      }
      if (!qualities.has('kurang-pas')) {
        add('MISSING_KURANG_PAS_ENDING', `dialogues[${index}]`, 'Dialog wajib memiliki minimal satu ending dengan quality "kurang-pas".');
      }
      for (const [endingIndex, ending] of endings.entries()) {
        if (typeof ending.id !== 'string' || !ending.id.trim()) {
          add('INVALID_ENDING_ID', `dialogues[${index}].endings[${endingIndex}]`, 'Ending wajib memiliki id yang jelas.');
        }
        if (typeof ending.feedback !== 'string' || !ending.feedback.trim()) {
          add('INVALID_ENDING_FEEDBACK', `dialogues[${index}].endings[${endingIndex}]`, 'Ending wajib memiliki teks feedback dalam bahasa Indonesia.');
        }
      }
    }
  }

  for (const [index, challenge] of content.challenges.entries()) {
    if (typeof challenge.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(challenge.unit_id)) {
      add('INVALID_UNIT_ID_REF', `challenges[${index}]`, `unit_id "${challenge.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }

    if (Array.isArray(challenge.rescuePhrases)) {
      for (const [phraseIndex, phrase] of (challenge.rescuePhrases as Item[]).entries()) {
        checkAudio(phrase.audio, `challenges[${index}].rescuePhrases[${phraseIndex}].audio`);
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
