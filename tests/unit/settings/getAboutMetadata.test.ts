import { describe, expect, it, vi } from 'vitest';
import { GetAboutMetadataUseCase } from '../../../src/features/settings/application/getAboutMetadata';
import type { PackageRepository } from '../../../src/features/packages/data/packageRepository';

describe('GetAboutMetadataUseCase', () => {
  it('returns valid metadata offline with proper license and child protection compliance', async () => {
    const mockPackageRepo = {
      listActive: vi.fn().mockResolvedValue([
        {
          packageId: 'jawa-mataraman',
          languageId: 'jv',
          dialectId: 'mataraman',
          packageVersion: '1.0.0',
        },
      ]),
    } as unknown as PackageRepository;

    const useCase = new GetAboutMetadataUseCase(mockPackageRepo, '1.0.0', '1');
    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const meta = result.data;
    expect(meta.appName).toBe('Clata');
    expect(meta.appVersion).toBe('1.0.0');
    expect(meta.buildNumber).toBe('1');

    // Package details
    expect(meta.activePackage.packageId).toBe('jawa-mataraman');
    expect(meta.activePackage.languageName).toBe('Jawa');
    expect(meta.activePackage.dialectName).toBe('Mataraman');
    expect(meta.activePackage.version).toBe('1.0.0');

    // Credits
    expect(meta.credits.length).toBeGreaterThanOrEqual(2);
    expect(meta.credits[0].role).toContain('Pengembang');

    // Content license distinction (PRD 11.7)
    expect(meta.licenses.textLicense.code).toBe('CC-BY-SA-4.0');
    expect(meta.licenses.audioLicense.isPublicLicense).toBe(false);
    expect(meta.licenses.audioLicense.name).toContain('Non-Open License');

    // Child compliance (UU PDP, PP Tunas, Permenkomdigi)
    expect(meta.compliance.minimumAgeYears).toBe(10);
    expect(meta.compliance.legalBasis).toContain(
      'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)'
    );
    expect(meta.compliance.legalBasis).toContain(
      'PP No. 17 Tahun 2025 tentang Tata Kelola Sistem Elektronik dalam Perlindungan Anak (PP Tunas)'
    );
    expect(meta.compliance.privacySummary.localStorageOnly).toBe(true);
    expect(meta.compliance.privacySummary.noAnalyticsOrAds).toBe(true);

    // Reporting channel
    expect(meta.compliance.reportingChannel.email).toBe('lapor@clata.id');
  });

  it('provides sensible fallback if packageRepository is not available', async () => {
    const useCase = new GetAboutMetadataUseCase();
    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.activePackage.packageId).toBe('jawa-mataraman');
    expect(result.data.activePackage.version).toBe('1.0.0');
  });
});
