import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { cx } from './ui'

export interface Datum {
  key: string
  label: string
  value: number
  /** Optional secondary text shown in the tooltip only. */
  meta?: string
}

/**
 * Single-series magnitude bars. One measure, one axis, one hue — a second
 * measure gets its own chart rather than a second y-scale.
 */
export function BarChart({
  data, unit = '', height = 180, title,
}: { data: Datum[]; unit?: string; height?: number; title: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const id = useId()

  return (
    <figure className="m-0">
      <div
        className="relative w-full"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Recessive gridlines at 0 / 50 / 100% of max */}
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-px w-full bg-[var(--color-line)] opacity-60" />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d, i) => {
            const h = (d.value / max) * 100
            return (
              <div
                key={d.key}
                className="group relative flex h-full flex-1 cursor-default items-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value}${unit}`}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, d.value > 0 ? 3 : 0)}%` }}
                  transition={{ duration: 0.45, delay: i * 0.012, ease: 'easeOut' }}
                  className={cx(
                    'w-full rounded-t-[4px] transition-colors duration-150',
                    hover === i ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]',
                    d.value === 0 && 'bg-[var(--color-surface-2)]',
                  )}
                  style={{ minHeight: d.value === 0 ? 2 : undefined }}
                />
                {hover === i && (
                  <div
                    role="tooltip"
                    id={`${id}-tip`}
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[180px] -translate-x-1/2 rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-2.5 py-1.5 text-xs shadow-[var(--shadow-overlay)]"
                  >
                    <span className="font-bold">{d.label}</span>
                    <span className="ml-2 tabular-nums">{d.value}{unit}</span>
                    {d.meta && (
                      <span className="mt-0.5 block text-[var(--color-fg-muted)]">{d.meta}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-[2px]">
        {data.map((d, i) => (
          <span
            key={d.key}
            className={cx(
              'flex-1 truncate text-center text-[10px] font-semibold text-[var(--color-fg-muted)]',
              data.length > 14 && i % 5 !== 0 && 'invisible',
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{title}</figcaption>
    </figure>
  )
}

/** Sequential single-hue heatmap: one hue, light → dark by magnitude. */
export function Heatmap({
  cells, title,
}: { cells: Array<{ key: string; value: number; label: string }>; title: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(1, ...cells.map((c) => c.value))
  const step = (v: number) => {
    if (v === 0) return 0
    const r = v / max
    if (r <= 0.25) return 1
    if (r <= 0.5) return 2
    if (r <= 0.75) return 3
    return 4
  }
  const opacity = [0, 0.22, 0.45, 0.7, 1]

  return (
    <figure className="m-0">
      <div className="flex flex-wrap gap-[3px]" onMouseLeave={() => setHover(null)}>
        {cells.map((c) => {
          const s = step(c.value)
          return (
            <div
              key={c.key}
              tabIndex={0}
              onMouseEnter={() => setHover(c.key)}
              onFocus={() => setHover(c.key)}
              onBlur={() => setHover(null)}
              aria-label={`${c.label}: ${c.value}`}
              title={`${c.label}: ${c.value}`}
              className={cx(
                'relative size-[11px] rounded-[3px] transition-transform duration-150',
                s === 0 && 'bg-[var(--color-surface-2)]',
                hover === c.key && 'scale-125',
              )}
              style={s > 0 ? {
                backgroundColor: `color-mix(in oklab, var(--color-primary) ${opacity[s] * 100}%, var(--color-surface-2))`,
              } : undefined}
            />
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[var(--color-fg-muted)]">
        <span>Less</span>
        {opacity.map((o, i) => (
          <span
            key={i}
            className="size-[11px] rounded-[3px]"
            style={{
              backgroundColor: i === 0
                ? 'var(--color-surface-2)'
                : `color-mix(in oklab, var(--color-primary) ${o * 100}%, var(--color-surface-2))`,
            }}
          />
        ))}
        <span>More</span>
      </div>
      <figcaption className="sr-only">{title}</figcaption>
    </figure>
  )
}

/** Hero number — when the data's job is one headline, it is not a chart. */
export function Stat({
  label, value, unit, sub, tone = 'default',
}: { label: string; value: string | number; unit?: string; sub?: string; tone?: 'default' | 'accent' }) {
  return (
    <div className="rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-4 shadow-[var(--shadow-tile)]">
      <p className="text-xs font-bold tracking-wide uppercase text-[var(--color-fg-muted)]">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span
          className={cx(
            'text-3xl font-extrabold tabular-nums',
            tone === 'accent' && 'text-[var(--color-accent)]',
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-[var(--color-fg-muted)]">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{sub}</p>}
    </div>
  )
}
