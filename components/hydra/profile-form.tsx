'use client'

import { Check, Target } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACTIVITY_OPTIONS, formatMl, recommendedGoal } from '@/lib/hydration'
import type { ActivityLevel, Profile } from '@/lib/store'
import { cn } from '@/lib/utils'
import { OptionChip } from './option-chip'

const BOTTLE_PRESETS = [330, 500, 600, 750, 1000]

type Errors = Partial<Record<keyof Profile, string>>

function validate(values: Profile): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Nama panggilan wajib diisi.'
  else if (values.name.trim().length > 24) errors.name = 'Maksimal 24 karakter.'
  if (!Number.isFinite(values.weightKg) || values.weightKg < 25 || values.weightKg > 250)
    errors.weightKg = 'Masukkan berat badan antara 25–250 kg.'
  if (!values.startTime) errors.startTime = 'Pilih jam mulai.'
  if (!values.endTime) errors.endTime = 'Pilih jam selesai.'
  if (values.startTime && values.endTime && values.endTime <= values.startTime)
    errors.endTime = 'Jam selesai harus setelah jam mulai.'
  if (!Number.isFinite(values.bottleMl) || values.bottleMl < 100 || values.bottleMl > 3000)
    errors.bottleMl = 'Kapasitas botol antara 100–3.000 ml.'
  return errors
}

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Profile | null
  submitLabel: string
  onSubmit: (profile: Profile) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '')
  const [activity, setActivity] = useState<ActivityLevel>(initial?.activity ?? 'sedang')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '07:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '21:00')
  const [bottle, setBottle] = useState(initial ? String(initial.bottleMl) : '600')
  const [errors, setErrors] = useState<Errors>({})

  const weightNum = Number(weight)
  const preview = weightNum >= 25 && weightNum <= 250 ? recommendedGoal({ weightKg: weightNum, activity }) : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values: Profile = {
      name: name.trim(),
      weightKg: Number(weight),
      activity,
      startTime,
      endTime,
      bottleMl: Math.round(Number(bottle)),
    }
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nama panggilan" error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. Raka"
            autoComplete="nickname"
            maxLength={24}
            aria-invalid={Boolean(errors.name)}
            className="h-11"
          />
        </Field>
        <Field id="weight" label="Berat badan (kg)" error={errors.weightKg}>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            min={25}
            max={250}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="cth. 58"
            aria-invalid={Boolean(errors.weightKg)}
            className="h-11"
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Tingkat aktivitas</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tingkat aktivitas">
          {ACTIVITY_OPTIONS.map((option) => {
            const selected = activity === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setActivity(option.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border bg-background hover:border-primary/40',
                )}
              >
                <span className="flex w-full items-center justify-between text-sm font-semibold">
                  {option.label}
                  {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">{option.description}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="start" label="Jam mulai aktivitas" error={errors.startTime}>
          <Input
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            aria-invalid={Boolean(errors.startTime)}
            className="h-11"
          />
        </Field>
        <Field id="end" label="Jam selesai aktivitas" error={errors.endTime}>
          <Input
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            aria-invalid={Boolean(errors.endTime)}
            className="h-11"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bottle">Kapasitas botol minum (ml)</Label>
        <div className="flex flex-wrap gap-2">
          {BOTTLE_PRESETS.map((ml) => (
            <OptionChip key={ml} selected={Number(bottle) === ml} onClick={() => setBottle(String(ml))}>
              {formatMl(ml)}
            </OptionChip>
          ))}
        </div>
        <Input
          id="bottle"
          type="number"
          inputMode="numeric"
          min={100}
          max={3000}
          step={10}
          value={bottle}
          onChange={(e) => setBottle(e.target.value)}
          aria-invalid={Boolean(errors.bottleMl)}
          aria-describedby={errors.bottleMl ? 'bottle-error' : undefined}
          className="h-11 sm:max-w-48"
        />
        {errors.bottleMl && (
          <p id="bottle-error" className="text-xs text-destructive">
            {errors.bottleMl}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-secondary p-4 text-secondary-foreground">
        <Target className="size-5 shrink-0" aria-hidden="true" />
        <p className="text-sm" aria-live="polite">
          {preview ? (
            <>
              Rekomendasi target harian Anda: <strong className="font-bold">{formatMl(preview)}</strong>
            </>
          ) : (
            'Isi berat badan untuk melihat rekomendasi target harian.'
          )}
        </p>
      </div>

      <Button type="submit" size="lg" className="h-12 rounded-full text-base">
        {submitLabel}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
