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

export async function registerPushSubscription() {
  if (!supportsWebPush()) throw new Error('Browser ini belum mendukung Web Push.')
  const vapidPublicKey = getVapidPublicKey()
  if (!vapidPublicKey) throw new Error('Kunci publik Web Push belum dikonfigurasi.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Izin notifikasi tidak diberikan.')
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(vapidPublicKey),
  })
  return serializePushSubscription(subscription)
}

export async function unregisterPushSubscription() {
  if (!supportsWebPush()) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return subscription ? subscription.unsubscribe() : false
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
