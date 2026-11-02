import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function PreparingScreen() {
  const { stagedArchive, installStagedPackage } = useApp();
  const [percent, setPercent] = useState(10);
  const [statusText, setStatusText] = useState('Membuka berkas arsip .clata...');
  const [isProcessing, setIsProcessing] = useState(Boolean(stagedArchive));
  const [errorMessage, setErrorMessage] = useState<string | null>(
    stagedArchive ? null : 'Tidak ada berkas paket yang dipilih.',
  );

  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Blokir tombol kembali perangkat selama proses instalasi berlangsung
  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Jika masih memproses, blokir back
      if (isProcessing && !errorMessage) {
        return true;
      }
      return false;
    });

    return () => backSubscription.remove();
  }, [isProcessing, errorMessage]);

  useEffect(() => {
    if (!stagedArchive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const startInstallation = async () => {
      try {
        console.log('[PreparingScreen] Memulai alur instalasi paket bahasa...');
        const result = await installStagedPackage((_step, progressPercent, text) => {
          if (!isMountedRef.current) return;
          setPercent(progressPercent);
          setStatusText(text);
        });

        console.log('[PreparingScreen] Hasil instalasi:', result.ok, result.packageId);

        if (!isMountedRef.current) return;

        if (result.ok) {
          setPercent(100);
          setStatusText('Paket berhasil dipasang!');
          setIsProcessing(false);
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log('[PreparingScreen] Berpindah ke layar /onboarding/ready');
              router.replace('/onboarding/ready');
            }
          }, 600);
        } else {
          setIsProcessing(false);
          setErrorMessage(result.message ?? 'Pemasangan paket gagal diverifikasi.');
        }
      } catch (err) {
        console.error('[PreparingScreen] Gagal memproses paket:', err);
        if (!isMountedRef.current) return;
        setIsProcessing(false);
        setErrorMessage(`Terjadi kesalahan sistem: ${String(err)}`);
      }
    };

    void startInstallation();
  }, [stagedArchive, installStagedPackage]);

  const handleBackToSelect = () => {
    router.replace('/onboarding/select-package');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {errorMessage ? (
          <View style={styles.header}>
            <AppPressable
              accessibilityLabel="Kembali ke pemilihan berkas"
              accessibilityRole="button"
              onPress={handleBackToSelect}
              style={styles.backButton}
            >
              <Icon color={colors.navy} name="arrow-left-line" size={24} />
            </AppPressable>
          </View>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}

        <View style={styles.centerSection}>
          {!errorMessage ? (
            <>
              <Text accessibilityRole="header" style={styles.title}>
                Menyiapkan Ruang Belajar
              </Text>

              <Text style={styles.percentText}>{percent}%</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>

              <View style={styles.statusCapsule}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text accessibilityLiveRegion="polite" style={styles.statusText}>
                  {statusText}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorCard}>
              <View style={styles.errorIconBox}>
                <Icon color={colors.magenta} name="error-warning-fill" size={32} />
              </View>

              <Text style={styles.errorTitle}>Pemasangan Paket Gagal</Text>
              <Text style={styles.errorDescription}>{errorMessage}</Text>

              <AppPressable
                accessibilityLabel="Pilih berkas paket lain"
                accessibilityRole="button"
                onPress={handleBackToSelect}
                style={styles.recoveryButton}
              >
                <Text style={styles.recoveryButtonText}>Pilih Berkas Lain</Text>
                <Icon color={colors.surface} name="arrow-right-line" size={18} />
              </AppPressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {!errorMessage ? (
            <Text style={styles.hintText}>Mohon jangan tutup aplikasi selama penyiapan…</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
  },
  headerPlaceholder: {
    height: touchTarget,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.navy,
    textAlign: 'center',
  },
  percentText: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    color: colors.primary,
  },
  progressTrack: {
    width: '100%',
    maxWidth: 320,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.navy,
  },
  errorCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.magentaTint,
    borderWidth: 1,
    borderColor: colors.magenta,
    borderRadius: radii.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.magenta,
    textAlign: 'center',
  },
  errorDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  recoveryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.magenta,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  recoveryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.surface,
  },
  footer: {
    alignItems: 'center',
    minHeight: 24,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
