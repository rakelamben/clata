import { useCallback, useEffect, useState } from 'react';

import type { UnitSessionProgressRecord } from '../../../infrastructure/database/databaseTypes';
import { UnitProgressRepository } from '../../../infrastructure/database/unitProgressRepository';

const unitProgressRepo = new UnitProgressRepository();

export interface UseUnitProgressResult {
  completedSessionIds: Set<string>;
  progressMap: Record<string, UnitSessionProgressRecord>;
  progressPercentage: number;
  completedCount: number;
  isLoading: boolean;
  markSessionCompleted: (sessionId: string, scorePercentage?: number) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useUnitProgress(
  packageId: string | null | undefined,
  unitId: string | null | undefined,
  totalSessionsCount: number,
  customRepo?: UnitProgressRepository,
): UseUnitProgressResult {
  const repo = customRepo ?? unitProgressRepo;
  const [completedSessionIds, setCompletedSessionIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, UnitSessionProgressRecord>>({});
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!packageId || !unitId) {
        if (isMounted) {
          setCompletedSessionIds(new Set());
          setProgressMap({});
          setProgressPercentage(0);
          setCompletedCount(0);
          setIsLoading(false);
        }
        return;
      }

      try {
        const records = await repo.getUnitProgress(packageId, unitId);
        if (!isMounted) return;

        setProgressMap(records);

        const completedSet = new Set<string>();
        let doneCount = 0;
        for (const [sId, rec] of Object.entries(records)) {
          if (rec.is_completed === 1) {
            completedSet.add(sId);
            doneCount++;
          }
        }

        setCompletedSessionIds(completedSet);
        setCompletedCount(doneCount);

        const percentage =
          totalSessionsCount > 0
            ? Math.min(100, Math.round((doneCount / totalSessionsCount) * 100))
            : 0;
        setProgressPercentage(percentage);
      } catch (err) {
        console.warn('Gagal memuat progres unit latihan:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, [packageId, unitId, totalSessionsCount, repo, refreshIndex]);

  const refreshProgress = useCallback(async () => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const markSessionCompleted = useCallback(
    async (sessionId: string, scorePercentage = 100) => {
      if (!packageId || !unitId) return;
      try {
        await repo.recordSessionCompletion(packageId, unitId, sessionId, scorePercentage);
        setRefreshIndex((prev) => prev + 1);
      } catch (err) {
        console.warn('Gagal mencatat penyelesaian sesi unit:', err);
      }
    },
    [packageId, unitId, repo],
  );

  return {
    completedSessionIds,
    progressMap,
    progressPercentage,
    completedCount,
    isLoading,
    markSessionCompleted,
    refreshProgress,
  };
}
