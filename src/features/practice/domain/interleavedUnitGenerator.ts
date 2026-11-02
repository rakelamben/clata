export type UnitSessionType = 'word_guess' | 'fill_gap' | 'dialogue';

export interface UnitSessionItem {
  sessionId: string;
  unitId: string;
  orderIndex: number;
  type: UnitSessionType;
  title: string;
  itemCount: number;
  itemIds: string[];
}

/**
 * Membangkitkan jadwal sesi latihan selang-seling bertahap (Interleaved Learning)
 * dalam satu unit: Tebak Kata (10 kata) -> Kalimat (6 kalimat) -> Percakapan (1 dialog) -> ...
 */
export function generateInterleavedUnitSessions(
  unitId: string,
  words: { id: string }[],
  sentences: { id: string; word_ids?: string[] }[],
  dialogues: { id: string; title: string }[],
): UnitSessionItem[] {
  const sessions: UnitSessionItem[] = [];
  let orderIndex = 1;

  let wordOffset = 0;
  let sentenceOffset = 0;
  let dialogueOffset = 0;

  let wordPart = 1;
  let sentencePart = 1;

  while (
    wordOffset < words.length ||
    sentenceOffset < sentences.length ||
    dialogueOffset < dialogues.length
  ) {
    // 1. Fase Tebak Kata (10 kata)
    if (wordOffset < words.length) {
      const chunk = words.slice(wordOffset, wordOffset + 10);
      sessions.push({
        sessionId: `${unitId}-w${wordPart}`,
        unitId,
        orderIndex: orderIndex++,
        type: 'word_guess',
        title: `Tebak Kata • Bagian ${wordPart}`,
        itemCount: chunk.length,
        itemIds: chunk.map((w) => w.id),
      });
      wordOffset += chunk.length;
      wordPart++;
    }

    // 2. Fase Kalimat Rumpang (6 kalimat)
    if (sentenceOffset < sentences.length) {
      const chunk = sentences.slice(sentenceOffset, sentenceOffset + 6);
      sessions.push({
        sessionId: `${unitId}-s${sentencePart}`,
        unitId,
        orderIndex: orderIndex++,
        type: 'fill_gap',
        title: `Kalimat • Bagian ${sentencePart}`,
        itemCount: chunk.length,
        itemIds: chunk.map((s) => s.id),
      });
      sentenceOffset += chunk.length;
      sentencePart++;
    }

    // 3. Fase Percakapan (1 Skenario Dialog)
    if (dialogueOffset < dialogues.length) {
      const dialog = dialogues[dialogueOffset];
      sessions.push({
        sessionId: `${unitId}-d${dialogueOffset + 1}`,
        unitId,
        orderIndex: orderIndex++,
        type: 'dialogue',
        title: `Percakapan • ${dialog.title}`,
        itemCount: 1,
        itemIds: [dialog.id],
      });
      dialogueOffset++;
    }
  }

  return sessions;
}
