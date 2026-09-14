import {
  BookOpen, CalendarClock, CalendarDays, Flame, LayoutGrid,
  Settings as SettingsIcon, TrendingUp,
} from 'lucide-react'

export type Route =
  | 'today' | 'planner' | 'deadlines' | 'journal' | 'newme' | 'progress' | 'settings'

export interface NavEntry {
  id: Route
  label: string
  icon: typeof LayoutGrid
  hint: string
  /** Extra words the command palette matches on, so "habits" finds New Me. */
  keywords: string
  /**
   * The view has media or layout a person can change, so the shell offers edit
   * mode while it is open. The rest have nothing to edit, and an Edit control
   * that does nothing is worse than no control.
   */
  editable?: boolean
}

/**
 * One registry, three consumers: the desktop rail, the mobile dock, and the
 * command palette. Adding a view used to mean editing three lists and getting
 * the number-key shortcuts out of sync with the order shown on screen.
 */
export const NAV: NavEntry[] = [
  { id: 'today', label: 'Today', icon: LayoutGrid, hint: 'One day at a time', keywords: 'home dashboard now tasks goals', editable: true },
  { id: 'planner', label: 'Planner', icon: CalendarDays, hint: 'The week ahead', keywords: 'week schedule plan upcoming', editable: true },
  { id: 'deadlines', label: 'Deadlines', icon: CalendarClock, hint: 'What is due', keywords: 'due dates countdown hours pace' },
  { id: 'journal', label: 'Journal', icon: BookOpen, hint: 'Introspection', keywords: 'diary mood reflect write entry' },
  { id: 'newme', label: 'New Me', icon: Flame, hint: 'Read every day', keywords: 'identity habits rules manifesto', editable: true },
  { id: 'progress', label: 'Progress', icon: TrendingUp, hint: 'Week · month · year', keywords: 'stats charts streak history trends' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, hint: 'Rhythm and data', keywords: 'theme backup export import reset' },
]

/** The four that earn a slot in the mobile dock; the rest live behind "More". */
export const DOCK: Route[] = ['today', 'planner', 'deadlines', 'progress']

export const routeFromHash = (): Route => {
  const h = window.location.hash.replace('#/', '')
  return NAV.find((n) => n.id === h)?.id ?? 'today'
}

export const goTo = (r: Route) => { window.location.hash = `#/${r}` }
