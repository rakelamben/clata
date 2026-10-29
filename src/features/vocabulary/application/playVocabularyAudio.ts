import type { AudioPort } from '../../../infrastructure/audio/AudioPort';
import type { AudioReference } from '../domain/vocabularyTypes';

export async function playVocabularyAudio(audio: AudioPort, reference: AudioReference | null, uri: string | number | null, itemId: string): Promise<void> {
  if (!reference || reference.status !== 'verified' || !uri) throw new Error('Audio tidak tersedia.');
  await audio.play({ itemId, uri, format: reference.format });
}
