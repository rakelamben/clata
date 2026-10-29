import { Redirect, router } from 'expo-router';
import RemixIcon, { type IconName } from 'react-native-remix-icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  useWindowDimensions,
  type TextInstance,
  type ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppRuntime } from '../bootstrap/AppBootstrap';
import { getAgeCategory, validateBirthYear } from '../domain/onboarding/ageGate';
import type { LanguageDialectOption } from '../domain/onboarding/onboardingTypes';
import { BirthDatePicker } from '../features/onboarding/presentation/BirthDatePicker';
import { OnboardingArt, type ArtMode } from '../features/onboarding/presentation/OnboardingArt';
import { OnboardingHeader } from '../features/onboarding/presentation/OnboardingHeader';
import { PreparationList, type PreparationPhase } from '../features/onboarding/presentation/PreparationList';
import { formatBirthDate, formatPackageLabel } from '../features/onboarding/presentation/onboardingForm';
import { AppPressable } from '../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../ui/theme';
import { useReduceMotion } from '../ui/useReduceMotion';

type Step = 1 | 2 | 3 | 4;
type Phase = 'idle' | 'packages' | PreparationPhase;

const PREPARATION_STAGES = [
  'Menyiapkan basis data lokal',
  'Memvalidasi materi belajar',
  'Memasang paket Jawa–Mataraman',
] as const;

/** Keeps each preparation step visible long enough to be read, without faking progress. */
const MIN_STAGE_MS = 360;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function pickPackageId(packages: LanguageDialectOption[], preferred: string): string {
  if (preferred && packages.some((option) => option.packageId === preferred)) return preferred;
  return packages[0]?.packageId ?? '';
}

