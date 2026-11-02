import { useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';

import type { WordItem } from '../../../domain/package/packageTypes';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { DictionaryWordCard } from './DictionaryWordCard';

interface DictionaryViewProps {
  words: WordItem[];
  onClose: () => void;
}

const FILTER_OPTIONS = ['Semua', 'Sopan', 'Akrab', 'Netral'];

export function DictionaryView({ words, onClose }: DictionaryViewProps) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWords = words.filter((word) => {
    const matchesFilter =
      selectedFilter === 'Semua' ||
      word.register.toLowerCase() === selectedFilter.toLowerCase();

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    return (
      word.text.toLowerCase().includes(normalizedQuery) ||
      word.meaning.toLowerCase().includes(normalizedQuery) ||
      word.part_of_speech.toLowerCase().includes(normalizedQuery)
    );
  });

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Kamus */}
      <View style={styles.header}>
        <AppPressable
          accessibilityLabel="Kembali ke Feed Kata"
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.backButton}
        >
          <Icon color={colors.navy} name="arrow-left-line" size={24} />
        </AppPressable>

        <Text style={styles.headerTitle}>Kamus Kosakata</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 2. Search Bar & Horizontal Filter Chips */}
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Icon color={colors.textSecondary} name="search-line" size={18} />
          <TextInput
            accessibilityLabel="Cari kosakata daerah atau terjemahan"
            onChangeText={setQuery}
            placeholder="Cari kata atau arti..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <AppPressable
              accessibilityLabel="Bersihkan pencarian"
              accessibilityRole="button"
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <Icon color={colors.textSecondary} name="close-circle-fill" size={16} />
            </AppPressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = selectedFilter === opt;
            return (
              <AppPressable
                accessibilityLabel={`Filter ${opt}`}
                accessibilityRole="button"
                key={opt}
                onPress={() => setSelectedFilter(opt)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* 3. Daftar Kartu Kamus */}
      {filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon color={colors.textSecondary} name="search-line" size={32} />
          <Text style={styles.emptyText}>Tidak ada kata yang sesuai pencarian.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredWords}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <DictionaryWordCard word={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
  },
  headerSpacer: {
    width: touchTarget,
  },
  controls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.surface,
    fontFamily: fonts.bodySemiBold,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
