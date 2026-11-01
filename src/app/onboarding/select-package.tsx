import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

interface PackageOption {
  id: string;
  name: string;
  dialect: string;
  description: string;
  tag?: string;
}

const SAMPLE_PACKAGES: readonly PackageOption[] = [
  {
    id: 'jawa-mataraman',
    name: 'Bahasa Jawa',
    dialect: 'Dialek Mataraman',
    description: 'Yogyakarta, Surakarta, Madiun & sekitarnya',
    tag: 'Tersedia Offline',
  },
  {
    id: 'sunda-priangan',
    name: 'Bahasa Sunda',
    dialect: 'Dialek Priangan',
    description: 'Bandung, Garut, Sumedang & sekitarnya',
  },
  {
    id: 'minangkabau',
    name: 'Bahasa Minangkabau',
    dialect: 'Dialek Baku',
    description: 'Padang, Agam, Bukittinggi & sekitarnya',
  },
  {
    id: 'bali-dataran',
    name: 'Bahasa Bali',
    dialect: 'Dialek Dataran',
    description: 'Denpasar, Gianyar, Badung & Tabanan',
  },
];

export default function SelectPackageScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['jawa-mataraman']);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    router.push('/onboarding/preparing');
  };

  const canProceed = selectedIds.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Pilih Bahasa Awal
          </Text>
          <Text style={styles.description}>
            Pilih satu atau beberapa bahasa daerah yang ingin kamu mulai pelajari:
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {SAMPLE_PACKAGES.map((pkg) => {
            const isSelected = selectedIds.includes(pkg.id);
            return (
              <AppPressable
                key={pkg.id}
                accessibilityLabel={`${pkg.name}, ${pkg.dialect}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                onPress={() => toggleSelect(pkg.id)}
              >
                <View style={[styles.packageCard, isSelected && styles.packageCardSelected]}>
                  <View style={styles.packageInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      {pkg.tag ? (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{pkg.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.packageDialect}>{pkg.dialect}</Text>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                  </View>

                  <View style={styles.checkIcon}>
                    <Icon
                      color={isSelected ? colors.primary : colors.borderStrong}
                      name={isSelected ? 'checkbox-circle-fill' : 'checkbox-blank-circle-line'}
                      size={26}
                    />
                  </View>
                </View>
              </AppPressable>
            );
          })}
        </ScrollView>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Lanjut menyiapkan paket bahasa"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            onPress={canProceed ? handleNext : undefined}
          >
            <View
              style={[
                styles.primaryButton,
                !canProceed && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>Lanjut</Text>
              <Icon color={colors.surface} name="arrow-right-line" size={20} />
            </View>
          </AppPressable>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.navy,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  packageInfo: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  packageName: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 17,
    color: colors.navy,
  },
  tagBadge: {
    backgroundColor: colors.tealTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.control,
  },
  tagBadgeText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.teal,
  },
  packageDialect: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.primary,
  },
  packageDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  checkIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    paddingVertical: spacing.sm,
  },
  primaryButton: {
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
