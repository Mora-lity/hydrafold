import { deviceFromRequest, isValidSchedule, isValidTimezone, jsonError, loadDevice, supabase } from '@/lib/push-server'

export async function PUT(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  const body = await request.json().catch(() => null)
  if (!body || !isValidTimezone(body.timezone) || !isValidSchedule(body)) return jsonError('Jadwal atau timezone tidak valid.')
  if (!(await loadDevice(device.id, device.token))) return jsonError('Perangkat tidak aktif.', 403)
  try { await supabase('push_schedules', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: body.id, device_id: device.id, time: body.time, days: body.days, timezone: body.timezone, active: body.enabled !== false }) }); return Response.json({ ok: true }) } catch { return jsonError('Gagal menyimpan jadwal.', 503) }
}

export async function DELETE(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  const body = await request.json().catch(() => null); if (!body?.id || !(await loadDevice(device.id, device.token))) return jsonError('Data tidak valid.', 400)
  try { await supabase(`push_schedules?id=eq.${encodeURIComponent(body.id)}&device_id=eq.${encodeURIComponent(device.id)}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }); return new Response(null, { status: 204 }) } catch { return jsonError('Gagal menghapus jadwal.', 503) }
}
