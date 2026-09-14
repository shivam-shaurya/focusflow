import { useMemo } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { useStore } from '../lib/store'
import { deadlineStats, fmtHours, todayLoad } from '../lib/deadlines'
import { Button, cx } from './ui'

/**
 * The link between deadlines and the day: how many hours today owes, and which
 * commitments have slipped far enough that the plan needs changing rather than
 * just more effort.
 */
export function DeadlineNudge({ onOpen }: { onOpen: () => void }) {
  const { state } = useStore()
  const load = useMemo(() => todayLoad(state.deadlines), [state.deadlines])

  if (load.count === 0 && load.urgent.length === 0) return null

  const slipping = load.urgent.length > 0

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cx(
        'rounded-[var(--radius-card)] border p-5',
        slipping
          ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_8%,var(--color-surface))]'
          : 'bg-[var(--color-surface)]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
            {slipping ? (
              <AlertTriangle size={13} className="text-[var(--color-accent)]" aria-hidden="true" />
            ) : (
              <CalendarClock size={13} aria-hidden="true" />
            )}
            Deadlines today
          </p>
          <p className="mt-1.5 text-lg font-bold">
            {load.hours > 0 ? (
              <>
                <span className="text-[var(--color-accent)]">{fmtHours(load.hours)}</span> across{' '}
                {load.count} {load.count === 1 ? 'deadline' : 'deadlines'}
              </>
            ) : (
              'Nothing due today'
            )}
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
            {slipping
              ? 'Some of these have slipped. Adjust today’s goals, or move the date — hoping is not a plan.'
              : 'Block this into your day before it gets eaten.'}
          </p>
        </div>
        <Button size="sm" onClick={onOpen}>Open deadlines</Button>
      </div>

      {slipping && (
        <ul className="mt-4 flex flex-col gap-2 border-t pt-3">
          {load.urgent.slice(0, 3).map((d) => {
            const s = deadlineStats(d)
            return (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold">{d.title}</span>
                <span className="text-[var(--color-fg-muted)]">
                  {s.overdue
                    ? 'past due'
                    : `needs ${fmtHours(s.perDay)}/day for ${s.workdaysLeft} more ${
                        s.workdaysLeft === 1 ? 'day' : 'days'
                      }`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </motion.section>
  )
}
