import { formatMl } from '@/lib/hydration'

export function ProgressRing({ consumed, goal }: { consumed: number; goal: number }) {
  const ratio = goal > 0 ? consumed / goal : 0
  const percent = Math.round(ratio * 100)
  const size = 240
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(ratio, 1))

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-60"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={consumed}
      aria-valuetext={`${formatMl(consumed)} dari ${formatMl(goal)}, ${percent} persen`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums">{percent}%</span>
        <span className="mt-1 text-sm font-medium text-foreground tabular-nums">{formatMl(consumed)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">dari {formatMl(goal)}</span>
      </div>
    </div>
  )
}
