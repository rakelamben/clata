/**
 * Definisi nilai register bahasa Clata.
 * Register adalah penanda relasi sosial/ragam tutur pemakaian kata, bukan tingkatan kesulitan.
 * Tiga nilai wajib:
 * - sopan: untuk orang yang lebih tua atau dihormati.
 * - akrab: untuk orang dekat atau sebaya.
 * - netral: bisa dipakai ke siapa saja.
 */
export const REGISTERS = ['sopan', 'akrab', 'netral'] as const;

export type Register = (typeof REGISTERS)[number];

export const REGISTER_LABELS: Record<Register, string> = {
  sopan: 'Sopan',
  akrab: 'Akrab',
  netral: 'Netral',
};

export const REGISTER_DESCRIPTIONS: Record<Register, string> = {
  sopan: 'Untuk orang yang lebih tua atau dihormati.',
  akrab: 'Untuk orang dekat atau sebaya.',
  netral: 'Bisa dipakai ke siapa saja.',
};

export function isValidRegister(value: unknown): value is Register {
  return typeof value === 'string' && REGISTERS.includes(value as Register);
}

export function assertValidRegister(value: unknown, context = 'register'): asserts value is Register {
  if (!isValidRegister(value)) {
    throw new Error(
      `Nilai ${context} "${String(value)}" tidak valid. Harus salah satu dari: ${REGISTERS.join(', ')}.`,
    );
  }
}
