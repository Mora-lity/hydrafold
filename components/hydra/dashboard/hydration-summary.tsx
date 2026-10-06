import { BellOff, BellRing, Droplets, Target } from 'lucide-react'
import Link from 'next/link'
import { describeReminderDay, formatMl, formatTime, nextReminder } from '@/lib/hydration'
import type { ReminderSettings } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ProgressRing } from '../progress-ring'

function statusMessage(ratio: number) {
  if (ratio >= 1) return 'Target hari ini tercapai. Luar biasa!'
  if (ratio >= 0.75) return 'Sedikit lagi! Pertahankan ritmenya.'
  if (ratio >= 0.4) return 'Sudah setengah jalan, terus lanjutkan.'
  if (ratio > 0) return 'Awal yang bagus. Minum sedikit demi sedikit.'
  return 'Belum ada catatan hari ini. Yuk mulai dengan segelas air.'
}

export function HydrationSummary({
  consumed,
  goal,
  reminder,
  now,
  className,
}: {
  consumed: number
  goal: number
  reminder: ReminderSettings
  now: Date
  className?: string
}) {
  const remaining = Math.max(goal - consumed, 0)
  const next = nextReminder(reminder, now)

  return (
    <section
      aria-labelledby="progress-heading"
      className={cn('rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6', className)}
    >
      <h2 id="progress-heading" className="sr-only">
        Progres hidrasi hari ini
      </h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="w-full max-w-56 shrink-0 sm:w-56">
          <ProgressRing consumed={consumed} goal={goal} />
        </div>
        <div className="flex w-full flex-col gap-3">
          <p className="text-center text-sm font-medium text-foreground sm:text-left" aria-live="polite">
            {statusMessage(goal ? consumed / goal : 0)}
          </p>
          <dl className="grid grid-cols-2 gap-3">
            <Stat icon={Target} label="Target harian" value={formatMl(goal)} />
            <Stat icon={Droplets} label="Sudah diminum" value={formatMl(consumed)} />
          </dl>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3 text-secondary-foreground">
            {next ? (
              <BellRing className="size-5 shrink-0" aria-hidden="true" />
            ) : (
              <BellOff className="size-5 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs opacity-80">Pengingat berikutnya</p>
              <p className="text-sm font-semibold">
                {next ? `${describeReminderDay(next, now)}, ${formatTime(next)}` : 'Pengingat nonaktif'}
              </p>
            </div>
            <Link
              href="/pengaturan#pengingat"
              className="shrink-0 text-xs font-semibold underline-offset-4 hover:underline"
            >
              Atur
            </Link>
          </div>
          {remaining > 0 && (
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Sisa {formatMl(remaining)} lagi untuk mencapai target.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-lg font-bold text-foreground tabular-nums">{value}</dd>
    </div>
  )
}
