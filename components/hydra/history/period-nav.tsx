import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PeriodNav({
  label,
  onPrev,
  onNext,
  canNext,
  prevLabel,
  nextLabel,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
  canNext: boolean
  prevLabel: string
  nextLabel: string
}) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label={prevLabel}>
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium text-foreground" aria-live="polite">
        {label}
      </span>
      <Button variant="ghost" size="icon" onClick={onNext} disabled={!canNext} aria-label={nextLabel}>
        <ChevronRight />
      </Button>
    </div>
  )
}
