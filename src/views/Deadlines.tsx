import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Archive, ArchiveRestore, CalendarClock, ChevronDown, Plus, Target, Trash2, TrendingUp,
} from 'lucide-react'
import { useStore } from '../lib/store'
import type { Deadline } from '../lib/types'
import {
  PACE_LABEL, deadlineStats, fmtHours, strategy, type Granularity, type Pace,
} from '../lib/deadlines'
import { fmtLong, todayISO } from '../lib/date'
import { Bar, Button, Card, Empty, SectionTitle, cx, Page, PageHeader } from '../components/ui'
import { Countdown } from '../components/Countdown'
import { celebrate } from '../lib/celebrate'

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const PACE_TONE: Record<Pace, string> = {
  done: 'text-[var(--color-primary)]',
  ahead: 'text-[var(--color-primary)]',
  'on-track': 'text-[var(--color-primary)]',
  behind: 'text-[var(--color-accent)]',
  'at-risk': 'text-[var(--color-destructive)]',
  overdue: 'text-[var(--color-destructive)]',
}

const GRANULARITIES: Array<[Granularity, string]> = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
]

export function Deadlines() {
  const { state } = useStore()
  const [showArchived, setShowArchived] = useState(false)

  const active = useMemo(
    () =>
      state.deadlines
        .filter((d) => !d.archivedAt)
        .sort((a, b) => a.due.localeCompare(b.due)),
    [state.deadlines],
  )
  const archived = useMemo(
    () => state.deadlines.filter((d) => d.archivedAt),
    [state.deadlines],
  )

  return (
    <Page width="reading">
      <PageHeader
        icon={CalendarClock}
        eyebrow="Deadlines"
        title="What is actually due"
        hint="Give it the hours it needs and the date it is due. The pace is then arithmetic, not a guess."
      />

      <NewDeadline />

      <AnimatePresence initial={false}>
        {active.map((d) => <DeadlineCard key={d.id} deadline={d} />)}
      </AnimatePresence>

      {active.length === 0 && (
        <Empty
          icon={<Target size={22} />}
          title="No deadlines yet"
          hint="Add one above. A vague “sometime soon” is exactly the kind of thing that never gets started."
        />
      )}

      {archived.length > 0 && (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setShowArchived((v) => !v)}>
            <Archive size={14} /> {showArchived ? 'Hide' : `Archived (${archived.length})`}
          </Button>
          {showArchived && (
            <div className="mt-3 flex flex-col gap-3">
              {archived.map((d) => <DeadlineCard key={d.id} deadline={d} />)}
            </div>
          )}
        </div>
      )}
    </Page>
  )
}

