import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { ChallengeRepository } from '../domain/challengeRepository';
import type { ChallengeCardItem, ChallengeVariantType } from '../domain/challengeTypes';
import type { Clock } from '../../../domain/ports/Clock';
import { createChallengeError } from '../domain/challengeErrors';
import { getSafetyGuidanceForChallenge, getDefaultRescuePhrases } from '../domain/challengeInvariants';

export class SQLiteChallengeRepository implements ChallengeRepository {
  constructor(
    private readonly database: DatabasePort,
    private readonly clock: Clock,
  ) {}

  private nowIso(): string {
    return this.clock.now().toISOString();
  }

  async getChallenges(
    packageId: string,
    unitId?: string,
    level?: string,
  ): Promise<RepositoryResult<ChallengeCardItem[]>> {
    try {
      let sql = `
        SELECT c.item_id, c.unit_id, c.payload_json, cc.checked_at, cc.variant
        FROM challenges c
        LEFT JOIN challenge_checks cc ON c.package_id = cc.package_id AND c.item_id = cc.challenge_id
        WHERE c.package_id = ?
      `;
      const params: unknown[] = [packageId];

      if (unitId) {
        sql += ' AND c.unit_id = ?';
        params.push(unitId);
      }
      sql += ' ORDER BY c.item_order ASC';

      const rows = await this.database.all<{
        item_id: string;
        unit_id: string | null;
        payload_json: string;
        checked_at: string | null;
        variant: string | null;
      }>(sql, params);

      const items: ChallengeCardItem[] = rows
        .map((row) => {
          let payload: Record<string, unknown> = {};
          try {
            payload = JSON.parse(row.payload_json);
          } catch {
            // fallback
          }

          const challengeLevel = (payload.level as ChallengeCardItem['level']) ?? 'L1';
          const item: ChallengeCardItem = {
            id: String(row.item_id),
            packageId,
            unitId: String(row.unit_id ?? payload.unit_id ?? ''),
            level: challengeLevel,
            title: String(payload.title ?? (payload.solo ? 'Tantangan Harian' : row.item_id)),
            estimatedDurationMinutes: typeof payload.estimatedDurationMinutes === 'number' ? payload.estimatedDurationMinutes : 5,
            objective: typeof payload.objective === 'string' ? payload.objective : 'Mempraktikkan frasa dasar di situasi santai.',
            solo: String(payload.solo ?? 'Lakukan latihan mandiri dengan mengucapkan frasa target.'),
            social: String(payload.social ?? 'Gunakan frasa ini saat bertegur sapa dengan teman atau keluarga.'),
            safetyGuidance: typeof payload.safetyGuidance === 'string' ? payload.safetyGuidance : undefined,
            rescuePhrases: Array.isArray(payload.rescuePhrases) ? (payload.rescuePhrases as ChallengeCardItem['rescuePhrases']) : undefined,
            isChecked: row.checked_at !== null,
            checkedVariant: row.variant === 'social' ? 'social' : row.variant === 'solo' ? 'solo' : undefined,
            checkedAt: row.checked_at !== null ? String(row.checked_at) : undefined,
          };

          // Enrich with default safety guidance and rescue phrases if missing
          return {
            ...item,
            safetyGuidance: getSafetyGuidanceForChallenge(item),
            rescuePhrases: getDefaultRescuePhrases(item),
          };
        })
        .filter((item) => (level ? item.level === level : true));

      return { ok: true, data: items };
    } catch (error) {
      return {
        ok: false,
        error: createChallengeError('CHALLENGE_QUERY_FAILED', 'Gagal memuat kartu tantangan.', { cause: error }),
      };
    }
  }

  async toggleChallengeCheck(input: {
    packageId: string;
    challengeId: string;
    variant: ChallengeVariantType;
  }): Promise<RepositoryResult<{ isChecked: boolean }>> {
    const { packageId, challengeId, variant } = input;
    try {
      const existing = await this.database.get<{ checked_at: string }>(
        'SELECT checked_at FROM challenge_checks WHERE package_id = ? AND challenge_id = ?',
        [packageId, challengeId],
      );

      if (existing) {
        await this.database.run(
          'DELETE FROM challenge_checks WHERE package_id = ? AND challenge_id = ?',
          [packageId, challengeId],
        );
        return { ok: true, data: { isChecked: false } };
      }

      await this.database.run(
        'INSERT OR REPLACE INTO challenge_checks (package_id, challenge_id, checked_at, variant) VALUES (?, ?, ?, ?)',
        [packageId, challengeId, this.nowIso(), variant],
      );
      return { ok: true, data: { isChecked: true } };
    } catch (error) {
      return {
        ok: false,
        error: createChallengeError('CHALLENGE_QUERY_FAILED', 'Gagal memperbarui status centang tantangan.', { cause: error }),
      };
    }
  }
}
