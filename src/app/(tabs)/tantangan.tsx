import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import {
  CHALLENGE_LEVEL_OPTIONS,
  computeChallengeLevel,
  getChallengeLevelLabel,
  type ChallengeCardItem,
  type ChallengeLevel,
  type ChallengeVariantType,
} from '../../features/challenge/domain/challengeTypes';
import { ChallengeCard } from '../../features/challenge/presentation/ChallengeCard';
import { ChallengeDetailSheet } from '../../features/challenge/presentation/ChallengeDetailSheet';
import {
  ChallengeEmpty,
  ChallengeError,
  ChallengeLoading,
} from '../../features/challenge/presentation/ChallengeStates';
import { DropdownPickerModal } from '../../features/challenge/presentation/DropdownPickerModal';
import { ChallengeRepository } from '../../infrastructure/database/challengeRepository';
import type { ChallengeProgressRecord } from '../../infrastructure/database/databaseTypes';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function TantanganScreen() {
  const { isInitialized, activePackageId, activePackageData } = useApp();
  const challengeRepo = useMemo(() => new ChallengeRepository(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ChallengeProgressRecord>>({});

  // Filter States
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<ChallengeLevel | undefined>(undefined);

  // Dropdown & Detail States
  const [activeDropdown, setActiveDropdown] = useState<'unit' | 'level' | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeCardItem | null>(null);

  // Animasi & Delay Kartu Selesai
  const [delayingRemovalIds, setDelayingRemovalIds] = useState<Set<string>>(new Set());
  const [fadingOutChallengeIds, setFadingOutChallengeIds] = useState<Set<string>>(new Set());
  const removalTimeoutsRef = useRef<
    Map<string, { fadeTimer: NodeJS.Timeout; removeTimer: NodeJS.Timeout }>
  >(new Map());

  useEffect(() => {
    const timeouts = removalTimeoutsRef.current;
    return () => {
      timeouts.forEach(({ fadeTimer, removeTimer }) => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      });
      timeouts.clear();
    };
  }, []);

  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  // Muat status centang tantangan dari SQLite
  const loadProgress = useCallback(async () => {
    if (!resolvedPackageId) {
      setProgressMap({});
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const map = await challengeRepo.getChallengeProgressMap(resolvedPackageId);
      setProgressMap(map);
    } catch (err) {
      console.warn('Gagal memuat status tantangan:', err);
      setError('Gagal memuat status tantangan.');
    } finally {
      setLoading(false);
    }
  }, [resolvedPackageId, challengeRepo]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
    }, [loadProgress]),
  );

  // Toggle Centang Selesai
  const handleToggleCheck = async (
    challengeId: string,
    variant: ChallengeVariantType,
  ) => {
    if (!resolvedPackageId) return;
    try {
      const updated = await challengeRepo.toggleChallenge(
        resolvedPackageId,
        challengeId,
        variant,
      );

      setProgressMap((prev) => ({
        ...prev,
        [challengeId]: updated,
      }));

      // Jika baru ditandai selesai dan 'Lihat selesai' mati: Beri delay & animasi sebelum hilang
      if (updated.is_completed === 1 && !showCompleted) {
        // Bersihkan timeout lama jika ada
        const existingTimers = removalTimeoutsRef.current.get(challengeId);
        if (existingTimers) {
          clearTimeout(existingTimers.fadeTimer);
          clearTimeout(existingTimers.removeTimer);
        }

        // Tahan kartu agar tetap tampil dalam status selesai
        setDelayingRemovalIds((prev) => new Set(prev).add(challengeId));

        // Delay 650ms: Mulai animasi fade-out
        const fadeTimer = setTimeout(() => {
          setFadingOutChallengeIds((prev) => new Set(prev).add(challengeId));
        }, 650);

        // Delay 950ms: Hilangkan sepenuhnya dari daftar
        const removeTimer = setTimeout(() => {
          setDelayingRemovalIds((prev) => {
            const next = new Set(prev);
            next.delete(challengeId);
            return next;
          });
          setFadingOutChallengeIds((prev) => {
            const next = new Set(prev);
            next.delete(challengeId);
            return next;
          });
          removalTimeoutsRef.current.delete(challengeId);
        }, 950);

        removalTimeoutsRef.current.set(challengeId, { fadeTimer, removeTimer });
      } else if (updated.is_completed === 0) {
        // Jika dibatalkan selesai: Batalkan delay & reset
        const existingTimers = removalTimeoutsRef.current.get(challengeId);
        if (existingTimers) {
          clearTimeout(existingTimers.fadeTimer);
          clearTimeout(existingTimers.removeTimer);
          removalTimeoutsRef.current.delete(challengeId);
        }
        setDelayingRemovalIds((prev) => {
          const next = new Set(prev);
          next.delete(challengeId);
          return next;
        });
        setFadingOutChallengeIds((prev) => {
          const next = new Set(prev);
          next.delete(challengeId);
          return next;
        });
      }

      // Update detail sheet jika sedang terbuka
      setSelectedChallenge((current) => {
        if (!current || current.id !== challengeId) return current;
        return {
          ...current,
          isChecked: updated.is_completed === 1,
          checkedVariant: updated.is_completed === 1 ? updated.completed_variant : undefined,
          completedAt: updated.completed_at,
        };
      });
    } catch (err) {
      console.warn('Gagal mengubah status tantangan:', err);
    }
  };

  // Opsi Dropdown Unit
  const unitOptions = useMemo(() => {
    const list = [{ label: 'Semua Unit', value: undefined as string | undefined }];
    if (!activePackageData?.units) return list;

    activePackageData.units.forEach((u) => {
      list.push({
        label: `Unit ${u.order}: ${u.title}`,
        value: u.unit_id,
      });
    });
    return list;
  }, [activePackageData]);

  // Label Unit Terpilih
  const currentUnitLabel = useMemo(() => {
    if (!selectedUnitId) return 'Semua Unit';
    const found = activePackageData?.units.find((u) => u.unit_id === selectedUnitId);
    return found ? `Unit ${found.order}` : 'Semua Unit';
  }, [selectedUnitId, activePackageData]);

  // Label Tingkat Terpilih
  const currentLevelLabel = useMemo(() => {
    if (!selectedLevel) return 'Semua Tingkat';
    return getChallengeLevelLabel(selectedLevel);
  }, [selectedLevel]);

  // Olah seluruh data tantangan dengan status progres
  const allChallengeItems = useMemo<ChallengeCardItem[]>(() => {
    if (!activePackageData?.challenges) return [];

    return activePackageData.challenges.map((c) => {
      const rec = progressMap[c.id];
      const isChecked = rec ? rec.is_completed === 1 : false;
      const checkedVariant = rec && rec.is_completed === 1 ? rec.completed_variant : undefined;
      const level = computeChallengeLevel(c.estimatedDurationMinutes);

      return {
        ...c,
        level,
        isChecked,
        checkedVariant,
        completedAt: rec?.completed_at,
      };
    });
  }, [activePackageData, progressMap]);

  // Filter daftar tantangan sesuai filter unit, level, dan toggle "Lihat selesai"
  const filteredChallenges = useMemo(() => {
    return allChallengeItems.filter((item) => {
      // 1. Filter Selesai: Jika showCompleted false dan tidak sedang dalam fase delay animasi, sembunyikan
      if (!showCompleted && item.isChecked && !delayingRemovalIds.has(item.id)) {
        return false;
      }
      // 2. Filter Unit
      if (selectedUnitId && item.unit_id !== selectedUnitId) {
        return false;
      }
      // 3. Filter Level
      if (selectedLevel && item.level !== selectedLevel) {
        return false;
      }
      return true;
    });
  }, [allChallengeItems, showCompleted, selectedUnitId, selectedLevel, delayingRemovalIds]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* 1. Header & Bar Kontrol Filter */}
      <View style={styles.headerContainer}>
        {/* Baris 1: Judul Layar */}
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Tantangan
        </Text>

        {/* Baris 2: Kontrol Filter (Kiri: Checkbox "Lihat selesai", Kanan: 2 Chip Dropdown) */}
        <View style={styles.controlRow}>
          {/* Sisi Kiri: Checkbox "Lihat selesai" */}
          <AppPressable
            accessibilityLabel="Tampilkan tantangan yang sudah selesai"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: showCompleted }}
            onPress={() => setShowCompleted((prev) => !prev)}
            style={styles.toggleRow}
          >
            <View
              style={[
                styles.toggleCheckbox,
                showCompleted && styles.toggleCheckboxActive,
              ]}
            >
              {showCompleted && (
                <Icon color={colors.surface} name="check-line" size={14} />
              )}
            </View>
            <Text
              style={[
                styles.toggleLabel,
                showCompleted && styles.toggleLabelActive,
              ]}
            >
              Lihat selesai
            </Text>
          </AppPressable>

          {/* Sisi Kanan: 2 Chip Filter Horizontal (Unit di kiri, Tingkat di kanan) */}
          <View style={styles.dropdownChipsRow}>
            {/* Chip Dropdown Unit */}
            <AppPressable
              accessibilityLabel={`Filter unit, terpilih: ${currentUnitLabel}`}
              accessibilityRole="button"
              onPress={() => setActiveDropdown('unit')}
              style={[
                styles.dropdownChip,
                selectedUnitId !== undefined && styles.dropdownChipActive,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.dropdownChipText,
                  selectedUnitId !== undefined && styles.dropdownChipTextActive,
                ]}
              >
                {currentUnitLabel}
              </Text>
              <Icon
                color={selectedUnitId !== undefined ? colors.teal : colors.navy}
                name="arrow-down-s-line"
                size={16}
              />
            </AppPressable>

            {/* Chip Dropdown Tingkat */}
            <AppPressable
              accessibilityLabel={`Filter tingkat, terpilih: ${currentLevelLabel}`}
              accessibilityRole="button"
              onPress={() => setActiveDropdown('level')}
              style={[
                styles.dropdownChip,
                selectedLevel !== undefined && styles.dropdownChipActive,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.dropdownChipText,
                  selectedLevel !== undefined && styles.dropdownChipTextActive,
                ]}
              >
                {currentLevelLabel}
              </Text>
              <Icon
                color={selectedLevel !== undefined ? colors.teal : colors.navy}
                name="arrow-down-s-line"
                size={16}
              />
            </AppPressable>
          </View>
        </View>
      </View>

      {/* 2. Daftar Tantangan Utama */}
      {!isInitialized || loading ? (
        <ChallengeLoading />
      ) : error ? (
        <ChallengeError message={error} onRetry={loadProgress} />
      ) : filteredChallenges.length === 0 ? (
        <ChallengeEmpty
          message={
            !showCompleted && allChallengeItems.some((c) => c.isChecked)
              ? 'Seluruh tantangan untuk filter ini sudah selesai! Centang "Lihat selesai" untuk melihatnya kembali.'
              : 'Belum ada tantangan yang cocok dengan filter yang dipilih.'
          }
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredChallenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              isFadingOut={fadingOutChallengeIds.has(item.id)}
              onPressCard={() => setSelectedChallenge(item)}
              onToggleCheck={handleToggleCheck}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 3. Modal Dropdown Picker Unit */}
      <DropdownPickerModal
        onClose={() => setActiveDropdown(null)}
        onSelect={(val) => setSelectedUnitId(val)}
        options={unitOptions}
        selectedValue={selectedUnitId}
        title="Pilih Unit"
        visible={activeDropdown === 'unit'}
      />

      {/* 4. Modal Dropdown Picker Tingkat */}
      <DropdownPickerModal
        onClose={() => setActiveDropdown(null)}
        onSelect={(val) => setSelectedLevel(val)}
        options={CHALLENGE_LEVEL_OPTIONS}
        selectedValue={selectedLevel}
        title="Pilih Tingkat"
        visible={activeDropdown === 'level'}
      />

      {/* 5. Lembar Detail Tantangan (Bottom Sheet) */}
      <ChallengeDetailSheet
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onToggleCheck={handleToggleCheck}
        visible={selectedChallenge !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
    letterSpacing: -0.04,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  // Sisi Kiri: Checkbox "Lihat selesai"
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget - 8,
    paddingVertical: 4,
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  toggleLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleLabelActive: {
    fontFamily: fonts.uiSemiBold,
    color: colors.navy,
  },

  // Sisi Kanan: 2 Chip Dropdown
  dropdownChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dropdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.control,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  dropdownChipActive: {
    backgroundColor: colors.tealTint,
    borderColor: colors.teal,
  },
  dropdownChipText: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.navy,
    maxWidth: 90,
  },
  dropdownChipTextActive: {
    fontFamily: fonts.uiSemiBold,
    color: colors.teal,
  },

  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + touchTarget,
  },
});
