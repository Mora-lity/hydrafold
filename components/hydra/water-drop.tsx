import { cn } from '@/lib/utils'

const DROP_PATH =
  'M100 8 C100 8 28 92 28 146 C28 188 60 220 100 220 C140 220 172 188 172 146 C172 92 100 8 100 8 Z'

/** Decorative water drop with an animated wave. `level` is 0–1 fill height. */
export function WaterDrop({ className, level = 0.62 }: { className?: string; level?: number }) {
  const waterTop = 220 - Math.min(Math.max(level, 0), 1) * 212
  return (
    <svg
      viewBox="0 0 200 228"
      className={cn('drop-shadow-xl', className)}
      role="img"
      aria-label="Ilustrasi tetesan air"
    >
      <defs>
        <clipPath id="drop-clip">
          <path d={DROP_PATH} />
        </clipPath>
        <linearGradient id="drop-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-2)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <path d={DROP_PATH} className="fill-card stroke-primary/25" strokeWidth={3} />
      <g clipPath="url(#drop-clip)">
        <g className="animate-wave" style={{ transformBox: 'view-box' }}>
          <path
            d={`M0 ${waterTop} Q25 ${waterTop - 10} 50 ${waterTop} T100 ${waterTop} T150 ${waterTop} T200 ${waterTop} T250 ${waterTop} T300 ${waterTop} T350 ${waterTop} T400 ${waterTop} V228 H0 Z`}
            fill="url(#drop-water)"
          />
        </g>
        <ellipse cx="72" cy="120" rx="10" ry="22" className="fill-white/40" />
        <circle cx="78" cy="160" r="5" className="fill-white/35" />
      </g>
    </svg>
  )
}
