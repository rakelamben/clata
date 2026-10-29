import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, radii, spacing } from '../../../ui/theme';
import type { DependencyContainer } from '../../../bootstrap/DependencyContainer';
import type { AboutMetadata } from '../domain/aboutTypes';

interface AboutViewProps {
  container: DependencyContainer;
}

export function AboutView({ container }: AboutViewProps) {
  const [metadata, setMetadata] = useState<AboutMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    let ignore = false;
    void container.getAboutMetadata.execute().then((result) => {
      if (!ignore && result.ok) {
        setMetadata(result.data);
      }
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [container]);

  const handleOpenEmail = useCallback(async () => {
    const email = metadata?.compliance.reportingChannel.email ?? 'lapor@clata.id';
    const subject = encodeURIComponent(
      metadata?.compliance.reportingChannel.subjectPrefix ?? '[Laporan Clata P0]'
    );
    const url = `mailto:${email}?subject=${subject}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Aplikasi Surel Tidak Ditemukan',
          `Silakan kirim surel laporan secara manual ke alamat: ${email}`
        );
      }
    } catch {
      Alert.alert(
        'Buka Surel',
        `Silakan kirim surel laporan ke alamat: ${email}`
      );
    }
  }, [metadata]);

  const handleCopyEmail = useCallback(() => {
    const email = metadata?.compliance.reportingChannel.email ?? 'lapor@clata.id';
    // Web or native clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(email);
    }
    setCopiedNotice(true);
    AccessibilityInfo.announceForAccessibility('Alamat surel pelaporan disalin.');
    setTimeout(() => {
      setCopiedNotice(false);
    }, 3000);
  }, [metadata]);

  if (loading) {
    return (
      <View style={styles.centered} accessibilityLabel="Memuat informasi Tentang Clata">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Memuat informasi…</Text>
      </View>
    );
  }

  const emailAddress = metadata?.compliance.reportingChannel.email ?? 'lapor@clata.id';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Brand & App Info Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge} importantForAccessibility="no">
          <Icon name="translate-2" size={36} color={colors.surface} />
        </View>
        <Text accessibilityRole="header" style={styles.appName}>
          {metadata?.appName ?? 'Clata'}
        </Text>
        <Text style={styles.appTagline}>
          Aplikasi Pelestarian Bahasa & Dialek Nusantara
        </Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionBadgeText}>
            Versi {metadata?.appVersion ?? '1.0.0'} (Build {metadata?.buildNumber ?? '1'})
          </Text>
        </View>
      </View>

      {/* Installed Package Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="archive-line" size={20} color={colors.navy} />
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Paket Bahasa Terpasang
          </Text>
        </View>
        <View style={styles.packageDetail}>
          <Text style={styles.packageLanguage}>
            {metadata?.activePackage.languageName} — Dialek {metadata?.activePackage.dialectName}
          </Text>
          <Text style={styles.packageMeta}>
            ID: {metadata?.activePackage.packageId} • Versi {metadata?.activePackage.version}
          </Text>
          <View style={styles.verifiedTag}>
            <Icon name="shield-check-line" size={16} color="#22543d" />
            <Text style={styles.verifiedText}>Konten Kurasi Terverifikasi (POC)</Text>
          </View>
        </View>
      </View>

      {/* Credits Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="team-line" size={20} color={colors.navy} />
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Kredit Kontributor & Penutur
          </Text>
        </View>
        <View style={styles.creditList}>
          {metadata?.credits.map((credit, idx) => (
            <View key={idx} style={styles.creditItem}>
              <Text style={styles.creditName}>{credit.name}</Text>
              <Text style={styles.creditRole}>{credit.role}</Text>
              {credit.note ? (
                <Text style={styles.creditNote}>{credit.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Licensing Section (Strict PRD 11.7 Separation) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="file-shield-line" size={20} color={colors.navy} />
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Lisensi & Hak Cipta Konten
          </Text>
        </View>

        <View style={styles.licenseBlock}>
          <View style={styles.licenseBadgeRow}>
            <Text style={styles.licenseLabel}>Lisensi Teks:</Text>
            <View style={styles.licenseTag}>
              <Text style={styles.licenseTagText}>CC BY-SA 4.0</Text>
            </View>
          </View>
          <Text style={styles.licenseDescription}>
            {metadata?.licenses.textLicense.summary}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.licenseBlock}>
          <View style={styles.licenseBadgeRow}>
            <Text style={styles.licenseLabel}>Lisensi Rekaman Suara:</Text>
            <View style={[styles.licenseTag, styles.audioLicenseTag]}>
              <Text style={styles.audioLicenseTagText}>Bukan Lisensi Terbuka</Text>
            </View>
          </View>
          <Text style={styles.licenseDescription}>
            {metadata?.licenses.audioLicense.summary}
          </Text>
          <Text style={styles.copyrightNotice}>
            {metadata?.licenses.audioLicense.attributionNotice}
          </Text>
        </View>
      </View>

      {/* Child Safety & Legal Age Limit */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="parent-line" size={20} color={colors.navy} />
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Batas Usia & Perlindungan Anak
          </Text>
        </View>
        <View style={styles.ageBadgeRow}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>10+</Text>
          </View>
          <Text style={styles.ageHeading}>
            Ditujukan untuk pengguna berusia minimal 10 tahun.
          </Text>
        </View>
        <Text style={styles.cardBody}>
          Clata dirancang mematuhi regulasi pelindungan data pribadi dan tata kelola sistem elektronik anak di Indonesia:
        </Text>
        <View style={styles.legalList}>
          {metadata?.compliance.legalBasis.map((basis, idx) => (
            <View key={idx} style={styles.legalItem}>
              <Icon name="check-line" size={16} color={colors.primary} />
              <Text style={styles.legalText}>{basis}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Privacy Policy Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="lock-2-line" size={20} color={colors.navy} />
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Ringkasan Kebijakan Privasi
          </Text>
        </View>
        <View style={styles.privacyList}>
          <View style={styles.privacyRow}>
            <Icon name="smartphone-line" size={18} color={colors.primary} />
            <Text style={styles.privacyText}>
              <Text style={styles.bold}>100% Penyimpanan Lokal:</Text> Seluruh kemajuan belajar tersimpan di perangkat Anda.
            </Text>
          </View>
          <View style={styles.privacyRow}>
            <Icon name="user-unfollow-line" size={18} color={colors.primary} />
            <Text style={styles.privacyText}>
              <Text style={styles.bold}>Tanpa Akun (P0):</Text> Belajar mandiri tanpa meminta surel, sandi, atau identitas pribadi.
            </Text>
          </View>
          <View style={styles.privacyRow}>
            <Icon name="shield-check-line" size={18} color={colors.primary} />
            <Text style={styles.privacyText}>
              <Text style={styles.bold}>Bebas Iklan & Pelacak:</Text> Aplikasi tidak menyertakan SDK pelacakan pihak ketiga.
            </Text>
          </View>
        </View>
      </View>

      {/* Abuse & Child Rights Violation Reporting Channel */}
      <View style={[styles.card, styles.reportCard]}>
        <View style={styles.cardHeader}>
          <Icon name="mail-send-line" size={20} color="#975a16" />
          <Text accessibilityRole="header" style={[styles.cardTitle, styles.reportTitle]}>
            Kanal Pelaporan & Pengaduan
          </Text>
        </View>
        <Text style={styles.reportDescription}>
          Jika Anda menemukan kesalahan materi bahasa, kekeliruan register, konten tidak pantas, atau potensi pelanggaran hak perlindungan anak, laporkan kepada tim kami:
        </Text>

        <View style={styles.emailContainer}>
          <Text style={styles.emailText} selectable>
            {emailAddress}
          </Text>
        </View>

        <View style={styles.reportButtonsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Salin alamat surel pelaporan ${emailAddress}`}
            onPress={handleCopyEmail}
            style={({ pressed }) => [
              styles.reportSecondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Icon name="file-copy-line" size={18} color={colors.navy} />
            <Text style={styles.reportSecondaryButtonText}>Salin Surel</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Kirim surel pelaporan ke ${emailAddress}`}
            onPress={() => void handleOpenEmail()}
            style={({ pressed }) => [
              styles.reportPrimaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Icon name="mail-line" size={18} color={colors.surface} />
            <Text style={styles.reportPrimaryButtonText}>Kirim Surel</Text>
          </Pressable>
        </View>

        {copiedNotice ? (
          <Text style={styles.copiedText} accessibilityRole="alert">
            ✓ Alamat surel berhasil disalin ke papan klip.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  brandHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
  },
  appTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  versionBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#edf2f7',
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  packageDetail: {
    gap: 4,
  },
  packageLanguage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packageMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: '#f0fff4',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: '#22543d',
    fontWeight: '600',
  },
  creditList: {
    gap: spacing.md,
  },
  creditItem: {
    gap: 2,
  },
  creditName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  creditRole: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  creditNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  licenseBlock: {
    gap: spacing.xs,
  },
  licenseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  licenseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  licenseTag: {
    backgroundColor: '#ebf8ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  licenseTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b6cb0',
  },
  audioLicenseTag: {
    backgroundColor: '#fffaf0',
  },
  audioLicenseTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c05621',
  },
  licenseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  copyrightNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  ageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ageBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBadgeText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  ageHeading: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  legalList: {
    gap: spacing.xs,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legalText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  privacyList: {
    gap: spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reportCard: {
    backgroundColor: '#fffaf0',
    borderColor: '#feebc8',
  },
  reportTitle: {
    color: '#744210',
  },
  reportDescription: {
    fontSize: 13,
    color: '#744210',
    lineHeight: 18,
  },
  emailContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#feebc8',
    borderRadius: radii.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  reportButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  reportSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  reportPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  reportPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  copiedText: {
    fontSize: 13,
    color: '#276749',
    fontWeight: '600',
    textAlign: 'center',
  },
});
