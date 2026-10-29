import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-remix-icon';

import { ScreenShell } from '../../ui/ScreenShell';
import { useAppRuntime } from '../../bootstrap/AppBootstrap';
import { colors, radii, spacing } from '../../ui/theme';
import { SettingsRow } from '../../features/settings/presentation/SettingsRow';
import type { ProgressSnapshot } from '../../domain/progress/learningEvent';

export default function ProfilScreen() {
  const { container } = useAppRuntime();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const today = container.clock.now().toISOString().substring(0, 10);
    void container.progressRepository
      .rebuild({ packageId: 'jawa-mataraman' }, today)
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
  }, [container]);

  const learnedWordsCount = snapshot
    ? Object.values(snapshot.wordStrength).filter((w) => w.strength > 0).length
    : 0;
  const masteryPercentage = Math.round((snapshot?.mastery ?? 0) * 100);
  const currentStreak = snapshot?.currentStreak ?? 0;
  const activeDaysCount = snapshot?.activeDays.length ?? 0;

  return (
    <ScreenShell
      title="Profil"
      description="Lihat ringkasan kemajuan belajar dan kelola pengaturan."
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Progress Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="medal-line" size={22} color={colors.navy} />
            <Text accessibilityRole="header" style={styles.cardTitle}>
              Kemajuan Belajar
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <View style={styles.packageBanner}>
                <Text style={styles.packageText}>Jawa (Mataraman)</Text>
                <View style={styles.masteryPill}>
                  <Text style={styles.masteryPillText}>{masteryPercentage}% Kuasai</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{currentStreak}</Text>
                  <Text style={styles.statLabel}>Hari Streak</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{activeDaysCount}</Text>
                  <Text style={styles.statLabel}>Total Hari Aktif</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{learnedWordsCount}</Text>
                  <Text style={styles.statLabel}>Kata Dipelajari</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Settings Action List */}
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Pengaturan
          </Text>
        </View>

        <View style={styles.actionList}>
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
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  loader: {
    paddingVertical: spacing.lg,
  },
  packageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  packageText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  masteryPill: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  masteryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.control,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  actionList: {
    gap: spacing.md,
  },
});
