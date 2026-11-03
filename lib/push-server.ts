
import webpush from 'web-push'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidSubject = process.env.VAPID_SUBJECT

export type DeviceContext = { id: string; token: string }

export type PushSubscriptionInput = {
  id?: string
  endpoint: string
  expirationTime?: number | null
  keys: { p256dh: string; auth: string }
}

export const MAX_ATTEMPTS = 5
export const CLAIM_TTL_SECONDS = 120

export function requireServerConfig() {
  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey ||
    !vapidPrivateKey ||
    !vapidPublicKey ||
    !vapidSubject
  ) {
    throw new Error('Web Push server configuration is incomplete.')
  }

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey,
  )

  return { supabaseUrl, supabaseServiceRoleKey }
}

function headers() {
  return {
    apikey: supabaseServiceRoleKey!,
    Authorization: `Bearer ${supabaseServiceRoleKey!}`,
    'Content-Type': 'application/json',
  }
}

export async function supabase<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = requireServerConfig()

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${path}`,
    {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`)
  }

  return response.status === 204
    ? (undefined as T)
    : response.json()
}

export function deviceFromRequest(request: Request) {
  const id = request.headers.get('x-hydrafold-device-id')
  const token = request.headers.get('x-hydrafold-device-token')

  if (
    !id ||
    !token ||
    id.length > 128 ||
    token.length < 32 ||
    token.length > 256
  ) {
    return null
  }

  return { id, token }
}

export async function hashDeviceToken(token: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )

  return Array.from(
    new Uint8Array(bytes),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function schedulerAuthorized(request: Request) {
  const expected = process.env.SCHEDULER_SECRET

  return Boolean(
    expected &&
      request.headers.get('authorization') === `Bearer ${expected}`,
  )
}

export async function sendPush(
  subscription: PushSubscriptionInput,
  payload: object,
) {
  requireServerConfig()

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: subscription.keys,
    },
    JSON.stringify(payload),
    { TTL: 300 },
  )
}

export function isValidTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 64) return false

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function isValidSchedule(value: unknown) {
  if (!value || typeof value !== 'object') return false

  const schedule = value as Record<string, unknown>

  return (
    typeof schedule.time === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(schedule.time) &&
    Array.isArray(schedule.days) &&
    schedule.days.every(
      (day) =>
        Number.isInteger(day) &&
        Number(day) >= 0 &&
        Number(day) <= 6,
    )
  )
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function randomToken() {
  return (
    crypto.randomUUID().replaceAll('-', '') +
    crypto.randomUUID().replaceAll('-', '')
  )
}

export function isRetryablePushError(error: unknown) {
  const status = (error as { statusCode?: number })?.statusCode

  return (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  )
}

export { vapidPublicKey }

export function occurrenceKey(
  scheduleId: string,
  localDate: string,
  localTime: string,
  timezone: string,
) {
  return `${scheduleId}:${localDate}:${localTime}:${timezone}`
}

export function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>
}

export function dueOccurrences(
  schedules: Array<{
    id: string
    time: string
    days: number[]
    timezone: string
  }>,
  from: Date,
  to: Date,
) {
  const output = new Map<
    string,
    {
      scheduleId: string
      localDate: string
      localTime: string
      timezone: string
      dueAt: string
    }
  >()

  for (
    let cursor = new Date(from);
    cursor < to;
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)
  ) {
    for (const schedule of schedules) {
      const parts = localParts(cursor, schedule.timezone)
      const date = `${parts.year}-${parts.month}-${parts.day}`
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()

      if (
        `${parts.hour}:${parts.minute}` !== schedule.time ||
        !schedule.days.includes(weekday)
      ) {
        continue
      }

      const key = occurrenceKey(
        schedule.id,
        date,
        schedule.time,
        schedule.timezone,
      )

      output.set(key, {
        scheduleId: schedule.id,
        localDate: date,
        localTime: schedule.time,
        timezone: schedule.timezone,
        dueAt: cursor.toISOString(),
      })
    }
  }

  return [...output.values()]
}

