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
}) {
  const issues: ContentValidationIssue[] = [];
  const ids = new Set<string>();
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });

  for (const [collectionName, items] of Object.entries(content)) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      const id = typeof item.id === 'string' ? item.id : typeof item.unit_id === 'string' ? item.unit_id : undefined;
      if (!id) add('MISSING_ID', `${collectionName}[${index}]`, 'Stable ID is required.');
      else if (ids.has(id)) add('DUPLICATE_ID', `${collectionName}[${index}]`, `Duplicate ID: ${id}`);
      else ids.add(id);
      if (content.publicRelease && item.status === 'poc') add('UNVERIFIED_PUBLIC_CONTENT', `${collectionName}[${index}]`, 'POC content cannot be published.');
      if (content.publicRelease && (!item.verifier || !item.license)) add('MISSING_PROVENANCE', `${collectionName}[${index}]`, 'Verifier and license metadata are required.');
      if (content.publicRelease && collectionName !== 'units' && (!item.audio || !item.source || !item.contributor || !item.revision)) add('MISSING_ITEM_METADATA', `${collectionName}[${index}]`, 'Source, contributor, revision, and audio metadata are required.');
    });
  }

  for (const [index, sentence] of content.sentences.entries()) {
    const level = sentence.level;
    const limit = level === 'L1' ? 8 : level === 'L2' ? 12 : level === 'L3' ? 16 : 16;
    if (typeof sentence.text !== 'string' || wordsIn(sentence.text) > limit) add('SENTENCE_TOO_LONG', `sentences[${index}]`, `Sentence exceeds ${limit} words.`);
    if (typeof sentence.text === 'string' && (sentence.text.match(/___/g) ?? []).length !== 1) add('INVALID_GAP_COUNT', `sentences[${index}]`, 'Exactly one gap is required.');
  }

  for (const [index, dialogue] of content.dialogues.entries()) {
    const nodes = Array.isArray(dialogue.nodes) ? dialogue.nodes as Item[] : [];
    const choices = nodes.flatMap((node) => Array.isArray(node.choices) ? node.choices as Item[] : []);
    if (nodes.length < 6 || nodes.length > 10) add('INVALID_DIALOG_TURNS', `dialogues[${index}]`, 'Dialogues require 6–10 turns.');
    if (choices.length < 2 || choices.length > 9) add('INVALID_CHOICE_COUNT', `dialogues[${index}]`, 'Dialogues require 2–3 choice points with 2–3 options each.');
    if (typeof dialogue.maxNewWords === 'number' && dialogue.maxNewWords > 5) add('TOO_MANY_NEW_WORDS', `dialogues[${index}]`, 'Dialogue has more than five new words.');
    if (!Array.isArray(dialogue.endings) || dialogue.endings.length === 0) add('MISSING_DIALOG_ENDING', `dialogues[${index}]`, 'Every dialogue needs an ending.');
  }

  return { ok: issues.length === 0, issues };
}
