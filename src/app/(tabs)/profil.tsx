import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { ChallengeRepository } from '../../infrastructure/database/challengeRepository';
import type {
  ChallengeProgressRecord,
  DailyStreakRecord,
  UnitSessionProgressRecord,
  WordViewRecord,
} from '../../infrastructure/database/databaseTypes';
import { SettingsRepository } from '../../infrastructure/database/settingsRepository';
import { StreakRepository } from '../../infrastructure/database/streakRepository';
import { UnitProgressRepository } from '../../infrastructure/database/unitProgressRepository';
import { WordViewRepository } from '../../infrastructure/database/wordViewRepository';
import { generateInterleavedUnitSessions } from '../../features/practice/domain/interleavedUnitGenerator';
import { colors, fonts, spacing } from '../../ui/theme';
import { AudioSpeedModal } from '../../features/profile/presentation/AudioSpeedModal';
import { PackageSwitchSheet } from '../../features/profile/presentation/PackageSwitchSheet';
import {
  LearningStatsSheet,
  MasteryDetailSheet,
  StreakDetailSheet,
  UnitDetailSheet,
} from '../../features/profile/presentation/ProfileDetailSheets';
import { ProfileHeroCards } from '../../features/profile/presentation/ProfileHeroCards';
import { ProfileMenuCard } from '../../features/profile/presentation/ProfileMenuCard';
import {
  ProfileUnitAccordion,
  type ProfileUnitItemProgress,
} from '../../features/profile/presentation/ProfileUnitAccordion';
import { ResetProgressModal } from '../../features/profile/presentation/ResetProgressModal';

