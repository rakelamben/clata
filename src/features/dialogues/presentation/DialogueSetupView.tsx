import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import type { DialogueListItem } from '../domain/dialogueTypes';
import { listDialogues } from '../application/listDialogues';
import { DialogueLoading, DialogueEmpty, DialogueError } from './DialogueStates';

export function DialogueSetupView({
  packageId,
  unitId,
  onSelectDialogue,
}: {
  packageId: string;
  unitId?: string;
  onSelectDialogue: (dialogueId: string) => void;
}) {
  const { container } = useAppRuntime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<DialogueListItem[]>([]);

  const reload = () => {
    setLoading(true);
    setError(null);
    void listDialogues(container.dialogue, packageId, unitId).then((result) => {
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setDialogues(result.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    let ignore = false;
    void listDialogues(container.dialogue, packageId, unitId).then((result) => {
      if (ignore) return;
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setDialogues(result.data);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [container.dialogue, packageId, unitId]);

  if (loading) return <DialogueLoading />;
  if (error) return <DialogueError message={error} onRetry={reload} />;
  if (dialogues.length === 0) {
    return <DialogueEmpty message="Belum ada skenario dialog untuk unit ini." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Pilih Percakapan Kurasi</Text>
      <FlatList
        data={dialogues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{item.level}</Text>
                </View>
                <View style={styles.registerBadge}>
                  <Text style={styles.registerText}>{item.register}</Text>
                </View>
                {item.isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Icon name="check-line" size={12} color={colors.surface} />
                    <Text style={styles.completedText}>Selesai</Text>
                  </View>
                ) : null}
              </View>

              {item.bestScore !== undefined ? (
                <Text style={styles.scoreText}>{Math.round(item.bestScore * 100)}%</Text>
              ) : null}
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.interlocutorText}>
              Lawan bicara: <Text style={styles.interlocutorBold}>{item.interlocutor}</Text> • {item.turnCount} giliran
            </Text>

            {item.contextDescription ? (
              <Text style={styles.contextText}>{item.contextDescription}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mulai dialog ${item.title}`}
              onPress={() => onSelectDialogue(item.id)}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Mulai Dialog</Text>
              <Icon name="arrow-right-line" size={18} color={colors.surface} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.md,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  levelText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  registerBadge: {
    backgroundColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  completedText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  interlocutorText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  interlocutorBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contextText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: 44,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
