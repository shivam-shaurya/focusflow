import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ArrowRight, Flame, Inbox, Sparkles, Star, Target } from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtLong, iso, streak, todayISO, weekDates } from '../lib/date'
import { Bar, Button, Card, Empty, Eyebrow, SectionTitle } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { QuickAdd } from '../components/QuickAdd'
import { FocusTimer } from '../components/FocusTimer'
import { GoalList } from '../components/GoalList'
import { Cover } from '../components/ImagePicker'
import { WEEKDAY_IDS } from '../lib/covers'
import { quoteOfTheDay } from '../lib/quotes'
import { DeadlineNudge } from '../components/DeadlineNudge'
import { AnimatedNumber, Aurora, ProgressRing, Stagger, StaggerItem } from '../components/motion'

/**
 * Bento layout: a 6-column grid where tiles claim different spans, so the eye
 * gets a route through the screen instead of a stack of equal boxes. The hero
 * is the widest and tallest thing on the page; the numbers are small and dense;
 * everything collapses to one column on a phone.
 */
export function Today() {
  const { state, updateTask, setDayCover } = useStore()
  const today = todayISO()
  const [showInbox, setShowInbox] = useState(false)

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
  const quote = quoteOfTheDay(today)

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-6" delay={0.02}>

        {/* ── Hero: cover image, greeting, the one thing, completion ring ── */}
        <StaggerItem className="md:col-span-6 xl:col-span-4">
          <div className="relative h-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)]">
            <div className="relative">
              <Cover
                src={cover}
                height={200}
                label="Cover for today"
                defaultId={WEEKDAY_IDS[weekday]}
                rounded=""
                onChange={(url) => setDayCover(weekday, url)}
              />
              {/* Gradient lets the headline sit legibly over any image. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, var(--color-surface) 2%, color-mix(in oklab, var(--color-surface) 55%, transparent) 40%, transparent 85%)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <Eyebrow>{fmtLong(today)}</Eyebrow>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {state.settings.name ? `Hey, ${state.settings.name}.` : 'Today'}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 p-5">
              <ProgressRing value={pct} size={76} stroke={8}>
                <AnimatedNumber
                  value={pct}
                  suffix="%"
                  className="text-sm font-extrabold tabular-nums"
                />
              </ProgressRing>
              <div className="min-w-0 flex-1">
                {theOne ? (
                  <>
                    <Eyebrow className="flex items-center gap-1.5">
                      <Star size={12} aria-hidden="true" /> If you only do one thing
                    </Eyebrow>
                    <p className="mt-1 truncate text-xl font-bold">{theOne.title}</p>
                    {theOne.description.trim() && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-[var(--color-fg-muted)]">
                        {theOne.description}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Eyebrow>Nothing left</Eyebrow>
                    <p className="mt-1 text-xl font-bold">
                      {doneItems > 0 ? 'Day cleared.' : 'Add one thing to start.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ── Small stat tiles ── */}
        <StaggerItem className="md:col-span-3 xl:col-span-2">
          <div className="grid h-full grid-cols-2 gap-4 xl:grid-cols-1">
            <Card className="flex flex-col justify-center !p-4">
              <Eyebrow className="flex items-center gap-1.5">
                <Flame size={12} aria-hidden="true" /> Streak
              </Eyebrow>
              <p className="mt-1 flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={dayStreak}
                  className="text-4xl font-extrabold tabular-nums text-[var(--color-accent)]"
                />
                <span className="text-sm font-semibold text-[var(--color-fg-muted)]">
                  {dayStreak === 1 ? 'day' : 'days'}
                </span>
              </p>
            </Card>
            <Card className="flex flex-col justify-center !p-4">
              <Eyebrow className="flex items-center gap-1.5">
                <Target size={12} aria-hidden="true" /> Done today
              </Eyebrow>
              <p className="mt-1 flex items-baseline gap-1.5">
                <AnimatedNumber value={doneItems} className="text-4xl font-extrabold tabular-nums" />
                <span className="text-sm font-semibold text-[var(--color-fg-muted)]">
                  / {totalItems}
                </span>
              </p>
            </Card>
          </div>
        </StaggerItem>

        {/* ── Focus timer gets its own tile ── */}
        <StaggerItem className="md:col-span-3 xl:col-span-2">
          <FocusTimer />
        </StaggerItem>

        {/* ── Deadlines nudge spans full width when it has something to say ── */}
        <StaggerItem className="md:col-span-6">
          <DeadlineNudge onOpen={() => { window.location.hash = '#/deadlines' }} />
        </StaggerItem>

        {/* ── Daily goals: the working surface, widest tile ── */}
        <StaggerItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <SectionTitle
              title="Daily goals"
              hint="Rename, reorder, or delete any of them. Click one to add detail."
              action={
                <AnimatedNumber
                  value={totalItems === 0 ? 0 : (goalsDone / Math.max(1, state.goals.length)) * 100}
                  suffix="%"
                  className="text-2xl font-extrabold tabular-nums"
                />
              }
            />
            <Bar value={pct} label="Today's completion" />
            <div className="mt-4">
              <GoalList date={today} />
            </div>
          </Card>
        </StaggerItem>

        {/* ── Quote tile, with the aurora wash ── */}
        <StaggerItem className="md:col-span-6 xl:col-span-2">
          <div className="relative h-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-tile)]">
            <Aurora />
            <div className="relative flex h-full flex-col justify-center">
              <Eyebrow>Today&rsquo;s note</Eyebrow>
              <blockquote className="mt-2 text-balance text-lg font-medium leading-snug">
                {quote.text}
              </blockquote>
              {quote.author && (
                <p className="mt-2 text-sm text-[var(--color-fg-muted)]">&mdash; {quote.author}</p>
              )}
            </div>
          </div>
        </StaggerItem>

        {/* ── Tasks ── */}
        <StaggerItem className="md:col-span-6 xl:col-span-3">
          <Card className="h-full">
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
                  hint="The daily goals are enough for a full day."
                />
              </div>
            )}
          </Card>
        </StaggerItem>

        {/* ── Inbox ── */}
        <StaggerItem className="md:col-span-6 xl:col-span-3">
          <Card className="h-full">
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
                        aria-label={`Move "${t.title}" to today`}
                      >
                        <ArrowRight size={14} />
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
        </StaggerItem>

        {/* ── Week strip: wide and short, closes the page ── */}
        <StaggerItem className="md:col-span-6">
          <Card>
            <SectionTitle title="This week" hint="Goal check-ins, Monday to Sunday." />
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...state.goals].sort((a, b) => a.order - b.order).map((g) => {
                const hits = week.filter((d) => g.history.includes(d)).length
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {g.name}
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
                            'h-1.5 flex-1 rounded-full transition-colors duration-200',
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
        </StaggerItem>
      </Stagger>
    </div>
  )
}
