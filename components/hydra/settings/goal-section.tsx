'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatMl } from '@/lib/hydration'
import { setCustomGoal } from '@/lib/store'

export function GoalSection({ customGoal, recommended }: { customGoal: number | null; recommended: number }) {
  const [useCustom, setUseCustom] = useState(customGoal !== null)
  const [value, setValue] = useState(String(customGoal ?? recommended))
  const [error, setError] = useState<string | null>(null)

  function handleToggle(checked: boolean) {
    setUseCustom(checked)
    if (!checked) {
      setCustomGoal(null)
      toast.success(`Target kembali otomatis: ${formatMl(recommended)}`)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const goal = Math.round(Number(value))
    if (!Number.isFinite(goal) || goal < 500 || goal > 6000) {
      setError('Target antara 500–6.000 ml.')
      return
    }
    setError(null)
    setCustomGoal(goal)
    toast.success(`Target harian disimpan: ${formatMl(goal)}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-4 text-secondary-foreground">
        <div>
          <p className="text-xs opacity-80">Rekomendasi otomatis</p>
          <p className="text-lg font-bold">{formatMl(recommended)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="custom-goal-toggle" className="text-sm">
            Atur manual
          </Label>
          <Switch id="custom-goal-toggle" checked={useCustom} onCheckedChange={handleToggle} />
        </div>
      </div>

      {useCustom && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Label htmlFor="custom-goal">Target harian (ml)</Label>
          <div className="flex gap-2">
            <Input
              id="custom-goal"
              type="number"
              inputMode="numeric"
              min={500}
              max={6000}
              step={50}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={Boolean(error)}
              className="h-11 sm:max-w-48"
            />
            <Button type="submit" className="h-11 rounded-xl">
              Simpan target
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
