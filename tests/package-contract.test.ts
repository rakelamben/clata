import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import {
  REGISTERS,
  REGISTER_LABELS,
  REGISTER_DESCRIPTIONS,
  isValidRegister,
} from '../src/domain/Register';
import {
  loadPackageData,
  parseAndValidateManifest,
} from '../src/domain/package/packageLoader';

const SOURCE_DIR = path.resolve(__dirname, 'fixtures/sample-package/source');

function readJsonFile(filename: string) {
  const filePath = path.join(SOURCE_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('Register definition single source of truth', () => {
  it('defines exactly the 3 required register values in one place', () => {
    expect(REGISTERS).toEqual(['sopan', 'akrab', 'netral']);
  });

  it('provides human-readable labels and descriptions', () => {
    expect(REGISTER_LABELS.sopan).toBe('Sopan');
    expect(REGISTER_LABELS.akrab).toBe('Akrab');
    expect(REGISTER_LABELS.netral).toBe('Netral');

    expect(REGISTER_DESCRIPTIONS.sopan).toBe('Untuk orang yang lebih tua atau dihormati.');
    expect(REGISTER_DESCRIPTIONS.akrab).toBe('Untuk orang dekat atau sebaya.');
    expect(REGISTER_DESCRIPTIONS.netral).toBe('Bisa dipakai ke siapa saja.');
  });

  it('validates registers accurately', () => {
    expect(isValidRegister('sopan')).toBe(true);
    expect(isValidRegister('akrab')).toBe(true);
    expect(isValidRegister('netral')).toBe(true);
    expect(isValidRegister('neutral')).toBe(false);
    expect(isValidRegister('formal')).toBe(false);
    expect(isValidRegister('familiar')).toBe(false);
    expect(isValidRegister('')).toBe(false);
    expect(isValidRegister(null)).toBe(false);
  });
});

describe('Package Content - Jawa Mataraman Contract', () => {
  const manifest = readJsonFile('manifest.json');
  const units = readJsonFile('unit.json');
  const kata = readJsonFile('kata.json');
  const kalimat = readJsonFile('kalimat.json');
  const dialog = readJsonFile('dialog.json');
  const challenge = readJsonFile('challenge.json');

  it('contains no "level" field in any package file', () => {
    for (const [name, data] of [
      ['unit.json', units],
      ['kata.json', kata],
      ['kalimat.json', kalimat],
      ['dialog.json', dialog],
      ['challenge.json', challenge],
    ] as const) {
      for (const [idx, item] of data.entries()) {
        expect(
          (item as Record<string, unknown>).level,
          `Atribut level ditemukan di ${name}[${idx}]`,
        ).toBeUndefined();
      }
    }
  });

  it('has valid mandatory register on all kata, kalimat, and dialog', () => {
    for (const item of kata) {
      expect(isValidRegister(item.register), `Register kata tidak sah: ${item.id}`).toBe(true);
    }
    for (const item of kalimat) {
      expect(isValidRegister(item.register), `Register kalimat tidak sah: ${item.id}`).toBe(true);
    }
    for (const item of dialog) {
      expect(isValidRegister(item.register), `Register dialog tidak sah: ${item.id}`).toBe(true);
    }
  });

  it('matches the exact 13 remapped words (10 akrab, 3 sopan)', () => {
    const kataMap = new Map<string, string>(kata.map((k: any) => [k.text, k.register]));

    const expectedAkrab = [
      'mangan',
      'turu',
      'sega',
      'banyu',
      'pasar',
      'omah',
      'maca',
      'sinau',
      'mlaku',
      'lunga',
    ];
    for (const text of expectedAkrab) {
      expect(kataMap.get(text), `Kata ${text} harus akrab`).toBe('akrab');
    }

    const expectedSopan = ['dhahar', 'sare', 'tindak'];
    for (const text of expectedSopan) {
      expect(kataMap.get(text), `Kata ${text} harus sopan`).toBe('sopan');
    }
  });

  it('matches the 17 old neutral words mapping', () => {
    const kataMap = new Map<string, string>(kata.map((k: any) => [k.text, k.register]));

    const expectedSopan = [
      'sugeng',
      'enjing',
      'sonten',
      'dalu',
      'nedha',
      'tilem',
      'sekul',
      'toya',
      'peken',
      'griya',
      'maos',
      'mlampah',
    ];
    for (const text of expectedSopan) {
      expect(kataMap.get(text), `Kata ${text} harus sopan`).toBe('sopan');
    }

    const expectedNetral = ['kamar', 'bapak', 'ibu', 'adhik'];
    for (const text of expectedNetral) {
      expect(kataMap.get(text), `Kata ${text} harus netral`).toBe('netral');
    }

    expect(kataMap.get('awan'), 'Kata awan harus akrab').toBe('akrab');
  });

  it('assigns catatan ONLY to the 5 designated words with correct text and length <= 120', () => {
    const withCatatan = kata.filter((k: any) => k.catatan !== undefined);
    expect(withCatatan.length).toBe(5);

    const catatanMap = new Map<string, string>(withCatatan.map((k: any) => [k.text, k.catatan]));

    expect(catatanMap.get('nedha')).toBe('Untuk diri sendiri.');
    expect(catatanMap.get('tilem')).toBe('Untuk diri sendiri.');
    expect(catatanMap.get('dhahar')).toBe('Untuk orang yang dihormati.');
    expect(catatanMap.get('sare')).toBe('Untuk orang yang dihormati.');
    expect(catatanMap.get('tindak')).toBe('Untuk orang yang dihormati.');

    for (const item of withCatatan) {
      expect(item.catatan.length).toBeLessThanOrEqual(120);
    }
  });

  it('matches checksum and sizeBytes of all files in manifest', () => {
    for (const fileEntry of manifest.files) {
      const filePath = path.join(SOURCE_DIR, fileEntry.path);
      expect(fs.existsSync(filePath), `File tidak ditemukan: ${filePath}`).toBe(true);

      const buffer = fs.readFileSync(filePath);
      const actualSize = buffer.byteLength;
      const actualSha256 = createHash('sha256').update(buffer).digest('hex');

      expect(actualSize, `Ukuran ${fileEntry.path} tidak cocok`).toBe(fileEntry.sizeBytes);
      expect(actualSha256, `Checksum sha256 ${fileEntry.path} tidak cocok`).toBe(fileEntry.sha256);
    }
  });

  it('sets manifest schemaVersion to 2, packageVersion to 2.0.0, and updated registerMapping', () => {
    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.packageVersion).toBe('2.0.0');
    expect(manifest.registerMapping).toEqual({
      akrab: 'ngoko',
      sopan: 'krama (termasuk krama inggil)',
      netral: 'tanpa pasangan bentuk',
    });
  });

  it('stores kalimat as canonical complete sentences without rumpang (no "___") and with valid focus_word_id', () => {
    const kataIdSet = new Set<string>(kata.map((k: any) => k.id));

    for (const s of kalimat) {
      expect(s.text, `Kalimat ${s.id} tidak boleh memuat "___"`).not.toContain('___');
      expect((s as any).gap, `Kalimat ${s.id} tidak boleh lagi menggunakan field gap`).toBeUndefined();
      expect(typeof s.focus_word_id).toBe('string');
      expect(s.focus_word_id.length).toBeGreaterThan(0);
      expect(kataIdSet.has(s.focus_word_id), `focus_word_id ${s.focus_word_id} harus ada di kata.json`).toBe(true);
      expect(s.word_ids).toContain(s.focus_word_id);
    }
  });

  it('supports audio on choices, audio on repairs, and multi-endings (pas and kurang-pas) in dialog', () => {
    for (const d of dialog) {
      for (const node of d.nodes) {
        if (Array.isArray(node.choices)) {
          for (const choice of node.choices) {
            expect(typeof choice.audio).toBe('string');
            expect(choice.audio.trim().length).toBeGreaterThan(0);
            if (choice.repair) {
              expect(typeof choice.repair.audio).toBe('string');
              expect(choice.repair.audio.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }

      expect(Array.isArray(d.endings)).toBe(true);
      expect(d.endings.length).toBeGreaterThanOrEqual(2);

      const qualities = d.endings.map((e: any) => e.quality);
      expect(qualities).toContain('pas');
      expect(qualities).toContain('kurang-pas');

      for (const ending of d.endings) {
        expect(typeof ending.id).toBe('string');
        expect(ending.id.trim().length).toBeGreaterThan(0);
        expect(typeof ending.feedback).toBe('string');
        expect(ending.feedback.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Package Loader & Validator Contract', () => {
  it('rejects schemaVersion 1 with a clear error message', () => {
    expect(() =>
      parseAndValidateManifest({
        packageId: 'jawa-mataraman',
        languageId: 'jv',
        packageVersion: '1.0.0',
        schemaVersion: 1,
      }),
    ).toThrow('Skema paket versi 1 sudah tidak didukung');
  });

  it('accepts schemaVersion 2', () => {
    const manifest = parseAndValidateManifest({
      packageId: 'jawa-mataraman',
      languageId: 'jv',
      dialectId: 'mataraman',
      packageVersion: '2.0.0',
      schemaVersion: 2,
      minimumAppVersion: '1.0.0',
      registerMapping: {
        akrab: 'ngoko',
        sopan: 'krama (termasuk krama inggil)',
        netral: 'tanpa pasangan bentuk',
      },
      orthographyReference: 'fixture-poc',
      createdAt: '2026-11-01T00:00:00.000Z',
      itemCounts: { units: 1, words: 1, sentences: 1, dialogues: 1, challenges: 1 },
      files: [],
    });
    expect(manifest.schemaVersion).toBe(2);
  });

  it('orders units strictly by order', () => {
    const rawUnits = [
      { unit_id: 'unit-3', order: 3, title: 'Unit 3' },
      { unit_id: 'unit-1', order: 1, title: 'Unit 1' },
      { unit_id: 'unit-2', order: 2, title: 'Unit 2' },
    ];
    const loaded = loadPackageData({
      manifest: {
        packageId: 'test',
        languageId: 'jv',
        packageVersion: '2.0.0',
        schemaVersion: 2,
      },
      units: rawUnits,
      words: [],
      sentences: [],
      dialogues: [],
      challenges: [],
    });

    expect(loaded.units.map((u) => u.unit_id)).toEqual(['unit-1', 'unit-2', 'unit-3']);
  });

  it('rejects any package data item that contains level', () => {
    expect(() =>
      loadPackageData({
        manifest: {
          packageId: 'test',
          languageId: 'jv',
          packageVersion: '2.0.0',
          schemaVersion: 2,
        },
        units: [{ unit_id: 'u-1', order: 1, title: 'U1', level: 'L1' }],
        words: [],
        sentences: [],
        dialogues: [],
        challenges: [],
      }),
    ).toThrow('Atribut level dilarang dalam paket data');
  });

  it('rejects sentences containing rumpang "___" or missing focus_word_id', () => {
    expect(() =>
      loadPackageData({
        manifest: {
          packageId: 'test',
          languageId: 'jv',
          packageVersion: '2.0.0',
          schemaVersion: 2,
        },
        units: [{ unit_id: 'u-1', order: 1, title: 'U1' }],
        words: [],
        sentences: [
          {
            id: 's-1',
            text: 'sugeng ___',
            translation: 'Selamat pagi',
            word_ids: ['kata-sugeng'],
            focus_word_id: 'kata-enjing',
            register: 'sopan',
          },
        ],
        dialogues: [],
        challenges: [],
      }),
    ).toThrow('tidak boleh mengandung tanda rumpang "___"');

    expect(() =>
      loadPackageData({
        manifest: {
          packageId: 'test',
          languageId: 'jv',
          packageVersion: '2.0.0',
          schemaVersion: 2,
        },
        units: [{ unit_id: 'u-1', order: 1, title: 'U1' }],
        words: [],
        sentences: [
          {
            id: 's-1',
            text: 'sugeng enjing',
            translation: 'Selamat pagi',
            word_ids: ['kata-sugeng'],
            register: 'sopan',
          },
        ],
        dialogues: [],
        challenges: [],
      }),
    ).toThrow('wajib memiliki focus_word_id');
  });

  it('rejects dialogues missing choice audio or multi-endings', () => {
    // Missing choice audio
    expect(() =>
      loadPackageData({
        manifest: {
          packageId: 'test',
          languageId: 'jv',
          packageVersion: '2.0.0',
          schemaVersion: 2,
        },
        units: [{ unit_id: 'u-1', order: 1, title: 'U1' }],
        words: [],
        sentences: [],
        dialogues: [
          {
            id: 'd-1',
            title: 'D1',
            interlocutor: 'neighbor',
            register: 'sopan',
            nodes: [{ id: 'n0', choices: [{ text: 'Halo', next: 'n1' }] }],
            endings: [
              { id: 'end-pas', quality: 'pas', feedback: 'Bagus' },
              { id: 'end-kurang-pas', quality: 'kurang-pas', feedback: 'Kurang' },
            ],
          },
        ],
        challenges: [],
      }),
    ).toThrow('wajib memiliki atribut audio');

    // Missing kurang-pas ending
    expect(() =>
      loadPackageData({
        manifest: {
          packageId: 'test',
          languageId: 'jv',
          packageVersion: '2.0.0',
          schemaVersion: 2,
        },
        units: [{ unit_id: 'u-1', order: 1, title: 'U1' }],
        words: [],
        sentences: [],
        dialogues: [
          {
            id: 'd-1',
            title: 'D1',
            interlocutor: 'neighbor',
            register: 'sopan',
            nodes: [{ id: 'n0', choices: [{ text: 'Halo', next: 'n1', audio: 'audio.opus' }] }],
            endings: [{ id: 'end-pas', quality: 'pas', feedback: 'Bagus' }],
          },
        ],
        challenges: [],
      }),
    ).toThrow('wajib memiliki minimal 2 ending');
  });
});
