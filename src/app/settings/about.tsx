import { ScreenShell } from '../../ui/ScreenShell';
import { useAppRuntime } from '../../bootstrap/AppBootstrap';
import { AboutView } from '../../features/settings/presentation/AboutView';

export default function AboutScreen() {
  const { container } = useAppRuntime();

  return (
    <ScreenShell
      title="Tentang Clata"
      description="Informasi aplikasi, lisensi konten, kepatuhan batas usia, dan kanal pengaduan."
    >
      <AboutView container={container} />
    </ScreenShell>
  );
}
