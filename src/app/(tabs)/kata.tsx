import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type ListViewToken,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../../context/AppContext';
import type { Register } from '../../domain/Register';
import {
  generateFeedBuffer,
  rankWordFeed,
  type FeedWordEntry,
} from '../../features/vocabulary/domain/wordFeedRanker';
import { DictionaryView } from '../../features/vocabulary/presentation/DictionaryView';
import { RegisterBottomSheet } from '../../features/vocabulary/presentation/RegisterBottomSheet';
import { StreakToastBanner } from '../../features/vocabulary/presentation/StreakToastBanner';
import {
  VocabularyEmpty,
  VocabularyLoading,
} from '../../features/vocabulary/presentation/VocabularyStates';
import { VocabularyAppBar } from '../../features/vocabulary/presentation/VocabularyAppBar';
import { WordFeedItem } from '../../features/vocabulary/presentation/WordFeedItem';
import type { DailyStreakRecord } from '../../infrastructure/database/databaseTypes';
import { getLocalDateString, StreakRepository } from '../../infrastructure/database/streakRepository';
import { WordViewRepository } from '../../infrastructure/database/wordViewRepository';
import { colors } from '../../ui/theme';
import { useReduceMotion } from '../../ui/useReduceMotion';

const viewabilityConfig = { itemVisiblePercentThreshold: 50, minimumViewTime: 0 };

