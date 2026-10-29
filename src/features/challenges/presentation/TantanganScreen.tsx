import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../../ui/theme';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import type { ChallengeCardItem, ChallengeVariantType } from '../domain/challengeTypes';
import { getChallenges } from '../application/getChallenges';
import { toggleChallengeCheck } from '../application/toggleChallengeCheck';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeLoading, ChallengeEmpty, ChallengeError } from './ChallengeStates';

export function TantanganScreen() {
  const { container, profile } = useAppRuntime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeCardItem[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();

  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';

  useEffect(() => {
    let ignore = false;
    void getChallenges(container.challenge, packageId, undefined, selectedLevel).then((result) => {
      if (ignore) return;
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setChallenges(result.data);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [container.challenge, packageId, selectedLevel]);

  const reload = () => {
    setLoading(true);
    setError(null);
    void getChallenges(container.challenge, packageId, undefined, selectedLevel).then((result) => {
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setChallenges(result.data);
      }
      setLoading(false);
    });
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

  const levels = [
    { label: 'Semua Tingkat', value: undefined },
    { label: 'L1 (Pemula)', value: 'L1' },
    { label: 'L2 (Menengah)', value: 'L2' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Tantangan
        </Text>
        <Text style={styles.headerDescription}>
          Coba sedikit demi sedikit, sesuai kenyamananmu.
        </Text>

        {/* Level Filter Chips */}
        <View style={styles.filterBar}>
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
                <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                  {lvl.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Content List */}
      {loading ? (
        <ChallengeLoading />
      ) : error ? (
        <ChallengeError message={error} onRetry={reload} />
      ) : challenges.length === 0 ? (
        <ChallengeEmpty message="Belum ada tantangan untuk filter ini." />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onToggleCheck={handleToggleCheck}
              onPlayAudio={handlePlayAudio}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background ?? '#F6F8FA',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.background ?? '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
