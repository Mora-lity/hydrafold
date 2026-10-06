'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dailyGoal } from '@/lib/hydration'
import { useHydraState } from '@/lib/store'
import { DailyChart } from './daily-chart'
import { HistoryStats } from './history-stats'
import { WeeklyChart } from './weekly-chart'

export function History() {
  const state = useHydraState()
  if (!state?.profile) return null
  const goal = dailyGoal(state)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Riwayat minum</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lihat pola konsumsi air harian dan mingguan Anda.</p>
      </header>

      <HistoryStats logs={state.logs} goal={goal} />

      <Tabs defaultValue="mingguan" className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="mingguan" className="flex-1 sm:flex-none">
            Mingguan
          </TabsTrigger>
          <TabsTrigger value="harian" className="flex-1 sm:flex-none">
            Harian
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mingguan">
          <WeeklyChart logs={state.logs} goal={goal} />
        </TabsContent>
        <TabsContent value="harian">
          <DailyChart logs={state.logs} goal={goal} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
