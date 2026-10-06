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

const INTERVALS = [30, 45, 60, 90, 120]
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function ReminderSection({ reminder }: { reminder: ReminderSettings }) {
  const [draft, setDraft] = useState<ReminderSettings>(reminder)
  const [error, setError] = useState<string | null>(null)

  const patch = (next: Partial<ReminderSettings>) => setDraft((d) => ({ ...d, ...next }))

  function toggleDay(day: number) {
    patch({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day] })
  }

  const previewDate = new Date()
  const sampleDay = draft.days.length ? DAY_ORDER.find((d) => draft.days.includes(d))! : 1
  previewDate.setDate(previewDate.getDate() + ((sampleDay - previewDate.getDay() + 7) % 7))
  const slots = reminderSlotsForDay({ ...draft, enabled: true, days: [sampleDay] }, previewDate)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (draft.endTime <= draft.startTime) return setError('Jam selesai harus setelah jam mulai.')
    if (draft.enabled && draft.days.length === 0) return setError('Pilih minimal satu hari aktif.')
    setError(null)
    updateReminder({ ...draft, days: [...draft.days].sort() })
    toast.success(draft.enabled ? 'Jadwal pengingat disimpan' : 'Pengingat dinonaktifkan')
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-start">Jam mulai</Label>
            <Input
              id="reminder-start"
              type="time"
              value={draft.startTime}
              onChange={(e) => patch({ startTime: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-end">Jam selesai</Label>
            <Input
              id="reminder-end"
              type="time"
              value={draft.endTime}
              onChange={(e) => patch({ endTime: e.target.value })}
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground" id="interval-label">
            Interval pengingat
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="interval-label">
            {INTERVALS.map((min) => (
              <OptionChip key={min} selected={draft.intervalMin === min} onClick={() => patch({ intervalMin: min })}>
                {min < 60 ? `${min} mnt` : `${min / 60} jam`}
              </OptionChip>
            ))}
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

      <div className="flex gap-3 rounded-2xl border border-border p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Pengingat hanya muncul selama HydraFold terbuka di browser. Notifikasi saat website ditutup belum tersedia
          pada versi ini.
        </p>
      </div>

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
