import { assertValidRegister } from '../Register';
import type {
  ChallengeItem,
  DialogueItem,
  LoadedPackage,
  PackageManifest,
  SentenceItem,
  UnitItem,
  WordItem,
} from './packageTypes';

export const CURRENT_SCHEMA_VERSION = 2;

export function parseAndValidateManifest(raw: unknown): PackageManifest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Manifest paket tidak valid: harus berupa objek JSON.');
  }

  const manifest = raw as Partial<PackageManifest>;

  if (manifest.schemaVersion === 1) {
    throw new Error(
      'Skema paket versi 1 sudah tidak didukung. Paket memerlukan schemaVersion 2 tanpa atribut level dan dengan register baru.',
    );
  }

  if (manifest.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Versi skema paket (${manifest.schemaVersion}) tidak didukung oleh aplikasi. Aplikasi mendukung schemaVersion ${CURRENT_SCHEMA_VERSION}.`,
    );
  }

  if (!manifest.packageId || !manifest.languageId || !manifest.packageVersion) {
    throw new Error('Manifest paket tidak lengkap: packageId, languageId, dan packageVersion wajib ada.');
  }

  return manifest as PackageManifest;
}

export function loadPackageData(params: {
  manifest: unknown;
  units: unknown[];
  words: unknown[];
  sentences: unknown[];
  dialogues: unknown[];
  challenges: unknown[];
}): LoadedPackage {
  const manifest = parseAndValidateManifest(params.manifest);

  const checkNoLevel = (item: Record<string, unknown>, context: string) => {
    if (item.level !== undefined) {
      throw new Error(
        `Atribut level dilarang dalam paket data. Ditemukan pada ${context}: ${JSON.stringify(item.id ?? item.unit_id ?? item.title)}.`,
      );
    }
  };

  // Validasi & urutkan unit berdasarkan order
  const units: UnitItem[] = params.units.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    checkNoLevel(item, `units[${idx}]`);
    if (typeof item.unit_id !== 'string' || typeof item.order !== 'number' || typeof item.title !== 'string') {
      throw new Error(`Unit pada indeks ${idx} tidak valid.`);
    }
    return {
      unit_id: item.unit_id,
      order: item.order,
      title: item.title,
    };
  });

  // Urutan unit HANYA memakai order
  units.sort((a, b) => a.order - b.order);

  // Validasi kata
  const words: WordItem[] = params.words.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    checkNoLevel(item, `words[${idx}]`);
    assertValidRegister(item.register, `kata (${item.id})`);

    let catatan: string | undefined;
    if (item.catatan !== undefined) {
      if (typeof item.catatan !== 'string') {
        throw new Error(`Catatan pada kata ${item.id} harus bertipe string.`);
      }
      if (item.catatan.length > 120) {
        throw new Error(`Catatan pada kata ${item.id} melebihi 120 karakter.`);
      }
      catatan = item.catatan;
    }

    return {
      id: String(item.id),
      text: String(item.text),
      meaning: String(item.meaning),
      part_of_speech: String(item.part_of_speech),
      register: item.register,
      catatan,
      theme: String(item.theme),
      unit_id: String(item.unit_id),
      audio: String(item.audio),
      status: String(item.status),
    };
  });

  // Validasi kalimat
  const sentences: SentenceItem[] = params.sentences.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    checkNoLevel(item, `sentences[${idx}]`);
    assertValidRegister(item.register, `kalimat (${item.id})`);

    const text = String(item.text ?? '');
    if (text.includes('___')) {
      throw new Error(
        `Kalimat pada indeks ${idx} (${item.id}) tidak boleh mengandung tanda rumpang "___". Harus berupa kalimat utuh.`,
      );
    }

    const focusWordId = typeof item.focus_word_id === 'string'
      ? item.focus_word_id
      : typeof item.gap === 'string'
        ? item.gap
        : '';

    if (!focusWordId) {
      throw new Error(`Kalimat pada indeks ${idx} (${item.id}) wajib memiliki focus_word_id.`);
    }

    return {
      id: String(item.id),
      text,
      translation: String(item.translation),
      word_ids: Array.isArray(item.word_ids) ? (item.word_ids as string[]) : [],
      focus_word_id: focusWordId,
      register: item.register,
      unit_id: String(item.unit_id),
      audio: String(item.audio),
      status: String(item.status),
    };
  });

  // Validasi dialog
  const dialogues: DialogueItem[] = params.dialogues.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    checkNoLevel(item, `dialogues[${idx}]`);
    assertValidRegister(item.register, `dialog (${item.id})`);

    const rawNodes = Array.isArray(item.nodes) ? (item.nodes as Record<string, unknown>[]) : [];
    for (const [nodeIdx, node] of rawNodes.entries()) {
      const rawChoices = Array.isArray(node.choices) ? (node.choices as Record<string, unknown>[]) : [];
      for (const [choiceIdx, choice] of rawChoices.entries()) {
        if (typeof choice.audio !== 'string' || !choice.audio.trim()) {
          throw new Error(
            `Pilihan ${choiceIdx} pada node ${node.id ?? nodeIdx} dialog ${item.id} wajib memiliki atribut audio.`,
          );
        }
        if (choice.repair !== undefined && choice.repair !== null) {
          const repair = choice.repair as Record<string, unknown>;
          if (typeof repair.audio !== 'string' || !repair.audio.trim()) {
            throw new Error(
              `Repair pada pilihan ${choiceIdx} node ${node.id ?? nodeIdx} dialog ${item.id} wajib memiliki atribut audio.`,
            );
          }
        }
      }
    }

    const rawEndings = Array.isArray(item.endings) ? (item.endings as Record<string, unknown>[]) : [];
    if (rawEndings.length < 2) {
      throw new Error(`Dialog ${item.id} wajib memiliki minimal 2 ending (minimal "pas" dan "kurang-pas").`);
    }

    const qualities = new Set(rawEndings.map((e) => e.quality));
    if (!qualities.has('pas') || !qualities.has('kurang-pas')) {
      throw new Error(`Dialog ${item.id} wajib mencakup ending dengan kualitas "pas" dan "kurang-pas".`);
    }

    const endings = rawEndings.map((e, endIdx) => {
      if (typeof e.id !== 'string' || !e.id.trim()) {
        throw new Error(`Ending pada indeks ${endIdx} dialog ${item.id} wajib memiliki id yang jelas.`);
      }
      if (typeof e.feedback !== 'string' || !e.feedback.trim()) {
        throw new Error(`Ending pada indeks ${endIdx} dialog ${item.id} wajib memiliki feedback teks.`);
      }
      return {
        id: String(e.id),
        quality: String(e.quality),
        feedback: String(e.feedback),
      };
    });

    return {
      id: String(item.id),
      title: String(item.title),
      interlocutor: String(item.interlocutor ?? item.partner ?? 'partner'),
      partner: item.partner ? String(item.partner) : undefined,
      contextDescription: item.contextDescription ? String(item.contextDescription) : undefined,
      userRole: item.userRole ? String(item.userRole) : undefined,
      avatar: item.avatar ? String(item.avatar) : undefined,
      register: item.register,
      unit_id: item.unit_id ? String(item.unit_id) : undefined,
      audio: item.audio ? String(item.audio) : undefined,
      status: item.status ? String(item.status) : undefined,
      nodes: rawNodes,
      endings,
      maxNewWords: typeof item.maxNewWords === 'number' ? item.maxNewWords : undefined,
      estimatedDurationMinutes:
        typeof item.estimatedDurationMinutes === 'number' ? item.estimatedDurationMinutes : undefined,
    };
  });

  // Validasi tantangan
  const challenges: ChallengeItem[] = params.challenges.map((raw, idx) => {
    const item = raw as Record<string, unknown>;
    checkNoLevel(item, `challenges[${idx}]`);
    return item as ChallengeItem;
  });

  return {
    manifest,
    units,
    words,
    sentences,
    dialogues,
    challenges,
  };
}
