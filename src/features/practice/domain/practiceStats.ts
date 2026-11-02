import type { LoadedPackage, UnitItem } from '../../../domain/package/packageTypes';

export interface UnitPracticeSummary extends UnitItem {
  exerciseCount: number;
  wordsCount: number;
  sentencesCount: number;
  dialoguesCount: number;
}

/**
 * Menghitung rekapitulasi item latihan per unit dari data paket aktif.
 * Jumlah latihan mencakup kosakata (kata), kalimat, dan dialog pada unit tersebut.
 */
export function computeUnitPracticeSummaries(
  packageData:
    | Pick<LoadedPackage, 'units' | 'words' | 'sentences' | 'dialogues'>
    | null
    | undefined,
): UnitPracticeSummary[] {
  if (!packageData) return [];
  const { units, words, sentences, dialogues } = packageData;

  return units.map((unit) => {
    const wordsCount = words.filter((w) => w.unit_id === unit.unit_id).length;
    const sentencesCount = sentences.filter(
      (s) => s.unit_id === unit.unit_id,
    ).length;
    const dialoguesCount = dialogues.filter(
      (d) => d.unit_id === unit.unit_id,
    ).length;
    const exerciseCount = wordsCount + sentencesCount + dialoguesCount;

    return {
      ...unit,
      exerciseCount,
      wordsCount,
      sentencesCount,
      dialoguesCount,
    };
  });
}
