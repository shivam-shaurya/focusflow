import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useStore } from '../lib/store'
import {
  MONTH_NAMES, addDays, fmtDay, iso, parseISO, startOfWeek, weekNumber, yearDates,
} from '../lib/date'
import { monthRows, rollup, weekRows, yearRows, type Bucketed } from '../lib/progress'
import { BarChart, Heatmap, Stat, type Datum } from '../components/charts'
import { Bar, Button, Card, PageHeader, SectionTitle, cx } from '../components/ui'
import { Swipe, useArrowPaging } from '../components/Swipe'

type Range = 'week' | 'month' | 'year'

const RANGES: Array<{ id: Range; label: string }> = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

export function Progress() {
  const { state } = useStore()
  const [range, setRange] = useState<Range>('week')
  const [offset, setOffset] = useState(0)

  const anchor = useMemo(() => {
    const now = new Date()
    if (range === 'week') return startOfWeek(addDays(now, offset * 7))
    if (range === 'month') return new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return new Date(now.getFullYear() + offset, 0, 1)
  }, [range, offset])

  const rows: Bucketed[] = useMemo(() => {
    if (range === 'week') return weekRows(state, anchor)
    if (range === 'month') return monthRows(state, anchor)
    return yearRows(state, anchor)
  }, [range, anchor, state])

  const totals = rollup(rows)

  const title =
    range === 'week'
      ? `Week ${weekNumber(anchor)}, ${anchor.getFullYear()}`
      : range === 'month'
        ? `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`
        : String(anchor.getFullYear())

  const taskData: Datum[] = rows.map((r) => ({
    key: r.key,
    label: range === 'week' ? fmtDay(r.key).split(' ')[0] : r.label,
    value: r.done,
    meta: `${r.planned} possible · ${r.habits} goal check-ins`,
  }))

  const focusData: Datum[] = rows.map((r) => ({
    key: r.key,
    label: range === 'week' ? fmtDay(r.key).split(' ')[0] : r.label,
    value: Math.round((r.focusMinutes / 60) * 10) / 10,
  }))

  // Year heatmap is always the full calendar year of the anchor.
  const heatCells = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of state.tasks) {
      if (!t.done || !t.completedAt) continue
      const k = iso(new Date(t.completedAt))
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    for (const g of state.goals) {
      for (const k of g.history) counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    return yearDates(anchor).map((d) => ({
      key: d,
      value: counts.get(d) ?? 0,
      label: parseISO(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
  }, [state.tasks, state.goals, anchor])

  const journalDays = range === 'year'
    ? new Set(state.journal.map((j) => j.date.slice(0, 4))).size
    : totals.journaled

  const avgMood = useMemo(() => {
    const keys = new Set(rows.map((r) => r.key))
    const relevant = state.journal.filter((j) =>
      range === 'year' ? j.date.startsWith(String(anchor.getFullYear())) : keys.has(j.date),
    )
    if (relevant.length === 0) return null
    return Math.round((relevant.reduce((a, j) => a + j.mood, 0) / relevant.length) * 10) / 10
  }, [rows, state.journal, range, anchor])

  const goBack = () => setOffset((o) => o - 1)
  // Forward stops at the present: there is nothing recorded after today.
  const goForward = () => setOffset((o) => Math.min(0, o + 1))
  useArrowPaging(goBack, goForward)

  return (
    <Swipe
      onPrev={goBack}
      onNext={goForward}
      className="mx-auto flex w-full max-w-7xl flex-col gap-4"
    >
      <PageHeader
        icon={TrendingUp}
        eyebrow="Progress"
        title={title}
        actions={<>
          <div className="flex rounded-[var(--radius-control)] border p-0.5" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={range === r.id}
                onClick={() => { setRange(r.id); setOffset(0) }}
                className={cx(
                  'min-h-9 cursor-pointer rounded-[var(--radius-micro)] px-3 text-sm font-semibold transition-colors duration-150',
                  range === r.id
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={goBack} aria-label={`Previous ${range}`}>
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" variant="ghost" disabled={offset >= 0} onClick={goForward} aria-label={`Next ${range}`}>
            <ChevronRight size={16} />
          </Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Check-ins" value={totals.done} sub={`${totals.planned} possible`} />
        <Stat
          label="Completion"
          value={`${totals.completionRate}%`}
          tone="accent"
          sub={totals.planned === 0 ? 'Nothing planned yet' : 'of what you planned'}
        />
        <Stat label="Focus time" value={totals.focusHours} unit="h" sub={`${totals.focusMinutes} minutes tracked`} />
        <Stat
          label="Active days"
          value={totals.activeDays}
          unit={`/ ${rows.length}`}
          sub={avgMood !== null ? `Avg mood ${avgMood}/5` : 'No journal entries yet'}
        />
      </div>

      <Card>
        <SectionTitle
          title="Completed per period"
          hint={range === 'year' ? 'One bar per month' : 'One bar per day'}
        />
        <BarChart data={taskData} title={`Goals and tasks completed per ${range === 'year' ? 'month' : 'day'}`} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Focus hours" hint="Time actually spent in timed blocks." />
          <BarChart data={focusData} unit="h" height={140} title="Focus hours" />
        </Card>

        <Card>
          <SectionTitle title="Consistency" hint="Showing up beats intensity." />
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-semibold">Days with something done</span>
                <span className="text-sm font-bold tabular-nums">
                  {Math.round((totals.activeDays / Math.max(1, rows.length)) * 100)}%
                </span>
              </div>
              <Bar value={(totals.activeDays / Math.max(1, rows.length)) * 100} label="Active days" />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-semibold">Daily goal check-ins</span>
                <span className="text-sm font-bold tabular-nums">{totals.habits}</span>
              </div>
              <Bar
                value={(totals.habits / Math.max(1, rows.length * Math.max(1, state.goals.length))) * 100}
                label="Habit check-ins"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-semibold">Journal entries</span>
                <span className="text-sm font-bold tabular-nums">{journalDays}</span>
              </div>
              <Bar value={(totals.journaled / Math.max(1, rows.length)) * 100} label="Journal entries" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title={`${anchor.getFullYear()} at a glance`}
          hint="Every day of the year. Gaps are information, not failure."
        />
        <Heatmap cells={heatCells} title={`Goals and tasks completed each day of ${anchor.getFullYear()}`} />
      </Card>

      <details className="rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-5 shadow-[var(--shadow-tile)]">
        <summary className="cursor-pointer text-sm font-bold">View as table</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-[var(--color-fg-muted)]">
                <th scope="col" className="py-2 pr-4 font-bold">Period</th>
                <th scope="col" className="py-2 pr-4 font-bold">Done</th>
                <th scope="col" className="py-2 pr-4 font-bold">Planned</th>
                <th scope="col" className="py-2 pr-4 font-bold">Focus (min)</th>
                <th scope="col" className="py-2 font-bold">Habits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 font-semibold">
                    {range === 'year' ? r.label : r.key}
                  </th>
                  <td className="py-2 pr-4 tabular-nums">{r.done}</td>
                  <td className="py-2 pr-4 tabular-nums">{r.planned}</td>
                  <td className="py-2 pr-4 tabular-nums">{r.focusMinutes}</td>
                  <td className="py-2 tabular-nums">{r.habits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Swipe>
  )
}
