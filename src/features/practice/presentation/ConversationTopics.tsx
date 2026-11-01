import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { listDialogues } from '../../dialogues/application/listDialogues';
import type { DialogueListItem } from '../../dialogues/domain/dialogueTypes';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export type TopicItem = {
  id: string;
  title: string;
  description: string;
  partner: string;
  userRole: string;
};

export const DEFAULT_DIALOGUES: TopicItem[] = [
  {
    id: 'dialog-sapaan',
    title: 'Menyapa Tetangga',
    description: 'Menyapa dan bertukar kabar singkat dengan tetangga di pagi hari.',
    partner: 'Tetangga',
    userRole: 'Warga / Pengunjung',
  },
  {
    id: 'dialog-pasar',
    title: 'Belanja di Pasar',
    description: 'Menanyakan harga dan membeli bahan makanan di pasar tradisional.',
    partner: 'Penjual Pasar',
    userRole: 'Pembeli',
  },
  {
    id: 'dialog-tamu',
    title: 'Menerima Tamu',
    description: 'Menyambut tamu yang bertandang ke rumah dengan santun.',
    partner: 'Tamu Rumah',
    userRole: 'Tuan Rumah',
  },
  {
    id: 'dialog-warung',
    title: 'Pesan Makanan di Warung',
    description: 'Memesan hidangan makan siang dan menanyakan minuman di warung makan.',
    partner: 'Pemilik Warung',
    userRole: 'Pelanggan',
  },
  {
    id: 'dialog-arah',
    title: 'Menanyakan Arah Jalan',
    description: 'Menanyakan arah jalan menuju stasiun kepada sesama warga di jalan.',
    partner: 'Warga Sekitar',
    userRole: 'Pengendara / Pejalan Kaki',
  },
  {
    id: 'dialog-pamit',
    title: 'Pamit Pulang',
    description: 'Berpamitan kepada tuan rumah setelah berkunjung silaturahmi.',
    partner: 'Tuan Rumah',
    userRole: 'Tamu',
  },
];

type ConversationTopicsProps = {
  packageId?: string;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ConversationTopics({
  packageId,
  selectedId,
  onSelect,
}: ConversationTopicsProps) {
  const { container } = useAppRuntime();
  const { width: windowWidth } = useWindowDimensions();
  const [topics, setTopics] = useState<TopicItem[]>(DEFAULT_DIALOGUES);
  const flatListRef = useRef<FlatList<TopicItem>>(null);

  // Card width matches --topic-card-width: min(78vw, 22rem / 352px)
  const cardWidth = Math.min(windowWidth * 0.78, 320);
  const itemGap = spacing.md;
  const snapInterval = cardWidth + itemGap;

  // Auto select elemen pertama saat mount load pre sesi
  useEffect(() => {
    if (DEFAULT_DIALOGUES.length > 0) {
      onSelect(DEFAULT_DIALOGUES[0].id);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [onSelect]);

  useEffect(() => {
    let ignore = false;
    const pkg = packageId ?? 'jawa-mataraman';
    void listDialogues(container.dialogue, pkg).then((result) => {
      if (ignore) return;
      if (result.ok && result.data.length > 0) {
        const loaded: TopicItem[] = result.data.map((item: DialogueListItem) => ({
          id: item.id,
          title: item.title,
          description: item.contextDescription ?? 'Latih respons dan tingkat tutur dalam situasi nyata.',
          partner: item.interlocutor === 'neighbor' ? 'Tetangga' : item.interlocutor,
          userRole: 'Kamu',
        }));
        // Merge loaded topics with our curated default dialogues so there are always at least 6 topics
        const existingIds = new Set(loaded.map((t) => t.id));
        const merged = [
          ...loaded,
          ...DEFAULT_DIALOGUES.filter((d) => !existingIds.has(d.id)),
        ];
        setTopics(merged);
        if (merged.length > 0) {
          onSelect(merged[0].id);
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
      }
    });
    return () => {
      ignore = true;
    };
  }, [container.dialogue, packageId, onSelect]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    if (index >= 0 && index < topics.length) {
      const active = topics[index];
      if (active && active.id !== selectedId) {
        onSelect(active.id);
      }
    }
  };

  return (
    <View style={[styles.carouselWrap, { width: windowWidth }]}>
      <FlatList
        ref={flatListRef}
        data={topics}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={0}
        getItemLayout={(_data, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: (windowWidth - cardWidth) / 2 },
        ]}
        ItemSeparatorComponent={() => <View style={{ width: itemGap }} />}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }) => {
          const isSelected = selectedId === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Topik ${item.title}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                onSelect(item.id);
                flatListRef.current?.scrollToOffset({
                  offset: index * snapInterval,
                  animated: true,
                });
              }}
              style={[
                styles.topicCard,
                { width: cardWidth },
                isSelected ? styles.topicCardSelected : styles.topicCardUnselected,
              ]}
            >
              <Text style={styles.kicker}>Tema</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>

              {/* Roles stacked vertically according to .conversation-topic-roles */}
              <View style={styles.rolesContainer}>
                <View style={styles.roleBlock}>
                  <Text style={styles.roleLabel}>Lawan bicara</Text>
                  <Text style={styles.roleValue} numberOfLines={1}>
                    {item.partner}
                  </Text>
                </View>
                <View style={styles.roleBlock}>
                  <Text style={styles.roleLabel}>Posisi pengguna</Text>
                  <Text style={styles.roleValue} numberOfLines={1}>
                    {item.userRole}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: {
    // Break out of the parent body padding to overflow the device screen edge-to-edge
    marginLeft: -20,
    marginRight: -20,
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.lg,
    borderWidth: 2,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    shadowColor: '#0A2E44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topicCardSelected: {
    borderColor: colors.navy,
    transform: [{ scale: 1.0 }],
  },
  topicCardUnselected: {
    borderColor: colors.border,
    transform: [{ scale: 0.95 }],
  },
  kicker: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  rolesContainer: {
    width: '100%',
    paddingTop: spacing.md,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  roleBlock: {
    gap: 2,
  },
  roleLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  roleValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
