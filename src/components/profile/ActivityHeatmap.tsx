'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { StudyActivity } from '@/types'

interface Props {
  activity: StudyActivity[]
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const CELL_SIZE = 12
const GAP = 2

function getIntensity(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  return 4
}

function getColor(intensity: number): string {
  switch (intensity) {
    case 0: return 'var(--card-border)'
    case 1: return 'color-mix(in srgb, var(--accent) 25%, transparent)'
    case 2: return 'color-mix(in srgb, var(--accent) 50%, transparent)'
    case 3: return 'color-mix(in srgb, var(--accent) 75%, transparent)'
    case 4: return 'var(--accent)'
    default: return 'var(--card-border)'
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function ActivityHeatmap({ activity }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const { grid, months, totalStudied } = useMemo(() => {
    // Build a map of date -> cards_studied
    const actMap = new Map<string, number>()
    let total = 0
    for (const a of activity) {
      actMap.set(a.activity_date, a.cards_studied)
      total += a.cards_studied
    }

    // Build grid: 53 columns x 7 rows, going back ~365 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the start: go back to the Sunday 52 weeks ago
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364 - startDate.getDay())

    const cells: { date: Date; count: number; col: number; row: number }[] = []
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1

    const current = new Date(startDate)
    while (current <= today) {
      const col = Math.floor((current.getTime() - startDate.getTime()) / (7 * 86400000))
      const row = current.getDay()
      const dateStr = current.toISOString().split('T')[0]
      const count = actMap.get(dateStr) ?? 0

      cells.push({ date: new Date(current), count, col, row })

      // Track month labels
      if (current.getMonth() !== lastMonth) {
        lastMonth = current.getMonth()
        monthLabels.push({
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          col,
        })
      }

      current.setDate(current.getDate() + 1)
    }

    return { grid: cells, months: monthLabels, totalStudied: total }
  }, [activity])

  const totalCols = Math.max(...grid.map((c) => c.col)) + 1
  const svgWidth = totalCols * (CELL_SIZE + GAP) + 30 // 30 for day labels
  const svgHeight = 7 * (CELL_SIZE + GAP) + 20 // 20 for month labels

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Study Activity</h2>
        <p className="text-xs text-[var(--muted)]">
          {totalStudied.toLocaleString()} cards studied in the last year
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {months.map((m, i) => (
            <text
              key={`${m.label}-${i}`}
              x={30 + m.col * (CELL_SIZE + GAP)}
              y={10}
              className="text-[9px] fill-[var(--muted)]"
              fontFamily="var(--font-sans)"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={20 + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
                className="text-[9px] fill-[var(--muted)]"
                fontFamily="var(--font-sans)"
              >
                {label}
              </text>
            )
          ))}

          {/* Cells */}
          {grid.map((cell) => {
            const intensity = getIntensity(cell.count)
            const x = 30 + cell.col * (CELL_SIZE + GAP)
            const y = 18 + cell.row * (CELL_SIZE + GAP)
            return (
              <rect
                key={`${cell.col}-${cell.row}`}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={getColor(intensity)}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect()
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    text: `${cell.count} card${cell.count !== 1 ? 's' : ''} on ${formatDate(cell.date)}`,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[var(--muted)]">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ background: getColor(i) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg bg-[var(--surface-raised)] border border-[var(--card-border)] px-2.5 py-1.5 text-[11px] text-[var(--foreground)] shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: 'translateX(-50%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </motion.div>
  )
}
