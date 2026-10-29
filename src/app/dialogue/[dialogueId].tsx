import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppRuntime } from '../../bootstrap/AppBootstrap';
import { DialogueRunScreen } from '../../features/dialogues/presentation/DialogueRunScreen';

export default function DialogueRoute() {
  const router = useRouter();
  const { dialogueId } = useLocalSearchParams<{ dialogueId: string }>();
  const { profile } = useAppRuntime();

  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';

  if (!dialogueId) {
    router.back();
    return null;
  }

  return (
    <DialogueRunScreen
      packageId={packageId}
      dialogueId={dialogueId}
      onExit={() => router.back()}
    />
  );
}
