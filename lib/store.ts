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

export type ReminderSettings = {
  enabled: boolean
  startTime: string
  endTime: string
  intervalMin: number
  days: number[]
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
      reminder: { ...DEFAULT_REMINDER, ...parsed.reminder },
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
