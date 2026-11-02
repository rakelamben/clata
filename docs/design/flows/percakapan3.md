import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import type { DialogueGraph, DialogueRunState, DialogueEnding } from '../domain/dialogueTypes';
import { DialogueLineBubble } from './DialogueLineBubble';
import { ChoiceActionGroup } from './ChoiceActionGroup';
import { SelfSpeakStep } from './SelfSpeakStep';
import { DialogueSummarySheet } from './DialogueSummarySheet';
import { DialogueLoading, DialogueError } from './DialogueStates';
import { startDialogueRun } from '../application/startDialogueRun';
import { submitDialogueChoice } from '../application/submitDialogueChoice';
import { advanceDialogueNode } from '../application/advanceDialogueNode';
import { abandonDialogueRun } from '../application/abandonDialogueRun';
import { dismissRepairPrompt } from '../domain/dialogueGraphEngine';

export function DialogueRunScreen({
  packageId,
  dialogueId,
  onExit,
}: {
  packageId: string;
  dialogueId: string;
  onExit: () => void;
}) {
  const { container } = useAppRuntime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<DialogueGraph | null>(null);
  const [runState, setRunState] = useState<DialogueRunState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [playingAudioPath, setPlayingAudioPath] = useState<string | null>(null);

  // Self speak modal state
  const [selfSpeakVisible, setSelfSpeakVisible] = useState(false);
  const [selfSpeakText, setSelfSpeakText] = useState('');
  const [selfSpeakTranslation, setSelfSpeakTranslation] = useState<string | undefined>();

  // Completed ending state
  const [completedEnding, setCompletedEnding] = useState<DialogueEnding | null>(null);

  const scrollViewRef = useRef<any>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setCompletedEnding(null);

    void startDialogueRun({
      dialogueRepository: container.dialogue,
      progressRepository: container.progressRepository,
      clock: container.clock,
      deviceId: container.deviceIdentity.getDeviceId(),
      packageId,
      dialogueId,
    }).then((result) => {
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setDialogue(result.data.dialogue);
        setRunState(result.data.runState);
      }
      setLoading(false);
    });
  }, [container, packageId, dialogueId]);

  useEffect(() => {
    let ignore = false;
    void startDialogueRun({
      dialogueRepository: container.dialogue,
      progressRepository: container.progressRepository,
      clock: container.clock,
      deviceId: container.deviceIdentity.getDeviceId(),
      packageId,
      dialogueId,
    }).then((result) => {
      if (ignore) return;
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setDialogue(result.data.dialogue);
        setRunState(result.data.runState);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [container, packageId, dialogueId]);

  // Auto scroll to bottom when history changes
  useEffect(() => {
    if (runState?.history.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [runState?.history.length]);

  const handleAudioToggle = async (audioPath?: string) => {
    if (!audioPath) return;

    if (playingAudioPath === audioPath) {
      await container.audio.stop();
      setPlayingAudioPath(null);
      return;
    }

    await container.audio.stop();
    setPlayingAudioPath(audioPath);

    const sourceRes = container.audioSources.resolve(packageId, '1.0.0', audioPath);
    if (sourceRes === null) {
      setPlayingAudioPath(null);
      return;
    }

    try {
      await container.audio.play({
        itemId: audioPath,
        uri: sourceRes,
        format: 'opus',
      });
    } catch {
      setPlayingAudioPath(null);
    }
  };

  const handleSelectChoice = async (index: number) => {
    if (!dialogue || !runState || submitting) return;

    setSelectedChoiceIndex(index);
    setSubmitting(true);

    const result = await submitDialogueChoice({
      dialogueRepository: container.dialogue,
      progressRepository: container.progressRepository,
      clock: container.clock,
      deviceId: container.deviceIdentity.getDeviceId(),
      dialogue,
      runState,
      choiceIndex: index,
    });

    setSubmitting(false);
    setSelectedChoiceIndex(null);

    if (!result.ok) {
      Alert.alert('Gagal Mengirim Respons', result.error.message);
      return;
    }

    const { updatedState, choice, isRepair, nextStep } = result.data;
    setRunState(updatedState);

    if (!isRepair) {
      // Trigger optional self-speak step
      setSelfSpeakText(choice.text);
      setSelfSpeakTranslation(choice.translation);
      setSelfSpeakVisible(true);

      if (nextStep.type === 'ending' && nextStep.ending) {
        setCompletedEnding(nextStep.ending);
      }
    }
  };

  const handleAdvanceNode = async () => {
    if (!dialogue || !runState || submitting) return;

    setSubmitting(true);
    const result = await advanceDialogueNode({
      dialogueRepository: container.dialogue,
      clock: container.clock,
      dialogue,
      runState,
    });

    setSubmitting(false);
    if (!result.ok) {
      Alert.alert('Gagal Melanjutkan', result.error.message);
      return;
    }

    setRunState(result.data.updatedState);
    if (result.data.nextStep.type === 'ending' && result.data.nextStep.ending) {
      setCompletedEnding(result.data.nextStep.ending);
    }
  };

  const handleRetryAfterRepair = () => {
    if (!runState) return;
    setRunState(dismissRepairPrompt(runState));
  };

  const handleConfirmExit = () => {
    Alert.alert(
      'Keluar dari Percakapan?',
      'Progres percakapan yang belum selesai tidak akan dihitung.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            if (runState) {
              await abandonDialogueRun(container.dialogue, runState.sessionId);
            }
            onExit();
          },
        },
      ],
    );
  };

  if (loading) return <DialogueLoading />;
  if (error) return <DialogueError message={error} onRetry={reload} />;
  if (!dialogue || !runState) return <DialogueError message="Dialog tidak dapat dimuat." onRetry={reload} />;

  if (completedEnding) {
    return (
      <DialogueSummarySheet
        ending={completedEnding}
        score={runState.score ?? 1.0}
        onRestart={reload}
        onExit={onExit}
      />
    );
  }

  const currentNode = dialogue.nodes.find((n) => n.id === runState.currentNodeId);
  const totalTurns = dialogue.nodes.length;
  const currentTurnIndex = dialogue.nodes.findIndex((n) => n.id === runState.currentNodeId) + 1;
  const hasChoices = currentNode?.choices && currentNode.choices.length > 0;

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup percakapan"
          onPress={handleConfirmExit}
          style={styles.closeButton}
        >
          <Icon name="close-line" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {dialogue.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            Giliran {currentTurnIndex} dari {totalTurns} • {dialogue.interlocutor}
          </Text>
        </View>
      </View>

      {/* Transcript region */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollRegion}
      >
        {runState.history.map((entry, index) => {
          const isUser = entry.speaker === 'user';
          return (
            <DialogueLineBubble
              key={`history_${entry.nodeId}_${index}`}
              speaker={entry.speaker}
              text={entry.text}
              translation={entry.translation}
              audio={entry.audio}
              isUser={isUser}
              isPlaying={playingAudioPath === entry.audio}
              onToggleAudio={() => handleAudioToggle(entry.audio)}
            />
          );
        })}
      </ScrollView>

      {/* Interactive area at bottom */}
      <View style={styles.actionArea}>
        {hasChoices ? (
          <ChoiceActionGroup
            choices={currentNode.choices!}
            disabled={submitting}
            selectedChoiceIndex={selectedChoiceIndex}
            onSelectChoice={handleSelectChoice}
            activeRepair={runState.activeRepair}
            onRetryAfterRepair={handleRetryAfterRepair}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lanjut ke giliran berikutnya"
            disabled={submitting}
            onPress={handleAdvanceNode}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Lanjut</Text>
          </Pressable>
        )}
      </View>

      {/* Optional Self-Speak Step Modal */}
      <SelfSpeakStep
        visible={selfSpeakVisible}
        targetText={selfSpeakText}
        translation={selfSpeakTranslation}
        onComplete={() => setSelfSpeakVisible(false)}
        onSkip={() => setSelfSpeakVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background ?? '#F6F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollRegion: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionArea: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
});