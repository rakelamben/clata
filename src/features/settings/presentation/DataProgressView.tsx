import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, radii, spacing } from '../../../ui/theme';
import type { DependencyContainer } from '../../../bootstrap/DependencyContainer';
import type { StorageInfo } from '../domain/settingsTypes';
import { SettingsRow } from './SettingsRow';
import { WarningBottomModal } from './WarningBottomModal';

interface DataProgressViewProps {
  container: DependencyContainer;
  onClearAllComplete?: () => void;
}

export function DataProgressView({
  container,
  onClearAllComplete,
}: DataProgressViewProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal states
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [clearAllModalVisible, setClearAllModalVisible] = useState(false);

  const loadStorage = useCallback(async () => {
    setLoading(true);
    const result = await container.getStorageInfo.execute();
    if (result.ok) {
      setStorageInfo(result.data);
    }
    setLoading(false);
  }, [container]);

  useEffect(() => {
    let ignore = false;
    void container.getStorageInfo.execute().then((result) => {
      if (!ignore && result.ok) {
        setStorageInfo(result.data);
      }
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [container]);

  const handleResetPackageConfirm = async () => {
    setActionLoading(true);
    const packageId = storageInfo?.packageId ?? 'jawa-mataraman';
    const result = await container.resetPackageProgress.execute({ packageId });
    setActionLoading(false);
    setResetModalVisible(false);

    if (result.ok) {
      setFeedbackMessage('Progres paket berhasil direset ke kondisi awal (Mastery 0%).');
      await loadStorage();
    } else {
      Alert.alert('Gagal Mereset', result.error.message);
    }
  };

  const handleClearAllConfirm = async () => {
    setActionLoading(true);
    const result = await container.clearAllLocalData.execute();
    setActionLoading(false);
    setClearAllModalVisible(false);

    if (result.ok) {
      if (onClearAllComplete) {
        onClearAllComplete();
      } else {
        setFeedbackMessage('Seluruh data lokal telah dihapus.');
        await loadStorage();
      }
    } else {
      Alert.alert('Gagal Menghapus Data', result.error.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      accessibilityRole="none"
    >
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Penyimpanan Lokal
        </Text>
        <Text style={styles.sectionDescription}>
          Seluruh data belajar dan progres Anda disimpan langsung di perangkat ini tanpa sinkronisasi internet (P0).
        </Text>
      </View>

      {/* Storage Information Card */}
      <View style={styles.infoCard}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle} importantForAccessibility="no">
                <Icon name="database-2-line" size={20} color={colors.navy} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Basis Data SQLite</Text>
                <Text style={styles.infoValue}>
                  {storageInfo?.databaseSizeFormatted ?? '0 KB'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle} importantForAccessibility="no">
                <Icon name="book-read-line" size={20} color={colors.navy} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Paket Bahasa Aktif</Text>
                <Text style={styles.infoValue}>
                  {storageInfo?.packageName ?? 'Jawa (Mataraman)'} (v{storageInfo?.packageVersion ?? '1.0.0'})
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {storageInfo?.totalEventsCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Log Kejadian Belajar</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {storageInfo?.learnedItemsCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Item Diingat</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Feedback banner */}
      {feedbackMessage ? (
        <View style={styles.feedbackBanner} accessibilityRole="alert">
          <Icon name="checkbox-circle-line" size={20} color={colors.primary} />
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      {/* Management Actions */}
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Tindakan Data
        </Text>
      </View>

      <View style={styles.actionList}>
        <SettingsRow
          title="Reset progres paket"
          subtitle="Hapus riwayat belajar, skor dialog, dan centang tantangan untuk paket Jawa (Mataraman). Mastery kembali ke 0%."
          leadingIcon="refresh-line"
          destructive
          onPress={() => setResetModalVisible(true)}
          accessibilityHint="Membuka konfirmasi reset progres untuk paket Jawa Mataraman"
        />

        <SettingsRow
          title="Hapus semua data lokal"
          subtitle="Mengembalikan aplikasi ke kondisi baru seperti baru dipasang. Seluruh riwayat dan profil lokal akan dihapus."
          leadingIcon="delete-bin-line"
          destructive
          onPress={() => setClearAllModalVisible(true)}
          accessibilityHint="Membuka konfirmasi penghapusan seluruh data aplikasi"
        />
      </View>

      {/* 2-Step Confirmation Modal for Package Reset */}
      <WarningBottomModal
        visible={resetModalVisible}
        title="Hapus progres paket?"
        description="Tindakan ini akan mereset skor mastery, kekuatan kata, skor skenario percakapan, dan centang tantangan untuk paket Jawa (Mataraman) menjadi 0%. Paket bahasa tetap terpasang dan Anda dapat memulai belajar dari awal."
        confirmLabel="Reset progres lokal"
        cancelLabel="Batal"
        loading={actionLoading}
        onConfirm={() => void handleResetPackageConfirm()}
        onCancel={() => setResetModalVisible(false)}
      />

      {/* 2-Step Confirmation Modal for Total Wipe */}
      <WarningBottomModal
        visible={clearAllModalVisible}
        title="Hapus semua data lokal?"
        description="Peringatan: Tindakan ini permanen. Seluruh log kejadian belajar, kemajuan kosakata, skor latihan, preferensi profil, dan pengaturan lokal akan dihapus. Anda akan diarahkan kembali ke layar selamat datang (onboarding)."
        confirmLabel="Hapus semua data lokal"
        cancelLabel="Batal"
        loading={actionLoading}
        onConfirm={() => void handleClearAllConfirm()}
        onCancel={() => setClearAllModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ebf4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    borderWidth: 1,
    borderColor: '#c6f6d5',
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#276749',
    fontWeight: '500',
  },
  actionList: {
    gap: spacing.md,
  },
});
