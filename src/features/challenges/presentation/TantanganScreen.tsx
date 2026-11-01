import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RemixIcon from 'react-native-remix-icon';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import type {
  ChallengeCardItem,
  ChallengeLevel,
  ChallengeVariantType,
} from '../domain/challengeTypes';
import { getChallenges } from '../application/getChallenges';
import { toggleChallengeCheck } from '../application/toggleChallengeCheck';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeDetailSheet } from './ChallengeDetailSheet';
import { ChallengeLoading, ChallengeEmpty, ChallengeError } from './ChallengeStates';

type UnitFilterItem = {
  id: string;
  order: number;
  title: string;
};

export function TantanganScreen() {
  const insets = useSafeAreaInsets();
  const { container, profile } = useAppRuntime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeCardItem[]>([]);
  const [units, setUnits] = useState<UnitFilterItem[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<ChallengeLevel | undefined>(undefined);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeCardItem | null>(null);

  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';

  // Load available units for contextual filtering
  useEffect(() => {
    let ignore = false;
    async function loadUnits() {
      try {
        const res = await container.practice.getUnits(packageId);
        if (!ignore && res.ok) {
          setUnits(res.data);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadUnits();
    return () => {
      ignore = true;
    };
  }, [container.practice, packageId]);

  // Load challenges from SQLite repository
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      async function fetchChallenges() {
        const result = await getChallenges(
          container.challenge,
          packageId,
          selectedUnitId,
          selectedLevel,
        );
        if (ignore) return;
        if (!result.ok) {
          setError(result.error.message);
        } else {
          setChallenges(result.data);
        }
        setLoading(false);
      }
      fetchChallenges();
      return () => {
        ignore = true;
      };
    }, [container.challenge, packageId, selectedUnitId, selectedLevel])
  );

  const reload = () => {
    setLoading(true);
    setError(null);
    void getChallenges(container.challenge, packageId, selectedUnitId, selectedLevel).then(
      (result) => {
        if (!result.ok) {
          setError(result.error.message);
        } else {
          setChallenges(result.data);
        }
        setLoading(false);
      },
    );
  };

  const handleToggleCheck = async (challengeId: string, variant: ChallengeVariantType) => {
    const result = await toggleChallengeCheck({
      repository: container.challenge,
      packageId,
      challengeId,
      variant,
    });

    if (result.ok) {
      setChallenges((prev) =>
        prev.map((item) =>
          item.id === challengeId
            ? { ...item, isChecked: result.data.isChecked, checkedVariant: variant }
            : item,
        ),
      );
      setSelectedChallenge((current) =>
        current && current.id === challengeId
          ? { ...current, isChecked: result.data.isChecked, checkedVariant: variant }
          : current,
      );
    }
  };

  const handlePlayAudio = async (audioPath: string) => {
    await container.audio.stop();
    const sourceRes = container.audioSources.resolve(packageId, '1.0.0', audioPath);
    if (sourceRes !== null) {
      await container.audio.play({
        itemId: audioPath,
        uri: sourceRes,
        format: 'opus',
      });
    }
  };

  // Human-friendly level filters (No L1/L2 codes in labels)
  const levels: { label: string; value: ChallengeLevel | undefined }[] = [
    { label: 'Semua Tingkat', value: undefined },
    { label: 'Ringan', value: 'L1' },
    { label: 'Sedang', value: 'L2' },
    { label: 'Besar', value: 'L3' },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Tantangan
        </Text>

        {/* Filter Section: Level Chips (Ringan / Sedang / Besar) */}
        <View style={styles.filterGroup}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {levels.map((lvl, index) => {
              const isSelected = selectedLevel === lvl.value;
              return (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={lvl.label}
                  onPress={() => setSelectedLevel(lvl.value)}
                  style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                >
                  {isSelected ? (
                    <RemixIcon name="check-line" size={14} color={colors.surface} />
                  ) : null}
                  <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                    {lvl.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Unit Filters (If multi-units exist) */}
        {units.length > 1 ? (
          <View style={styles.unitFilterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Semua Unit"
                onPress={() => setSelectedUnitId(undefined)}
                style={[styles.unitChip, !selectedUnitId && styles.activeUnitChip]}
              >
                <Text style={[styles.unitChipText, !selectedUnitId && styles.activeUnitChipText]}>
                  Semua Unit
                </Text>
              </Pressable>
              {units.map((unit) => {
                const isSelected = selectedUnitId === unit.id;
                return (
                  <Pressable
                    key={unit.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Unit ${unit.order}`}
                    onPress={() => setSelectedUnitId(unit.id)}
                    style={[styles.unitChip, isSelected && styles.activeUnitChip]}
                  >
                    <Text style={[styles.unitChipText, isSelected && styles.activeUnitChipText]}>
                      Unit {unit.order}: {unit.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Main Content List with Simple Cards */}
      {loading ? (
        <ChallengeLoading />
      ) : error ? (
        <ChallengeError message={error} onRetry={reload} />
      ) : challenges.length === 0 ? (
        <ChallengeEmpty message="Belum ada tantangan untuk filter yang kamu pilih." />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPressCard={() => setSelectedChallenge(item)}
              onToggleCheck={handleToggleCheck}
            />
          )}
        />
      )}

      {/* Detail Bottom Sheet without dark backdrop, scrollable, with handle */}
      <ChallengeDetailSheet
        visible={selectedChallenge !== null}
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onToggleCheck={handleToggleCheck}
        onPlayAudio={handlePlayAudio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
    letterSpacing: -0.04,
  },
  headerDescription: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  filterGroup: {
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Math.max(36, touchTarget - 12),
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.background,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  activeFilterChip: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  activeFilterText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.surface,
  },
  unitFilterRow: {
    marginTop: spacing.xs,
  },
  unitChip: {
    minHeight: 32,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radii.control,
    backgroundColor: '#F0F2F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeUnitChip: {
    backgroundColor: colors.tealTint,
    borderColor: colors.teal,
  },
  unitChipText: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeUnitChipText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.teal,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
