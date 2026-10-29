/** Full Indonesian month names, used wherever a birth date is shown to the learner. */
export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/** Short month labels for the compact date-picker columns. */
export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

/** Formats a local date without relying on Intl data being available offline. */
export function formatBirthDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  jv: 'Jawa',
};

const DIALECT_NAMES: Record<string, string> = {
  mataraman: 'Mataraman',
};

function titleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Builds a human-readable package label without exposing raw ids. */
export function formatPackageLabel(languageId: string, dialectId: string): string {
  const language = LANGUAGE_NAMES[languageId] ?? titleCase(languageId);
  const dialect = DIALECT_NAMES[dialectId] ?? titleCase(dialectId);
  return dialect ? `${language} · ${dialect}` : language;
}
