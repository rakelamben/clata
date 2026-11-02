import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { generateInterleavedUnitSessions } from '../../features/practice/domain/interleavedUnitGenerator';
import { computeUnitPracticeSummaries } from '../../features/practice/domain/practiceStats';
import {
  FreePracticeCard,
  PracticeAppBar,
  QuickPracticeCard,
  UnitPracticeCard,
} from '../../features/practice/presentation/PracticeComponents';
import {
  PRE_SESSION_PRESETS,
  PracticePreSessionModal,
  type PreSessionConfig,
} from '../../features/practice/presentation/PracticePreSessionModal';
import { UnitProgressRepository } from '../../infrastructure/database/unitProgressRepository';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function LatihanScreen() {
  const { isInitialized, activePackageId, activePackageData } = useApp();
  const [preSessionConfig, setPreSessionConfig] = useState<PreSessionConfig | null>(null);
  const [selectedPracticeType, setSelectedPracticeType] = useState<
    'quick' | 'word_guess' | 'fill_gap' | 'dialogue' | null
  >(null);
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());

  const unitProgressRepo = useMemo(() => new UnitProgressRepository(), []);
  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  // Muat status unit yang sudah 100% tuntas
  const refreshCompletedUnits = useCallback(async () => {
    if (!resolvedPackageId || !activePackageData) {
      setCompletedUnitIds(new Set());
      return;
    }

    try {
      const completedSessionsMap =
        await unitProgressRepo.getCompletedSessionsByPackage(resolvedPackageId);
      const { units, words, sentences, dialogues } = activePackageData;
      const completedSet = new Set<string>();

      for (const unit of units) {
        const uWords = words.filter((w) => w.unit_id === unit.unit_id);
        const uSentences = sentences.filter((s) => s.unit_id === unit.unit_id);
        const uDialogues = dialogues.filter((d) => d.unit_id === unit.unit_id);
        const sessions = generateInterleavedUnitSessions(
          unit.unit_id,
          uWords,
          uSentences,
          uDialogues,
        );

        const doneSessions = completedSessionsMap[unit.unit_id];
        if (
          sessions.length > 0 &&
          doneSessions &&
          sessions.every((s) => doneSessions.has(s.sessionId))
        ) {
          completedSet.add(unit.unit_id);
        }
      }

      setCompletedUnitIds(completedSet);
    } catch (err) {
      console.warn('Gagal memuat status kelulusan unit:', err);
    }
  }, [resolvedPackageId, activePackageData, unitProgressRepo]);

  useFocusEffect(
    useCallback(() => {
      void refreshCompletedUnits();
    }, [refreshCompletedUnits]),
  );

  // Hitung jumlah latihan per unit secara dinamis dari database/paket aktif
  const unitsWithCount = useMemo(() => {
    return computeUnitPracticeSummaries(activePackageData);
  }, [activePackageData]);

  if (!isInitialized) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Menyiapkan data latihan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activePackageData) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <PracticeAppBar unitCount={0} />
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon color={colors.textSecondary} name="pencil-ruler-2-line" size={36} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Paket Aktif</Text>
          <Text style={styles.emptyDescription}>
            Pasang atau impor paket bahasa untuk mulai mengakses unit dan sesi latihan.
          </Text>
          <AppPressable
            accessibilityLabel="Pilih berkas paket bahasa .clata"
            accessibilityRole="button"
            onPress={() => router.push('/onboarding/select-package')}
            style={styles.uploadButton}
          >
            <Icon color={colors.surface} name="folder-upload-line" size={18} />
            <Text style={styles.uploadButtonText}>Pilih Berkas .clata</Text>
          </AppPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* 1. Appbar: teks Latihan ---- teks n Unit */}
      <PracticeAppBar unitCount={unitsWithCount.length} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Card Latihan Cepat (Horizontal) */}
        <QuickPracticeCard
          onPress={() => {
            setSelectedPracticeType('quick');
            setPreSessionConfig(PRE_SESSION_PRESETS.quick);
          }}
        />

        {/* 3. Section Unit Latihan */}
        <View style={styles.sectionContainer}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Unit Latihan
          </Text>

          {unitsWithCount.map((unit) => (
            <UnitPracticeCard
              exerciseCount={unit.exerciseCount}
              isCompleted={completedUnitIds.has(unit.unit_id)}
              key={unit.unit_id}
              onPress={() => {
                router.push(`/practice/${unit.unit_id}`);
              }}
              order={unit.order}
              title={unit.title}
            />
          ))}
        </View>

        {/* 4. Section Latihan Bebas */}
        <View style={styles.sectionContainer}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Latihan Bebas
          </Text>

          {/* Card 1: Tebak Kata */}
          <FreePracticeCard
            accentColor={colors.teal}
            description="Asah ingatan kosakata dan arti kata pilihan."
            iconName="font-size"
            onPress={() => {
              setSelectedPracticeType('word_guess');
              setPreSessionConfig(PRE_SESSION_PRESETS.word_guess);
            }}
            tintColor={colors.tealTint}
            title="Tebak Kata"
          />

          {/* Card 2: Kalimat Rumpang */}
          <FreePracticeCard
            accentColor={colors.primary}
            description="Lengkapi kata target yang tepat sesuai konteks kalimat utuh."
            iconName="edit-2-line"
            onPress={() => {
              setSelectedPracticeType('fill_gap');
              setPreSessionConfig(PRE_SESSION_PRESETS.fill_gap);
            }}
            tintColor={colors.orangeTint}
            title="Kalimat Rumpang"
          />

          {/* Card 3: Percakapan */}
          <FreePracticeCard
            accentColor={colors.magenta}
            description="Praktik dialog situasi nyata dan memilih ragam tutur yang pas."
            iconName="chat-1-line"
            onPress={() => {
              setSelectedPracticeType('dialogue');
              setPreSessionConfig(PRE_SESSION_PRESETS.dialogue);
            }}
            tintColor={colors.magentaTint}
            title="Percakapan"
          />
        </View>
      </ScrollView>

      {/* 5. Bottom Sheet Pra-Sesi Latihan (Netral Terang, Borderless) */}
      <PracticePreSessionModal
        config={preSessionConfig}
        onClose={() => {
          setPreSessionConfig(null);
          setSelectedPracticeType(null);
        }}
        onStart={() => {
          const type = selectedPracticeType;
          setPreSessionConfig(null);
          setSelectedPracticeType(null);

          if (type === 'quick') {
            router.push('/practice/quick-quiz');
          } else if (type === 'word_guess') {
            router.push({
              pathname: '/practice/word-guess',
              params: { mode: 'free' },
            });
          } else if (type === 'fill_gap') {
            router.push({
              pathname: '/practice/fill-gap',
              params: { mode: 'free' },
            });
          } else if (type === 'dialogue') {
            router.push({
              pathname: '/practice/dialogue',
              params: { mode: 'free', dialogueId: 'random' },
            });
          }
        }}
        visible={Boolean(preSessionConfig)}
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
    paddingBottom: spacing.xxl,
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
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
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  uploadButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.surface,
  },
});
