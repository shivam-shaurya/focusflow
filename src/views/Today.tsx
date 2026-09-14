import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Flame, Inbox, Sparkles, Star } from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtLong, iso, streak, todayISO, weekDates } from '../lib/date'
import { Bar, Button, Card, Empty, Pill, SectionTitle } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { QuickAdd } from '../components/QuickAdd'
import { FocusTimer } from '../components/FocusTimer'
import { GoalList } from '../components/GoalList'
import { Cover } from '../components/ImagePicker'
import { WEEKDAY_IDS } from '../lib/covers'
import { QuoteCard } from '../components/QuoteCard'
import { DeadlineNudge } from '../components/DeadlineNudge'

export function Today() {
  const { state, updateTask, setDayCover } = useStore()
  const today = todayISO()
  const [showInbox, setShowInbox] = useState(true)

  const todays = useMemo(() => state.tasks.filter((t) => t.date === today), [state.tasks, today])
  const inbox = useMemo(() => state.tasks.filter((t) => !t.date && !t.done), [state.tasks])

  const goalsDone = state.goals.filter((g) => g.history.includes(today)).length
  const tasksDone = todays.filter((t) => t.done).length
  const totalItems = state.goals.length + todays.length
  const doneItems = goalsDone + tasksDone
  const pct = totalItems === 0 ? 0 : (doneItems / totalItems) * 100

  const weekday = (new Date().getDay() + 6) % 7
  const cover = state.settings.dayCovers[String(weekday)]

  const dayStreak = streak([
    ...state.tasks.filter((t) => t.done && t.completedAt).map((t) => iso(new Date(t.completedAt as number))),
    ...state.goals.flatMap((g) => g.history),
  ])

  const week = weekDates(new Date())
  const theOne = todays.find((t) => !t.done)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">{fmtLong(today)}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {state.settings.name ? `Hey, ${state.settings.name}.` : 'Today'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="accent">
            <span className="inline-flex items-center gap-1">
              <Flame size={12} aria-hidden="true" /> {dayStreak} day streak
            </span>
          </Pill>
          <Pill>{doneItems}/{totalItems} done</Pill>
        </div>
      </header>

      <QuoteCard />

      {theOne && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-[var(--radius-card)] border-2 border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_10%,var(--color-surface))] p-5"
        >
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-[var(--color-primary)]">
            <Star size={13} aria-hidden="true" /> If you only do one thing
          </p>
          <p className="mt-2 text-xl font-bold">{theOne.title}</p>
          {theOne.description.trim() && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-fg-muted)]">{theOne.description}</p>
          )}
        </motion.div>
      )}

      <DeadlineNudge onOpen={() => { window.location.hash = '#/deadlines' }} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)]">
            <Cover
              src={cover}
              height={140}
              label="Cover for today"
              defaultId={WEEKDAY_IDS[weekday]}
              onChange={(url) => setDayCover(weekday, url)}
            />
            <div className="p-5">
              <SectionTitle
                title="Daily goals"
                hint="Rename, reorder, or delete any of them. Click one to add detail."
                action={<span className="text-2xl font-extrabold tabular-nums">{Math.round(pct)}%</span>}
              />
              <Bar value={pct} label="Today's completion" />
              <div className="mt-3">
                <GoalList date={today} />
              </div>
            </div>
          </section>

          <Card>
            <SectionTitle title="Today's tasks" hint="One-off things, on top of the daily goals." />
            <QuickAdd date={today} placeholder="What else needs to happen today?" />
            <ul className="mt-3 flex flex-col">
              <AnimatePresence initial={false}>
                {todays.map((t) => <TaskRow key={t.id} task={t} />)}
              </AnimatePresence>
            </ul>
            {todays.length === 0 && (
              <div className="mt-3">
                <Empty
                  icon={<Sparkles size={22} />}
                  title="No extra tasks"
                  hint="The seven goals above are enough for a full day."
                />
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle
              title="Inbox"
              hint="Dump it here now, decide later."
              action={
                <Button size="sm" variant="ghost" onClick={() => setShowInbox((v) => !v)}>
                  {showInbox ? 'Hide' : `Show (${inbox.length})`}
                </Button>
              }
            />
            <QuickAdd placeholder="Brain-dump anything…" />
            {showInbox && (
              <ul className="mt-3 flex flex-col">
                <AnimatePresence initial={false}>
                  {inbox.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <ul className="min-w-0 flex-1"><TaskRow task={t} /></ul>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTask(t.id, { date: today, bucket: 'today' })}
                      >
                        &rarr; Today
                      </Button>
                    </div>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            {showInbox && inbox.length === 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                <Inbox size={15} aria-hidden="true" /> Inbox is empty.
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <FocusTimer />

          <Card>
            <SectionTitle title="This week" hint="Goal check-ins, Monday to Sunday." />
            <div className="flex flex-col gap-3">
              {[...state.goals].sort((a, b) => a.order - b.order).map((g) => {
                const hits = week.filter((d) => g.history.includes(d)).length
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        <span aria-hidden="true">{g.emoji}</span> {g.name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-fg-muted)]">
                        {hits}/7
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {week.map((d) => (
                        <span
                          key={d}
                          title={d}
                          className={[
                            'h-2 flex-1 rounded-full',
                            g.history.includes(d)
                              ? 'bg-[var(--color-primary)]'
                              : 'bg-[var(--color-surface-2)]',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
