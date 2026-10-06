'use client'

import { Droplet, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMl, formatTime } from '@/lib/hydration'
import { removeDrink, type DrinkLog } from '@/lib/store'

export function TodayLog({ logs }: { logs: DrinkLog[] }) {
  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <section aria-labelledby="today-log-heading" className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="today-log-heading" className="text-base font-semibold text-foreground">
          Catatan hari ini
        </h2>
        <span className="text-xs text-muted-foreground">{logs.length} kali minum</span>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada catatan. Gunakan tombol di atas untuk mencatat minum pertama Anda.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {sorted.map((log) => (
            <li key={log.id} className="flex items-center gap-3 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">
                <Droplet className="size-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-semibold text-foreground tabular-nums">{formatMl(log.amountMl)}</span>
              <time className="text-sm text-muted-foreground tabular-nums" dateTime={new Date(log.timestamp).toISOString()}>
                {formatTime(new Date(log.timestamp))}
              </time>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeDrink(log.id)}
                aria-label={`Hapus catatan ${formatMl(log.amountMl)} pukul ${formatTime(new Date(log.timestamp))}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
