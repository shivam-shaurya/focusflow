export type Bucket = 'inbox' | 'today' | 'week' | 'someday'

export interface Task {
  id: string
  title: string
  /** Free-text detail, revealed when the task is opened. */
  description: string
  done: boolean
  /** ISO date (yyyy-mm-dd) the task is scheduled for. Undefined = unscheduled. */
  date?: string
  bucket: Bucket
  createdAt: number
  completedAt?: number
}

/**
 * A goal that repeats every single day (Meditation, Reading, …). Seven ship by
 * default; every one can be renamed, described, reordered, or deleted.
 */
export interface DailyGoal {
  id: string
  name: string
  /** Shared across every day — what this goal means in general. */
  description: string
  /** Emoji shown beside the name. */
  emoji: string
  /** Per-date detail. The name is shared across days; this is not. */
  notes: Record<string, string>
  /** ISO dates on which it was completed. */
  history: string[]
  order: number
}

/** One session of work logged against a deadline. */
export interface HourLog {
  id: string
  date: string
  hours: number
  note?: string
}

/**
 * A dated commitment with an effort estimate — "finish the syllabus, 40 hours,
 * by the 30th". The planner turns that into a required daily pace.
 */
export interface Deadline {
  id: string
  title: string
  description: string
  /** ISO date it is due; the countdown runs to the end of this day. */
  due: string
  /** Total hours the work is estimated to need. */
  totalHours: number
  /** Logged effort, kept as entries so progress stays auditable. */
  log: HourLog[]
  /**
   * Weekday indices (0 = Monday) available to work on this. Lets the pace maths
   * skip days you already know you won't touch it.
   */
  workdays: number[]
  createdAt: number
  /** Set when finished or abandoned; archived deadlines leave the active list. */
  archivedAt?: number
}

export type Mood = 1 | 2 | 3 | 4 | 5

export interface JournalEntry {
  id: string
  date: string
  mood: Mood
  focusRating: Mood
  /** Template id the entry was written against. */
  template: string
  /** Field id -> answer, across every template used that day. */
  answers: Record<string, string>
  freeform: string
  updatedAt: number
}

export interface FocusSession {
  id: string
  taskId?: string
  minutes: number
  startedAt: number
  completed: boolean
}

/** A block in the "New Me" page — the pointed, re-read-daily material. */
export type BlockKind = 'bullets' | 'checklist' | 'prompts' | 'links'
export type BlockTone = 'neutral' | 'warn' | 'danger' | 'gold' | 'blue'

export interface Block {
  id: string
  title: string
  subtitle: string
  kind: BlockKind
  tone: BlockTone
  /** Cover image or gif for this block. */
  image?: string
  items: BlockItem[]
  order: number
  open: boolean
}

export interface BlockItem {
  id: string
  text: string
  /** checklist only */
  done?: boolean
  /** links only */
  url?: string
  /** links only */
  image?: string
}

import type { CelebrationLevel } from './celebrate'

export interface Settings {
  name: string
  theme: 'dark' | 'light'
  focusLength: number
  breakLength: number
  reduceMotion: boolean
  yearTheme: string
  /** Weekday index (0 = Monday) -> image or gif URL for that day's card. */
  dayCovers: Record<string, string>
  /** Banner across the top of the weekly board. */
  banner: string
  avatar: string
  boardTitle: string
  /**
   * How much of the reward layer to show when something is finished. 'calm'
   * keeps the moment but drops the particles; 'off' removes it entirely.
   */
  celebration: CelebrationLevel
  /**
   * Milestone kind -> image or GIF the user attached to it. Empty by default,
   * and the celebrations are designed to be finished without it — anything here
   * is layered into the moment, never the thing that makes it work.
   */
  celebrationMedia: Record<string, string>
  /**
   * Today, stripped to the hero, the goals and the capture field. Kept in
   * settings rather than in component state because it is a way of working,
   * not a mood — it should still be there tomorrow morning.
   */
  todayFocus: boolean
}

export interface AppState {
  /** Schema version of this payload. See SCHEMA in lib/persist.ts. */
  version: number
  tasks: Task[]
  goals: DailyGoal[]
  deadlines: Deadline[]
  journal: JournalEntry[]
  sessions: FocusSession[]
  blocks: Block[]
  settings: Settings
}
