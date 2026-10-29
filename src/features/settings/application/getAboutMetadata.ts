import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import { createAppError } from '../../../domain/errors/AppError';
import type { AboutMetadata } from '../domain/aboutTypes';
import type { PackageRepository } from '../../packages/data/packageRepository';

export class GetAboutMetadataUseCase {
  constructor(
    private readonly packageRepository?: PackageRepository,
    private readonly appVersion: string = '1.0.0',
    private readonly buildNumber: string = '1'
  ) {}

  async execute(): Promise<RepositoryResult<AboutMetadata>> {
    try {
      let activePkg = {
        packageId: 'jawa-mataraman',
        languageName: 'Jawa',
        dialectName: 'Mataraman',
        version: '1.0.0',
      };

      if (this.packageRepository) {
        const activeList = await this.packageRepository.listActive();
        if (activeList.length > 0) {
          const first = activeList[0];
          activePkg = {
            packageId: first.packageId,
            languageName: first.languageId === 'jv' ? 'Jawa' : first.languageId,
            dialectName: first.dialectId === 'mataraman' ? 'Mataraman' : first.dialectId,
            version: first.packageVersion,
          };
        }
      }

      const metadata: AboutMetadata = {
        appName: 'Clata',
        appVersion: this.appVersion,
        buildNumber: this.buildNumber,
        activePackage: activePkg,
        credits: [
          {
            name: 'Pemilik Produk & Pengembang Clata',
            role: 'Pengembang Utama, Desain Sistem, & Audio POC',
            dialectOrRegion: 'Mataraman',
            note: 'Rekaman audio kurasi awal (POC)',
          },
          {
            name: 'Penutur Asli Dialek Mataraman',
            role: 'Konsultasi Budaya & Verifikasi Tingkat Tutur',
            dialectOrRegion: 'Madiun / Solo / Kediri',
            note: 'Kurasi register Ngoko, Krama Madya, Krama Inggil',
          },
        ],
        licenses: {
          textLicense: {
            name: 'Creative Commons Attribution-ShareAlike 4.0 International',
            code: 'CC-BY-SA-4.0',
            url: 'https://creativecommons.org/licenses/by-sa/4.0/',
            summary:
              'Teks kosakata, kalimat, terjemahan, dan dialog bebas disalin, dibagikan, dan diadaptasi dengan atribusi yang sesuai dan lisensi serupa.',
          },
          audioLicense: {
            name: 'Izin Penggunaan Terbatas Clata (Non-Open License)',
            isPublicLicense: false,
            summary:
              'Seluruh rekaman suara penutur asli dilindungi hak cipta dengan izin penggunaan terbatas yang diberikan secara eksklusif untuk aplikasi Clata. Audio tidak dilisensikan secara terbuka dan tidak boleh didistribusikan ulang tanpa izin tertulis dari pemegang hak cipta.',
            attributionNotice:
              'Hak cipta rekaman audio milik masing-masing penutur asli dan Clata.',
          },
        },
        compliance: {
          minimumAgeYears: 10,
          legalBasis: [
            'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)',
            'PP No. 17 Tahun 2025 tentang Tata Kelola Sistem Elektronik dalam Perlindungan Anak (PP Tunas)',
            'Permenkomdigi No. 9 Tahun 2026 tentang Tata Cara Pendaftaran & Perlindungan Anak',
          ],
          privacySummary: {
            noAccountRequired: true,
            localStorageOnly: true,
            noAnalyticsOrAds: true,
            noBackgroundTracking: true,
          },
          reportingChannel: {
            email: 'lapor@clata.id',
            subjectPrefix: '[Laporan Clata P0]',
            purpose:
              'Kanal resmi pelaporan kesalahan konten kurasi, kekeliruan tingkat tutur, serta pelanggaran perlindungan hak anak.',
          },
        },
      };

      return { ok: true, data: metadata };
    } catch (cause) {
      return {
        ok: false,
        error: createAppError('UNKNOWN', 'Gagal memuat metadata aplikasi.', {
          recoverable: true,
          cause,
        }),
      };
    }
  }
}
