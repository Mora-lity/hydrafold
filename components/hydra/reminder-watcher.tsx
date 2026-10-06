'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useNow } from '@/hooks/use-now'
import { formatTime, reminderSlotsForDay } from '@/lib/hydration'
import { addDrink, type ReminderSettings } from '@/lib/store'

/**
 * In-app reminder: only fires while this tab is open. It never claims to
 * notify the user once the website is closed.
 */
export function ReminderWatcher({ reminder }: { reminder: ReminderSettings }) {
  const now = useNow(15_000)
  const lastChecked = useRef<Date>(new Date())

  useEffect(() => {
    const previous = lastChecked.current
    lastChecked.current = now
    const due = reminderSlotsForDay(reminder, now).filter((slot) => slot > previous && slot <= now)
    if (due.length === 0) return
    const slot = due[due.length - 1]
    toast.info(`Waktunya minum air (${formatTime(slot)})`, {
      description: 'Ambil botolmu dan minum beberapa teguk.',
      duration: 15_000,
      action: {
        label: 'Catat 250 ml',
        onClick: () => {
          addDrink(250)
          toast.success('250 ml tercatat')
        },
      },
    })
  }, [now, reminder])

  return null
}