export async function claimDelivery(occurrence: {
  scheduleId: string
  localDate: string
  localTime: string
  timezone: string
}) {
  return supabase<{ id: string; claim_token: string }[]>(
    'push_deliveries?on_conflict=schedule_id,local_date,local_time,timezone',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        schedule_id: occurrence.scheduleId,
        local_date: occurrence.localDate,
        local_time: occurrence.localTime,
        timezone: occurrence.timezone,
        status: 'pending',
      }),
    },
  )
}

export async function markDelivery(
  id: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  await supabase(
    `push_deliveries?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status, ...extra }),
    },
  )
}

export async function loadDevice(id: string, token: string) {
  const tokenHash = await hashDeviceToken(token)

  const rows = await supabase<{ id: string }[]>(
    `push_devices?id=eq.${encodeURIComponent(id)}` +
      `&device_token_hash=eq.${encodeURIComponent(tokenHash)}` +
      '&active=eq.true&select=id',
  )

  return rows[0] ?? null
}

export async function loadSubscriptions(deviceId: string) {
  return supabase<PushSubscriptionInput[]>(
    `push_subscriptions?device_id=eq.${encodeURIComponent(deviceId)}` +
      '&active=eq.true&select=id,endpoint,expirationTime:expiration_time,keys',
  )
}

export async function loadSchedules(deviceId: string) {
  return supabase<
    {
      id: string
      time: string
      days: number[]
      timezone: string
    }[]
  >(
    `push_schedules?device_id=eq.${encodeURIComponent(deviceId)}` +
      '&active=eq.true&select=id,time,days,timezone',
  )
}

export async function processDueDelivery(delivery: {
  id: string
  device_id: string
  schedule_id: string
  attempt_count: number
  max_attempts: number
}) {
  const subscriptions = await loadSubscriptions(delivery.device_id)
  let succeeded = 0

  for (const subscription of subscriptions) {
    if (!subscription.id) continue

    const targetPath =
      `push_delivery_targets?delivery_id=eq.${encodeURIComponent(delivery.id)}` +
      `&subscription_id=eq.${encodeURIComponent(subscription.id)}`

    // Buat target jika belum ada.
    await supabase(
      'push_delivery_targets?on_conflict=delivery_id,subscription_id',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({
          delivery_id: delivery.id,
          subscription_id: subscription.id,
          endpoint: subscription.endpoint,
          status: 'pending',
          attempt_count: 0,
        }),
      },
    )

    // Klaim target agar scheduler lain tidak mengirim target yang sama.
    const claimToken = crypto.randomUUID()
    const now = new Date()
    const claimUntil = new Date(
      now.getTime() + CLAIM_TTL_SECONDS * 1000,
    )

    const claimed = await supabase<{ attempt_count: number }[]>(
      targetPath +
        '&or=(status.eq.pending,status.eq.retryable,' +
        `and(status.eq.processing,claim_until.lt.${encodeURIComponent(now.toISOString())}))` +
        `&attempt_count=lt.${delivery.max_attempts}` +
        '&select=attempt_count',
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          status: 'processing',
          claim_token: claimToken,
          claim_until: claimUntil.toISOString(),
          attempt_count: 1,
        }),
      },
    )

    if (!claimed.length) continue

    const attemptCount = claimed[0].attempt_count

    try {
      await sendPush(subscription, {
        type: 'reminder',
        scheduleId: delivery.schedule_id,
      })

      await supabase(
        targetPath +
          `&claim_token=eq.${encodeURIComponent(claimToken)}` +
          '&status=eq.processing',
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            status: 'sent',
            sent_at: new Date().toISOString(),
            claim_token: null,
            claim_until: null,
            last_error: null,
          }),
        },
      )

      succeeded++
    } catch (error) {
      const retryable = isRetryablePushError(error)
      const message =
        error instanceof Error ? error.message : String(error)

      const canRetry =
        retryable && attemptCount < delivery.max_attempts

      await supabase(
        targetPath +
          `&claim_token=eq.${encodeURIComponent(claimToken)}` +
          '&status=eq.processing',
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            status: canRetry ? 'retryable' : 'failed',
            claim_token: null,
            claim_until: null,
            last_error: message.slice(0, 1000),
          }),
        },
      )
    }
  }

  return succeeded
}
