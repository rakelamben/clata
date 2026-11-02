import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';
import { router, useLocalSearchParams } from 'expo-router';

import { AppPressable } from '../../ui/AppPressable';
import { useApp } from '../../context/AppContext';
import type { DialogueItem, DialogueNodeItem } from '../../domain/package/packageTypes';
import {
  advanceDialogueRun,
  applyChoiceToRun,
  dismissRepairPrompt,
  getCurrentNode,
  initializeDialogueRun,
} from '../../features/practice/domain/dialogueGraphEngine';
import type { DialogueRunState } from '../../features/practice/domain/dialogueTypes';
import { ChoiceActionGroup } from '../../features/practice/presentation/ChoiceActionGroup';
import { DialogueLineBubble } from '../../features/practice/presentation/DialogueLineBubble';
import {
  DialogueEmpty,
  DialogueLoading,
} from '../../features/practice/presentation/DialogueStates';
import { DialogueSummarySheet } from '../../features/practice/presentation/DialogueSummarySheet';
import { selectFreeDialogue } from '../../features/practice/domain/practiceFreeSelection';
import { ScenarioContextCard } from '../../features/practice/presentation/ScenarioContextCard';
import { TypingIndicator } from '../../features/practice/presentation/TypingIndicator';
import { playAudioSafe } from '../../features/vocabulary/audio/audioPlayback';
import { UnitProgressRepository } from '../../infrastructure/database/unitProgressRepository';
import { colors, fonts, radii, spacing } from '../../ui/theme';

const unitProgressRepo = new UnitProgressRepository();

