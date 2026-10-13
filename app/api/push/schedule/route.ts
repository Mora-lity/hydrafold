
import {
  deviceFromRequest,
  isValidSchedule,
  isValidTimezone,
  jsonError,
  loadDevice,
  supabase,
} from '@/lib/push-server'

export async function PUT(request: Request) {
  const device = deviceFromRequest(request)
  if (!device) return jsonError('Token perangkat tidak valid.', 401)

  const body = await request.json().catch(() => null)

  if (
    !body ||
    !isValidTimezone(body.timezone) ||
    !isValidSchedule(body)
  ) {
    return jsonError('Jadwal atau timezone tidak valid.')
  }

  if (!(await loadDevice(device.id, device.token))) {
    return jsonError('Perangkat tidak aktif.', 403)
  }

  const scheduleId =
    typeof body.id === 'string' && body.id.length > 0
      ? body.id
      : crypto.randomUUID()

  try {
    const existing = await supabase<{ id: string }[]>(
      `push_schedules?id=eq.${encodeURIComponent(scheduleId)}` +
        `&device_id=eq.${encodeURIComponent(device.id)}&select=id`,
    )

    const values = {
      time: body.time,
      days: body.days,
      timezone: body.timezone,
      active: body.enabled !== false,
      updated_at: new Date().toISOString(),
    }

    if (existing.length > 0) {
      await supabase(
        `push_schedules?id=eq.${encodeURIComponent(scheduleId)}` +
          `&device_id=eq.${encodeURIComponent(device.id)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(values),
        },
      )
    } else {
      await supabase('push_schedules', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          id: scheduleId,
          device_id: device.id,
          ...values,
        }),
      })
    }

    return Response.json({ ok: true, id: scheduleId })
  } catch {
    return jsonError('Gagal menyimpan jadwal.', 503)
  }
}

export async function DELETE(request: Request) {
  const device = deviceFromRequest(request)
  if (!device) return jsonError('Token perangkat tidak valid.', 401)

  const body = await request.json().catch(() => null)

  if (
    typeof body?.id !== 'string' ||
    !body.id ||
    !(await loadDevice(device.id, device.token))
  ) {
    return jsonError('Data tidak valid.', 400)
  }

  try {
    await supabase(
      `push_schedules?id=eq.${encodeURIComponent(body.id)}` +
        `&device_id=eq.${encodeURIComponent(device.id)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          active: false,
          updated_at: new Date().toISOString(),
        }),
      },
    )

    return new Response(null, { status: 204 })
  } catch {
    return jsonError('Gagal menghapus jadwal.', 503)
  }
}
