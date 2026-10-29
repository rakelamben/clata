import RemixIcon from 'react-native-remix-icon';
import { ActivityIndicator, StyleSheet } from 'react-native';

import type { AudioPort } from '../../../infrastructure/audio/AudioPort';
import type { AudioPlaybackState } from '../../../infrastructure/audio/audioTypes';
import { playVocabularyAudio } from '../application/playVocabularyAudio';
import type { AudioReference } from '../domain/vocabularyTypes';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, touchTarget } from '../../../ui/theme';

type Props = {
  wordId: string;
  wordLabel: string;
  reference: AudioReference | null;
  uri?: string | number | null;
  audio: AudioPort;
  state: AudioPlaybackState;
  onStateChange: (state: AudioPlaybackState) => void;
  onUnavailable?: () => void;
};

export function AudioToggle({
  wordId,
  wordLabel,
  reference,
  uri,
  audio,
  state,
  onStateChange,
  onUnavailable,
}: Props) {
  const isAvailable = Boolean(reference && reference.status === 'verified' && uri);
  const isPlaying = state === 'playing' && audio.getActiveItemId() === wordId;
  const isLoading = state === 'loading' && audio.getActiveItemId() === wordId;

  const handlePress = () => {
    if (!isAvailable) {
      onUnavailable?.();
      return;
    }

    if (isPlaying) {
      void audio.stop().then(() => onStateChange(audio.getState())).catch(() => onStateChange('error'));
      return;
    }

    if (reference && uri) {
      onStateChange('loading');
      void playVocabularyAudio(audio, reference, uri, wordId)
        .then(() => onStateChange(audio.getState()))
        .catch(() => onStateChange('error'));
    }
  };

  const accessibilityLabel = !isAvailable
    ? `Audio kata ${wordLabel} tidak tersedia`
    : isPlaying
      ? `Hentikan audio ${wordLabel}`
      : `Putar audio ${wordLabel}`;

  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: isLoading, selected: isPlaying }}
      ringRadius={touchTarget / 2}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        isPlaying && styles.buttonPlaying,
        !isAvailable && styles.buttonUnavailable,
        pressed && styles.buttonPressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : isPlaying ? (
        <RemixIcon name="volume-up-fill" size={22} color={colors.surface} accessible={false} />
      ) : !isAvailable ? (
        <RemixIcon name="volume-mute-line" size={20} color={colors.borderStrong} accessible={false} />
      ) : (
        <RemixIcon name="volume-up-line" size={22} color={colors.navy} accessible={false} />
      )}
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyTint,
  },
  buttonPlaying: {
    backgroundColor: colors.primary,
  },
  buttonUnavailable: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