export default function DialogueRunnerScreen() {
  const { unitId, sessionId, dialogueId, mode } = useLocalSearchParams<{
    unitId?: string;
    sessionId?: string;
    dialogueId?: string;
    mode?: string;
  }>();

  const { activePackageId, activePackageData, isInitialized } = useApp();
  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  const [sessionKey, setSessionKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [playingAudioPath, setPlayingAudioPath] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  const registerTimeout = useCallback((fn: () => void, delayMs: number) => {
    const id = setTimeout(fn, delayMs);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  // Ambil data dialog yang cocok
  const dialogue = useMemo<DialogueItem | null>(() => {
    if (!activePackageData?.dialogues || activePackageData.dialogues.length === 0) {
      return null;
    }

    if (dialogueId === 'random' || mode === 'free') {
      return selectFreeDialogue(activePackageData.dialogues);
    }

    if (dialogueId) {
      const match = activePackageData.dialogues.find((d: DialogueItem) => d.id === dialogueId);
      if (match) return match;
    }

    if (unitId) {
      const unitMatch = activePackageData.dialogues.find((d: DialogueItem) => d.unit_id === unitId);
      if (unitMatch) return unitMatch;
    }

    return activePackageData.dialogues[0] || null;
  }, [activePackageData, dialogueId, unitId, mode]);

  const defaultRunState = useMemo<DialogueRunState | null>(() => {
    if (!dialogue || sessionKey < 0) return null;
    try {
      return initializeDialogueRun(dialogue);
    } catch {
      return null;
    }
  }, [dialogue, sessionKey]);

  const [customRunState, setCustomRunState] = useState<DialogueRunState | null>(null);
  const runState = customRunState ?? defaultRunState;

  const handleRestart = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
    setIsPartnerTyping(false);
    setSubmitting(false);
    setSelectedChoiceIndex(null);
    setCustomRunState(null);
    setSessionKey((prev) => prev + 1);
  }, []);

  // Auto-scroll ke bawah saat transkrip obrolan bertambah
  useEffect(() => {
    if (runState?.history.length) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [runState?.history.length]);

  const handleAudioToggle = async (audioPath?: string) => {
    if (!audioPath) return;

    if (playingAudioPath === audioPath) {
      setPlayingAudioPath(null);
      return;
    }

    setPlayingAudioPath(audioPath);
    await playAudioSafe(audioPath, (status) => {
      if (status === 'playing') {
        setPlayingAudioPath(audioPath);
      } else if (status === 'idle' || status === 'error' || status === 'unavailable') {
        setPlayingAudioPath(null);
      }
    });
  };

  const persistProgressIfCompleted = async (finalState: DialogueRunState) => {
    if (finalState.status === 'completed' && resolvedPackageId && unitId && sessionId && mode !== 'free') {
      try {
        const scorePercentage = Math.round((finalState.score ?? 1.0) * 100);
        await unitProgressRepo.recordSessionCompletion(
          resolvedPackageId,
          unitId,
          sessionId,
          scorePercentage,
        );
      } catch (err) {
        console.error('[DialogueRunner] Gagal menyimpan progres ke database:', err);
      }
    }
  };

  const handleSelectChoice = (index: number) => {
    if (!dialogue || !runState || submitting || isPartnerTyping) return;

    setSelectedChoiceIndex(index);
    setSubmitting(true);

    try {
      const result = applyChoiceToRun(dialogue, runState, index);
      const prevCount = runState.history.length;
      const newCount = result.updatedState.history.length;

      // Jika bertambah 2 balon (1 ucapan user + 1 balasan partner / repair)
      if (newCount >= prevCount + 2) {
        const userEntry = result.updatedState.history[prevCount];

        // 1. Tampilkan ucapan user terlebih dahulu
        setCustomRunState({
          ...runState,
          history: [...runState.history, userEntry],
          activeRepair: null,
        });

        // 2. Beri jeda 200ms lalu tampilkan typing indicator lawan bicara
        registerTimeout(() => {
          setIsPartnerTyping(true);

          // 3. Setelah 700ms mengetik, matikan typing indicator & munculkan balon lawan bicara
          registerTimeout(async () => {
            setIsPartnerTyping(false);
            setCustomRunState(result.updatedState);

            if (!result.isRepair && result.nextStep.type === 'ending') {
              await persistProgressIfCompleted(result.updatedState);
            }

            // 4. Buka kembali interaksi setelah jeda membaca singkat (250ms)
            registerTimeout(() => {
              setSubmitting(false);
              setSelectedChoiceIndex(null);
            }, 250);
          }, 700);
        }, 200);
      } else {
        // Bertambah 1 balon atau langsung ending
        setCustomRunState(result.updatedState);
        if (!result.isRepair && result.nextStep.type === 'ending') {
          void persistProgressIfCompleted(result.updatedState);
        }
        setSubmitting(false);
        setSelectedChoiceIndex(null);
      }
    } catch (err) {
      Alert.alert('Gagal Mengirim Respons', (err as Error).message);
      setSubmitting(false);
      setSelectedChoiceIndex(null);
    }
  };

  const handleAdvanceNode = () => {
    if (!dialogue || !runState || submitting || isPartnerTyping) return;

    setSubmitting(true);
    try {
      const result = advanceDialogueRun(dialogue, runState);
      const prevCount = runState.history.length;
      const newCount = result.updatedState.history.length;

      if (newCount > prevCount) {
        const newEntry = result.updatedState.history[newCount - 1];

        // Jika giliran berikutnya adalah lawan bicara, tampilkan typing indicator terlebih dahulu
        if (!newEntry.isUser) {
          setIsPartnerTyping(true);

          registerTimeout(async () => {
            setIsPartnerTyping(false);
            setCustomRunState(result.updatedState);

            if (result.nextStep.type === 'ending') {
              await persistProgressIfCompleted(result.updatedState);
            }

            registerTimeout(() => {
              setSubmitting(false);
            }, 250);
          }, 650);
        } else {
          // Jika ucapan user, tampilkan langsung
          setCustomRunState(result.updatedState);
          if (result.nextStep.type === 'ending') {
            void persistProgressIfCompleted(result.updatedState);
          }
          setSubmitting(false);
        }
      } else {
        setCustomRunState(result.updatedState);
        if (result.nextStep.type === 'ending') {
          void persistProgressIfCompleted(result.updatedState);
        }
        setSubmitting(false);
      }
    } catch (err) {
      Alert.alert('Gagal Melanjutkan', (err as Error).message);
      setSubmitting(false);
    }
  };

  const handleRetryAfterRepair = () => {
    if (!runState) return;
    setCustomRunState(dismissRepairPrompt(runState));
  };

  const handleConfirmExit = () => {
    Alert.alert(
      'Keluar dari Percakapan?',
      'Progres percakapan yang belum selesai tidak akan disimpan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  if (!isInitialized) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <DialogueLoading />
      </SafeAreaView>
    );
  }

  if (!dialogue || !runState) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <DialogueEmpty message="Data percakapan tidak dapat dimuat." />
      </SafeAreaView>
    );
  }

  // Tampilkan lembar evaluasi akhir jika percakapan telah selesai
  if (runState.status === 'completed' && runState.completedEnding) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <DialogueSummarySheet
          ending={runState.completedEnding}
          onExit={() => router.back()}
          onRestart={handleRestart}
          score={runState.score ?? 1.0}
        />
      </SafeAreaView>
    );
  }

  const currentNode = getCurrentNode(dialogue, runState);
  const nodes = dialogue.nodes as DialogueNodeItem[];
  const totalTurns = nodes.length;
  const currentTurnIndex = nodes.findIndex((n) => n.id === runState.currentNodeId) + 1;
  const hasChoices = Boolean(currentNode?.choices && currentNode.choices.length > 0);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <AppPressable
            accessibilityLabel="Tutup percakapan"
            accessibilityRole="button"
            onPress={handleConfirmExit}
            style={styles.closeButton}
          >
            <Icon color={colors.textPrimary} name="close-line" size={24} />
          </AppPressable>

          <View style={styles.headerTitleContainer}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {dialogue.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              Lawan Bicara: {String(dialogue.partner || dialogue.interlocutor || 'Lawan Bicara')}
            </Text>
          </View>

          <View style={styles.turnBadge}>
            <Text style={styles.turnBadgeText}>
              {Math.min(Math.max(currentTurnIndex, 1), totalTurns)}/{totalTurns}
            </Text>
          </View>
        </View>

        {/* Transcript Obrolan */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          style={styles.scrollRegion}
        >
          {/* Kartu Skenario Konteks di Atas Transkrip */}
          <ScenarioContextCard
            avatar={dialogue.avatar as string | undefined}
            contextDescription={dialogue.contextDescription as string | undefined}
            partner={(dialogue.partner || dialogue.interlocutor || 'Lawan Bicara') as string}
            register={dialogue.register as string | undefined}
            title={dialogue.title}
            userRole={dialogue.userRole as string | undefined}
          />

          {runState.history.map((entry, index) => (
            <DialogueLineBubble
              key={`history_${entry.nodeId}_${index}`}
              audio={entry.audio}
              coachingNote={entry.coachingNote}
              isPlaying={playingAudioPath === entry.audio}
              isRepair={entry.isRepair}
              isUser={entry.isUser}
              onToggleAudio={() => handleAudioToggle(entry.audio)}
              speaker={entry.speaker}
              text={entry.text}
              translation={entry.translation}
            />
          ))}

          {isPartnerTyping ? (
            <TypingIndicator
              speaker={String(dialogue.partner || dialogue.interlocutor || 'Lawan Bicara')}
            />
          ) : null}
        </ScrollView>

        {/* Area Interaktif di Bagian Bawah */}
        <View style={styles.actionArea}>
          {hasChoices && currentNode?.choices ? (
            <ChoiceActionGroup
              activeRepair={runState.activeRepair}
              choices={currentNode.choices}
              disabled={submitting || isPartnerTyping}
              onRetryAfterRepair={handleRetryAfterRepair}
              onSelectChoice={handleSelectChoice}
              selectedChoiceIndex={selectedChoiceIndex}
            />
          ) : (
            <AppPressable
              accessibilityLabel="Lanjut ke giliran berikutnya"
              accessibilityRole="button"
              disabled={submitting || isPartnerTyping}
              onPress={handleAdvanceNode}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Lanjut Percakapan</Text>
              <Icon color={colors.surface} name="arrow-right-line" size={18} />
            </AppPressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  turnBadge: {
    backgroundColor: colors.orangeTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  turnBadgeText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.primary,
  },
  scrollRegion: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  actionArea: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
