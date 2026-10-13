import { deviceFromRequest, hashDeviceToken, jsonError, randomToken, supabase } from '@/lib/push-server'

export async function POST() {
  try {
    const id = crypto.randomUUID(); const token = randomToken()
    await supabase('push_devices', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id, device_token_hash: await hashDeviceToken(token), active: true }) })
    return Response.json({ deviceId: id, deviceToken: token })
  } catch { return jsonError('Push server belum dikonfigurasi.', 503) }
}

export async function DELETE(request: Request) {
  const device = deviceFromRequest(request); if (!device) return jsonError('Token perangkat tidak valid.', 401)
  try {
    const tokenHash = await hashDeviceToken(device.token)
    await supabase(`push_devices?id=eq.${encodeURIComponent(device.id)}&device_token_hash=eq.${encodeURIComponent(tokenHash)}&active=eq.true`, { method: 'PATCH', body: JSON.stringify({ active: false, revoked_at: new Date().toISOString() }) })
    return new Response(null, { status: 204 })
  } catch { return jsonError('Gagal mencabut perangkat.', 503) }
}
