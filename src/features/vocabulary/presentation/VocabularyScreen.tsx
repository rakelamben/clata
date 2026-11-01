import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RemixIcon from 'react-native-remix-icon';
import {
  Animated,
  AppState,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type AppStateStatus,
  type ListViewToken,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { recordWordViewed } from '../application/recordWordViewed';
import type { AudioPlaybackState } from '../../../infrastructure/audio/audioTypes';
import type { VocabularyWord } from '../domain/vocabularyTypes';
import { DictionaryView } from './DictionaryView';
import {
  VocabularyEmpty,
  VocabularyError,
  VocabularyLoading,
} from './VocabularyStates';
import { WordFeedItem } from './WordFeedItem';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { useReduceMotion } from '../../../ui/useReduceMotion';

const viewabilityConfig = { itemVisiblePercentThreshold: 65, minimumViewTime: 0 };

type FeedEntry = {
  feedId: string;
  word: VocabularyWord;
};

const REGISTER_DETAILS: Record<string, { title: string; note: string }> = {
  ngoko: {
    title: 'Ngoko',
    note: 'Tingkat tutur santai dan akrab. Digunakan saat berbicara dengan teman sebaya, kerabat dekat, atau orang yang lebih muda.',
  },
  familiar: {
    title: 'Ngoko (Akrab)',
    note: 'Tingkat tutur santai dan akrab. Digunakan saat berbicara dengan teman sebaya, kerabat dekat, atau orang yang lebih muda.',
  },
  'ngoko-alus': {
    title: 'Ngoko Alus',
    note: 'Variasi ngoko yang menyelipkan kata krama untuk menghormati lawan bicara tanpa meninggalkan suasana akrab.',
  },
  neutral: {
    title: 'Netral / Ngoko Alus',
    note: 'Tingkat tutur sedang atau netral, dapat digunakan dalam percakapan sehari-hari dengan rasa saling menghargai.',
  },
  krama: {
    title: 'Krama',
    note: 'Tingkat tutur halus dan sopan. Digunakan untuk berbicara dengan orang tua, tokoh masyarakat, atau situasi resmi.',
  },
  formal: {
    title: 'Krama (Halus)',
    note: 'Tingkat tutur halus dan sopan. Digunakan untuk berbicara dengan orang tua, tokoh masyarakat, atau situasi resmi.',
  },
  'krama-inggil': {
    title: 'Krama Inggil',
    note: 'Kosakata penghormatan tertinggi, khusus ditujukan kepada orang yang sangat dihormati atau sesepuh.',
  },
};

function getPackageLabel(packageId?: string | null): string {
  if (!packageId) return 'Jawa · Mataraman';
  const parts = packageId.split('-');
  if (parts.length >= 2) {
    const lang = parts[0] === 'jawa' ? 'Jawa' : parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const dialect = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${lang} · ${dialect}`;
  }
  return packageId.charAt(0).toUpperCase() + packageId.slice(1);
}

function generateFeedBatch(base: VocabularyWord[], count: number, randomize = true): FeedEntry[] {
  if (base.length === 0) return [];
  const items: FeedEntry[] = [];
  const pool = [...base];
  if (randomize && pool.length > 1) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  for (let i = 0; i < count; i++) {
    const word = pool[i % pool.length];
    items.push({
      feedId: `${word.id}-${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
      word,
    });
  }
  return items;
}

