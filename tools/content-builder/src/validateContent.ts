import { isValidRegister, REGISTERS } from '../../../src/domain/Register';

export type ContentValidationIssue = { code: string; path: string; message: string };

type Item = Record<string, unknown>;

function wordsIn(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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

  // Validasi kata: register wajib (sopan, akrab, netral), unit_id valid, & catatan opsional <= 120 karakter
  for (const [index, word] of content.words.entries()) {
    if (!isValidRegister(word.register)) {
      add(
        'INVALID_REGISTER',
        `words[${index}]`,
        `Register wajib diisi dan harus salah satu dari: ${REGISTERS.join(', ')}.`,
      );
    }
    if (typeof word.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(word.unit_id)) {
      add('INVALID_UNIT_ID_REF', `words[${index}]`, `unit_id "${word.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }
    checkAudio(word.audio, `words[${index}].audio`);

    if (word.catatan !== undefined) {
      if (typeof word.catatan !== 'string') {
        add('INVALID_CATATAN_TYPE', `words[${index}]`, 'Atribut catatan harus bertipe string.');
      } else if (word.catatan.length > 120) {
        add('CATATAN_TOO_LONG', `words[${index}]`, `Atribut catatan melebihi batas 120 karakter (panjang: ${word.catatan.length}).`);
      }
    }
  }

  const wordIdSet = new Set<string>();
  for (const word of content.words) {
    if (typeof word.id === 'string') wordIdSet.add(word.id);
  }

  // Validasi kalimat: register wajib, kalimat utuh (tanpa '___'), focus_word_id valid, dan unit_id valid
  for (const [index, sentence] of content.sentences.entries()) {
    if (!isValidRegister(sentence.register)) {
      add(
        'INVALID_REGISTER',
        `sentences[${index}]`,
        `Register wajib diisi dan harus salah satu dari: ${REGISTERS.join(', ')}.`,
      );
    }
    if (typeof sentence.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(sentence.unit_id)) {
      add('INVALID_UNIT_ID_REF', `sentences[${index}]`, `unit_id "${sentence.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }
    checkAudio(sentence.audio, `sentences[${index}].audio`);

    const limit = 16;
    if (typeof sentence.text !== 'string' || wordsIn(sentence.text) > limit) {
      add('SENTENCE_TOO_LONG', `sentences[${index}]`, `Sentence exceeds ${limit} words.`);
    }
    if (typeof sentence.text === 'string' && sentence.text.includes('___')) {
      add(
        'CANONICAL_SENTENCE_CONTAINS_GAP',
        `sentences[${index}]`,
        'Kalimat harus berupa kalimat utuh (canonical sentence) dan tidak boleh memuat tanda rumpang "___".',
      );
    }

    const focusWordId = typeof sentence.focus_word_id === 'string' ? sentence.focus_word_id : undefined;
    if (!focusWordId) {
      add(
        'MISSING_FOCUS_WORD_ID',
        `sentences[${index}]`,
        'Field focus_word_id wajib diisi sebagai penanda kata target pembelajaran.',
      );
    } else if (wordIdSet.size > 0 && !wordIdSet.has(focusWordId)) {
      add(
        'INVALID_FOCUS_WORD_ID_REF',
        `sentences[${index}]`,
        `focus_word_id "${focusWordId}" tidak ditemukan dalam daftar kata (kata.json).`,
      );
    }

    if (Array.isArray(sentence.word_ids)) {
      for (const wordId of sentence.word_ids) {
        if (typeof wordId === 'string' && wordIdSet.size > 0 && !wordIdSet.has(wordId)) {
          add(
            'INVALID_WORD_ID_REF',
            `sentences[${index}]`,
            `word_id "${wordId}" tidak ditemukan dalam daftar kata (kata.json).`,
          );
        }
      }
    }
  }

  // Validasi dialog: register wajib, pilihan ber-audio, repair ber-audio, multi-ending, unit_id valid, dan graph reachability
  for (const [index, dialogue] of content.dialogues.entries()) {
    if (!isValidRegister(dialogue.register)) {
      add(
        'INVALID_REGISTER',
        `dialogues[${index}]`,
        `Register dialog wajib diisi dan harus salah satu dari: ${REGISTERS.join(', ')}.`,
      );
    }
    if (typeof dialogue.unit_id === 'string' && unitIdSet.size > 0 && !unitIdSet.has(dialogue.unit_id)) {
      add('INVALID_UNIT_ID_REF', `dialogues[${index}]`, `unit_id "${dialogue.unit_id}" tidak ditemukan dalam daftar unit (unit.json).`);
    }
    checkAudio(dialogue.audio, `dialogues[${index}].audio`);

    const nodes = Array.isArray(dialogue.nodes) ? (dialogue.nodes as Item[]) : [];
    const choices = nodes.flatMap((node) => (Array.isArray(node.choices) ? (node.choices as Item[]) : []));
    if (nodes.length < 6 || nodes.length > 10) add('INVALID_DIALOG_TURNS', `dialogues[${index}]`, 'Dialogues require 6–10 turns.');
    if (choices.length < 2 || choices.length > 9) add('INVALID_CHOICE_COUNT', `dialogues[${index}]`, 'Dialogues require 2–3 choice points with 2–3 options each.');
    if (typeof dialogue.maxNewWords === 'number' && dialogue.maxNewWords > 5) add('TOO_MANY_NEW_WORDS', `dialogues[${index}]`, 'Dialogue has more than five new words.');

    const nodeIdSet = new Set<string>();
    for (const node of nodes) {
      if (typeof node.id === 'string') nodeIdSet.add(node.id);
    }

    const endings = Array.isArray(dialogue.endings) ? (dialogue.endings as Item[]) : [];
    const endingIdSet = new Set<string>();
    for (const ending of endings) {
      if (typeof ending.id === 'string') endingIdSet.add(ending.id);
    }

    // Validasi atribut audio & graph next pada setiap node, choice, dan repair
    for (const [nodeIndex, node] of nodes.entries()) {
      checkAudio(node.audio, `dialogues[${index}].nodes[${nodeIndex}].audio`);

      if (typeof node.next === 'string' && node.next !== 'end' && !nodeIdSet.has(node.next) && !endingIdSet.has(node.next)) {
        add('INVALID_DIALOG_GRAPH', `dialogues[${index}].nodes[${nodeIndex}]`, `Node pointer next "${node.next}" tidak valid (harus ID node, ID ending, atau "end").`);
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

    // Validasi multi-ending (minimal 2 ending: pas dan kurang-pas)
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

  // Validasi tantangan: unit_id valid dan rescuePhrases
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
