import type { Metadata } from 'next'
import { Dashboard } from '@/components/hydra/dashboard/dashboard'

export const metadata: Metadata = {
  title: 'Beranda — HydraFold',
}

export default function DashboardPage() {
  return <Dashboard />
}
