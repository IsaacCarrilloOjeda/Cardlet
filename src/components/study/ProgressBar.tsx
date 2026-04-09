interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0">{current}/{total}</span>
    </div>
  )
}
