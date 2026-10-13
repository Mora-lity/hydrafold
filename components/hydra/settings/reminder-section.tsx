'use client'

import { Info } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DAY_LABELS, DAY_NAMES, formatTime, reminderSlotsForDay } from '@/lib/hydration'
import { updateReminder, type ReminderSettings } from '@/lib/store'
import { OptionChip } from '../option-chip'
import { getPushPermission, registerPushSubscription, revokePushDevice, syncPushSchedule } from '@/lib/push-client'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function ReminderSection({ reminder }: { reminder: ReminderSettings }) {
  const [draft, setDraft] = useState<ReminderSettings>(reminder)
  const [error, setError] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState<'idle' | 'activating' | 'active' | 'denied' | 'failed'>('idle')

  const permission = getPushPermission()
  const pushStatusLabel = permission === 'denied' || pushStatus === 'denied'
    ? 'Izin ditolak'
    : pushStatus === 'active'
      ? 'Aktif'
      : pushStatus === 'failed'
        ? 'Gagal mengaktifkan'
        : permission === 'unsupported'
          ? 'Belum aktif di browser ini'
          : 'Belum aktif'

  const patch = (next: Partial<ReminderSettings>) => setDraft((d) => ({ ...d, ...next }))
  const schedules = draft.schedules ?? []

  function addSchedule() {
    const time = '12:00'
    if (schedules.some((schedule) => schedule.time === time)) return setError('Jam tersebut sudah ada.')
    patch({ schedules: [...schedules, { id: `schedule-${Date.now()}`, time, enabled: true }] })
  }

  function updateSchedule(id: string, time: string) {
    if (schedules.some((schedule) => schedule.id !== id && schedule.time === time)) return setError('Jam tersebut sudah ada.')
    setError(null)
    patch({ schedules: schedules.map((schedule) => (schedule.id === id ? { ...schedule, time } : schedule)) })
  }

  function removeSchedule(id: string) {
    patch({ schedules: schedules.filter((schedule) => schedule.id !== id) })
  }

  function toggleDay(day: number) {
    patch({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day] })
  }

  const previewDate = new Date()
  const sampleDay = draft.days.length ? DAY_ORDER.find((d) => draft.days.includes(d))! : 1
  previewDate.setDate(previewDate.getDate() + ((sampleDay - previewDate.getDay() + 7) % 7))
  const slots = reminderSlotsForDay({ ...draft, enabled: true, days: [sampleDay] }, previewDate)

  async function enablePush() {
    setPushStatus('activating')
    setError(null)
    try {
      await registerPushSubscription()
      setPushStatus('active')
      toast.success('Notifikasi push aktif')
    } catch (activationError) {
      const message = activationError instanceof Error ? activationError.message : 'Notifikasi push gagal diaktifkan.'
      setPushStatus(message.includes('Izin') ? 'denied' : 'failed')
      setError(message)
    }
  }

  async function disablePush() {
    setError(null)
    try {
      await revokePushDevice()
      setPushStatus('idle')
      toast.success('Notifikasi push dinonaktifkan')
    } catch (revokeError) {
      setPushStatus('failed')
      setError(revokeError instanceof Error ? revokeError.message : 'Notifikasi push gagal dinonaktifkan.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (draft.enabled && draft.days.length === 0) return setError('Pilih minimal satu hari aktif.')
    if (draft.enabled && schedules.filter((schedule) => schedule.enabled).length === 0) return setError('Aktifkan minimal satu jam pengingat.')
    if (schedules.some((schedule) => !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(schedule.time))) return setError('Gunakan format jam HH:mm yang valid.')
    setError(null)
    const timezone = draft.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    const normalized = { ...draft, days: [...draft.days].sort(), timezone, migrationNeedsReview: false }
    updateReminder(normalized)
    try {
      await syncPushSchedule(schedules, normalized.days, timezone)
      toast.success(draft.enabled ? 'Jadwal pengingat disimpan' : 'Pengingat dinonaktifkan')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Jadwal tersimpan lokal, tetapi gagal disinkronkan.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
        <div>
          <Label htmlFor="reminder-enabled" className="text-sm font-semibold">
            Aktifkan pengingat
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">Tampil sebagai pemberitahuan di dalam aplikasi.</p>
        </div>
        <Switch id="reminder-enabled" checked={draft.enabled} onCheckedChange={(enabled) => patch({ enabled })} />
      </div>

      <fieldset disabled={!draft.enabled} className="flex flex-col gap-6 disabled:opacity-50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="reminder-time">Jam pengingat</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Pilih satu atau beberapa jam khusus.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSchedule}>Tambah jam</Button>
          </div>
          <div className="flex flex-col gap-2">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-2">
                <Input
                  id={`reminder-${schedule.id}`}
                  aria-label="Jam pengingat"
                  type="time"
                  value={schedule.time}
                  onChange={(e) => updateSchedule(schedule.id, e.target.value)}
                  className="h-11"
                />
                <Switch checked={schedule.enabled} onCheckedChange={(enabled) => patch({ schedules: schedules.map((item) => item.id === schedule.id ? { ...item, enabled } : item) })} aria-label={`Aktifkan ${schedule.time}`} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSchedule(schedule.id)}>Hapus</Button>
              </div>
            ))}
            {schedules.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jam pengingat.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground" id="days-label">
            Hari aktif
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="days-label">
            {DAY_ORDER.map((day) => (
              <OptionChip
                key={day}
                selected={draft.days.includes(day)}
                onClick={() => toggleDay(day)}
                label={DAY_NAMES[day]}
                className="w-12 px-0"
              >
                {DAY_LABELS[day]}
              </OptionChip>
            ))}
          </div>
          <div className="flex gap-2 text-xs">
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => patch({ days: [1, 2, 3, 4, 5] })}>
              Hari kerja
            </button>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => patch({ days: [0, 1, 2, 3, 4, 5, 6] })}>
              Setiap hari
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-muted p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Pratinjau jadwal ({slots.length} pengingat per hari)
          </p>
          {slots.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {slots.map((slot) => (
                <li key={slot.getTime()} className="rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground tabular-nums">
                  {formatTime(slot)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Periksa kembali jam mulai dan selesai.</p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifikasi saat website tertutup</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Status: {pushStatusLabel}</p>
          </div>
          {pushStatus === 'activating' ? (
            <Button type="button" size="sm" variant="outline" disabled>Memproses...</Button>
          ) : pushStatus === 'active' ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void disablePush()}>Nonaktifkan</Button>
          ) : (
            <Button type="button" size="sm" onClick={() => void enablePush()}>Aktifkan</Button>
          )}
        </div>
        <div className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>Jadwal tersimpan di perangkat ini dengan zona waktu IANA. Push saat website tertutup membutuhkan konfigurasi backend dan scheduler eksternal.</p>
        </div>
      </div>

      {draft.migrationNeedsReview && (
        <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
          Jadwal ini dimigrasikan dari interval lama. Periksa jamnya lalu simpan untuk mengonfirmasi.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 rounded-full text-base">
        Simpan jadwal
      </Button>
    </form>
  )
}
