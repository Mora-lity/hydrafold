'use client'

import { useSyncExternalStore } from 'react'

export type ActivityLevel = 'rendah' | 'sedang' | 'tinggi'

export type Profile = {
  name: string
  weightKg: number
  activity: ActivityLevel
  startTime: string
  endTime: string
  bottleMl: number
}

export type ReminderSchedule = {
  id: string
  time: string
  enabled: boolean
  days?: number[]
}

export type ReminderSettings = {
  enabled: boolean
  startTime: string
  endTime: string
  intervalMin: number
  days: number[]
  timezone?: string
  schedules?: ReminderSchedule[]
  migrationNeedsReview?: boolean
}

export type DrinkLog = {
  id: string
  amountMl: number
  timestamp: number
}

export type HydraState = {
  profile: Profile | null
  customGoalMl: number | null
  reminder: ReminderSettings
  logs: DrinkLog[]
}

const STORAGE_KEY = 'hydrafold:data:v1'

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: true,
  startTime: '07:00',
  endTime: '21:00',
  intervalMin: 60,
  days: [1, 2, 3, 4, 5],
  timezone: undefined,
  schedules: [
    { id: 'default-07-00', time: '07:00', enabled: true },
    { id: 'default-08-00', time: '08:00', enabled: true },
    { id: 'default-09-00', time: '09:00', enabled: true },
    { id: 'default-10-00', time: '10:00', enabled: true },
    { id: 'default-11-00', time: '11:00', enabled: true },
    { id: 'default-12-00', time: '12:00', enabled: true },
    { id: 'default-13-00', time: '13:00', enabled: true },
    { id: 'default-14-00', time: '14:00', enabled: true },
    { id: 'default-15-00', time: '15:00', enabled: true },
    { id: 'default-16-00', time: '16:00', enabled: true },
    { id: 'default-17-00', time: '17:00', enabled: true },
    { id: 'default-18-00', time: '18:00', enabled: true },
    { id: 'default-19-00', time: '19:00', enabled: true },
    { id: 'default-20-00', time: '20:00', enabled: true },
    { id: 'default-21-00', time: '21:00', enabled: true },
  ],
}

function migrateReminder(input: Partial<ReminderSettings> | undefined): ReminderSettings {
  const reminder = { ...DEFAULT_REMINDER, ...input }
  if (Array.isArray(input?.schedules)) return reminder
  const start = Number(input?.startTime?.split(':')[0])
  const end = Number(input?.endTime?.split(':')[0])
  const interval = Number(input?.intervalMin)
  const schedules: ReminderSchedule[] = []
  if (Number.isInteger(start) && Number.isInteger(end) && interval >= 15 && end >= start && end <= 23) {
    for (let minutes = start * 60; minutes <= end * 60; minutes += interval) {
      const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      schedules.push({ id: `migrated-${time.replace(':', '-')}`, time, enabled: true })
    }
  }
  return { ...reminder, schedules: schedules.length ? schedules : [{ id: 'review-07-00', time: '07:00', enabled: false }], migrationNeedsReview: true }
}

const DEFAULT_STATE: HydraState = {
  profile: null,
  customGoalMl: null,
  reminder: DEFAULT_REMINDER,
  logs: [],
}

let state: HydraState = DEFAULT_STATE
let loaded = false
const listeners = new Set<() => void>()

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<HydraState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      reminder: migrateReminder(parsed.reminder),
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    }
  } catch {
    return DEFAULT_STATE
  }
}

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return
  state = readFromStorage()
  loaded = true
}

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  ensureLoaded()
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    state = readFromStorage()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot() {
  ensureLoaded()
  return state
}

function getServerSnapshot(): HydraState | null {
  return null
}

export function setHydraState(updater: (prev: HydraState) => HydraState) {
  ensureLoaded()
  state = updater(state)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage may be full or blocked (private mode); keep in-memory state.
  }
  emit()
}

/** Returns null during SSR / before localStorage is read. */
export function useHydraState(): HydraState | null {
  return useSyncExternalStore<HydraState | null>(subscribe, getSnapshot, getServerSnapshot)
}

export function saveProfile(profile: Profile) {
  setHydraState((prev) => ({
    ...prev,
    profile,
    reminder: prev.profile
      ? prev.reminder
      : { ...prev.reminder, startTime: profile.startTime, endTime: profile.endTime },
  }))
}

export function setCustomGoal(goalMl: number | null) {
  setHydraState((prev) => ({ ...prev, customGoalMl: goalMl }))
}

export function updateReminder(reminder: ReminderSettings) {
  setHydraState((prev) => ({ ...prev, reminder }))
}

export function addDrink(amountMl: number) {
  const log: DrinkLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amountMl,
    timestamp: Date.now(),
  }
  setHydraState((prev) => ({ ...prev, logs: [...prev.logs, log] }))
  return log
}

export function removeDrink(id: string) {
  setHydraState((prev) => ({ ...prev, logs: prev.logs.filter((log) => log.id !== id) }))
}

export function resetAllData() {
  setHydraState(() => DEFAULT_STATE)
}
