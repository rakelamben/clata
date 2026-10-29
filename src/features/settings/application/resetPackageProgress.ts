import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { ProgressRepository } from '../../progress/data/progressRepository';

export interface ResetPackageProgressInput {
  packageId: string;
}

export interface ResetPackageProgressOutput {
  success: boolean;
  packageId: string;
  resetAt: string;
}

export class ResetPackageProgressUseCase {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly generateId: () => string = () =>
      `reset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  ) {}

  async execute(
    input: ResetPackageProgressInput
  ): Promise<RepositoryResult<ResetPackageProgressOutput>> {
    const commandId = this.generateId();
    const timestamp = this.now();
    const result = await this.progressRepository.resetPackage(
      input.packageId,
      commandId,
      timestamp
    );
    if (!result.ok) {
      return result;
    }

    // Rebuild snapshot under the new boundary so cache is reset to 0
    await this.progressRepository.rebuild(
      { packageId: input.packageId },
      timestamp.substring(0, 10)
    );

    return {
      ok: true,
      data: {
        success: true,
        packageId: input.packageId,
        resetAt: timestamp,
      },
    };
  }
}
