import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../../ui/theme';

export function PracticeFeedback({ correct, answer, example }: { correct: boolean; answer: string; example?: string }) { return <View accessibilityRole="alert" style={[styles.box, correct ? styles.success : styles.attention]}><Text style={styles.title}>{correct ? 'Benar.' : 'Belum tepat.'}</Text><Text style={styles.text}>Jawaban yang benar: {answer}</Text>{example ? <Text style={styles.text}>Contoh: {example}</Text> : null}</View>; }
const styles = StyleSheet.create({ box: { padding: spacing.md, gap: spacing.xs }, success: { backgroundColor: colors.tealTint }, attention: { backgroundColor: colors.magentaTint }, title: { color: colors.navy, fontWeight: '700', fontSize: 18 }, text: { color: colors.textPrimary, fontSize: 16 } });