function NewDeadline() {
  const { addDeadline } = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [workdays, setWorkdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(hours)
    if (!title.trim() || !due || !Number.isFinite(h) || h <= 0) return
    addDeadline({
      title: title.trim(),
      description: description.trim(),
      due,
      totalHours: h,
      workdays: workdays.length ? workdays : [0, 1, 2, 3, 4, 5, 6],
    })
    setTitle(''); setDue(''); setHours(''); setDescription('')
    setWorkdays([0, 1, 2, 3, 4, 5, 6])
    setOpen(false)
  }

  if (!open) {
    return (
      <Button variant="primary" className="self-start" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add a deadline
      </Button>
    )
  }

  return (
    <Card>
      <SectionTitle
        title="New deadline"
        hint="Estimate generously — a target you keep missing stops meaning anything."
      />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          What is it
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish the DIP syllabus"
            className="min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Due date
            <input
              type="date"
              value={due}
              min={todayISO()}
              onChange={(e) => setDue(e.target.value)}
              className="min-h-11 cursor-pointer rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Hours it needs
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 40"
              className="min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Days you can work on it</legend>
          <p className="text-xs text-[var(--color-fg-muted)]">
            The daily target is divided across these days only, so it stays realistic.
          </p>
          <div className="flex gap-1.5">
            {DAY_INITIALS.map((letter, i) => {
              const on = workdays.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setWorkdays((w) => (on ? w.filter((x) => x !== i) : [...w, i]))
                  }
                  aria-pressed={on}
                  aria-label={DAY_NAMES_FULL[i]}
                  className={cx(
                    'h-10 flex-1 cursor-pointer rounded-[var(--radius-control)] border text-xs font-bold transition-colors duration-150',
                    on
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]',
                  )}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Notes <span className="font-normal text-[var(--color-fg-muted)]">(optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Chapters, modules, what “done” means…"
            className="resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-2.5 text-sm outline-none"
          />
        </label>

        <div className="flex gap-2">
          <Button type="submit" variant="primary">Add deadline</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}

function DeadlineCard({ deadline: d }: { deadline: Deadline }) {
  const { updateDeadline, removeDeadline, logDeadlineHours, removeDeadlineLog } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [gran, setGran] = useState<Granularity>('daily')
  const [logValue, setLogValue] = useState('')

  const s = deadlineStats(d)
  const buckets = useMemo(() => strategy(d, gran), [d, gran])
  const archived = !!d.archivedAt

  /*
   * The moment worth marking is the last hour being logged, not the archiving
   * that happens afterwards — by then the work is already over and the screen
   * has moved on. Starts as null so a finished deadline does not re-celebrate
   * every time this list renders.
   */
  const finishedBefore = useRef<boolean | null>(null)
  useEffect(() => {
    const prev = finishedBefore.current
    finishedBefore.current = s.finished
    if (prev === false && s.finished && !archived) {
      celebrate({
        kind: 'deadline',
        title: 'Deadline met',
        detail: `${d.title} — all ${d.totalHours} hours logged.`,
      })
    }
  }, [s.finished, archived, d.title, d.totalHours])

  const quickLog = (h: number) => logDeadlineHours(d.id, h)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cx(
        'rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-5',
        archived && 'opacity-60',
        !archived && s.pace === 'at-risk' && 'border-[var(--color-destructive)]',
        !archived && s.overdue && 'border-[var(--color-destructive)]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold tracking-tight">{d.title}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
            Due {fmtLong(d.due)} · {d.totalHours}h estimated
          </p>
          {d.description && (
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{d.description}</p>
          )}
        </div>
        <Countdown msLeft={s.msLeft} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <span className={cx('text-sm font-bold', PACE_TONE[s.pace])}>
            {PACE_LABEL[s.pace]}
          </span>
          <span className="text-sm font-semibold tabular-nums text-[var(--color-fg-muted)]">
            {fmtHours(s.done)} of {d.totalHours}h · {Math.round(s.percent)}%
          </span>
        </div>
        <Bar value={s.percent} label={`${d.title} completion`} />
      </div>

      {/* The headline number: what today actually asks of you. */}
      {!archived && !s.finished && !s.overdue && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric
            label="Do today"
            value={fmtHours(s.todayTarget)}
            hint={s.todayDone > 0 ? `${fmtHours(s.todayDone)} logged already` : 'to stay on pace'}
            strong
          />
          <Metric
            label="Per working day"
            value={fmtHours(s.perDay)}
            hint={`${s.workdaysLeft} working ${s.workdaysLeft === 1 ? 'day' : 'days'} left`}
          />
          <Metric
            label="Still to do"
            value={fmtHours(s.remaining)}
            hint={`expected ${fmtHours(s.expected)} by now`}
          />
        </div>
      )}

      {s.finished && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] p-3 text-sm font-semibold text-[var(--color-primary)]">
          All {d.totalHours} hours logged. Archive it when you are ready.
        </p>
      )}

      {!archived && !s.finished && s.workdaysLeft === 0 && !s.overdue && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-[var(--color-destructive)] p-3 text-sm">
          No working days left before the due date. Either widen the working days above,
          move the date, or cut the scope — the current plan cannot fit.
        </p>
      )}

      {!archived && !s.finished && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Log time
          </span>
          {[0.5, 1, 2].map((h) => (
            <Button key={h} size="sm" onClick={() => quickLog(h)}>+{fmtHours(h)}</Button>
          ))}
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              const h = Number(logValue)
              if (Number.isFinite(h) && h > 0) quickLog(h)
              setLogValue('')
            }}
          >
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              placeholder="hrs"
              aria-label={`Hours to log against ${d.title}`}
              className="min-h-9 w-20 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-2 text-sm outline-none"
            />
            <Button size="sm" type="submit" variant="primary">Add</Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--color-primary)]"
      >
        <TrendingUp size={15} aria-hidden="true" />
        Strategise
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-3 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-3">
              <div className="flex rounded-[var(--radius-control)] border bg-[var(--color-surface)] p-0.5" role="tablist" aria-label="Plan granularity">
                {GRANULARITIES.map(([g, label]) => (
                  <button
                    key={g}
                    role="tab"
                    aria-selected={gran === g}
                    onClick={() => setGran(g)}
                    className={cx(
                      'min-h-9 flex-1 cursor-pointer rounded-[var(--radius-micro)] px-3 text-sm font-semibold transition-colors duration-150',
                      gran === g
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                        : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--color-surface-2)]">
                    <tr className="border-b text-xs uppercase text-[var(--color-fg-muted)]">
                      <th scope="col" className="py-2 pr-3 font-bold">
                        {gran === 'daily' ? 'Day' : gran === 'weekly' ? 'Week' : 'Month'}
                      </th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Target</th>
                      <th scope="col" className="py-2 text-right font-bold">Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((b) => (
                      <tr
                        key={b.key}
                        className={cx(
                          'border-b last:border-0',
                          b.isCurrent && 'bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]',
                        )}
                      >
                        <th scope="row" className="py-2 pr-3 font-medium">
                          {b.label}
                          {b.isCurrent && (
                            <span className="ml-2 text-xs font-bold text-[var(--color-primary)]">now</span>
                          )}
                        </th>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {b.target > 0 ? fmtHours(b.target) : '—'}
                        </td>
                        <td
                          className={cx(
                            'py-2 text-right tabular-nums',
                            b.logged > 0 ? 'font-semibold' : 'text-[var(--color-fg-muted)]',
                            b.isPast && b.logged === 0 && 'text-[var(--color-destructive)]',
                          )}
                        >
                          {b.logged > 0 ? fmtHours(b.logged) : b.isPast ? 'missed' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {buckets.length === 0 && (
                  <p className="py-3 text-sm text-[var(--color-fg-muted)]">
                    Nothing to plan — the due date has passed.
                  </p>
                )}
              </div>

              {d.log.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Time log ({d.log.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {[...d.log].sort((a, b) => b.date.localeCompare(a.date)).map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-[var(--color-fg-muted)]">{l.date}</span>
                        <span className="font-semibold tabular-nums">{fmtHours(l.hours)}</span>
                        <button
                          onClick={() => removeDeadlineLog(d.id, l.id)}
                          aria-label={`Remove ${l.hours} hours logged on ${l.date}`}
                          className="cursor-pointer rounded-[var(--radius-micro)] p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-destructive)]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <label className="flex items-center gap-2 text-xs font-semibold">
                  Due
                  <input
                    type="date"
                    value={d.due}
                    onChange={(e) => e.target.value && updateDeadline(d.id, { due: e.target.value })}
                    className="min-h-9 cursor-pointer rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  Hours
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={d.totalHours}
                    onChange={(e) =>
                      updateDeadline(d.id, { totalHours: Math.max(0.5, Number(e.target.value)) })
                    }
                    className="min-h-9 w-24 rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-2 text-sm"
                  />
                </label>
                <span className="flex items-center gap-1">
                  {DAY_INITIALS.map((letter, i) => {
                    const on = d.workdays.includes(i)
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          updateDeadline(d.id, {
                            workdays: on
                              ? d.workdays.filter((x) => x !== i)
                              : [...d.workdays, i],
                          })
                        }
                        aria-pressed={on}
                        aria-label={DAY_NAMES_FULL[i]}
                        className={cx(
                          'size-8 cursor-pointer rounded-[var(--radius-micro)] border text-xs font-bold',
                          on
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                            : 'bg-[var(--color-surface)] text-[var(--color-fg-muted)]',
                        )}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </span>

                <span className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateDeadline(d.id, { archivedAt: archived ? undefined : Date.now() })
                    }
                  >
                    {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    {archived ? 'Restore' : 'Archive'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete "${d.title}" and its time log?`)) removeDeadline(d.id)
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

function Metric({
  label, value, hint, strong,
}: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <div
      className={cx(
        'rounded-[var(--radius-control)] border p-3',
        strong
          ? 'border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)]'
          : 'bg-[var(--color-surface-2)]',
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
        {label}
      </p>
      <p
        className={cx(
          'mt-1 text-2xl font-extrabold tabular-nums',
          strong && 'text-[var(--color-primary)]',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">{hint}</p>
    </div>
  )
}
