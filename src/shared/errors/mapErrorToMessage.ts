import type { AppError } from '../../domain/errors/AppError';

const messages: Record<AppError['code'], string> = {
  STARTUP_FAILED: 'Clata belum siap digunakan. Coba lagi.',
  MIGRATION_FAILED: 'Pembaruan penyimpanan gagal. Coba lagi.',
  RECOVERY_REQUIRED: 'Clata memerlukan pemulihan sebelum dapat digunakan.',
  INVALID_CONFIGURATION: 'Konfigurasi aplikasi belum lengkap.',
  UNSUPPORTED_PLATFORM: 'Perangkat ini belum didukung.',
  UNKNOWN: 'Terjadi kesalahan. Coba lagi.',
};

export function mapErrorToMessage(error: AppError) {
  return messages[error.code];
}
