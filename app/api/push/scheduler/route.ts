
import {
  dueOccurrences,
  jsonError,
  processDueDelivery,
  randomToken,
  schedulerAuthorized,
  supabase,
  MAX_ATTEMPTS,
} from '@/lib/push-server'

export async function POST(request: Request) {
  if (!schedulerAuthorized(request)) {
    return jsonError('Unauthorized.', 401)
  }

  const now = new Date()
  const from = new Date(now.getTime() - 15 * 60_000)
  let processed = 0

  try {
    const schedules = await supabase<
      {
        id: string
        device_id: string
        time: string
        days: number[]
        timezone: string
      }[]
    >(
      'push_schedules?active=eq.true&select=id,device_id,time,days,timezone',
    )

    for (const schedule of schedules) {
      const occurrences = dueOccurrences([schedule], from, now)

      for (const occurrence of occurrences) {
        const rows = await supabase<
          {
            id: string
            device_id: string
            schedule_id: string
            attempt_count: number
            max_attempts: number
          }[]
        >(
          'push_deliveries?on_conflict=schedule_id,local_date,local_time,timezone',
          {
            method: 'POST',
            headers: {
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify({
              schedule_id: occurrence.scheduleId,
              device_id: schedule.device_id,
              local_date: occurrence.localDate,
              local_time: occurrence.localTime,
              timezone: occurrence.timezone,
              max_attempts: MAX_ATTEMPTS,
            }),
          },
        )

        const delivery = rows[0]
        if (!delivery || delivery.attempt_count >= delivery.max_attempts) {
          continue
        }

        // Claim the delivery atomically. Only one scheduler request can
        // successfully change the current attempt into "processing".
        const claimToken = crypto.randomUUID()
        const claimUntil = new Date(now.getTime() + 120_000)

        const claimed = await supabase<
          { id: string; attempt_count: number; max_attempts: number }[]
        >(
          `push_deliveries?id=eq.${encodeURIComponent(delivery.id)}` +
            `&attempt_count=eq.${delivery.attempt_count}` +
            `&or=(status.eq.pending,status.eq.retryable,and(status.eq.processing,claim_until.lt.${encodeURIComponent(now.toISOString())}))` +
            '&select=id,attempt_count,max_attempts',
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              status: 'processing',
              claim_token: claimToken,
              claim_until: claimUntil.toISOString(),
              attempt_count: delivery.attempt_count + 1,
              last_attempt_at: now.toISOString(),
            }),
          },
        )

        // Another scheduler invocation may already own this delivery.
        if (!claimed.length) continue

        const attemptCount = claimed[0].attempt_count

        try {
          await processDueDelivery({
            ...delivery,
            attempt_count: attemptCount,
          })

          const targets = await supabase<{ status: string }[]>(
            `push_delivery_targets?delivery_id=eq.${encodeURIComponent(delivery.id)}&select=status`,
          )

          const hasRetryable = targets.some(
            (target) => target.status === 'retryable',
          )
          const hasSent = targets.some((target) => target.status === 'sent')

          let finalStatus: 'sent' | 'retryable' | 'failed'

          if (hasRetryable) {
            finalStatus =
              attemptCount >= delivery.max_attempts ? 'failed' : 'retryable'
          } else {
            finalStatus = hasSent ? 'sent' : 'failed'
          }

          await supabase(
            `push_deliveries?id=eq.${encodeURIComponent(delivery.id)}` +
              `&claim_token=eq.${encodeURIComponent(claimToken)}` +
              '&status=eq.processing',
            {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                status: finalStatus,
                claim_token: null,
                claim_until: null,
                completed_at:
                  finalStatus === 'retryable' ? null : new Date().toISOString(),
              }),
            },
          )

          processed++
        } catch {
          const retryStatus =
            attemptCount >= delivery.max_attempts ? 'failed' : 'retryable'

          await supabase(
            `push_deliveries?id=eq.${encodeURIComponent(delivery.id)}` +
              `&claim_token=eq.${encodeURIComponent(claimToken)}` +
              '&status=eq.processing',
            {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                status: retryStatus,
                claim_token: null,
                claim_until: null,
                completed_at:
                  retryStatus === 'failed' ? new Date().toISOString() : null,
              }),
            },
          )
        }
      }
    }

    return Response.json({
      processed,
      windowStart: from.toISOString(),
      windowEnd: now.toISOString(),
    })
  } catch {
    return jsonError('Scheduler gagal diproses.', 503)
  }
}
