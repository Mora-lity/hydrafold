import { deviceFromRequest, jsonError, randomToken, supabase } from '@/lib/push-server'

export async function POST() {
  try {
    const id = crypto.randomUUID(); const token = randomToken()
    await supabase('devices', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id, device_token: token, active: true }) })
    return Response.json({ deviceId: id, deviceToken: token })
  } catch { return jsonError('Push server belum dikonfigurasi.', 503) }
}

export async function DELETE(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  try { await supabase(`devices?id=eq.${encodeURIComponent(device.id)}&device_token=eq.${encodeURIComponent(device.token)}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }); return new Response(null, { status: 204 }) } catch { return jsonError('Gagal mencabut perangkat.', 503) }
}
