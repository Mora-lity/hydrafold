import { cn } from '@/lib/utils'

export function OptionChip({
  selected,
  onClick,
  children,
  className,
  label,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/40',
        className,
      )}
    >
      {children}
    </button>
  )
}
