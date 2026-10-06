import { CalendarCheck, Flame, TrendingUp } from 'lucide-react'
import { formatMl, totalForDay } from '@/lib/hydration'
import type { DrinkLog } from '@/lib/store'

function lastNDays(n: number) {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    return d
  })
}

export function HistoryStats({ logs, goal }: { logs: DrinkLog[]; goal: number }) {
  const week = lastNDays(7).map((d) => totalForDay(logs, d))
  const average = Math.round(week.reduce((a, b) => a + b, 0) / 7)
  const metDays = week.filter((total) => total >= goal).length

  let streak = 0
  const days = lastNDays(365)
  // Today still in progress: don't break the streak if today's goal isn't met yet.
  const startIndex = totalForDay(logs, days[0]) >= goal ? 0 : 1
  for (let i = startIndex; i < days.length; i++) {
    if (totalForDay(logs, days[i]) >= goal) streak++
    else break
  }

  const items = [
    { icon: TrendingUp, label: 'Rata-rata 7 hari', value: formatMl(average) },
    { icon: CalendarCheck, label: 'Target tercapai', value: `${metDays}/7 hari` },
    { icon: Flame, label: 'Rentetan', value: `${streak} hari` },
  ]

  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-3 shadow-sm md:p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="leading-tight text-pretty">{label}</span>
          </dt>
          <dd className="mt-1 text-base font-bold text-foreground tabular-nums md:text-xl">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
