import { AppShell } from '@/components/hydra/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
