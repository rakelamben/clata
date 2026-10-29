import { router } from 'expo-router';

import { ScreenShell } from '../../ui/ScreenShell';
import { useAppRuntime } from '../../bootstrap/AppBootstrap';
import { DataProgressView } from '../../features/settings/presentation/DataProgressView';

export default function DataProgressScreen() {
  const { container } = useAppRuntime();

  return (
    <ScreenShell
      title="Data dan Progres"
      description="Kelola penyimpanan lokal dan progres belajar."
    >
      <DataProgressView
        container={container}
        onClearAllComplete={() => {
          router.replace('/');
        }}
      />
    </ScreenShell>
  );
}
