'use client'

import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Ikuti sistem', icon: Laptop },
]

const noop = () => () => {}

export function ThemeSection() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(noop, () => true, () => false)

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-3">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:border-primary/40',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
