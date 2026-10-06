import type { Metadata } from 'next'
import { Settings } from '@/components/hydra/settings/settings'

export const metadata: Metadata = {
  title: 'Pengaturan — HydraFold',
}

export default function PengaturanPage() {
  return <Settings />
}
