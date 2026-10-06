import { Droplet } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30"
      >
        <Droplet className="size-5" fill="currentColor" strokeWidth={1.5} />
      </span>
      {compact ? (
        <span className="sr-only">HydraFold</span>
      ) : (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Hydra<span className="text-primary">Fold</span>
        </span>
      )}
    </span>
  )
}
