export function volumeTicks(maxValue: number, goal: number) {
  const top = Math.max(maxValue, goal) * 1.05
  const step = top > 4000 ? 1000 : 500
  const max = Math.ceil(top / step) * step
  return Array.from({ length: max / step + 1 }, (_, i) => i * step)
}

export function formatVolumeTick(v: number) {
  return v >= 1000 ? `${(v / 1000).toLocaleString('id-ID')} L` : `${v}`
}
