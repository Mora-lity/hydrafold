import type { Metadata } from 'next'
import { History } from '@/components/hydra/history/history'

export const metadata: Metadata = {
  title: 'Riwayat Minum — HydraFold',
}

export default function RiwayatPage() {
  return <History />
}
