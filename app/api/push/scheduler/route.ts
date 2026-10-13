import { dueOccurrences, jsonError, processDueDelivery, schedulerAuthorized, supabase, MAX_ATTEMPTS } from '@/lib/push-server'

export async function POST(request: Request) {
  if (!schedulerAuthorized(request)) return jsonError('Unauthorized.', 401)
  const now = new Date(); const from = new Date(now.getTime() - 15 * 60_000)
  try {
    const schedules = await supabase<{ id: string; device_id: string; time: string; days: number[]; timezone: string }[]>('push_schedules?active=eq.true&select=id,device_id,time,days,timezone')
    let processed = 0
    for (const schedule of schedules) {
      for (const occurrence of dueOccurrences([schedule], from, now)) {
        const rows = await supabase<{ id: string; device_id: string; schedule_id: string; attempt_count: number; max_attempts: number }[]>('push_deliveries?on_conflict=schedule_id,local_date,local_time,timezone', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ schedule_id: occurrence.scheduleId, device_id: schedule.device_id, local_date: occurrence.localDate, local_time: occurrence.localTime, timezone: occurrence.timezone, max_attempts: MAX_ATTEMPTS }) })
        const delivery = rows[0]; if (!delivery || delivery.attempt_count >= delivery.max_attempts) continue
        await supabase(`push_deliveries?id=eq.${encodeURIComponent(delivery.id)}&attempt_count=lt.${MAX_ATTEMPTS}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ attempt_count: delivery.attempt_count + 1, last_attempt_at: now.toISOString() }) })
        await processDueDelivery(delivery); processed++
      }
    }
    return Response.json({ processed, windowStart: from.toISOString(), windowEnd: now.toISOString() })
  } catch { return jsonError('Scheduler gagal diproses.', 503) }
}