export default function OnboardingScreen() {
  const { container, profile, startup, onboardingState, completeOnboarding, retryStartup } = useAppRuntime();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const compact = height < 740 || width < 360;

  const [step, setStep] = useState<Step>(() => {
    if (onboardingState === 'blocked') return 3;
    if (onboardingState === 'local-data-warning') return 2;
    return profile?.birthYear != null ? 4 : 1;
  });
  const [phase, setPhase] = useState<Phase>(() => (step === 4 ? 'packages' : 'idle'));
  const [blocked, setBlocked] = useState(() => onboardingState === 'blocked');
  const [birthDate, setBirthDate] = useState<Date | null>(() =>
    profile?.birthYear != null ? new Date(profile.birthYear, 0, 1) : null,
  );
  const [ageError, setAgeError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [warningAcknowledged, setWarningAcknowledged] = useState(onboardingState === 'ready');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [options, setOptions] = useState<LanguageDialectOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState(profile?.selectedPackageId ?? '');
  const [completedLocally, setCompletedLocally] = useState(false);

  const headingRef = useRef<TextInstance>(null);
  const dateFieldRef = useRef<ViewInstance>(null);
  const checkboxRef = useRef<ViewInstance>(null);
  const mountedRef = useRef(true);
  const prepareRunRef = useRef(0);
  const runningRef = useRef(false);
  const warningTouchedRef = useRef(false);

  const focusDateField = useCallback(() => {
    const node = findNodeHandle(dateFieldRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, []);

  const focusCheckbox = useCallback(() => {
    const node = findNodeHandle(checkboxRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, []);

  const closeDatePicker = useCallback(() => {
    setDatePickerVisible(false);
    setTimeout(() => focusDateField(), reduceMotion ? 0 : 300);
  }, [focusDateField, reduceMotion]);

  const handleDateConfirmed = useCallback(
    (date: Date) => {
      setBirthDate(date);
      setAgeError(null);
      setDatePickerVisible(false);
      setTimeout(() => focusDateField(), reduceMotion ? 0 : 300);
    },
    [focusDateField, reduceMotion],
  );

  const handleBack = useCallback(() => {
    if (blocked) {
      setBlocked(false);
      setAgeError(null);
      setBirthDate(null);
      setPhase('idle');
      setPrepareError(null);
      setStep(2);
      return;
    }
    if (step === 4) {
      setPhase('idle');
      setPrepareError(null);
      setAgeError(null);
      setStep(3);
      return;
    }
    if (step === 3) {
      setPhase('idle');
      setPrepareError(null);
      setAgeError(null);
      setStep(2);
      return;
    }
    if (step === 2) setStep(1);
  }, [blocked, step]);

  const handleSkip = useCallback(() => setStep(2), []);

  const prepare = useCallback(
    async (birthYear: number) => {
      if (runningRef.current) return;
      runningRef.current = true;
      const run = prepareRunRef.current + 1;
      prepareRunRef.current = run;
      const isCurrent = () => mountedRef.current && prepareRunRef.current === run;

      setPrepareError(null);
      setAgeError(null);
      setPhase('preparing');
      setStageIndex(0);

      try {
        await Promise.all([container.database.get(), wait(MIN_STAGE_MS)]);
        if (!isCurrent()) return;
        setStageIndex(1);

        await Promise.all([container.packages.installBundled(), wait(MIN_STAGE_MS)]);
        if (!isCurrent()) return;

        const packages = await container.packageRepository.listActive();
        if (!isCurrent()) return;
        setOptions(packages);
        const packageId = pickPackageId(packages, selectedPackageId);
        if (!packageId) throw new Error('Paket bahasa belum siap digunakan.');
        setSelectedPackageId(packageId);
        setStageIndex(2);

        setCompletedLocally(true);
        await Promise.all([
          completeOnboarding({
            birthYear,
            packageId,
            introDismissed: true,
            localWarningAcknowledged: true,
          }),
          wait(MIN_STAGE_MS),
        ]);
        if (!isCurrent()) return;
        setStageIndex(PREPARATION_STAGES.length);
        setPhase('ready');
      } catch {
        setCompletedLocally(false);
        if (!isCurrent()) return;
        setPhase('failed');
        setPrepareError('Pastikan penyimpanan perangkat tersedia, lalu coba lagi.');
      } finally {
        if (prepareRunRef.current === run) runningRef.current = false;
      }
    },
    [completeOnboarding, container, selectedPackageId],
  );

  const handleAgeContinue = useCallback(() => {
    setAgeError(null);
    if (birthDate === null) {
      setAgeError('Pilih tanggal lahirmu terlebih dahulu.');
      focusDateField();
      return;
    }

    const birthYear = birthDate.getFullYear();
    const invalid = validateBirthYear(birthYear, container.clock.now());
    if (invalid) {
      setAgeError(invalid);
      focusDateField();
      return;
    }

    if (getAgeCategory(birthYear, container.clock) === 'blocked') {
      setBlocked(true);
      setPhase('idle');
      setPrepareError(null);
      return;
    }

    setBlocked(false);
    setPrepareError(null);
    setPhase('packages');
    setStep(4);
  }, [birthDate, container.clock, focusDateField]);

  const startPackagePreparation = useCallback(() => {
    const birthYear = birthDate?.getFullYear() ?? null;
    if (birthYear === null) {
      setAgeError('Pilih tanggal lahirmu terlebih dahulu.');
      setPhase('idle');
      setStep(3);
      setTimeout(() => focusDateField(), 0);
      return;
    }
    void prepare(birthYear);
  }, [birthDate, focusDateField, prepare]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!warningAcknowledged) {
        setLocalError('Centang konfirmasi penyimpanan data lokal untuk melanjutkan.');
        focusCheckbox();
        return;
      }
      setLocalError(null);
      setStep(3);
      return;
    }
    if (step === 3) handleAgeContinue();
  }, [focusCheckbox, handleAgeContinue, step, warningAcknowledged]);

  useEffect(() => {
    let active = true;
    void container.profile
      .isLocalWarningAcknowledged()
      .then((value) => {
        if (active && !warningTouchedRef.current) setWarningAcknowledged(value);
      })
      .catch(() => {
        // The explicit checkbox in step 2 remains the source of truth.
      });
    return () => {
      active = false;
    };
  }, [container.profile]);

  useEffect(() => {
    let active = true;
    void container.packageRepository
      .listActive()
      .then((packages) => {
        if (!active) return;
        setOptions(packages);
        setSelectedPackageId((current) => {
          if (current && packages.some((option) => option.packageId === current)) return current;
          if (
            profile?.selectedPackageId &&
            packages.some((option) => option.packageId === profile.selectedPackageId)
          ) {
            return profile.selectedPackageId;
          }
          return packages[0]?.packageId ?? '';
        });
      })
      .catch(() => {
        // Preparation reports a recoverable failure with a retry action.
      });
    return () => {
      active = false;
    };
  }, [container.packageRepository, profile?.selectedPackageId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const node = findNodeHandle(headingRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 150);
    return () => clearTimeout(timer);
  }, [step, phase, blocked]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      prepareRunRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1 && phase !== 'preparing' && phase !== 'ready') {
        handleBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [handleBack, phase, step]);

  if (onboardingState === 'error') {
    return (
      <View style={styles.errorState}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.errorTitle}>
          Clata belum siap
        </Text>
        <Text maxFontSizeMultiplier={2} style={styles.errorDescription}>
          Data lokal belum dapat dibaca. Coba lagi untuk melanjutkan.
        </Text>
        <PrimaryButton
          label="Coba lagi"
          icon="refresh-line"
          onPress={() => void retryStartup()}
          reduceMotion={reduceMotion}
        />
      </View>
    );
  }

  if (
    startup.status === 'ready' &&
    startup.onboardingCompleted &&
    onboardingState === 'ready' &&
    !completedLocally
  ) {
    return <Redirect href="/(tabs)/kata" />;
  }

  const title = blocked
    ? 'Kita bertemu lagi nanti, ya.'
    : step === 1
      ? 'Belajar bahasa daerah dengan percaya diri.'
      : step === 2
        ? 'Siapkan profil lokal.'
        : step === 3
          ? 'Berapa tahun lahirmu?'
          : phase === 'ready'
            ? 'Paket belajar siap'
            : phase === 'preparing'
              ? 'Menyiapkan ruang belajarmu.'
              : phase === 'failed'
                ? 'Persiapan belum selesai.'
                : 'Siapkan paket belajarmu.';

  const description = blocked
    ? 'Clata ditujukan untuk usia 10 tahun ke atas. Kamu bisa kembali ketika sudah cukup umur.'
    : step === 1
      ? 'Pelajari kata dan percakapan untuk digunakan sehari-hari.'
      : step === 2
        ? 'Aplikasi berjalan 100% offline. Tahun lahir dan paket belajar disimpan di perangkatmu, bukan di server.'
        : step === 3
          ? ''
          : phase === 'ready'
            ? 'Materi belajar telah diverifikasi di perangkatmu.'
            : phase === 'preparing'
              ? 'Kami menyiapkan materi agar kamu bisa belajar tanpa koneksi internet.'
              : phase === 'failed'
                ? 'Kami belum berhasil menyiapkan materi. Coba lagi.'
                : 'Paket berikut akan dipasang untuk mulai belajar. Semua materi tersedia tanpa koneksi internet.';

  const artMode: ArtMode = blocked
    ? 'blocked'
    : step === 1
      ? 'intro'
      : step === 2
        ? 'local'
        : 'age';

  const showBack = step > 1 && phase !== 'preparing' && phase !== 'ready';
  const showSkip = step === 1;
  const showAgeForm = step === 3 && phase === 'idle' && !blocked;
  const showPackageScreen = step === 4 && !blocked;
  const preparationPhase =
    phase === 'preparing' || phase === 'ready' || phase === 'failed' ? phase : null;

  const selectedPackage =
    options.find((option) => option.packageId === selectedPackageId) ?? options[0];
  const packageLabel = selectedPackage
    ? formatPackageLabel(selectedPackage.languageId, selectedPackage.dialectId)
    : 'Jawa · Mataraman';
  const dateFieldValue = birthDate ? formatBirthDate(birthDate) : 'Belum dipilih';
  const dateFieldHint = ageError
    ? `${ageError} Membuka pemilih tanggal lahir.`
    : 'Membuka pemilih tanggal lahir. Data hanya disimpan di perangkat ini.';

  return (
    <View style={styles.root}>
      <OnboardingHeader
        showBack={showBack}
        showSkip={showSkip}
        reduceMotion={reduceMotion}
        onBack={handleBack}
        onSkip={handleSkip}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      >
        {step !== 4 ? <OnboardingArt mode={artMode} compact={compact} /> : null}

        <View style={styles.copy}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={2}
            ref={headingRef}
            style={styles.heading}
          >
            {title}
          </Text>

          {description ? (
            <Text maxFontSizeMultiplier={2} style={styles.description}>
              {description}
            </Text>
          ) : null}

          {step === 2 ? (
            <View style={styles.checkSection}>
              <AppPressable
                accessibilityHint={localError ?? undefined}
                accessibilityLabel="Saya memahami bahwa data hanya tersimpan di perangkat ini dan dapat hilang jika aplikasi dihapus."
                accessibilityRole="checkbox"
                accessibilityState={{ checked: warningAcknowledged }}
                onPress={() => {
                  warningTouchedRef.current = true;
                  setWarningAcknowledged((value) => !value);
                  setLocalError(null);
                }}
                ref={checkboxRef}
                ringRadius={radii.card}
                style={({ pressed }) => [
                  styles.checkRow,
                  pressed && styles.checkRowPressed,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    warningAcknowledged && styles.checkboxChecked,
                  ]}
                >
                  {warningAcknowledged ? (
                    <RemixIcon
                      name="check-line"
                      size={16}
                      color={colors.surface}
                      accessible={false}
                    />
                  ) : null}
                </View>
                <Text maxFontSizeMultiplier={2} style={styles.checkLabel}>
                  Saya memahami bahwa data hanya tersimpan di perangkat ini dan dapat hilang
                  jika aplikasi dihapus.
                </Text>
              </AppPressable>
              {localError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {localError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {showAgeForm ? (
            <View style={styles.ageSection}>
              <AppPressable
                accessibilityHint={dateFieldHint}
                accessibilityLabel="Tanggal lahir"
                accessibilityRole="button"
                accessibilityState={{ expanded: datePickerVisible }}
                accessibilityValue={{ text: dateFieldValue }}
                onPress={() => setDatePickerVisible(true)}
                ref={dateFieldRef}
                ringRadius={radii.control}
                style={({ pressed }) => [
                  styles.dateField,
                  ageError && styles.dateFieldError,
                  pressed && styles.dateFieldPressed,
                ]}
              >
                <RemixIcon
                  name="calendar-line"
                  size={22}
                  color={colors.navy}
                  accessible={false}
                />
                <Text
                  maxFontSizeMultiplier={2}
                  style={[
                    styles.dateFieldValue,
                    !birthDate && styles.dateFieldPlaceholder,
                  ]}
                >
                  {birthDate ? formatBirthDate(birthDate) : 'Pilih tanggal lahir'}
                </Text>
                <RemixIcon
                  name="arrow-down-s-line"
                  size={20}
                  color={colors.textSecondary}
                  accessible={false}
                />
              </AppPressable>
              {ageError ? (
                <Text
                  accessibilityRole="alert"
                  maxFontSizeMultiplier={2}
                  style={styles.errorText}
                >
                  {ageError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {showPackageScreen ? (
            <View style={styles.packageArea}>
              {options.length > 1 ? (
                <View>
                  <Text maxFontSizeMultiplier={2} style={styles.packageHeader}>
                    Paket belajar
                  </Text>
                  <View style={styles.packageOptions}>
                    {options.map((option) => {
                      const checked = option.packageId === selectedPackageId;
                      return (
                        <AppPressable
                          key={option.packageId}
                          accessibilityLabel={formatPackageLabel(
                            option.languageId,
                            option.dialectId,
                          )}
                          accessibilityRole="radio"
                          accessibilityState={{ checked }}
                          onPress={() => setSelectedPackageId(option.packageId)}
                          ringRadius={radii.control}
                          style={({ pressed }) => [
                            styles.packageOption,
                            checked && styles.packageOptionChecked,
                            pressed && styles.packageOptionPressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.packageRadio,
                              checked && styles.packageRadioChecked,
                            ]}
                          >
                            {checked ? <View style={styles.packageRadioDot} /> : null}
                          </View>
                          <Text maxFontSizeMultiplier={2} style={styles.packageValue}>
                            {formatPackageLabel(option.languageId, option.dialectId)}
                          </Text>
                        </AppPressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.packageCard}>
                  <View style={styles.packageCardTop}>
                    <View style={styles.packageIcon}>
                      <RemixIcon
                        name="book-2-line"
                        size={20}
                        color={colors.navy}
                        accessible={false}
                      />
                    </View>
                    <View style={styles.packageText}>
                      <Text maxFontSizeMultiplier={2} style={styles.packageTitle}>
                        {packageLabel}
                      </Text>
                      <Text maxFontSizeMultiplier={2} style={styles.packageDescription}>
                        Kata dan percakapan untuk keseharian.
                      </Text>
                    </View>
                    <RemixIcon
                      name="check-line"
                      size={20}
                      color={colors.teal}
                      accessible={false}
                    />
                  </View>
                  <View style={styles.packageTags}>
                    {['Kata', 'Latihan', 'Dialog'].map((tag) => (
                      <Text key={tag} maxFontSizeMultiplier={2} style={styles.packageTag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                  <Text maxFontSizeMultiplier={2} style={styles.packageBundled}>
                    Paket bawaan · Tersedia offline
                  </Text>
                </View>
              )}

              {preparationPhase ? (
                <PreparationList
                  errorMessage={prepareError}
                  phase={preparationPhase}
                  stageIndex={stageIndex}
                  stages={PREPARATION_STAGES}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        {blocked ? null : step === 3 ? (
          <PrimaryButton
            icon="arrow-right-line"
            label="Lanjut"
            onPress={handleAgeContinue}
            reduceMotion={reduceMotion}
          />
        ) : step === 4 ? (
          phase === 'preparing' ? (
            <Text style={styles.footerNote}>Semua disiapkan di perangkatmu.</Text>
          ) : phase === 'ready' ? (
            <PrimaryButton
              icon="arrow-right-line"
              label="Mulai belajar"
              onPress={() => router.replace('/(tabs)/kata')}
              reduceMotion={reduceMotion}
            />
          ) : phase === 'failed' ? (
            <PrimaryButton
              icon="refresh-line"
              label="Coba lagi"
              onPress={startPackagePreparation}
              reduceMotion={reduceMotion}
            />
          ) : (
            <PrimaryButton
              icon="download-2-line"
              label="Mulai"
              onPress={startPackagePreparation}
              reduceMotion={reduceMotion}
            />
          )
        ) : (
          <PrimaryButton
            icon="arrow-right-line"
            label="Lanjut"
            onPress={handleNext}
            reduceMotion={reduceMotion}
          />
        )}
      </View>

      {datePickerVisible ? (
        <BirthDatePicker
          currentYear={container.clock.now().getFullYear()}
          onClose={closeDatePicker}
          onConfirm={handleDateConfirmed}
          reduceMotion={reduceMotion}
          value={birthDate}
        />
      ) : null}
    </View>
  );
}

type PrimaryButtonProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
  reduceMotion: boolean;
};

function PrimaryButton({ label, icon, onPress, reduceMotion }: PrimaryButtonProps) {
  return (
    <AppPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      containerStyle={styles.primaryContainer}
      onPress={onPress}
      ringRadius={radii.control}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.primaryPressed,
        pressed && !reduceMotion && styles.primaryPressedScale,
      ]}
    >
      <Text maxFontSizeMultiplier={2} style={styles.primaryLabel}>
        {label}
      </Text>
      <RemixIcon name={icon} size={20} color={colors.surface} accessible={false} />
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  copy: {
    width: '100%',
    maxWidth: 544,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  heading: {
    color: colors.navy,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  description: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
  checkSection: {
    marginTop: spacing.xl,
  },
  checkRow: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  checkRowPressed: {
    backgroundColor: colors.navyTint,
  },
  checkbox: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  checkLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  ageSection: {
    marginTop: spacing.lg,
  },
  dateField: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  dateFieldError: {
    borderColor: colors.magenta,
  },
  dateFieldPressed: {
    backgroundColor: colors.navyTint,
  },
  dateFieldValue: {
    flex: 1,
    color: colors.navy,
    fontFamily: fonts.uiSemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  dateFieldPlaceholder: {
    color: colors.textSecondary,
    fontFamily: fonts.uiMedium,
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.magenta,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  packageArea: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  packageHeader: {
    marginBottom: spacing.sm,
    color: colors.navy,
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  packageCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  packageCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  packageIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.navyTint,
  },
  packageText: {
    flex: 1,
    gap: spacing.xs,
  },
  packageTitle: {
    color: colors.navy,
    fontFamily: fonts.uiSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  packageDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  packageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  packageTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.navyTint,
    color: colors.navy,
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  packageBundled: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  packageValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  packageOptions: {
    gap: spacing.sm,
  },
  packageOption: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  packageOptionChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.navyTint,
  },
  packageOptionPressed: {
    backgroundColor: colors.navyTint,
  },
  packageRadio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: 11,
  },
  packageRadioChecked: {
    borderColor: colors.primary,
  },
  packageRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  footer: {
    width: '100%',
    maxWidth: 544,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: spacing.md,
  },
  footerNote: {
    paddingVertical: spacing.md,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryContainer: {
    width: '100%',
  },
  primary: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryPressedScale: {
    transform: [{ scale: 0.98 }],
  },
  primaryLabel: {
    flexShrink: 1,
    color: colors.surface,
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  errorState: {
    flex: 1,
    width: '100%',
    maxWidth: 544,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: 20,
    paddingTop: 64,
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.navy,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
  },
  errorDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
});
