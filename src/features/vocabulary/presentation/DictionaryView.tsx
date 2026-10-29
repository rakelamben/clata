import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import RemixIcon from 'react-native-remix-icon';
import {
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DependencyContainer } from '../../../bootstrap/DependencyContainer';
import type { AudioPlaybackState } from '../../../infrastructure/audio/audioTypes';
import type { VocabularyFilters, VocabularyWord } from '../domain/vocabularyTypes';
import { DictionaryWordCard } from './DictionaryWordCard';
import { DictionaryLoadingList } from './VocabularyStates';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

type Props = {
  packageId?: string | null;
  onClose: () => void;
  container: DependencyContainer;
  audioState: AudioPlaybackState;
  onAudioStateChange: (state: AudioPlaybackState) => void;
};

export function DictionaryView({
  packageId,
  onClose,
  container,
  audioState,
  onAudioStateChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [filters, setFilters] = useState<VocabularyFilters>({ themes: [], registers: [] });
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const listRef = useRef<FlatList<VocabularyWord>>(null);
  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Load package filters & all words
  const loadData = useCallback(async () => {
    if (!packageId) {
      setWords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);

    try {
      // Load all words for the package
      const pageResult = await container.vocabulary.search({
        packageId,
        limit: 250,
        source: 'dictionary',
      });

      if (pageResult.ok) {
        setWords(pageResult.data.items);
      } else {
        setLoadFailed(true);
      }

      const filtersResult = await container.vocabulary.getFilters(packageId);
      if (filtersResult.ok) {
        setFilters(filtersResult.data);
      }
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [container.vocabulary, packageId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  // Reset scroll position on filter/search change
  const resetListPosition = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Filter options list: 'Semua', followed by available registers or themes
  const filterOptions = ['Semua', ...filters.registers];

  // Client-side filtering matching search query & register filter
  const normalizedQuery = query.trim().toLowerCase();
  const visibleWords = words.filter((word) => {
    const matchesFilter =
      selectedFilter === 'Semua' ||
      word.register.toLowerCase() === selectedFilter.toLowerCase() ||
      word.registerLabel?.toLowerCase() === selectedFilter.toLowerCase();

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    return (
      word.lemma.toLowerCase().includes(normalizedQuery) ||
      word.meaning.toLowerCase().includes(normalizedQuery) ||
      (word.partOfSpeech && word.partOfSpeech.toLowerCase().includes(normalizedQuery))
    );
  });

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: insets.bottom },
      ]}
    >
      {/* 1. Header Kamus */}
      <View style={styles.header}>
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Kembali ke Kata"
          onPress={handleClose}
          ringRadius={touchTarget / 2}
          style={styles.backButton}
        >
          <RemixIcon name="arrow-left-line" size={24} color={colors.navy} accessible={false} />
        </AppPressable>
        <Text style={styles.headerTitle}>Kamus</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 2. Controls: Search Bar & Horizontal Filters */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <RemixIcon name="search-line" size={20} color={colors.textSecondary} accessible={false} />
          <TextInput
            ref={searchInputRef}
            accessibilityLabel="Cari kata atau arti"
            placeholder="Cari kata atau arti…"
            placeholderTextColor={colors.borderStrong}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              resetListPosition();
            }}
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel="Hapus pencarian"
              onPress={() => {
                setQuery('');
                resetListPosition();
                searchInputRef.current?.focus();
              }}
              ringRadius={16}
              style={styles.clearButton}
            >
              <RemixIcon name="close-line" size={18} color={colors.borderStrong} accessible={false} />
            </AppPressable>
          ) : null}
        </View>

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          accessibilityLabel="Filter kata"
        >
          {filterOptions.map((item) => {
            const isSelected = selectedFilter === item;
            return (
              <AppPressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter ${item}`}
                onPress={() => {
                  setSelectedFilter(item);
                  resetListPosition();
                }}
                ringRadius={radii.control}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              >
                {isSelected ? (
                  <RemixIcon name="check-line" size={16} color={colors.surface} accessible={false} />
                ) : null}
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {item}
                </Text>
              </AppPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Word List Region */}
      <View style={styles.listRegion}>
        {loading ? (
          <DictionaryLoadingList />
        ) : loadFailed ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, styles.emptyIconError]}>
              <RemixIcon name="book-open-line" size={32} color={colors.primary} accessible={false} />
            </View>
            <Text style={styles.emptyTitle}>Kamus belum dapat dibuka.</Text>
            <Text style={styles.emptyDescription}>
              Materi lokal belum siap. Silakan buka kembali Kamus sebentar lagi.
            </Text>
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel="Coba lagi"
              onPress={() => void loadData()}
              ringRadius={radii.control}
              style={styles.retryButton}
            >
              <RemixIcon name="refresh-line" size={18} color={colors.surface} accessible={false} />
              <Text style={styles.retryButtonText}>Coba lagi</Text>
            </AppPressable>
          </View>
        ) : visibleWords.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <RemixIcon name="search-line" size={32} color={colors.textSecondary} accessible={false} />
            </View>
            <Text style={styles.emptyTitle}>
              {words.length > 0 ? 'Kata belum ditemukan.' : 'Belum ada kata di kamus.'}
            </Text>
            <Text style={styles.emptyDescription}>
              {words.length > 0
                ? 'Coba kata lain atau pilih filter yang berbeda.'
                : 'Materi kamus akan muncul setelah paket belajar terpasang.'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            accessibilityLabel="Daftar kata kamus, dapat digulir"
            data={visibleWords}
            keyExtractor={(word) => word.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DictionaryWordCard
                word={item}
                audio={container.audio}
                audioUri={
                  item.audio
                    ? container.audioSources.resolve(
                        item.packageId,
                        item.packageVersion,
                        item.audio.path,
                      )
                    : null
                }
                audioState={audioState}
                onAudioStateChange={onAudioStateChange}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.navy,
  },
  headerSpacer: {
    width: touchTarget,
  },
  controls: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchContainer: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.surface,
    fontFamily: fonts.uiSemiBold,
  },
  listRegion: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyIconError: {
    backgroundColor: colors.magentaTint,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