export function VocabularyScreen() {
  const { container, profile } = useAppRuntime();
  const packageId = profile?.selectedPackageId;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  // Slide height occupies exactly one full view area between header and tab bar
  const headerHeight = 52;
  const slideHeight = Math.max(
    Math.floor(windowHeight - Math.max(insets.top, spacing.lg) - insets.bottom - headerHeight),
    360,
  );

  const [screen, setScreen] = useState<'feed' | 'dictionary'>('feed');
  const [baseWords, setBaseWords] = useState<VocabularyWord[]>([]);
  const [feedItems, setFeedItems] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [audioState, setAudioState] = useState<AudioPlaybackState>('idle');
  const [tooltipWord, setTooltipWord] = useState<VocabularyWord | null>(null);

  const baseWordsRef = useRef<VocabularyWord[]>([]);
  const [scrollY] = useState(() => new Animated.Value(0));
  const feedListRef = useRef<FlatList<FeedEntry>>(null);
  const savedScrollOffset = useRef(0);

  const visibleSince = useRef(new Map<string, number>());
  const visibleIds = useRef(new Set<string>());
  const recorded = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const failed = useRef(new Set<string>());
  const failedPayloads = useRef(new Map<string, { itemId: string; durationMs: number }>());
  const sessionId = useRef('');

  // Load initial words for feed
  const loadInitialFeed = useCallback(async () => {
    if (!packageId) {
      setBaseWords([]);
      setFeedItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);

    const result = await container.vocabulary.getFeedPage({
      packageId,
      limit: 50,
      source: 'vocabulary_feed',
    });

    if (result.ok) {
      baseWordsRef.current = result.data.items;
      setBaseWords(result.data.items);
      // Generate initial looping batch (20 items)
      const initialBatch = generateFeedBatch(result.data.items, 20, false);
      setFeedItems(initialBatch);
    } else {
      setError(true);
    }

    setLoading(false);
  }, [container.vocabulary, packageId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadInitialFeed());
  }, [loadInitialFeed]);

  // Append new randomized / looped batch when approaching bottom
  const loadMoreLoopedItems = useCallback(() => {
    if (baseWordsRef.current.length === 0) return;
    const nextBatch = generateFeedBatch(baseWordsRef.current, 15, true);
    setFeedItems((current) => [...current, ...nextBatch]);
  }, []);

  useEffect(() => container.audio.subscribe(setAudioState), [container.audio]);

  useEffect(() => {
    visibleSince.current.clear();
    recorded.current.clear();
    pending.current.clear();
    failed.current.clear();
    failedPayloads.current.clear();
    sessionId.current = `vocabulary-${packageId ?? 'none'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, [packageId]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const now = Date.now();
      const visible = new Set(
        viewableItems.map((token) => String((token.item as FeedEntry)?.word?.id ?? '')),
      );
      visibleIds.current = visible;
      for (const itemId of visible) {
        if (itemId && !visibleSince.current.has(itemId)) visibleSince.current.set(itemId, now);
      }
      for (const itemId of visibleSince.current.keys()) {
        if (!visible.has(itemId)) visibleSince.current.delete(itemId);
      }
    },
    [],
  );

  useEffect(() => {
    const exposureMap = visibleSince.current;
    const onAppState = (state: AppStateStatus) => {
      if (state !== 'active') visibleSince.current.clear();
      else {
        const now = Date.now();
        for (const itemId of visibleIds.current) visibleSince.current.set(itemId, now);
      }
    };
    const subscription = AppState.addEventListener('change', onAppState);
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active' || !packageId) return;
      const now = Date.now();
      const todayStr = container.clock.now().toISOString().slice(0, 10);
      const sessionPrefix = `vocabulary-${packageId}-${todayStr}`;
      if (!sessionId.current.startsWith(sessionPrefix)) {
        sessionId.current = `${sessionPrefix}-${now}-${Math.random().toString(36).slice(2, 8)}`;
      }
      for (const [itemId, since] of visibleSince.current) {
        const eventKey = `${todayStr}:${packageId}:${itemId}`;
        if (
          now - since < 1000 ||
          recorded.current.has(eventKey) ||
          pending.current.has(eventKey) ||
          failed.current.has(eventKey)
        )
          continue;
        pending.current.add(eventKey);
        void recordWordViewed(
          container.progressRepository,
          {
            packageId,
            itemId,
            sessionId: sessionId.current,
            durationMs: now - since,
            deviceId: container.deviceIdentity.getDeviceId(),
          },
          container.clock,
        )
          .then((result) => {
            if (result.ok) recorded.current.add(eventKey);
            else {
              failed.current.add(eventKey);
              failedPayloads.current.set(eventKey, { itemId, durationMs: now - since });
              setSaveFailed(true);
            }
          })
          .finally(() => pending.current.delete(eventKey));
      }
    }, 250);

    return () => {
      subscription.remove();
      clearInterval(timer);
      exposureMap.clear();
      visibleIds.current.clear();
    };
  }, [container, packageId]);

  const onScrollAnimated = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      savedScrollOffset.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const activeRegisterKey = tooltipWord?.register.toLowerCase() ?? '';
  const tooltipDetails =
    REGISTER_DETAILS[activeRegisterKey] ??
    (tooltipWord
      ? {
          title: tooltipWord.registerLabel ?? tooltipWord.register,
          note: 'Tingkat tutur bahasa daerah yang mengekspresikan tata krama dan rasa hormat sesuai relasi penutur.',
        }
      : null);

  // If in Dictionary view mode
  if (screen === 'dictionary') {
    return (
      <DictionaryView
        packageId={packageId}
        onClose={() => {
          setScreen('feed');
          setTimeout(() => {
            feedListRef.current?.scrollToOffset({
              offset: savedScrollOffset.current,
              animated: false,
            });
          }, 60);
        }}
        container={container}
        audioState={audioState}
        onAudioStateChange={setAudioState}
      />
    );
  }

  // Render Infinite Vertical Feed (Cardless with Snap & Motion Easing)
  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: insets.bottom },
      ]}
    >
      {/* Top Header Row with Package Pill and Buka Kamus */}
      <View style={[styles.headerRow, { height: headerHeight }]}>
        <View style={styles.packagePill}>
          <Text style={styles.packagePillText}>{getPackageLabel(packageId)}</Text>
        </View>

        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Buka Kamus"
          onPress={() => {
            setScreen('dictionary');
          }}
          ringRadius={20}
          style={({ pressed }) => [
            styles.dictionaryButton,
            pressed && styles.dictionaryButtonPressed,
          ]}
        >
          <RemixIcon name="book-open-line" size={18} color={colors.navy} accessible={false} />
          <Text style={styles.dictionaryButtonText}>Kamus</Text>
        </AppPressable>
      </View>

      {loading ? (
        <VocabularyLoading slideHeight={slideHeight} />
      ) : error ? (
        <VocabularyError onRetry={() => void loadInitialFeed()} />
      ) : baseWords.length === 0 ? (
        <VocabularyEmpty />
      ) : (
        <Animated.FlatList
          ref={feedListRef}
          accessibilityLabel="Feed kata, dapat digulir"
          data={feedItems}
          keyExtractor={(item) => item.feedId}
          getItemLayout={(_, index) => ({
            length: slideHeight,
            offset: slideHeight * index,
            index,
          })}
          snapToInterval={slideHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          onScroll={onScrollAnimated}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          onEndReached={loadMoreLoopedItems}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => {
            // Motion easing calculations for fluid scroll
            const inputRange = [
              (index - 1) * slideHeight,
              index * slideHeight,
              (index + 1) * slideHeight,
            ];

            const scale = reduceMotion
              ? 1
              : scrollY.interpolate({
                  inputRange,
                  outputRange: [0.82, 1, 0.82],
                  extrapolate: 'clamp',
                });

            const opacity = reduceMotion
              ? 1
              : scrollY.interpolate({
                  inputRange,
                  outputRange: [0.25, 1, 0.25],
                  extrapolate: 'clamp',
                });

            const translateY = reduceMotion
              ? 0
              : scrollY.interpolate({
                  inputRange,
                  outputRange: [35, 0, -35],
                  extrapolate: 'clamp',
                });

            return (
              <WordFeedItem
                word={item.word}
                slideHeight={slideHeight}
                animatedStyle={{
                  transform: [{ scale }, { translateY }],
                  opacity,
                }}
                audioUri={
                  item.word.audio
                    ? container.audioSources.resolve(
                        item.word.packageId,
                        item.word.packageVersion,
                        item.word.audio.path,
                      )
                    : null
                }
                audio={container.audio}
                audioState={audioState}
                onAudioStateChange={setAudioState}
                onOpenTooltip={setTooltipWord}
              />
            );
          }}
        />
      )}

      {saveFailed ? (
        <View style={styles.saveErrorContainer}>
          <Text accessibilityRole="alert" style={styles.saveError}>
            Progress belum tersimpan.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const retries = [...failedPayloads.current.entries()];
              failed.current.clear();
              setSaveFailed(false);
              for (const [eventKey, payload] of retries) {
                if (!packageId) continue;
                pending.current.add(eventKey);
                void recordWordViewed(
                  container.progressRepository,
                  {
                    packageId,
                    itemId: payload.itemId,
                    sessionId: sessionId.current,
                    durationMs: payload.durationMs,
                    deviceId: container.deviceIdentity.getDeviceId(),
                  },
                  container.clock,
                )
                  .then((result) => {
                    if (result.ok) {
                      recorded.current.add(eventKey);
                      failedPayloads.current.delete(eventKey);
                      if (failedPayloads.current.size === 0) setSaveFailed(false);
                    } else {
                      failed.current.add(eventKey);
                      setSaveFailed(true);
                    }
                  })
                  .finally(() => pending.current.delete(eventKey));
              }
            }}
          >
            <Text style={styles.retryText}>Coba simpan lagi</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Tooltip Modal Bottom Sheet for Tingkat Tutur */}
      <Modal
        visible={tooltipWord !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipWord(null)}
      >
        <Pressable style={styles.tooltipScrim} onPress={() => setTooltipWord(null)}>
          <Pressable style={styles.tooltipCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.tooltipHandle} />
            <Text style={styles.tooltipTitle}>{tooltipDetails?.title}</Text>
            <Text style={styles.tooltipNote}>{tooltipDetails?.note}</Text>
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel="Tutup penjelasan tingkat tutur"
              onPress={() => setTooltipWord(null)}
              ringRadius={radii.control}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Mengerti</Text>
            </AppPressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  packagePill: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    alignSelf: 'center',
  },
  packagePillText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  dictionaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  dictionaryButtonPressed: {
    backgroundColor: colors.navyTint,
  },
  dictionaryButtonText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  saveErrorContainer: {
    paddingVertical: spacing.sm,
  },
  saveError: {
    color: colors.magenta,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  retryText: {
    color: colors.primary,
    fontFamily: fonts.uiSemiBold,
    paddingVertical: spacing.xs,
  },
  tooltipScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  tooltipCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.xl,
    gap: spacing.md,
  },
  tooltipHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  tooltipEyebrow: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  tooltipTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 26,
    color: colors.navy,
  },
  tooltipNote: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
