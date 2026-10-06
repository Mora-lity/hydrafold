import { BookOpen, ChartColumn, House, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Beranda', icon: House },
  { href: '/riwayat', label: 'Riwayat', icon: ChartColumn },
  { href: '/edukasi', label: 'Edukasi', icon: BookOpen },
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
] as const
