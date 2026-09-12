import type { AppState, Task } from './types'
import { iso, monthDates, parseISO, weekDates, yearDates, MONTH_NAMES } from './date'

export interface Bucketed {
  key: string
  label: string
  done: number
  planned: number
  focusMinutes: number
  journaled: boolean
  habits: number
}

const completedOn = (tasks: Task[], date: string) =>
  tasks.filter((t) => t.done && t.completedAt && iso(new Date(t.completedAt)) === date).length

const plannedOn = (tasks: Task[], date: string) => tasks.filter((t) => t.date === date).length

export function dayStats(state: AppState, date: string): Bucketed {
  const d = parseISO(date)
  const goalHits = state.goals.filter((g) => g.history.includes(date)).length
  return {
    key: date,
    label: String(d.getDate()),
    // A day's work is its goal check-ins plus any one-off tasks.
    done: completedOn(state.tasks, date) + goalHits,
    planned: plannedOn(state.tasks, date) + state.goals.length,
    focusMinutes: state.sessions
      .filter((s) => s.completed && iso(new Date(s.startedAt)) === date)
      .reduce((a, s) => a + s.minutes, 0),
    journaled: state.journal.some((j) => j.date === date),
    habits: goalHits,
  }
}

const sum = (rows: Bucketed[]) =>
  rows.reduce(
    (a, r) => ({
      done: a.done + r.done,
      planned: a.planned + r.planned,
      focusMinutes: a.focusMinutes + r.focusMinutes,
      journaled: a.journaled + (r.journaled ? 1 : 0),
      habits: a.habits + r.habits,
    }),
    { done: 0, planned: 0, focusMinutes: 0, journaled: 0, habits: 0 },
  )

export function weekRows(state: AppState, anchor: Date): Bucketed[] {
  return weekDates(anchor).map((d) => dayStats(state, d))
}

export function monthRows(state: AppState, anchor: Date): Bucketed[] {
  return monthDates(anchor).map((d) => dayStats(state, d))
}

/** One row per month of the anchor's year. */
export function yearRows(state: AppState, anchor: Date): Bucketed[] {
  const byMonth: Bucketed[] = MONTH_NAMES.map((label, i) => ({
    key: `${anchor.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
    label,
    done: 0, planned: 0, focusMinutes: 0, journaled: false, habits: 0,
  }))
  for (const date of yearDates(anchor)) {
    const s = dayStats(state, date)
    const m = parseISO(date).getMonth()
    byMonth[m].done += s.done
    byMonth[m].planned += s.planned
    byMonth[m].focusMinutes += s.focusMinutes
    byMonth[m].habits += s.habits
    byMonth[m].journaled = byMonth[m].journaled || s.journaled
  }
  return byMonth
}

export function rollup(rows: Bucketed[]) {
  const t = sum(rows)
  return {
    ...t,
    completionRate: t.planned === 0 ? 0 : Math.round((t.done / t.planned) * 100),
    focusHours: Math.round((t.focusMinutes / 60) * 10) / 10,
    activeDays: rows.filter((r) => r.done > 0 || r.habits > 0 || r.journaled).length,
  }
}
