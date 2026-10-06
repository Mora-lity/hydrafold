'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatMl, logsForDay } from '@/lib/hydration'
import type { DrinkLog } from '@/lib/store'
import { formatVolumeTick, volumeTicks } from './axis'
import { PeriodNav } from './period-nav'

const config = {
  cumulative: { label: 'Kumulatif', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function DailyChart({ logs, goal }: { logs: DrinkLog[]; goal: number }) {
  const [dayOffset, setDayOffset] = useState(0)

  const date = new Date()
  date.setDate(date.getDate() - dayOffset)
  const dayLogs = logsForDay(logs, date)

  const perHour = Array.from({ length: 24 }, () => 0)
  for (const log of dayLogs) perHour[new Date(log.timestamp).getHours()] += log.amountMl

  const currentHour = new Date().getHours()
  const lastHour = dayOffset === 0 ? currentHour : 23
  let running = 0
  const data = perHour.slice(0, lastHour + 1).map((amount, hour) => {
    running += amount
    return { hour: `${String(hour).padStart(2, '0')}:00`, cumulative: running }
  })
  const ticks = volumeTicks(running, goal)

  const label =
    dayOffset === 0
      ? 'Hari ini'
      : dayOffset === 1
        ? 'Kemarin'
        : date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <section aria-labelledby="daily-heading" className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="daily-heading" className="text-base font-semibold text-foreground">
            Konsumsi harian
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatMl(running)} dari target {formatMl(goal)} · {dayLogs.length} kali minum
          </p>
        </div>
        <PeriodNav
          label={label}
          onPrev={() => setDayOffset((d) => d + 1)}
          onNext={() => setDayOffset((d) => Math.max(0, d - 1))}
          canNext={dayOffset > 0}
          prevLabel="Hari sebelumnya"
          nextLabel="Hari berikutnya"
        />
      </div>
      <ChartContainer config={config} className="mt-4 aspect-auto h-64 w-full md:h-72">
        <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={24} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            fontSize={11}
                tickFormatter={formatVolumeTick}
                ticks={ticks}
                domain={[0, ticks[ticks.length - 1]]}
          />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMl(Number(value))} />} />
          <ReferenceLine y={goal} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Area
            type="stepAfter"
            dataKey="cumulative"
            stroke="var(--color-cumulative)"
            strokeWidth={2}
            fill="url(#fillCumulative)"
          />
        </AreaChart>
      </ChartContainer>
    </section>
  )
}
