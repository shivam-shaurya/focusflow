/** All date keys are local-time ISO dates: "yyyy-mm-dd". */
export const iso = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => iso(new Date())

export const addDays = (d: Date, n: number) => {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

/** Monday-first week start. */
export const startOfWeek = (d: Date) => {
  const c = new Date(d)
  const day = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - day)
  c.setHours(0, 0, 0, 0)
  return c
}

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1)

export const weekDates = (anchor: Date): string[] => {
  const s = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => iso(addDays(s, i)))
}

export const monthDates = (anchor: Date): string[] => {
  const s = startOfMonth(anchor)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return Array.from({ length: end.getDate() }, (_, i) => iso(addDays(s, i)))
}

export const yearDates = (anchor: Date): string[] => {
  const s = startOfYear(anchor)
  const days = (new Date(anchor.getFullYear(), 11, 31).getTime() - s.getTime()) / 86_400_000 + 1
  return Array.from({ length: Math.round(days) }, (_, i) => iso(addDays(s, i)))
}

/** ISO-8601 week number, used to label weekly rollups. */
export const weekNumber = (d: Date): number => {
  const c = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = c.getUTCDay() || 7
  c.setUTCDate(c.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(c.getUTCFullYear(), 0, 1))
  return Math.ceil(((c.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const fmtDay = (isoDate: string) => {
  const d = parseISO(isoDate)
  return `${DAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()}`
}

export const fmtLong = (isoDate: string) => {
  const d = parseISO(isoDate)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export const isToday = (isoDate: string) => isoDate === todayISO()

/** Longest run of consecutive days ending today (or yesterday) in a set of dates. */
export const streak = (dates: string[]): number => {
  const set = new Set(dates)
  let n = 0
  let cursor = new Date()
  if (!set.has(iso(cursor))) cursor = addDays(cursor, -1)
  while (set.has(iso(cursor))) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}
