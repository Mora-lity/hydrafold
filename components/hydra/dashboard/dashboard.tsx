'use client'

import { useNow } from '@/hooks/use-now'
import { dailyGoal, formatLongDate, greeting, logsForDay } from '@/lib/hydration'
import { useHydraState } from '@/lib/store'
import { HydrationSummary } from './hydration-summary'
import { QuickAdd } from './quick-add'
import { TodayLog } from './today-log'

export function Dashboard() {
  const state = useHydraState()
  const now = useNow()
  if (!state?.profile) return null

  const goal = dailyGoal(state)
  const todayLogs = logsForDay(state.logs, now)
  const consumed = todayLogs.reduce((sum, log) => sum + log.amountMl, 0)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{formatLongDate(now)}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance text-foreground md:text-3xl">
          {greeting(now)}, {state.profile.name}!
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <HydrationSummary
          className="lg:col-span-3"
          consumed={consumed}
          goal={goal}
          reminder={state.reminder}
          now={now}
        />
        <QuickAdd className="lg:col-span-2" bottleMl={state.profile.bottleMl} />
      </div>

      <TodayLog logs={todayLogs} />
    </div>
  )
}
