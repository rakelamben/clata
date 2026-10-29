import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { getPracticeQuestion } from '../application/getPracticeQuestion';
import { submitPracticeAnswer } from '../application/submitPracticeAnswer';
import { completePracticeSession } from '../application/completePracticeSession';
import type { PracticeQuestion } from '../domain/practiceTypes';
import { AnswerOption } from './AnswerOption';
import { PracticeFeedback } from './PracticeFeedback';
import { PracticeEmpty, PracticeError, PracticeLoading } from './PracticeStates';
import { AudioToggle } from '../../vocabulary/presentation/AudioToggle';
import { colors, radii, spacing } from '../../../ui/theme';

export function PracticeQuestionScreen() {
  const { container } = useAppRuntime();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completionFailed, setCompletionFailed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const loadIndex = async (nextIndex: number) => {
    if (!sessionId) return;
    setLoading(true); setError(null); setSelected(null); setFeedback(null);
    const result = await getPracticeQuestion(container.practice, sessionId, nextIndex);
    if (!result.ok) setError(result.error.message); else setQuestion(result.data);
    setIndex(nextIndex); setLoading(false);
  };
  useEffect(() => {
    let mounted = true;
    if (!sessionId) return () => { mounted = false; };
    void container.practice.getSession(sessionId).then(async (result) => { if (!mounted) return; if (!result.ok) { setError(result.error.message); setLoading(false); return; } if (!result.data) { setError('Sesi latihan tidak ditemukan.'); setLoading(false); return; } setTotal(result.data.questionCount); setCorrectCount(result.data.correctCount); if (result.data.currentIndex >= result.data.questionCount) { const completion = await completePracticeSession(container.practice, sessionId); if (completion.ok) setCompleted(true); else setCompletionFailed(true); setLoading(false); return; } void loadIndex(result.data.currentIndex); });
    return () => { mounted = false; };
  // Session route is immutable while mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  const submit = async () => {
    if (!sessionId || !question || !selected || feedback) return;
    setSaving(true);
    const result = await submitPracticeAnswer(container.practice, { sessionId, questionId: question.questionId, optionId: selected });
    setSaving(false);
    if (!result.ok) { setError(result.error.message); return; }
    setFeedback({ correct: result.data.correct, answer: result.data.answerLabel });
    if (result.data.correct) setCorrectCount((current) => current + 1);
    if (result.data.sessionCompleted) {
      const completion = await completePracticeSession(container.practice, sessionId);
      if (!completion.ok) setCompletionFailed(true); else setCompleted(true);
    }
  };
  const retryCompletion = async () => { if (!sessionId) return; const result = await completePracticeSession(container.practice, sessionId); if (result.ok) { setCompletionFailed(false); setCompleted(true); } };
  if (loading) return <PracticeLoading />;
  if (error) return <PracticeError message={error} onRetry={() => void loadIndex(index)} />;
  if (completed) return <View style={styles.summary}><Text accessibilityRole="header" style={styles.title}>Latihan selesai</Text><Text style={styles.prompt}>{correctCount} dari {total} jawaban benar.</Text><Text style={styles.body}>Coba lagi untuk memperkuat item yang masih terasa sulit.</Text><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.submit}><Text style={styles.submitText}>Kembali ke Latihan</Text></Pressable></View>;
  if (completionFailed && !question) return <View style={styles.summary}><Text accessibilityRole="header" style={styles.title}>Jawaban sudah lengkap</Text><Text accessibilityRole="alert" style={styles.error}>Sesi belum selesai tersimpan.</Text><Pressable accessibilityRole="button" onPress={() => void retryCompletion()} style={styles.submit}><Text style={styles.submitText}>Coba simpan lagi</Text></Pressable></View>;
  if (!question) return <PracticeEmpty message="Belum ada materi untuk sesi ini." />;
  const prompt = question.type === 'guess_the_word' ? question.prompt.lemma ?? question.prompt.meaning ?? 'Dengarkan kata' : `${question.beforeGap}___${question.afterGap}`;
  const audioReference = question.type === 'guess_the_word' ? question.prompt.audio ?? null : question.audio ?? null;
  const example = question.type === 'guess_the_word' ? question.exampleSentence?.text : undefined;
  return <ScrollView contentContainerStyle={styles.container}><Pressable accessibilityRole="button" accessibilityLabel="Keluar dari sesi" onPress={() => Alert.alert('Keluar dari sesi?', 'Jawaban yang sudah tersimpan tetap aman.', [{ text: 'Tetap di sini', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: () => router.back() }])}><Text style={styles.exit}>Keluar</Text></Pressable><Text accessibilityRole="header" style={styles.title}>{question.type === 'guess_the_word' ? 'Guess the Word' : 'Fill the Gap'}</Text><Text accessibilityRole="text" style={styles.progress}>Soal {index + 1} dari {total || '?'}</Text><Text style={styles.prompt}>{prompt}</Text>{audioReference ? <AudioToggle wordId={question.questionId} wordLabel="soal latihan" reference={audioReference} uri={null} audio={container.audio} state={container.audio.getState()} onStateChange={() => undefined} /> : null}{question.type === 'fill_the_gap' ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: showTranslation }} onPress={() => setShowTranslation((value) => !value)}><Text style={styles.action}>{showTranslation ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}</Text></Pressable> : null}{showTranslation && question.type === 'fill_the_gap' ? <Text style={styles.body}>{question.translation}</Text> : null}<View accessibilityRole="radiogroup" style={styles.options}>{question.options.map((option) => <AnswerOption key={option.optionId} label={option.label} selected={selected === option.optionId} disabled={Boolean(feedback) || saving} onPress={() => setSelected(option.optionId)} />)}</View>{feedback ? <PracticeFeedback correct={feedback.correct} answer={feedback.answer} example={example} /> : null}{completionFailed ? <View><Text accessibilityRole="alert" style={styles.error}>Jawaban tersimpan, tetapi sesi belum selesai.</Text><Pressable accessibilityRole="button" onPress={() => void retryCompletion()}><Text style={styles.action}>Coba simpan lagi</Text></Pressable></View> : null}{!feedback ? <Pressable accessibilityRole="button" disabled={!selected || saving} onPress={() => void submit()} style={[styles.submit, (!selected || saving) && styles.disabled]}><Text style={styles.submitText}>{saving ? 'Menyimpan…' : 'Periksa jawaban'}</Text></Pressable> : !completionFailed ? <Pressable accessibilityRole="button" onPress={() => { if (index + 1 < total) void loadIndex(index + 1); }} style={styles.submit}><Text style={styles.submitText}>{index + 1 < total ? 'Lanjut' : 'Menutup…'}</Text></Pressable> : null}</ScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.background }, summary: { flex: 1, gap: spacing.lg, padding: spacing.lg, justifyContent: 'center', backgroundColor: colors.background }, title: { color: colors.navy, fontSize: 24, fontWeight: '700' }, progress: { color: colors.textSecondary, fontSize: 16 }, prompt: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', paddingVertical: spacing.lg }, body: { color: colors.textSecondary, fontSize: 16 }, action: { color: colors.primary, fontWeight: '700', paddingVertical: spacing.sm }, exit: { color: colors.primary, fontWeight: '700' }, options: { gap: spacing.md }, submit: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radii.control, backgroundColor: colors.primary }, disabled: { opacity: 0.5 }, error: { color: colors.magenta, fontSize: 16 }, submitText: { color: colors.surface, fontSize: 16, fontWeight: '700' } });
