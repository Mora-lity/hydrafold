import { deviceFromRequest, jsonError, loadDevice, supabase } from '@/lib/push-server'

export async function POST(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  const body = await request.json().catch(() => null)
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth || !(await loadDevice(device.id, device.token))) return jsonError('Data subscription tidak valid.', 400)
  try { 'push_subscriptions?on_conflict=device_id,endpoint'{ method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ device_id: device.id, endpoint: body.endpoint, expiration_time: body.expirationTime ?? null, keys: body.keys, active: true }) }); return Response.json({ ok: true }) } catch { return jsonError('Gagal menyimpan subscription.', 503) }
}

export async function DELETE(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  const body = await request.json().catch(() => null); if (!body?.endpoint || !(await loadDevice(device.id, device.token))) return jsonError('Data tidak valid.', 400)
  try { await supabase(`push_subscriptions?device_id=eq.${encodeURIComponent(device.id)}&endpoint=eq.${encodeURIComponent(body.endpoint)}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }); return new Response(null, { status: 204 }) } catch { return jsonError('Gagal mencabut subscription.', 503) }
}
