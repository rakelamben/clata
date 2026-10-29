import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { colors, radii, spacing } from '../../../ui/theme';
import { createPracticeSession } from '../application/createPracticeSession';
import { loadInterruptedSession } from '../application/loadInterruptedSession';
import type { GuessTheWordDirection, PracticeExerciseType, PracticeSession } from '../domain/practiceTypes';
import { PracticeError, PracticeLoading } from './PracticeStates';
import { DialogueSetupView } from '../../dialogues/presentation/DialogueSetupView';

export function PracticeSetup() {
  const { container, profile } = useAppRuntime();
  const [mode, setMode] = useState<'practice' | 'dialogue'>('practice');
  const [loading, setLoading] = useState<PracticeExerciseType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interrupted, setInterrupted] = useState<PracticeSession | null>(null);
  const [direction, setDirection] = useState<GuessTheWordDirection>('word_to_meaning');
  const [questionCount, setQuestionCount] = useState(10);
  const [units, setUnits] = useState<{ id: string; title: string; order: number }[]>([]);
  const [unitId, setUnitId] = useState<string | undefined>();
  const [audioAvailable, setAudioAvailable] = useState(false);

  useEffect(() => {
    if (!profile?.selectedPackageId) return;
    void loadInterruptedSession(container.practice, profile.selectedPackageId).then((result) => { if (result.ok) setInterrupted(result.data); });
    void container.practice.getUnits(profile.selectedPackageId).then((result) => { if (result.ok) setUnits(result.data); });
  }, [container.practice, profile?.selectedPackageId]);

  useEffect(() => {
    if (!profile?.selectedPackageId) return;
    void container.practice.getAvailability(profile.selectedPackageId, 'guess_the_word', unitId, 'audio_to_meaning').then((result) => { if (result.ok) setAudioAvailable(result.data.available); });
  }, [container.practice, profile?.selectedPackageId, unitId]);

  const start = async (exerciseType: PracticeExerciseType, force = false) => {
    if (!profile?.selectedPackageId) { setError('Paket belajar belum tersedia.'); return; }
    if (interrupted && !force) {
      Alert.alert('Sesi terakhir belum selesai.', 'Jawaban yang sudah tersimpan tetap aman.', [
        { text: 'Lanjutkan', onPress: () => router.push({ pathname: '/practice/[sessionId]', params: { sessionId: interrupted.sessionId } }) },
        { text: 'Mulai baru', style: 'destructive', onPress: () => { void container.practice.abandonSession(interrupted.sessionId).then((result) => { if (result.ok) { setInterrupted(null); void start(exerciseType, true); } else setError(result.error.message); }); } },
        { text: 'Batal', style: 'cancel' },
      ]);
      return;
    }
    setLoading(exerciseType); setError(null);
    if (direction === 'audio_to_meaning' && !audioAvailable) { setError('Audio belum tersedia untuk materi ini. Pilih arah soal lain.'); setLoading(null); return; }
    const result = await createPracticeSession(container.practice, { packageId: profile.selectedPackageId, exerciseType, unitId, questionCount, direction });
    setLoading(null);
    if (!result.ok) { setError(result.error.message); return; }
    router.push({ pathname: '/practice/[sessionId]', params: { sessionId: result.data.sessionId } });
  };

  if (mode === 'dialogue') {
    return (
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali ke pilihan latihan"
          onPress={() => setMode('practice')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Kembali ke Menu Latihan</Text>
        </Pressable>
        <DialogueSetupView
          packageId={profile?.selectedPackageId ?? 'jawa-mataraman'}
          unitId={unitId}
          onSelectDialogue={(selectedDlgId) => {
            router.push({
              pathname: '/dialogue/[dialogueId]',
              params: { dialogueId: selectedDlgId },
            });
          }}
        />
      </View>
    );
  }

  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>Latihan</Text>
    <Text style={styles.description}>Pilih cara latihanmu.</Text>
    {interrupted ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/practice/[sessionId]', params: { sessionId: interrupted.sessionId } })} style={styles.resume}><Text style={styles.cardTitle}>Sesi terakhir belum selesai.</Text><Text style={styles.cardText}>Lanjutkan dari soal yang tersimpan.</Text></Pressable> : null}
    {error ? <PracticeError message={error} /> : null}
    <Text style={styles.label}>Materi</Text>
    <View style={styles.row}><Pressable accessibilityRole="button" accessibilityState={{ selected: !unitId }} onPress={() => setUnitId(undefined)} style={[styles.chip, !unitId && styles.selected]}><Text>Semua unit</Text></Pressable>{units.map((unit) => <Pressable key={unit.id} accessibilityRole="button" accessibilityState={{ selected: unitId === unit.id }} onPress={() => setUnitId(unit.id)} style={[styles.chip, unitId === unit.id && styles.selected]}><Text>{unit.title}</Text></Pressable>)}</View>
    <Text style={styles.label}>Jumlah soal</Text>
    <View style={styles.row}>{[5, 10, 20].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: questionCount === value }} onPress={() => setQuestionCount(value)} style={[styles.chip, questionCount === value && styles.selected]}><Text>{value}</Text></Pressable>)}</View>
    <Text style={styles.label}>Arah Guess the Word</Text>
    <View style={styles.row}>{([['word_to_meaning', 'Kata → arti'], ['meaning_to_word', 'Arti → kata'], ['audio_to_meaning', 'Audio → arti']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" disabled={value === 'audio_to_meaning' && !audioAvailable} accessibilityState={{ selected: direction === value, disabled: value === 'audio_to_meaning' && !audioAvailable }} onPress={() => setDirection(value)} style={[styles.chip, direction === value && styles.selected, value === 'audio_to_meaning' && !audioAvailable && styles.disabled]}><Text>{label}{value === 'audio_to_meaning' && !audioAvailable ? ' (belum tersedia)' : ''}</Text></Pressable>)}</View>
    {loading ? <PracticeLoading /> : <><Pressable accessibilityRole="button" onPress={() => void start('guess_the_word')} style={styles.card}><Text style={styles.cardTitle}>Guess the Word</Text><Text style={styles.cardText}>Hubungkan kata dengan artinya.</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void start('fill_the_gap')} style={styles.card}><Text style={styles.cardTitle}>Fill the Gap</Text><Text style={styles.cardText}>Lengkapi kalimat dengan kata yang tepat.</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setMode('dialogue')} style={styles.card}><Text style={styles.cardTitle}>Dialog</Text><Text style={styles.cardText}>Latih percakapan nyata dengan lawan bicara.</Text></Pressable></>}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, gap: spacing.md, padding: spacing.lg, backgroundColor: colors.background }, title: { color: colors.navy, fontSize: 28, fontWeight: '700' }, description: { color: colors.textSecondary, fontSize: 16 }, label: { color: colors.textPrimary, fontWeight: '700' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, selected: { borderColor: colors.navy, backgroundColor: colors.navyTint }, card: { minHeight: 96, justifyContent: 'center', gap: spacing.xs, padding: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, resume: { minHeight: 80, justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radii.card, borderWidth: 2, borderColor: colors.teal, backgroundColor: colors.tealTint }, disabled: { opacity: 0.6 }, cardTitle: { color: colors.navy, fontSize: 20, fontWeight: '700' }, cardText: { color: colors.textSecondary, fontSize: 16 }, backButton: { minHeight: 44, justifyContent: 'center', paddingVertical: spacing.xs }, backButtonText: { color: colors.primary, fontSize: 15, fontWeight: '700' } });
