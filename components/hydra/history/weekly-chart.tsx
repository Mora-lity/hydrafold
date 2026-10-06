'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DAY_LABELS, formatMl, totalForDay } from '@/lib/hydration'
import type { DrinkLog } from '@/lib/store'
import { formatVolumeTick, volumeTicks } from './axis'
import { PeriodNav } from './period-nav'

const config = {
  total: { label: 'Diminum', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function WeeklyChart({ logs, goal }: { logs: DrinkLog[]; goal: number }) {
  const [weekOffset, setWeekOffset] = useState(0)

  const end = new Date()
  end.setDate(end.getDate() - weekOffset * 7)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end)
    d.setDate(end.getDate() - (6 - i))
    return d
  })
  const data = days.map((d) => ({
    day: `${DAY_LABELS[d.getDay()]} ${d.getDate()}`,
    total: totalForDay(logs, d),
  }))
  const weekTotal = data.reduce((sum, d) => sum + d.total, 0)
  const ticks = volumeTicks(Math.max(...data.map((d) => d.total)), goal)
  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const label = weekOffset === 0 ? '7 hari terakhir' : `${fmt(days[0])} – ${fmt(days[6])}`

  return (
    <section aria-labelledby="weekly-heading" className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="weekly-heading" className="text-base font-semibold text-foreground">
            Konsumsi mingguan
          </h2>
          <p className="text-xs text-muted-foreground">
            Total {formatMl(weekTotal)} · garis putus-putus = target {formatMl(goal)}
          </p>
        </div>
        <PeriodNav
          label={label}
          onPrev={() => setWeekOffset((w) => w + 1)}
          onNext={() => setWeekOffset((w) => Math.max(0, w - 1))}
          canNext={weekOffset > 0}
          prevLabel="Minggu sebelumnya"
          nextLabel="Minggu berikutnya"
        />
      </div>
      <ChartContainer config={config} className="mt-4 aspect-auto h-64 w-full md:h-72">
        <BarChart data={data} margin={{ left: -12, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            fontSize={11}
            tickFormatter={formatVolumeTick}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)' }}
            content={<ChartTooltipContent formatter={(value) => formatMl(Number(value))} />}
          />
          <ReferenceLine y={goal} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 4, 4]} maxBarSize={40} />
        </BarChart>
      </ChartContainer>
    </section>
  )
}
