import type { Deadline } from './types'
import { MONTH_NAMES, addDays, iso, parseISO, startOfWeek, todayISO, weekNumber } from './date'

/** 0 = Monday, matching the rest of the app. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7

export const ALL_WORKDAYS = [0, 1, 2, 3, 4, 5, 6]

/**
 * Every date from `from` to `to` inclusive that the user is willing to work on.
 * This is the unit the whole module divides by — not calendar days — so someone
 * who never studies at weekends gets a pace they can actually hit.
 */
export function availableDates(from: string, to: string, workdays: number[]): string[] {
  if (to < from) return []
  const set = new Set(workdays.length ? workdays : ALL_WORKDAYS)
  const out: string[] = []
  let cursor = parseISO(from)
  const end = parseISO(to)
  // Guard against a pathological range; 10 years of days is far past useful.
  for (let i = 0; cursor <= end && i < 3700; i++) {
    if (set.has(weekdayIndex(cursor))) out.push(iso(cursor))
    cursor = addDays(cursor, 1)
  }
  return out
}

export const loggedHours = (d: Deadline) => d.log.reduce((a, l) => a + l.hours, 0)

export const hoursOn = (d: Deadline, date: string) =>
  d.log.filter((l) => l.date === date).reduce((a, l) => a + l.hours, 0)

export type Pace = 'done' | 'ahead' | 'on-track' | 'behind' | 'at-risk' | 'overdue'

export interface DeadlineStats {
  done: number
  remaining: number
  /** 0..100 */
  percent: number
  /** Calendar days until the due date; negative once it has passed. */
  daysLeft: number
  /** Working days left, today included. */
  workdaysLeft: number
  /** Hours per remaining working day needed to finish on time. */
  perDay: number
  /** What today's share is, after any hours already logged today. */
  todayTarget: number
  todayDone: number
  /** Linear expectation given how much of the working time has elapsed. */
  expected: number
  pace: Pace
  overdue: boolean
  finished: boolean
  /** Milliseconds until the end of the due day; negative once past. */
  msLeft: number
}

export function deadlineStats(d: Deadline, now = new Date()): DeadlineStats {
  const today = iso(now)
  const done = loggedHours(d)
  const remaining = Math.max(0, d.totalHours - done)
  const percent = d.totalHours > 0 ? Math.min(100, (done / d.totalHours) * 100) : 0
  const finished = remaining <= 0

  const dueDate = parseISO(d.due)
  const endOfDue = new Date(dueDate)
  endOfDue.setHours(23, 59, 59, 999)
  const msLeft = endOfDue.getTime() - now.getTime()
  const daysLeft = Math.ceil((endOfDue.getTime() - now.getTime()) / 86_400_000)
  const overdue = msLeft < 0

  const left = availableDates(today, d.due, d.workdays)
  const workdaysLeft = left.length
  const perDay = finished || workdaysLeft === 0 ? 0 : remaining / workdaysLeft

  const todayDone = hoursOn(d, today)
  const todayTarget = left[0] === today ? Math.max(0, perDay - todayDone) : 0

  // Expectation is linear across the working days of the whole run, so someone
  // who starts late sees the shortfall rather than a flattering average.
  const startISO = iso(new Date(d.createdAt))
  const whole = availableDates(startISO < d.due ? startISO : d.due, d.due, d.workdays)
  const elapsed = Math.max(0, whole.length - workdaysLeft)
  const expected = whole.length > 0 ? (d.totalHours * elapsed) / whole.length : d.totalHours

  let pace: Pace
  if (finished) pace = 'done'
  else if (overdue) pace = 'overdue'
  else if (workdaysLeft === 0) pace = 'at-risk'
  else if (done >= expected + Math.max(1, d.totalHours * 0.05)) pace = 'ahead'
  else if (done >= expected - Math.max(1, d.totalHours * 0.05)) pace = 'on-track'
  else if (perDay <= 8) pace = 'behind'
  else pace = 'at-risk'

  return {
    done, remaining, percent, daysLeft, workdaysLeft, perDay,
    todayTarget, todayDone, expected, pace, overdue, finished, msLeft,
  }
}

