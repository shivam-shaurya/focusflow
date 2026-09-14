import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { addDays, fmtDay, isToday, startOfWeek, weekDates, weekNumber } from '../lib/date'
import { Bar, Button, Card, SectionTitle, cx } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { GoalList } from '../components/GoalList'
import { Cover } from '../components/ImagePicker'
import { AnimatedNumber } from '../components/motion'
import { WEEKDAY_IDS } from '../lib/covers'

const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function Planner() {
  const { state, addTask, updateTask, setDayCover, setSettings } = useStore()
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()))
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const days = useMemo(() => weekDates(anchor), [anchor])

  const byDay = useMemo(() => {
    const map: Record<string, typeof state.tasks> = {}
    for (const d of days) map[d] = state.tasks.filter((t) => t.date === d)
    return map
  }, [days, state.tasks])

  const perDayTotal = state.goals.length
  const weekTotal = days.reduce((a, d) => a + byDay[d].length + perDayTotal, 0)
  const weekDone = days.reduce(
    (a, d) =>
      a + byDay[d].filter((t) => t.done).length + state.goals.filter((g) => g.history.includes(d)).length,
    0,
  )
  const pct = weekTotal === 0 ? 0 : (weekDone / weekTotal) * 100

  const shift = (n: number) => setAnchor((a) => startOfWeek(addDays(a, n * 7)))
  const unscheduled = state.tasks.filter((t) => !t.date && !t.done)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Banner — the page's own cover, like a Notion header. */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border shadow-[var(--shadow-tile)]">
        <Cover
          src={state.settings.banner}
          height={180}
          label="Board banner"
          rounded=""
          defaultId="banner"
          onChange={(url) => setSettings({ banner: url })}
        />
        <div className="flex flex-wrap items-end justify-between gap-3 bg-[var(--color-surface)] p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-14 shrink-0">
              <Cover
                src={state.settings.avatar}
                height={56}
                label="Board icon"
                rounded="rounded-xl"
                defaultId="icon"
                onChange={(url) => setSettings({ avatar: url })}
              />
            </div>
            <div className="min-w-0">
              <input
                value={state.settings.boardTitle}
                onChange={(e) => setSettings({ boardTitle: e.target.value })}
                aria-label="Board title"
                className="w-full truncate rounded-[var(--radius-control)] bg-transparent text-2xl font-extrabold tracking-tight outline-none focus:bg-[var(--color-surface-2)] sm:text-3xl"
              />
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                <CalendarDays size={14} aria-hidden="true" />
                Week {weekNumber(anchor)} &middot; {anchor.getFullYear()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => shift(-1)} aria-label="Previous week">
              <ChevronLeft size={16} />
            </Button>
            <Button size="sm" onClick={() => setAnchor(startOfWeek(new Date()))}>This week</Button>
            <Button size="sm" variant="ghost" onClick={() => shift(1)} aria-label="Next week">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <SectionTitle
          title="Week progress"
          hint={`${weekDone} of ${weekTotal} check-ins (${state.goals.length} daily goals × 7 days, plus tasks)`}
          action={<AnimatedNumber value={pct} suffix="%" className="text-2xl font-extrabold tabular-nums" />}
        />
        <Bar value={pct} label="Weekly completion" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {days.map((day, i) => {
          const tasks = byDay[day]
          const goalHits = state.goals.filter((g) => g.history.includes(day)).length
          const dTotal = tasks.length + perDayTotal
          const dDone = tasks.filter((t) => t.done).length + goalHits
          const dPct = dTotal === 0 ? 0 : (dDone / dTotal) * 100
          return (
            <motion.div
              key={day}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03, ease: 'easeOut' }}
              className={cx(
                'flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)]',
                isToday(day)
                  ? 'border-[var(--color-primary)] shadow-[var(--shadow-raised)]'
                  : 'shadow-[var(--shadow-tile)]',
              )}
            >
              <Cover
                src={state.settings.dayCovers[String(i)]}
                height={120}
                label={`${DAY_FULL[i]} cover`}
                defaultId={WEEKDAY_IDS[i]}
                onChange={(url) => setDayCover(i, url)}
              />

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3 className={cx('font-bold', isToday(day) && 'text-[var(--color-primary)]')}>
                    {DAY_FULL[i]}
                    <span className="ml-2 text-xs font-semibold text-[var(--color-fg-muted)]">
                      {fmtDay(day).split(' ')[1]}
                    </span>
                  </h3>
                  <span className="text-xs font-semibold tabular-nums text-[var(--color-fg-muted)]">
                    {dDone}/{dTotal}
                  </span>
                </div>
                <Bar value={dPct} label={`${DAY_FULL[i]} completion`} />

                <div className="mt-3">
                  <GoalList date={day} compact />
                </div>

                {tasks.length > 0 && (
                  <ul className="mt-2 flex flex-col border-t pt-2">
                    <AnimatePresence initial={false}>
                      {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
                    </AnimatePresence>
                  </ul>
                )}

                <form
                  className="mt-auto pt-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const v = (drafts[day] ?? '').trim()
                    if (!v) return
                    addTask({ title: v, date: day, bucket: 'week' })
                    setDrafts((d) => ({ ...d, [day]: '' }))
                  }}
                >
                  <input
                    value={drafts[day] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [day]: e.target.value }))}
                    placeholder="+ Add a one-off task"
                    aria-label={`Add a task on ${DAY_FULL[i]}`}
                    className="min-h-10 w-full rounded-[var(--radius-control)] border border-dashed bg-transparent px-3 text-sm outline-none placeholder:text-[var(--color-fg-muted)] focus:border-solid focus:bg-[var(--color-surface-2)]"
                  />
                </form>
              </div>
            </motion.div>
          )
        })}

        <Card className="flex flex-col">
          <h3 className="mb-1 font-bold">Unscheduled</h3>
          <p className="mb-3 text-xs text-[var(--color-fg-muted)]">
            Drop these into a day when you have the energy for them.
          </p>
          <ul className="flex flex-1 flex-col gap-1">
            {unscheduled.slice(0, 10).map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                <label className="sr-only" htmlFor={`sched-${t.id}`}>Schedule {t.title}</label>
                <select
                  id={`sched-${t.id}`}
                  value=""
                  onChange={(e) => e.target.value && updateTask(t.id, { date: e.target.value, bucket: 'week' })}
                  className="min-h-9 cursor-pointer rounded-[var(--radius-micro)] border bg-[var(--color-surface-2)] px-2 text-xs font-semibold"
                >
                  <option value="">Plan…</option>
                  {days.map((d, k) => (
                    <option key={d} value={d}>{DAY_FULL[k]}</option>
                  ))}
                </select>
              </li>
            ))}
            {unscheduled.length === 0 && (
              <li className="text-sm text-[var(--color-fg-muted)]">Nothing waiting. Clear head.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
