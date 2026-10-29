import type { DialogueGraph, DialogueNode, DialogueChoice } from './dialogueTypes';

export type DialogueValidationIssue = {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
};

export type DialogueValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly DialogueValidationIssue[];
};

export function validateDialogueGraph(dialogue: DialogueGraph): DialogueValidationResult {
  const issues: DialogueValidationIssue[] = [];

  const add = (code: string, message: string, path?: string) => {
    issues.push({ code, message, path });
  };

  const nodes = dialogue.nodes ?? [];
  const endings = dialogue.endings ?? [];

  if (!Array.isArray(nodes) || nodes.length < 6 || nodes.length > 10) {
    add('INVALID_DIALOG_TURNS', 'Graf dialog memerlukan antara 6 hingga 10 giliran (turns).', 'nodes');
  }

  if (!Array.isArray(endings) || endings.length === 0) {
    add('MISSING_DIALOG_ENDING', 'Setiap dialog harus memiliki minimal satu ending.', 'endings');
  }

  for (const [idx, ending] of endings.entries()) {
    if (!ending.id || typeof ending.id !== 'string') {
      add('INVALID_ENDING_ID', `Ending pada indeks ${idx} tidak memiliki id yang valid.`, `endings[${idx}]`);
    }
    if (!ending.feedback || typeof ending.feedback !== 'string') {
      add('MISSING_ENDING_FEEDBACK', `Ending '${ending.id}' harus memiliki teks feedback umpan balik.`, `endings[${idx}].feedback`);
    }
  }

  const endingIds = new Set(endings.map((e) => e.id));
  const nodeMap = new Map<string, DialogueNode>();

  for (const [idx, node] of nodes.entries()) {
    if (!node.id || typeof node.id !== 'string') {
      add('INVALID_NODE_ID', `Node pada indeks ${idx} tidak memiliki id yang valid.`, `nodes[${idx}]`);
    } else {
      if (nodeMap.has(node.id)) {
        add('DUPLICATE_NODE_ID', `Node ID ganda terdeteksi: '${node.id}'.`, `nodes[${idx}].id`);
      }
      nodeMap.set(node.id, node);
    }

    if (!node.text || typeof node.text !== 'string') {
      add('MISSING_NODE_TEXT', `Node '${node.id}' tidak memiliki teks bahasa daerah.`, `nodes[${idx}].text`);
    }
  }

  // Count choice points
  const choiceNodes = nodes.filter((n) => Array.isArray(n.choices) && n.choices.length > 0);
  if (choiceNodes.length < 2 || choiceNodes.length > 3) {
    add('INVALID_CHOICE_COUNT', `Dialog harus memiliki 2 hingga 3 titik pilihan, ditemukan: ${choiceNodes.length}.`, 'nodes');
  }

  for (const node of choiceNodes) {
    const choices = node.choices ?? [];
    if (choices.length < 2 || choices.length > 3) {
      add('INVALID_OPTION_COUNT', `Titik pilihan pada node '${node.id}' harus memiliki 2 hingga 3 opsi, ditemukan: ${choices.length}.`, `nodes[${node.id}].choices`);
    }

    // Check choice types
    const choiceTypes = new Set(choices.map((c: DialogueChoice) => c.type));
    if (choiceTypes.size > 1) {
      add('MIXED_CHOICE_TYPES', `Node '${node.id}' memadukan tipe choice yang berbeda dalam satu titik.`, `nodes[${node.id}].choices`);
    }

    const firstType = choices[0]?.type;
    if (firstType === 'register') {
      for (const choice of choices) {
        if (choice.quality === 'tidak-nyambung') {
          add('INVALID_REGISTER_OPTION', `Titik register pada node '${node.id}' tidak boleh memuat opsi 'tidak-nyambung'.`, `nodes[${node.id}]`);
        }
      }
    } else if (firstType === 'comprehension') {
      const hasConnected = choices.some((c: DialogueChoice) => c.quality === 'pas' || c.quality === 'cukup-pas' || c.quality === 'kurang-pas');
      const hasDisconnected = choices.some((c: DialogueChoice) => c.quality === 'tidak-nyambung');

      if (!hasConnected || !hasDisconnected) {
        add('INVALID_COMPREHENSION_OPTIONS', `Titik pemahaman pada node '${node.id}' harus memiliki minimal 1 opsi nyambung dan 1 opsi tidak-nyambung.`, `nodes[${node.id}]`);
      }

      for (const choice of choices) {
        if (choice.quality === 'tidak-nyambung') {
          if (!choice.repair || !choice.repair.text) {
            add('MISSING_REPAIR_RESPONSE', `Opsi tidak-nyambung pada node '${node.id}' wajib menyertakan objek balasan repair.`, `nodes[${node.id}]`);
          }
          if (choice.next !== node.id) {
            add('INVALID_REPAIR_NEXT', `Opsi tidak-nyambung pada node '${node.id}' harus menunjuk kembali ke node itu sendiri ('${node.id}').`, `nodes[${node.id}]`);
          }
        }
      }
    }

    // Verify all targets in choices
    for (const choice of choices) {
      if (!nodeMap.has(choice.next) && !endingIds.has(choice.next)) {
        add('INVALID_TARGET_REFERENCE', `Target '${choice.next}' pada pilihan node '${node.id}' tidak ditemukan pada node maupun ending.`, `nodes[${node.id}]`);
      }
    }
  }

  // Verify non-choice nodes target
  for (const node of nodes) {
    if (!node.choices || node.choices.length === 0) {
      if (node.next) {
        if (!nodeMap.has(node.next) && !endingIds.has(node.next)) {
          add('INVALID_NEXT_REFERENCE', `Target next '${node.next}' pada node '${node.id}' tidak ditemukan pada node maupun ending.`, `nodes[${node.id}].next`);
        }
      }
    }
  }

  // Reachability analysis from initial node (nodes[0])
  if (nodes.length > 0) {
    const initialId = nodes[0].id;
    const visited = new Set<string>();
    const queue = [initialId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const n = nodeMap.get(current);
      if (!n) continue;

      if (n.choices && n.choices.length > 0) {
        for (const c of n.choices) {
          if (nodeMap.has(c.next) && !visited.has(c.next)) {
            queue.push(c.next);
          }
        }
      } else if (n.next && nodeMap.has(n.next) && !visited.has(n.next)) {
        queue.push(n.next);
      }
    }

    // Check for unreachable nodes
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        add('ORPHAN_NODE', `Node '${node.id}' tidak dapat dijangkau dari node awal ('${initialId}').`, `nodes[${node.id}]`);
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