export const PACE_LABEL: Record<Pace, string> = {
  done: 'Finished',
  ahead: 'Ahead of pace',
  'on-track': 'On track',
  behind: 'Behind — raise the daily target',
  'at-risk': 'At risk — the maths no longer fits',
  overdue: 'Past due',
}

/* ── strategise ──────────────────────────────────────────────────────────── */

export type Granularity = 'daily' | 'weekly' | 'monthly'

export interface Bucket {
  key: string
  label: string
  /** Working days this bucket contains. */
  days: number
  /** Hours to put in to stay on schedule. */
  target: number
  /** Hours already logged inside it. */
  logged: number
  isPast: boolean
  isCurrent: boolean
}

const bucketKey = (date: string, g: Granularity): string => {
  if (g === 'daily') return date
  const d = parseISO(date)
  if (g === 'weekly') return iso(startOfWeek(d))
  return date.slice(0, 7)
}

const bucketLabel = (key: string, g: Granularity): string => {
  if (g === 'daily') {
    const d = parseISO(key)
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  }
  if (g === 'weekly') {
    const d = parseISO(key)
    return `Week ${weekNumber(d)} · from ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
  }
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/**
 * Splits the remaining effort across the remaining working days, then groups
 * those days into buckets. Dividing by days rather than by bucket count keeps a
 * short final week from being handed a full week's worth of hours.
 */
export function strategy(d: Deadline, g: Granularity, now = new Date()): Bucket[] {
  const today = iso(now)
  const { remaining } = deadlineStats(d, now)
  const left = availableDates(today, d.due, d.workdays)
  const perDay = left.length > 0 ? remaining / left.length : 0

  // Past buckets come from the log, so the table shows the whole run.
  const pastDates = [...new Set(d.log.map((l) => l.date))].filter((x) => x < today).sort()

  const order: string[] = []
  const map = new Map<string, Bucket>()

  const touch = (date: string, isFuture: boolean) => {
    const key = bucketKey(date, g)
    if (!map.has(key)) {
      order.push(key)
      map.set(key, {
        key,
        label: bucketLabel(key, g),
        days: 0,
        target: 0,
        logged: 0,
        isPast: false,
        isCurrent: bucketKey(today, g) === key,
      })
    }
    const b = map.get(key)!
    if (isFuture) {
      b.days += 1
      b.target += perDay
    }
  }

  for (const date of pastDates) touch(date, false)
  for (const date of left) touch(date, true)

  for (const l of d.log) {
    const key = bucketKey(l.date, g)
    const b = map.get(key)
    if (b) b.logged += l.hours
  }

  for (const key of order) {
    const b = map.get(key)!
    b.isPast = key < bucketKey(today, g)
  }

  return order.map((k) => map.get(k)!)
}

/** Hours to do today across every active deadline, for the nudge on Today. */
export function todayLoad(deadlines: Deadline[], now = new Date()) {
  const active = deadlines.filter((d) => !d.archivedAt)
  let hours = 0
  let count = 0
  for (const d of active) {
    const s = deadlineStats(d, now)
    if (s.finished || s.overdue) continue
    if (s.todayTarget > 0) {
      hours += s.todayTarget
      count += 1
    }
  }
  return { hours, count, urgent: active.filter((d) => {
    const s = deadlineStats(d, now)
    return !s.finished && (s.pace === 'behind' || s.pace === 'at-risk' || s.overdue)
  }) }
}

/** "3d 04h 12m" style countdown pieces. */
export function countdownParts(ms: number) {
  const abs = Math.abs(ms)
  return {
    negative: ms < 0,
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor(abs / 3_600_000) % 24,
    minutes: Math.floor(abs / 60_000) % 60,
    seconds: Math.floor(abs / 1000) % 60,
  }
}

export const fmtHours = (h: number) => {
  if (h <= 0) return '0h'
  if (h < 1) return `${Math.round(h * 60)}m`
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`
}

export const daysUntil = (dueISO: string) => {
  const a = parseISO(todayISO()).getTime()
  const b = parseISO(dueISO).getTime()
  return Math.round((b - a) / 86_400_000)
}
