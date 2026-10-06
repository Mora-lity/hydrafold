import type { ActivityLevel, DrinkLog, HydraState, Profile, ReminderSettings } from './store'

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'rendah', label: 'Rendah', description: 'Banyak duduk, kuliah/kerja di dalam ruangan' },
  { value: 'sedang', label: 'Sedang', description: 'Sering berjalan atau olahraga ringan' },
  { value: 'tinggi', label: 'Tinggi', description: 'Olahraga rutin atau aktivitas fisik berat' },
]

const ACTIVITY_BONUS: Record<ActivityLevel, number> = {
  rendah: 0,
  sedang: 350,
  tinggi: 700,
}

export const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function recommendedGoal(profile: Pick<Profile, 'weightKg' | 'activity'>) {
  const base = profile.weightKg * 33 + ACTIVITY_BONUS[profile.activity]
  return Math.round(base / 50) * 50
}

export function dailyGoal(state: HydraState) {
  if (state.customGoalMl) return state.customGoalMl
  if (!state.profile) return 2000
  return recommendedGoal(state.profile)
}

export function dayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function logsForDay(logs: DrinkLog[], date: Date) {
  const key = dayKey(date)
  return logs.filter((log) => dayKey(new Date(log.timestamp)) === key)
}

export function totalForDay(logs: DrinkLog[], date: Date) {
  return logsForDay(logs, date).reduce((sum, log) => sum + log.amountMl, 0)
}

export function formatMl(ml: number) {
  if (ml >= 1000) {
    const liters = ml / 1000
    return `${liters.toLocaleString('id-ID', { maximumFractionDigits: 2 })} L`
  }
  return `${ml.toLocaleString('id-ID')} ml`
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function atMinutes(base: Date, minutes: number) {
  const d = new Date(base)
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

/** All reminder times for the given date (empty if the day is inactive). */
export function reminderSlotsForDay(reminder: ReminderSettings, date: Date) {
  if (!reminder.enabled || !reminder.days.includes(date.getDay())) return []
  const start = toMinutes(reminder.startTime)
  const end = toMinutes(reminder.endTime)
  const interval = Math.max(15, reminder.intervalMin)
  if (end <= start) return []
  const slots: Date[] = []
  for (let m = start; m <= end; m += interval) slots.push(atMinutes(date, m))
  return slots
}

export function nextReminder(reminder: ReminderSettings, now: Date): Date | null {
  if (!reminder.enabled || reminder.days.length === 0) return null
  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(now)
    day.setDate(now.getDate() + offset)
    const upcoming = reminderSlotsForDay(reminder, day).find((slot) => slot > now)
    if (upcoming) return upcoming
  }
  return null
}

export function describeReminderDay(target: Date, now: Date) {
  const today = dayKey(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const key = dayKey(target)
  if (key === today) return 'Hari ini'
  if (key === dayKey(tomorrow)) return 'Besok'
  return DAY_NAMES[target.getDay()]
}
