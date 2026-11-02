import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Icon, { type IconName } from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import type { WordItem } from '../../domain/package/packageTypes';
import {
  generateInterleavedUnitSessions,
  type UnitSessionItem,
} from '../../features/practice/domain/interleavedUnitGenerator';
import { getWordsDueForPrimer } from '../../features/practice/domain/wordPrimerChecker';
import { useUnitProgress } from '../../features/practice/hooks/useUnitProgress';
import {
  PRE_SESSION_PRESETS,
  PracticePreSessionModal,
  type PreSessionConfig,
} from '../../features/practice/presentation/PracticePreSessionModal';
import { WordPrimerModal } from '../../features/practice/presentation/WordPrimerModal';
import { WordViewRepository } from '../../infrastructure/database/wordViewRepository';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function UnitDetailScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const { isInitialized, activePackageId, activePackageData } = useApp();
  const [preSessionConfig, setPreSessionConfig] = useState<PreSessionConfig | null>(null);
  const [selectedSession, setSelectedSession] = useState<UnitSessionItem | null>(null);
  const [unviewedWordsForPrimer, setUnviewedWordsForPrimer] = useState<WordItem[]>([]);
  const [isPrimerVisible, setIsPrimerVisible] = useState(false);

  const wordViewRepo = useMemo(() => new WordViewRepository(), []);

  // Cari unit aktif berdasarkan unitId
  const currentUnit = useMemo(() => {
    if (!activePackageData) return null;
    return activePackageData.units.find((u) => u.unit_id === unitId) ?? null;
  }, [activePackageData, unitId]);

  // Bangkitkan jadwal sesi selang-seling bertahap
  const sessions = useMemo(() => {
    if (!activePackageData || !currentUnit) return [];
    const { words, sentences, dialogues } = activePackageData;

    const unitWords = words.filter((w) => w.unit_id === currentUnit.unit_id);
    const unitSentences = sentences.filter((s) => s.unit_id === currentUnit.unit_id);
    const unitDialogues = dialogues.filter((d) => d.unit_id === currentUnit.unit_id);

    return generateInterleavedUnitSessions(
      currentUnit.unit_id,
      unitWords,
      unitSentences,
      unitDialogues,
    );
  }, [activePackageData, currentUnit]);

  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  // Hook reaktif progres unit dari SQLite
  const {
    completedSessionIds,
    progressPercentage,
    markSessionCompleted,
    refreshProgress,
  } = useUnitProgress(
    resolvedPackageId,
    currentUnit?.unit_id,
    sessions.length,
  );

  // Muat ulang data penyelesaian dari SQLite secara otomatis ketika kembali ke layar unit
  useFocusEffect(
    useCallback(() => {
      void refreshProgress();
    }, [refreshProgress]),
  );

  const handleOpenSession = (session: UnitSessionItem) => {
    setSelectedSession(session);

    let preset = PRE_SESSION_PRESETS.word_guess;
    if (session.type === 'fill_gap') {
      preset = PRE_SESSION_PRESETS.fill_gap;
    } else if (session.type === 'dialogue') {
      preset = PRE_SESSION_PRESETS.dialogue;
    }

    setPreSessionConfig({
      ...preset,
      title: session.title,
    });
  };

  const handleStartSession = async (session: UnitSessionItem) => {
    if (!activePackageId || !activePackageData || !currentUnit) return;

    if (session.type === 'word_guess') {
      // 1. Tebak Kata: Buka Runner Latihan Tebak Kata interaktif
      setSelectedSession(null);
      router.push({
        pathname: '/practice/word-guess',
        params: {
          unitId: currentUnit.unit_id,
          sessionId: session.sessionId,
        },
      });
      return;
    }

    // 2. Kalimat Rumpang & Percakapan: Periksa apakah ada kosakata yang belum isViewed
    const neededWordIds = new Set<string>();
    if (session.type === 'fill_gap') {
      const relatedSentences = activePackageData.sentences.filter((s) =>
        session.itemIds.includes(s.id),
      );
      for (const s of relatedSentences) {
        if (s.focus_word_id) neededWordIds.add(s.focus_word_id);
        if (s.word_ids) {
          for (const wid of s.word_ids) neededWordIds.add(wid);
        }
      }
    } else if (session.type === 'dialogue') {
      const relatedDialogues = activePackageData.dialogues.filter((d) =>
        session.itemIds.includes(d.id),
      );
      for (const d of relatedDialogues) {
        const targetIds = (d as unknown as { target_word_ids?: string[] }).target_word_ids;
        if (Array.isArray(targetIds)) {
          for (const wid of targetIds) neededWordIds.add(wid);
        }
      }
    }

    const candidateWords = activePackageData.words.filter((w) => neededWordIds.has(w.id));
    const viewedMap = await wordViewRepo.getWordViewMap(activePackageId);
    const unviewedWords = getWordsDueForPrimer(candidateWords, viewedMap);

    if (unviewedWords.length > 0) {
      // Tampilkan layar primer "Kamu harus tahu kata ini" (belum pernah dilihat ATAU > 7 hari)
      setUnviewedWordsForPrimer(unviewedWords);
      setIsPrimerVisible(true);
    } else {
      if (session.type === 'fill_gap') {
        setSelectedSession(null);
        router.push({
          pathname: '/practice/fill-gap',
          params: {
            unitId: currentUnit.unit_id,
            sessionId: session.sessionId,
          },
        });
        return;
      }

      if (session.type === 'dialogue') {
        setSelectedSession(null);
        router.push({
          pathname: '/practice/dialogue',
          params: {
            unitId: currentUnit.unit_id,
            sessionId: session.sessionId,
            dialogueId: session.itemIds[0],
          },
        });
        return;
      }

      await markSessionCompleted(session.sessionId);
      setSelectedSession(null);
    }
  };

  const handleContinueFromPrimer = async (session: UnitSessionItem) => {
    if (!activePackageId || !currentUnit) return;
    for (const w of unviewedWordsForPrimer) {
      await wordViewRepo.recordWordView(activePackageId, w.id);
    }
    setIsPrimerVisible(false);

    if (session.type === 'fill_gap') {
      setSelectedSession(null);
      router.push({
        pathname: '/practice/fill-gap',
        params: {
          unitId: currentUnit.unit_id,
          sessionId: session.sessionId,
        },
      });
      return;
    }

    if (session.type === 'dialogue') {
      setSelectedSession(null);
      router.push({
        pathname: '/practice/dialogue',
        params: {
          unitId: currentUnit.unit_id,
          sessionId: session.sessionId,
          dialogueId: session.itemIds[0],
        },
      });
      return;
    }

    await markSessionCompleted(session.sessionId);
    setSelectedSession(null);
  };

  if (!isInitialized) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Memuat unit latihan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUnit) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.appBar}>
          <AppPressable
            accessibilityLabel="Kembali ke tab Latihan"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon color={colors.navy} name="arrow-left-line" size={24} />
          </AppPressable>
          <Text style={styles.unitTitleText}>Unit Tidak Ditemukan</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.stateText}>Data unit tidak ditemukan dalam paket aktif.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* 1. Header: Background Transparan, Back + Judul (kiri), Banyak Latihan (kanan) */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <AppPressable
            accessibilityLabel="Kembali ke tab Latihan"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon color={colors.navy} name="arrow-left-line" size={24} />
          </AppPressable>
          <Text numberOfLines={1} style={styles.unitTitleText}>
            Unit {currentUnit.order}: {currentUnit.title}
          </Text>
        </View>

        <View
          accessibilityLabel={`Banyak latihan: ${sessions.length} Latihan`}
          style={styles.exerciseChip}
        >
          <Text style={styles.exerciseChipText}>{sessions.length} Latihan</Text>
        </View>
      </View>

      {/* 2. Pinned Card: Card Background Putih (tetap di atas, tidak hilang saat scroll) */}
      <View style={styles.pinnedCardContainer}>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Progress penyelesaian</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressPercentageText}>{progressPercentage}%</Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 3. ScrollView Body: Daftar Card Latihan dengan Garis Menyambung */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sessionListContainer}>
          {sessions.map((session, index) => {
            const isLast = index === sessions.length - 1;
            const isCompleted = completedSessionIds.has(session.sessionId);

            let iconName: IconName = 'font-size';
            let accentColor: string = colors.teal;
            let tintColor: string = colors.tealTint;

            if (session.type === 'fill_gap') {
              iconName = 'edit-2-line';
              accentColor = colors.primary;
              tintColor = colors.orangeTint;
            } else if (session.type === 'dialogue') {
              iconName = 'chat-1-line';
              accentColor = colors.magenta;
              tintColor = colors.magentaTint;
            }

            if (isCompleted) {
              iconName = 'checkbox-circle-fill';
              accentColor = colors.teal;
              tintColor = colors.tealTint;
            }

            return (
              <View key={session.sessionId} style={styles.sessionItemWrapper}>
                {/* Card Latihan (Judul di kiri, Icon di kanan, tanpa deskripsi) */}
                <AppPressable
                  accessibilityLabel={`${session.title}, jenis latihan ${session.type}${isCompleted ? ', selesai' : ''}`}
                  accessibilityRole="button"
                  onPress={() => handleOpenSession(session)}
                  style={styles.sessionCard}
                >
                  <Text numberOfLines={2} style={styles.sessionCardTitle}>
                    {session.title}
                  </Text>

                  <View style={[styles.sessionIconCircle, { backgroundColor: tintColor }]}>
                    <Icon color={accentColor} name={iconName} size={20} />
                  </View>
                </AppPressable>

                {/* Dekorasi Garis Menyambung Vertikal */}
                {!isLast && (
                  <View style={styles.connectorContainer}>
                    <View style={styles.connectorLine} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 4. Modal Pra-Sesi Latihan (Full Screen, Slide In, Borderless) */}
      <PracticePreSessionModal
        config={preSessionConfig}
        onClose={() => {
          setPreSessionConfig(null);
          setSelectedSession(null);
        }}
        onStart={() => {
          setPreSessionConfig(null);
          if (selectedSession) {
            void handleStartSession(selectedSession);
          }
        }}
        visible={Boolean(preSessionConfig)}
      />

      {/* 5. Modal Primer Kata Baru: "Kamu harus tahu kata ini" */}
      <WordPrimerModal
        onClose={() => {
          setIsPrimerVisible(false);
          setSelectedSession(null);
        }}
        onContinue={() => {
          if (selectedSession) {
            void handleContinueFromPrimer(selectedSession);
          }
        }}
        visible={isPrimerVisible}
        words={unviewedWordsForPrimer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  stateText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // AppBar: Background Transparan
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    minHeight: touchTarget,
  },
  appBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  unitTitleText: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.navy,
  },
  exerciseChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseChipText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Pinned Progress Card: Tetap Card Background Putih di atas (tidak ikut ter-scroll)
  pinnedCardContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    backgroundColor: 'transparent',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.xs,
  },
  progressLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  progressPercentageText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
    minWidth: 42,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navyTint,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Body: Daftar Card Latihan & Garis Menyambung
  sessionListContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  sessionItemWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  sessionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    minHeight: touchTarget + 8,
  },
  sessionCardTitle: {
    flex: 1,
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.navy,
    paddingRight: spacing.md,
  },
  sessionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Garis Menyambung Vertikal
  connectorContainer: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.border,
  },
});