export default function ProfilScreen() {
  const {
    activePackageId,
    activePackageData,
    switchActivePackage,
    resetPackageProgress,
  } = useApp();

  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  const streakRepo = useMemo(() => new StreakRepository(), []);
  const unitRepo = useMemo(() => new UnitProgressRepository(), []);
  const wordViewRepo = useMemo(() => new WordViewRepository(), []);
  const challengeRepo = useMemo(() => new ChallengeRepository(), []);
  const settingsRepo = useMemo(() => new SettingsRepository(), []);

  // State Data Progres
  const [streakDays, setStreakDays] = useState(0);
  const [todayStreak, setTodayStreak] = useState<DailyStreakRecord | null>(null);
  const [unitProgressMap, setUnitProgressMap] = useState<Record<string, UnitSessionProgressRecord>>({});
  const [wordViewsMap, setWordViewsMap] = useState<Map<string, WordViewRecord>>(() => new Map());
  const [challengeProgressMap, setChallengeProgressMap] = useState<Record<string, ChallengeProgressRecord>>({});
  const [audioSpeed, setAudioSpeedState] = useState<'normal' | 'slow'>('normal');

  // State Modal & Bottom Sheet
  const [showStreakSheet, setShowStreakSheet] = useState(false);
  const [showMasterySheet, setShowMasterySheet] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<ProfileUnitItemProgress | null>(null);
  const [showPackageSwitchSheet, setShowPackageSwitchSheet] = useState(false);
  const [showAudioSpeedModal, setShowAudioSpeedModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Muat data setiap kali tab profil dibuka
  const loadProfileData = useCallback(async () => {
    if (!resolvedPackageId) return;

    try {
      const [
        streakCount,
        currentDayStreak,
        unitMap,
        wordMap,
        challengeMap,
        speed,
      ] = await Promise.all([
        streakRepo.getConsecutiveStreak(resolvedPackageId),
        streakRepo.getTodayStreak(resolvedPackageId),
        unitRepo.getAllUnitProgress(resolvedPackageId),
        wordViewRepo.getWordViewMap(resolvedPackageId),
        challengeRepo.getChallengeProgressMap(resolvedPackageId),
        settingsRepo.getAudioSpeed(),
      ]);

      setStreakDays(streakCount);
      setTodayStreak(currentDayStreak);
      setUnitProgressMap(unitMap);
      setWordViewsMap(wordMap);
      setChallengeProgressMap(challengeMap);
      setAudioSpeedState(speed);
    } catch (err) {
      console.warn('Gagal memuat data profil:', err);
    }
  }, [
    resolvedPackageId,
    streakRepo,
    unitRepo,
    wordViewRepo,
    challengeRepo,
    settingsRepo,
  ]);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
    }, [loadProfileData]),
  );

  // Kalkulasi data unit berbasis sesi terintegrasi
  const unitsProgressList = useMemo<ProfileUnitItemProgress[]>(() => {
    if (!activePackageData?.units) return [];
    const { units, words, sentences, dialogues } = activePackageData;

    return units.map((unit) => {
      const uWords = words.filter((w) => w.unit_id === unit.unit_id);
      const uSentences = sentences.filter((s) => s.unit_id === unit.unit_id);
      const uDialogues = dialogues.filter((d) => d.unit_id === unit.unit_id);
      const sessions = generateInterleavedUnitSessions(
        unit.unit_id,
        uWords,
        uSentences,
        uDialogues,
      );

      const totalSessions = sessions.length;
      let completedSessions = 0;
      for (const s of sessions) {
        const key = `${unit.unit_id}:${s.sessionId}`;
        if (unitProgressMap[key]?.is_completed === 1) {
          completedSessions += 1;
        }
      }

      const percentage =
        totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0;
      const isCompleted = totalSessions > 0 && completedSessions === totalSessions;

      return {
        unitId: unit.unit_id,
        order: unit.order,
        title: unit.title,
        completedSessions,
        totalSessions,
        percentage,
        isCompleted,
      };
    });
  }, [activePackageData, unitProgressMap]);

  // Kalkulasi data penguasaan (Mastery)
  const totalUnits = unitsProgressList.length;
  const completedUnits = unitsProgressList.filter((u) => u.isCompleted).length;

  const totalChallenges = activePackageData?.challenges?.length ?? 0;
  const completedChallenges = useMemo(() => {
    return Object.values(challengeProgressMap).filter((c) => c.is_completed === 1).length;
  }, [challengeProgressMap]);

  const totalWords = activePackageData?.words?.length ?? 0;
  const learnedWords = wordViewsMap.size;

  // Skor penguasaan komposit
  const masteryProgress = useMemo(() => {
    const unitPart = totalUnits > 0 ? (completedUnits / totalUnits) * 0.45 : 0;
    const challengePart = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 0.35 : 0;
    const wordPart = totalWords > 0 ? Math.min(1, learnedWords / Math.max(totalWords, 1)) * 0.2 : 0;
    return Math.min(1, unitPart + challengePart + wordPart);
  }, [completedUnits, totalUnits, completedChallenges, totalChallenges, learnedWords, totalWords]);

  const masteryLevelLabel = useMemo(() => {
    if (masteryProgress >= 0.85) return 'Tingkat Mahir';
    if (masteryProgress >= 0.5) return 'Tingkat Menengah';
    if (masteryProgress >= 0.2) return 'Tingkat Dasar';
    return 'Pemula';
  }, [masteryProgress]);

  // Kalkulasi rata-rata akurasi latihan
  const averageAccuracy = useMemo(() => {
    const completedRecords = Object.values(unitProgressMap).filter(
      (r) => r.is_completed === 1 && typeof r.score_percentage === 'number',
    );
    if (completedRecords.length === 0) return 100;
    const sum = completedRecords.reduce((acc, r) => acc + (r.score_percentage ?? 0), 0);
    return Math.round(sum / completedRecords.length);
  }, [unitProgressMap]);

  // Sesi rincian untuk unit yang sedang dibuka
  const selectedUnitSessions = useMemo(() => {
    if (!selectedUnitForDetail || !activePackageData) return [];
    const uid = selectedUnitForDetail.unitId;
    const { words, sentences, dialogues } = activePackageData;

    const uWords = words.filter((w) => w.unit_id === uid);
    const uSentences = sentences.filter((s) => s.unit_id === uid);
    const uDialogues = dialogues.filter((d) => d.unit_id === uid);
    const sessions = generateInterleavedUnitSessions(
      uid,
      uWords,
      uSentences,
      uDialogues,
    );

    return sessions.map((s) => {
      const key = `${uid}:${s.sessionId}`;
      const rec = unitProgressMap[key];
      return {
        sessionId: s.sessionId,
        title: s.title,
        isCompleted: rec?.is_completed === 1,
        scorePercentage: rec?.score_percentage,
      };
    });
  }, [selectedUnitForDetail, activePackageData, unitProgressMap]);

  const packageName = useMemo(() => {
    const raw = activePackageData?.manifest?.packageId || activePackageId;
    if (!raw) return 'Paket Bahasa';
    return raw
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [activePackageData, activePackageId]);

  const handleAudioSpeedChange = async (newSpeed: 'normal' | 'slow') => {
    setAudioSpeedState(newSpeed);
    await settingsRepo.setAudioSpeed(newSpeed);
  };

  const handleConfirmReset = async () => {
    if (!resolvedPackageId) return;
    await resetPackageProgress(resolvedPackageId);
    await loadProfileData();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* 1. App Bar tetap di atas (di luar ScrollView) */}
      <View style={styles.appBar}>
        <Text accessibilityRole="header" style={styles.appBarTitle}>
          Profil
        </Text>

        {/* Chip Nama Paket Terpilih di sisi kanan AppBar */}
        <View style={styles.packageChip}>
          <Icon color={colors.teal} name="bookmark-3-line" size={14} />
          <Text style={styles.packageChipText}>{packageName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Baris 2 Card 1:1 Horizontal (Streak Api & Level Mastery) */}
        <ProfileHeroCards
          masteryLevelLabel={masteryLevelLabel}
          masteryProgress={masteryProgress}
          onPressMastery={() => setShowMasterySheet(true)}
          onPressStreak={() => setShowStreakSheet(true)}
          streakDays={streakDays}
        />

        {/* 2. Card: Statistik Belajar Ringkas (Dipindah tepat di bawah Card 1:1 sesuai arahan) */}
        <ProfileMenuCard
          accessibilityLabel={`Statistik Belajar: ${learnedWords} kata dipelajari, ${completedChallenges} tantangan selesai. Ketuk untuk rincian.`}
          description={`${learnedWords} Kata • ${completedChallenges} Tantangan`}
          icon="bar-chart-2-line"
          iconBgColor={colors.navyTint}
          iconColor={colors.navy}
          onPress={() => setShowStatsSheet(true)}
          title="Statistik Belajar"
        />

        {/* 3. Akordion: Penyelesaian Unit */}
        <ProfileUnitAccordion
          onPressUnit={(unit) => setSelectedUnitForDetail(unit)}
          units={unitsProgressList}
        />

        {/* 4. Card: Beralih Paket Bahasa */}
        <ProfileMenuCard
          accessibilityLabel={`Paket bahasa saat ini: ${packageName}. Ketuk untuk beralih atau pasang paket baru.`}
          description={packageName}
          icon="arrow-left-right-line"
          iconBgColor={colors.tealTint}
          iconColor={colors.teal}
          onPress={() => setShowPackageSwitchSheet(true)}
          title="Paket Bahasa"
        />

        {/* 5. Card: Kecepatan Audio */}
        <ProfileMenuCard
          accessibilityLabel={`Kecepatan audio pemutaran saat ini: ${audioSpeed === 'slow' ? 'Lambat (0.8x)' : 'Normal (1.0x)'}. Ketuk untuk mengubah.`}
          description={audioSpeed === 'slow' ? 'Lambat (0.8x)' : 'Normal (1.0x)'}
          icon="volume-up-line"
          iconBgColor={colors.orangeTint}
          iconColor={colors.primary}
          onPress={() => setShowAudioSpeedModal(true)}
          title="Kecepatan Audio"
        />

        {/* 6. Card: Kelola Data Belajar (Reset Progres) */}
        <ProfileMenuCard
          accessibilityLabel="Reset progres belajar paket ini ke awal. Peringatan: tindakan ini tidak dapat dibatalkan."
          description="Reset riwayat paket ini"
          icon="refresh-line"
          isDanger
          onPress={() => setShowResetModal(true)}
          title="Kelola Data Belajar"
        />

        {/* Footer Informasi & Privasi */}
        <View style={styles.footer}>
          <View style={styles.offlineBadge}>
            <Icon color={colors.teal} name="shield-check-line" size={15} />
            <Text style={styles.offlineText}>100% Offline & Privat</Text>
          </View>
          <Text style={styles.footerVersion}>Clata v1.0.0 • Data tersimpan di perangkat</Text>
        </View>
      </ScrollView>

      {/* Detail Bottom Sheets */}
      <StreakDetailSheet
        isTodayCompleted={todayStreak?.is_completed === 1}
        onClose={() => setShowStreakSheet(false)}
        streakDays={streakDays}
        todayScrollCount={todayStreak?.scroll_count ?? 0}
        visible={showStreakSheet}
      />

      <MasteryDetailSheet
        challengesCompleted={completedChallenges}
        levelLabel={masteryLevelLabel}
        masteryProgress={masteryProgress}
        onClose={() => setShowMasterySheet(false)}
        totalChallenges={totalChallenges}
        totalUnits={totalUnits}
        unitsCompleted={completedUnits}
        visible={showMasterySheet}
        wordsLearned={learnedWords}
      />

      <LearningStatsSheet
        accuracyPercentage={averageAccuracy}
        challengesCompleted={completedChallenges}
        onClose={() => setShowStatsSheet(false)}
        totalChallenges={totalChallenges}
        totalWordsInPackage={totalWords}
        visible={showStatsSheet}
        wordsLearned={learnedWords}
      />

      <UnitDetailSheet
        onClose={() => setSelectedUnitForDetail(null)}
        sessions={selectedUnitSessions}
        unit={selectedUnitForDetail}
        visible={Boolean(selectedUnitForDetail)}
      />

      <PackageSwitchSheet
        activePackageId={activePackageId}
        onClose={() => setShowPackageSwitchSheet(false)}
        onSelectPackage={switchActivePackage}
        visible={showPackageSwitchSheet}
      />

      {/* Modals */}
      <AudioSpeedModal
        currentSpeed={audioSpeed}
        onClose={() => setShowAudioSpeedModal(false)}
        onSelectSpeed={handleAudioSpeedChange}
        visible={showAudioSpeedModal}
      />

      <ResetProgressModal
        onClose={() => setShowResetModal(false)}
        onConfirmReset={handleConfirmReset}
        packageName={packageName}
        visible={showResetModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  appBarTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.navy,
  },
  packageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tealTint,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBE3DB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  packageChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.teal,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.teal,
  },
  footerVersion: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
