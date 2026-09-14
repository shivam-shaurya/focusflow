import { useEffect, useState } from 'react'
import { countdownParts } from '../lib/deadlines'
import { cx } from './ui'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Live countdown to the end of a due date. Ticks per second while more than a
 * day remains would be pointless, so the interval steps down as it gets close —
 * a distant deadline costs one render a minute.
 */
export function Countdown({ msLeft, compact = false }: { msLeft: number; compact?: boolean }) {
  const [, force] = useState(0)

  useEffect(() => {
    const period = Math.abs(msLeft) > 86_400_000 ? 60_000 : 1000
    const id = window.setInterval(() => force((n) => n + 1), period)
    return () => window.clearInterval(id)
  }, [msLeft])

  const p = countdownParts(msLeft)
  const urgent = !p.negative && msLeft < 3 * 86_400_000

  if (compact) {
    return (
      <span
        className={cx(
          'font-mono text-xs font-bold tabular-nums',
          p.negative
            ? 'text-[var(--color-destructive)]'
            : urgent
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)]',
        )}
      >
        {p.negative && '+'}
        {p.days > 0 ? `${p.days}d ` : ''}
        {pad(p.hours)}:{pad(p.minutes)}
        {p.days === 0 && `:${pad(p.seconds)}`}
      </span>
    )
  }

  const cells: Array<[number, string]> = [
    [p.days, p.days === 1 ? 'day' : 'days'],
    [p.hours, 'hrs'],
    [p.minutes, 'min'],
    [p.seconds, 'sec'],
  ]

  return (
    <div>
      <div className="flex gap-2" aria-hidden="true">
        {cells.map(([v, unit]) => (
          <div
            key={unit}
            className={cx(
              'min-w-14 rounded-lg border px-2 py-1.5 text-center',
              p.negative
                ? 'border-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)]'
                : urgent
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)]'
                  : 'bg-[var(--color-surface-2)]',
            )}
          >
            <div className="font-mono text-lg font-extrabold tabular-nums leading-none">
              {pad(v)}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase text-[var(--color-fg-muted)]">
              {unit}
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">
        {p.negative ? 'Overdue by' : 'Time remaining:'} {p.days} days, {p.hours} hours,{' '}
        {p.minutes} minutes
      </p>
    </div>
  )
}
