'use client'

import { CupSoda, GlassWater, Milk, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMl } from '@/lib/hydration'
import { addDrink, removeDrink } from '@/lib/store'
import { cn } from '@/lib/utils'

const PRESETS = [
  { ml: 150, icon: GlassWater, label: 'Gelas kecil' },
  { ml: 250, icon: GlassWater, label: 'Gelas' },
  { ml: 350, icon: CupSoda, label: 'Tumbler' },
  { ml: 500, icon: Milk, label: 'Botol' },
]

function logDrink(ml: number) {
  const log = addDrink(ml)
  toast.success(`${formatMl(ml)} ditambahkan`, {
    action: { label: 'Batalkan', onClick: () => removeDrink(log.id) },
  })
}

export function QuickAdd({ bottleMl, className }: { bottleMl: number; className?: string }) {
  const [manual, setManual] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Math.round(Number(manual))
    if (!Number.isFinite(value) || value < 10 || value > 3000) {
      setError('Masukkan jumlah antara 10–3.000 ml.')
      return
    }
    setError(null)
    logDrink(value)
    setManual('')
  }

  return (
    <section
      aria-labelledby="quick-add-heading"
      className={cn('flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6', className)}
    >
      <h2 id="quick-add-heading" className="text-base font-semibold text-foreground">
        Catat minum
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">Ketuk sesuai jumlah yang baru saja diminum.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {PRESETS.map(({ ml, icon: Icon, label }) => (
          <button
            key={ml}
            type="button"
            onClick={() => logDrink(ml)}
            aria-label={`Tambah ${ml} ml`}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-background p-3 text-left transition-all outline-none hover:border-primary/50 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold text-foreground tabular-nums">+{ml} ml</span>
              <span className="block text-xs text-muted-foreground">{label}</span>
            </span>
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-3 h-11 rounded-xl"
        onClick={() => logDrink(bottleMl)}
      >
        <Milk data-icon="inline-start" />
        Habis 1 botol ({formatMl(bottleMl)})
      </Button>

      <form onSubmit={handleManual} className="mt-4 flex flex-col gap-2" noValidate>
        <Label htmlFor="manual-amount">Jumlah manual (ml)</Label>
        <div className="flex gap-2">
          <Input
            id="manual-amount"
            type="number"
            inputMode="numeric"
            min={10}
            max={3000}
            placeholder="cth. 200"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'manual-error' : undefined}
            className="h-11"
          />
          <Button type="submit" className="h-11 rounded-xl px-4">
            <Plus data-icon="inline-start" />
            Tambah
          </Button>
        </div>
        {error && (
          <p id="manual-error" className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}
