export type PushSubscriptionPayload = {
  endpoint: string
  expirationTime: number | null
  keys: { p256dh: string; auth: string }
}

export function supportsWebPush() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
}

export function base64UrlToBytes(value: string) {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`
  const binary = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function serializePushSubscription(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error('Subscription Web Push tidak lengkap.')
  }
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  }
}

const DEVICE_STORAGE_KEY = 'hydrafold:push-device:v1'

type DeviceCredentials = { deviceId: string; deviceToken: string }

function readDeviceCredentials(): DeviceCredentials | null {
  try {
    const raw = window.localStorage.getItem(DEVICE_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<DeviceCredentials>
    return typeof value.deviceId === 'string' && typeof value.deviceToken === 'string' ? value as DeviceCredentials : null
  } catch {
    return null
  }
}

function saveDeviceCredentials(credentials: DeviceCredentials) {
  window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(credentials))
}

function pushHeaders(credentials: DeviceCredentials) {
  return { 'Content-Type': 'application/json', 'x-hydrafold-device-id': credentials.deviceId, 'x-hydrafold-device-token': credentials.deviceToken }
}

async function pushRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(path, { ...init, headers: { ...pushHeaders(readDeviceCredentials()!), ...(init.headers ?? {}) } })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? 'Permintaan Web Push gagal.')
  }
  return response
}

async function ensureDevice() {
  const existing = readDeviceCredentials()
  if (existing) return existing
  const response = await fetch('/api/push/device', { method: 'POST' })
  if (!response.ok) throw new Error('Perangkat Web Push gagal didaftarkan.')
  const credentials = await response.json() as DeviceCredentials
  saveDeviceCredentials(credentials)
  return credentials
}

export async function registerPushSubscription() {
  if (!supportsWebPush()) throw new Error('Browser ini belum mendukung Notification, PushManager, atau service worker.')
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
  if (permission === 'denied') throw new Error('Izin notifikasi ditolak. Izinkan notifikasi HydraFold melalui pengaturan situs browser.')
  if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.')
  const vapidPublicKey = getVapidPublicKey()
  if (!vapidPublicKey) throw new Error('Kunci publik Web Push belum dikonfigurasi.')
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(vapidPublicKey),
  })
  const credentials = await ensureDevice()
  await pushRequest('/api/push/subscription', { method: 'POST', headers: { ...pushHeaders(credentials) }, body: JSON.stringify(serializePushSubscription(subscription)) })
  return serializePushSubscription(subscription)
}

export async function syncPushSchedule(settings: { id: string; time: string; enabled: boolean }[], days: number[], timezone: string) {
  const credentials = readDeviceCredentials()
  if (!credentials) throw new Error('Aktifkan notifikasi push terlebih dahulu sebelum menyimpan jadwal ke backend.')
  const currentIds = new Set(settings.map((schedule) => schedule.id))
  const storedIds = readStoredScheduleIds()
  await Promise.all([
    ...settings.map((schedule) => pushRequest('/api/push/schedule', { method: 'PUT', headers: pushHeaders(credentials), body: JSON.stringify({ ...schedule, days, timezone }) })),
    ...storedIds.filter((id) => !currentIds.has(id)).map((id) => pushRequest('/api/push/schedule', { method: 'DELETE', headers: pushHeaders(credentials), body: JSON.stringify({ id }) })),
  ])
  try { window.localStorage.setItem('hydrafold:push-schedule-ids:v1', JSON.stringify([...currentIds])) } catch { /* Local storage is optional for server synchronization. */ }
  return true
}

function readStoredScheduleIds() {
  try {
    const value = JSON.parse(window.localStorage.getItem('hydrafold:push-schedule-ids:v1') ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

export async function revokePushDevice() {
  const credentials = readDeviceCredentials()
  if (credentials) await fetch('/api/push/device', { method: 'DELETE', headers: pushHeaders(credentials) })
  const unsubscribed = await unregisterPushSubscription()
  try { window.localStorage.removeItem(DEVICE_STORAGE_KEY) } catch { /* Storage may be blocked. */ }
  return unsubscribed
}

export async function unregisterPushSubscription() {
  if (!supportsWebPush()) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return subscription ? subscription.unsubscribe() : false
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  return supportsWebPush() ? Notification.permission : 'unsupported'
}

export type ScheduledOccurrence = {
  scheduleId: string
  localDate: string
  localTime: string
  timezone: string
  instant: Date
}

type Schedule = { id: string; time: string; enabled: boolean; days?: number[] }

const timePattern = /^(?:[01]\\d|2[0-3]):[0-5]\\d$/

function partsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value])) as Record<string, string>
}

function localDateKey(date: Date, timezone: string) {
  const parts = partsInTimezone(date, timezone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function occurrenceKey(occurrence: Pick<ScheduledOccurrence, 'scheduleId' | 'localDate' | 'localTime' | 'timezone'>) {
  return `${occurrence.scheduleId}:${occurrence.localDate}:${occurrence.localTime}:${occurrence.timezone}`
}

export function occurrencesInWindow(
  schedules: Schedule[],
  timezone: string,
  from: Date,
  to: Date,
): ScheduledOccurrence[] {
  if (!timezone || from >= to) return []
  const output = new Map<string, ScheduledOccurrence>()
  const cursor = new Date(from)
  cursor.setUTCMinutes(cursor.getUTCMinutes() - 1)
  while (cursor < to) {
    const parts = partsInTimezone(cursor, timezone)
    const localTime = `${parts.hour}:${parts.minute}`
    const localDate = `${parts.year}-${parts.month}-${parts.day}`
    const weekday = new Date(`${localDate}T12:00:00Z`).getUTCDay()
    for (const schedule of schedules) {
      if (!schedule.enabled || !timePattern.test(schedule.time) || schedule.time !== localTime) continue
      if (schedule.days && !schedule.days.includes(weekday)) continue
      const occurrence = { scheduleId: schedule.id, localDate, localTime, timezone, instant: new Date(cursor) }
      output.set(occurrenceKey(occurrence), occurrence)
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)
  }
  return [...output.values()]
}
