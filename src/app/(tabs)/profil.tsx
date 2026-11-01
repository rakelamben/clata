import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RemixIcon from 'react-native-remix-icon';

import { useAppRuntime } from '../../bootstrap/AppBootstrap';
import { colors, fonts, radii, spacing } from '../../ui/theme';
import { SettingsRow } from '../../features/settings/presentation/SettingsRow';
import { ProfileProgressCards } from '../../features/progress/presentation/ProfileProgressCards';
import type { ProgressSnapshot } from '../../domain/progress/learningEvent';

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { container, profile } = useAppRuntime();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';

  // Format 2-line language & dialect header
  const parts = packageId.split('-');
  const languageName =
    parts[0] === 'jawa'
      ? 'Bahasa Jawa'
      : `Bahasa ${parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Jawa'}`;
  const dialectName =
    parts[1] === 'mataraman'
      ? 'Dialek Mataraman'
      : `Dialek ${parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Mataraman'}`;

  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      const today = container.clock.now().toISOString().substring(0, 10);
      void container.progressRepository
        .rebuild({ packageId }, today)
        .then((result) => {
          if (!ignore && result.ok) {
            setSnapshot(result.data);
          }
          if (!ignore) {
            setLoading(false);
          }
        });

      return () => {
        ignore = true;
      };
    }, [container, packageId])
  );

  const masteryPercentage = Math.round(snapshot?.mastery ?? 0);
  const currentStreak = snapshot?.currentStreak ?? 0;
  const currentLevel = snapshot?.level ?? 1;
  const highestLevel = snapshot?.highestLevel ?? 1;

  const guessStats = snapshot?.completionStats?.guessTheWord;
  const gapStats = snapshot?.completionStats?.fillTheGap;
  const dialogueStats = snapshot?.completionStats?.dialogue;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Profil
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Horizontally centered 2-line: Bahasa & Dialek */}
        <View style={styles.languageCenterHeader}>
          <Text style={styles.languageMainText}>{languageName}</Text>
          <Text style={styles.dialectSubText}>{dialectName}</Text>
        </View>

        {/* 2. Section: Kemajuan Belajar (2-Kolom Rasio 1/1) */}
        <View style={styles.section}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <ProfileProgressCards
              currentStreak={currentStreak}
              masteryPercentage={masteryPercentage}
              currentLevel={currentLevel}
              highestLevel={highestLevel}
            />
          )}
        </View>

        {/* 3. Section: Statistik Latihan & Dialog (FR-61 / PRD 8.6) */}
        <View style={styles.section}>
          <View style={styles.card}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.statsSection}>
                {/* Tebak Kata */}
                <View style={styles.exerciseRow}>
                  <View style={[styles.exerciseIconContainer, { backgroundColor: colors.navyTint }]}>
                    <RemixIcon name="translate-2" size={20} color={colors.navy} />
                  </View>
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseTitle}>Tebak Kata</Text>
                      <View style={styles.accuracyBadge}>
                        <Text style={styles.accuracyText}>
                          {guessStats && guessStats.totalAnswered7Days > 0
                            ? `${guessStats.accuracy7DaysPercent}%`
                            : '—'}
                        </Text>
                        <Text style={styles.accuracyLabel}>7 hari</Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseSubtitle}>
                      {guessStats?.sessionsCompleted ?? 0} sesi selesai · {guessStats?.totalAnswered ?? 0} soal dijawab
                      {guessStats && guessStats.totalAnswered > 0 ? ` (${guessStats.accuracyPercent}% akurasi total)` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Kalimat Rumpang */}
                <View style={styles.exerciseRow}>
                  <View style={[styles.exerciseIconContainer, { backgroundColor: colors.tealTint }]}>
                    <RemixIcon name="puzzle-line" size={20} color={colors.teal} />
                  </View>
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseTitle}>Kalimat Rumpang</Text>
                      <View style={styles.accuracyBadge}>
                        <Text style={styles.accuracyText}>
                          {gapStats && gapStats.totalAnswered7Days > 0
                            ? `${gapStats.accuracy7DaysPercent}%`
                            : '—'}
                        </Text>
                        <Text style={styles.accuracyLabel}>7 hari</Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseSubtitle}>
                      {gapStats?.sessionsCompleted ?? 0} sesi selesai · {gapStats?.totalAnswered ?? 0} soal dijawab
                      {gapStats && gapStats.totalAnswered > 0 ? ` (${gapStats.accuracyPercent}% akurasi total)` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Dialog Kurasi */}
                <View style={styles.exerciseRow}>
                  <View style={[styles.exerciseIconContainer, { backgroundColor: 'rgba(173, 54, 3, 0.1)' }]}>
                    <RemixIcon name="chat-voice-line" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseTitle}>Dialog Kurasi</Text>
                      <View style={styles.sessionCountBadge}>
                        <Text style={styles.sessionCountText}>
                          {dialogueStats?.sessionsCompleted ?? 0} sesi selesai
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseSubtitle}>Hasil akhir percakapan:</Text>
                    <View style={styles.endingsRow}>
                      <View style={[styles.endingBadge, styles.endingBaik]}>
                        <Text style={[styles.endingBadgeText, styles.endingBaikText]}>
                          Baik: {dialogueStats?.endings?.baik ?? 0}
                        </Text>
                      </View>
                      <View style={[styles.endingBadge, styles.endingPas]}>
                        <Text style={[styles.endingBadgeText, styles.endingPasText]}>
                          Pas: {dialogueStats?.endings?.pas ?? 0}
                        </Text>
                      </View>
                      <View style={[styles.endingBadge, styles.endingKurangPas]}>
                        <Text style={[styles.endingBadgeText, styles.endingKurangPasText]}>
                          Kurang Pas: {dialogueStats?.endings?.['kurang-pas'] ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Dialog AI */}
                <View style={styles.exerciseRow}>
                  <View style={[styles.exerciseIconContainer, { backgroundColor: '#F1F5F9' }]}>
                    <RemixIcon name="robot-line" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseTitle}>Dialog AI</Text>
                      <View style={styles.offlineQuotaBadge}>
                        <Text style={styles.offlineQuotaText}>0 / 3 (Offline)</Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseSubtitle}>
                      Fitur online P1 (tersedia saat online dengan akun).
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 4. Section: Pengaturan & Informasi */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PENGATURAN & INFORMASI</Text>

          <View style={styles.settingsList}>
            <SettingsRow
              title="Paket Bahasa"
              subtitle="Jawa — Dialek Mataraman (v1.0.0)"
              value="Aktif"
              leadingIcon="archive-line"
              onPress={() => {
                router.push('/settings/about');
              }}
              accessibilityHint="Melihat rincian paket bahasa aktif"
            />

            <SettingsRow
              title="Data dan progres"
              subtitle="Ringkasan penyimpanan, reset progres paket, atau hapus data lokal"
              leadingIcon="database-2-line"
              onPress={() => {
                router.push('/settings/data-progress');
              }}
              accessibilityHint="Membuka pengaturan data dan reset progres"
            />

            <SettingsRow
              title="Tentang Clata"
              subtitle="Versi aplikasi, kredit kontributor, lisensi CC BY-SA 4.0, dan pelaporan"
              leadingIcon="information-line"
              onPress={() => {
                router.push('/settings/about');
              }}
              accessibilityHint="Membuka halaman tentang Clata dan kepatuhan"
            />
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
    letterSpacing: -0.04,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  languageCenterHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  languageMainText: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.navy,
    textAlign: 'center',
  },
  dialectSubText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  loader: {
    paddingVertical: spacing.lg,
  },
  statsSection: {
    gap: spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  exerciseIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exerciseContent: {
    flex: 1,
    gap: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.navy,
  },
  exerciseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accuracyText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.teal,
  },
  accuracyLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.textSecondary,
  },
  sessionCountBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionCountText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  endingsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  endingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  endingBaik: {
    backgroundColor: colors.tealTint,
  },
  endingBaikText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.teal,
  },
  endingPas: {
    backgroundColor: colors.navyTint,
  },
  endingPasText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.navy,
  },
  endingKurangPas: {
    backgroundColor: colors.magentaTint,
  },
  endingKurangPasText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.magenta,
  },
  endingBadgeText: {
    fontSize: 11,
  },
  offlineQuotaBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineQuotaText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  settingsList: {
    gap: spacing.md,
  },
});