export default function KataScreen() {
  const { activePackageData, activePackageId, isInitialized } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  const wordViewRepo = useMemo(() => new WordViewRepository(), []);
  const streakRepo = useMemo(() => new StreakRepository(), []);

  // Slide height presisi antara AppBar transparan (52dp) dan bottom tab bar (~56dp)
  const headerHeight = 52;
  const bottomTabBarHeight = 56;
  const slideHeight = Math.max(
    Math.floor(windowHeight - insets.top - insets.bottom - headerHeight - bottomTabBarHeight),
    360,
  );

  const [screen, setScreen] = useState<'feed' | 'dictionary'>('feed');
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedWordEntry[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [todayStreak, setTodayStreak] = useState<DailyStreakRecord>({
    package_id: activePackageId ?? '',
    date_string: getLocalDateString(),
    scroll_count: 0,
    is_completed: 0,
    completed_at: null,
  });

  const baseRankedRef = useRef<FeedWordEntry[]>([]);
  const iterationRef = useRef(1);
  const feedListRef = useRef<FlatList<FeedWordEntry>>(null);
  const savedScrollOffset = useRef(0);
  const viewedInThisSessionRef = useRef(new Set<string>());
  const [scrollY] = useState(() => new Animated.Value(0));

  // Inisialisasi data kata & streak stabil per sesi (cold start / package switch)
  useEffect(() => {
    let isMounted = true;

    const initFeedAndStreak = async () => {
      if (!activePackageId || !activePackageData) {
        if (isMounted) {
          setFeedItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const streak = await streakRepo.getTodayStreak(activePackageId);
        const wordViewsMap = await wordViewRepo.getWordViewMap(activePackageId);

        if (!isMounted) return;
        setTodayStreak(streak);

        const words = activePackageData.words;
        const units = activePackageData.units;
        const currentUnitId = units[0]?.unit_id ?? 'unit-1';

        // Peringkat 5-Tier Spaced Repetition Bucket dengan pengacakan ringan 1x saat buka sesi
        const ranked = rankWordFeed(words, units, currentUnitId, wordViewsMap, {
          randomizeWithinTier: true,
        });

        baseRankedRef.current = ranked;
        iterationRef.current = 1;

        // Buat buffer awal (25 item berulang stabil)
        const initialBuffer = generateFeedBuffer(ranked, Math.min(25, ranked.length * 2));
        setFeedItems(initialBuffer);
      } catch (err) {
        console.error('[KataScreen] Gagal memuat data kosakata atau streak:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initFeedAndStreak();

    return () => {
      isMounted = false;
    };
  }, [activePackageId, activePackageData, streakRepo, wordViewRepo]);

  // Sinkronisasi status streak saat layar Kata kembali difokuskan (misal setelah reset progres)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const syncStreakOnFocus = async () => {
        if (!activePackageId) return;
        try {
          const streak = await streakRepo.getTodayStreak(activePackageId);
          if (isMounted) {
            setTodayStreak(streak);
            // Jika progres direset (scroll_count = 0), bersihkan cache sesi kata dilihat
            if (streak.scroll_count === 0) {
              viewedInThisSessionRef.current.clear();
            }
          }
        } catch (err) {
          console.warn('[KataScreen] Gagal menyinkronkan status streak:', err);
        }
      };

      void syncStreakOnFocus();

      return () => {
        isMounted = false;
      };
    }, [activePackageId, streakRepo]),
  );

  // Tambahkan item buffer berikutnya saat scroll mendekati ujung bawah tanpa merusak urutan
  const handleEndReached = useCallback(() => {
    if (baseRankedRef.current.length === 0) return;
    iterationRef.current += 1;
    const nextBatch = generateFeedBuffer(
      baseRankedRef.current,
      15,
      iterationRef.current,
    );
    setFeedItems((prev) => [...prev, ...nextBatch]);
  }, []);

  // Pelacakan instan kata yang terlihat di viewport (isViewed & penambahan scroll streak)
  const onViewableItemsChanged = useCallback(
    async ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      if (!activePackageId) return;

      for (const token of viewableItems) {
        const entry = token.item as FeedWordEntry | undefined;
        if (!entry?.word?.id) continue;

        const wordId = entry.word.id;

        // Pastikan hanya dihitung 1x per sesi per kata agar scroll bolak-balik tidak mengecoh streak
        if (!viewedInThisSessionRef.current.has(wordId)) {
          viewedInThisSessionRef.current.add(wordId);

          try {
            // 1. Simpan status isViewed ke SQLite
            void wordViewRepo.recordWordView(activePackageId, wordId);

            // 2. Tambah hitungan scroll harian untuk streak
            const result = await streakRepo.incrementDailyScroll(activePackageId);
            setTodayStreak(result.streak);

            if (result.justCompleted) {
              setShowStreakToast(true);
            }
          } catch (err) {
            console.warn('[KataScreen] Gagal memperbarui status view atau streak:', err);
          }
        }
      }
    },
    [activePackageId, streakRepo, wordViewRepo],
  );

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

  // Jika sedang membuka mode Kamus
  if (screen === 'dictionary') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <DictionaryView
          onClose={() => {
            setScreen('feed');
            setTimeout(() => {
              feedListRef.current?.scrollToOffset({
                offset: savedScrollOffset.current,
                animated: false,
              });
            }, 60);
          }}
          words={activePackageData?.words ?? []}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Toast Perayaan Streak Harian (Non-Intrusif) */}
        <StreakToastBanner
          onDismiss={() => setShowStreakToast(false)}
          visible={showStreakToast}
        />

        {/* 1. AppBar Transparan Melayang (Tanpa judul, tanpa label paket, progress streak tengah, tombol kamus kanan) */}
        <VocabularyAppBar
          isStreakCompleted={todayStreak.is_completed === 1}
          onOpenDictionary={() => setScreen('dictionary')}
          scrollCount={todayStreak.scroll_count}
        />

        {/* 2. Area Konten Feed Kata */}
        {!isInitialized || loading ? (
          <VocabularyLoading />
        ) : feedItems.length === 0 ? (
          <VocabularyEmpty
            onUploadPackage={() => router.push('/onboarding/select-package')}
          />
        ) : (
          <Animated.FlatList
            accessibilityLabel="Feed kosakata daerah"
            data={feedItems}
            decelerationRate="fast"
            disableIntervalMomentum={true}
            getItemLayout={(_, index) => ({
              length: slideHeight,
              offset: slideHeight * index,
              index,
            })}
            keyExtractor={(item) => item.feedId}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onScroll={onScrollAnimated}
            onViewableItemsChanged={onViewableItemsChanged}
            ref={feedListRef}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * slideHeight,
                index * slideHeight,
                (index + 1) * slideHeight,
              ];

              const scale = reduceMotion
                ? 1
                : scrollY.interpolate({
                    inputRange,
                    outputRange: [0.84, 1, 0.84],
                    extrapolate: 'clamp',
                  });

              const opacity = reduceMotion
                ? 1
                : scrollY.interpolate({
                    inputRange,
                    outputRange: [0.28, 1, 0.28],
                    extrapolate: 'clamp',
                  });

              const translateY = reduceMotion
                ? 0
                : scrollY.interpolate({
                    inputRange,
                    outputRange: [30, 0, -30],
                    extrapolate: 'clamp',
                  });

              return (
                <WordFeedItem
                  animatedStyle={{
                    transform: [{ scale }, { translateY }],
                    opacity,
                  }}
                  onOpenRegister={(reg) => setSelectedRegister(reg)}
                  slideHeight={slideHeight}
                  word={item.word}
                />
              );
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={slideHeight}
            viewabilityConfig={viewabilityConfig}
          />
        )}

        {/* 3. Bottom Sheet Tingkat Tutur (Register Modal) */}
        <RegisterBottomSheet
          onClose={() => setSelectedRegister(null)}
          register={selectedRegister}
        />
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
  },
});
