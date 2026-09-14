import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type {
  AppState, Block, BlockItem, BlockKind, DailyGoal, Deadline, FocusSession, JournalEntry,
  Settings, Task,
} from './types'
import { uid } from './seed'
import { todayISO } from './date'
import {
  clearPreImport, loadState, migrate, readPreImport, saveState, seed, stashPreImport,
  type LoadStatus,
} from './persist'

/** How long to coalesce edits before writing. Journal typing fires per keystroke. */
const DEBOUNCE_MS = 400

export type SaveStatus = 'saved' | 'pending' | 'quota' | 'unavailable' | 'frozen'

interface Store {
  state: AppState
  /** What happened to the last write, and whether writing is possible at all. */
  saveStatus: SaveStatus
  /** How the saved payload read on boot — drives the recovery banner. */
  bootStatus: LoadStatus
  /** True while edits are made but not yet flushed to disk. */
  unsaved: boolean
  retrySave: () => void
  /** Human-readable form of a write failure, or '' when writes are fine. */
  storageError: string
  addTask: (t: Partial<Task> & { title: string }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void

  addGoal: (name?: string) => void
  updateGoal: (id: string, patch: Partial<DailyGoal>) => void
  toggleGoal: (id: string, date: string) => void
  /** Writes the note for one date only — other days keep theirs. */
  setGoalNote: (id: string, date: string, text: string) => void
  removeGoal: (id: string) => void
  moveGoal: (id: string, dir: -1 | 1) => void

  addDeadline: (d: Partial<Deadline> & { title: string; due: string; totalHours: number }) => void
  updateDeadline: (id: string, patch: Partial<Deadline>) => void
  removeDeadline: (id: string) => void
  /** Records effort against a deadline. Negative hours are rejected. */
  logDeadlineHours: (id: string, hours: number, date?: string, note?: string) => void
  removeDeadlineLog: (id: string, logId: string) => void

  saveJournal: (entry: Partial<JournalEntry> & { date: string }) => void
  logSession: (s: Omit<FocusSession, 'id'>) => void

  addBlock: (kind: BlockKind) => void
  updateBlock: (id: string, patch: Partial<Block>) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, dir: -1 | 1) => void
  addItem: (blockId: string, item?: Partial<BlockItem>) => void
  updateItem: (blockId: string, itemId: string, patch: Partial<BlockItem>) => void
  removeItem: (blockId: string, itemId: string) => void

  setSettings: (patch: Partial<Settings>) => void
  setDayCover: (weekday: number, url: string) => void
  resetAll: () => void
  exportJSON: () => string
  importJSON: (raw: string) => boolean
  /** Restores the snapshot taken just before the last import. */
  undoImport: () => boolean
  canUndoImport: boolean
}

const Ctx = createContext<Store | null>(null)

const ERRORS: Record<Exclude<SaveStatus, 'saved' | 'pending'>, string> = {
  quota:
    'Browser storage is full — most likely from uploaded images. ' +
    'Download a backup, then remove a few uploaded covers or use image links instead.',
  unavailable:
    'This browser is not allowing FocusFlow to save. Private-browsing windows often ' +
    'block storage. Download a backup so nothing is lost.',
  frozen:
    'Your saved data was written by a newer version of FocusFlow. Nothing is being ' +
    'saved right now, so that newer data is not overwritten. Reload to pick it up.',
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(loadState)
  const [state, setState] = useState<AppState>(boot.state)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    boot.status === 'future' ? 'frozen' : 'saved',
  )
  const [canUndoImport, setCanUndoImport] = useState(() => readPreImport() !== null)

  /**
   * Writing is refused in two cases, both to protect bytes already on disk:
   * a payload from a newer schema, and a corrupt payload we could not copy aside.
   */
  const writable = useRef(
    boot.status !== 'future' && !(boot.status === 'corrupt' && !boot.quarantined),
  )

  /**
   * Latest committed state, for the flush handlers and for the pre-import
   * snapshot. Updated in an effect rather than during render, so it is only ever
   * read after commit — which is true of every caller (timers, DOM events).
   */
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    if (!writable.current) return
    const res = saveState(stateRef.current)
    setSaveStatus(res.ok ? 'saved' : res.reason)
  }, [])

  // Coalesce edits, then write. Skips the very first run: boot.state came off
  // disk (or is a seed we do not want to persist over an unreadable payload).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!writable.current) return
    setSaveStatus((s) => (s === 'saved' ? 'pending' : s))
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, DEBOUNCE_MS)
    return () => window.clearTimeout(timer.current)
  }, [state, flush])

  /**
   * Flush on the way out. `pagehide` is the event that actually fires on mobile;
   * `beforeunload` alone would drop the last keystroke before a tab close.
   */
  useEffect(() => {
    const onHide = () => flush()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [flush])

  const retrySave = useCallback(() => {
    writable.current = boot.status !== 'future'
    flush()
  }, [flush, boot.status])

  const storageError =
    saveStatus === 'saved' || saveStatus === 'pending' ? '' : ERRORS[saveStatus]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark')
  }, [state.settings.theme])

  /* ── tasks ─────────────────────────────────────────────────────────── */

  const addTask = useCallback((t: Partial<Task> & { title: string }) => {
    const task: Task = {
      id: uid(),
      description: '',
      done: false,
      bucket: t.date ? 'today' : 'inbox',
      createdAt: Date.now(),
      ...t,
    }
    setState((s) => ({ ...s, tasks: [task, ...s.tasks] }))
    return task
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t,
      ),
    }))
  }, [])

  const removeTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
  }, [])

  /* ── daily goals ───────────────────────────────────────────────────── */

  const addGoal = useCallback((name = 'New goal') => {
    setState((s) => ({
      ...s,
      goals: [
        ...s.goals,
        {
          id: uid(), name, emoji: '', description: '', notes: {}, history: [],
          order: s.goals.length,
        },
      ],
    }))
  }, [])

  const updateGoal = useCallback((id: string, patch: Partial<DailyGoal>) => {
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  }, [])

  const toggleGoal = useCallback((id: string, date: string) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              history: g.history.includes(date)
                ? g.history.filter((d) => d !== date)
                : [...g.history, date],
            }
          : g,
      ),
    }))
  }, [])

  const setGoalNote = useCallback((id: string, date: string, text: string) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, notes: { ...g.notes, [date]: text } } : g,
      ),
    }))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
  }, [])

  const moveGoal = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const sorted = [...s.goals].sort((a, b) => a.order - b.order)
      const i = sorted.findIndex((g) => g.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= sorted.length) return s
      ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
      return { ...s, goals: sorted.map((g, k) => ({ ...g, order: k })) }
    })
  }, [])

  /* ── deadlines ─────────────────────────────────────────────────────── */

  const addDeadline = useCallback(
    (d: Partial<Deadline> & { title: string; due: string; totalHours: number }) => {
      const deadline: Deadline = {
        id: uid(),
        description: '',
        log: [],
        workdays: [0, 1, 2, 3, 4, 5, 6],
        createdAt: Date.now(),
        ...d,
      }
      setState((s) => ({ ...s, deadlines: [...s.deadlines, deadline] }))
    },
    [],
  )

  const updateDeadline = useCallback((id: string, patch: Partial<Deadline>) => {
    setState((s) => ({
      ...s,
      deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
  }, [])

  const removeDeadline = useCallback((id: string) => {
    setState((s) => ({ ...s, deadlines: s.deadlines.filter((d) => d.id !== id) }))
  }, [])

  const logDeadlineHours = useCallback(
    (id: string, hours: number, date = todayISO(), note?: string) => {
      if (!Number.isFinite(hours) || hours <= 0) return
      setState((s) => ({
        ...s,
        deadlines: s.deadlines.map((d) =>
          d.id === id ? { ...d, log: [...d.log, { id: uid(), date, hours, note }] } : d,
        ),
      }))
    },
    [],
  )

  const removeDeadlineLog = useCallback((id: string, logId: string) => {
    setState((s) => ({
      ...s,
      deadlines: s.deadlines.map((d) =>
        d.id === id ? { ...d, log: d.log.filter((l) => l.id !== logId) } : d,
      ),
    }))
  }, [])

  /* ── journal ───────────────────────────────────────────────────────── */

  const saveJournal = useCallback((entry: Partial<JournalEntry> & { date: string }) => {
    setState((s) => {
      const existing = s.journal.find((j) => j.date === entry.date)
      const merged: JournalEntry = {
        id: existing?.id ?? uid(),
        date: entry.date,
        mood: entry.mood ?? existing?.mood ?? 3,
        focusRating: entry.focusRating ?? existing?.focusRating ?? 3,
        template: entry.template ?? existing?.template ?? 'daily',
        answers: { ...existing?.answers, ...entry.answers },
        freeform: entry.freeform ?? existing?.freeform ?? '',
        updatedAt: Date.now(),
      }
      return {
        ...s,
        journal: existing
          ? s.journal.map((j) => (j.date === entry.date ? merged : j))
          : [merged, ...s.journal],
      }
    })
  }, [])

  const logSession = useCallback((sess: Omit<FocusSession, 'id'>) => {
    setState((s) => ({ ...s, sessions: [{ ...sess, id: uid() }, ...s.sessions] }))
  }, [])

  /* ── New Me blocks ─────────────────────────────────────────────────── */

  const addBlock = useCallback((kind: BlockKind) => {
    setState((s) => ({
      ...s,
      blocks: [
        ...s.blocks,
        {
          id: uid(), title: 'New section', subtitle: '', kind, tone: 'neutral',
          items: [{ id: uid(), text: '', done: kind === 'checklist' ? false : undefined }],
          order: s.blocks.length, open: true,
        },
      ],
    }))
  }, [])

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setState((s) => ({ ...s, blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
  }, [])

  const removeBlock = useCallback((id: string) => {
    setState((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) }))
  }, [])

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const sorted = [...s.blocks].sort((a, b) => a.order - b.order)
      const i = sorted.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= sorted.length) return s
      ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
      return { ...s, blocks: sorted.map((b, k) => ({ ...b, order: k })) }
    })
  }, [])

  const addItem = useCallback((blockId: string, item: Partial<BlockItem> = {}) => {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              items: [
                ...b.items,
                {
                  id: uid(),
                  text: '',
                  done: b.kind === 'checklist' ? false : undefined,
                  url: b.kind === 'links' ? '' : undefined,
                  ...item,
                },
              ],
            }
          : b,
      ),
    }))
  }, [])

  const updateItem = useCallback((blockId: string, itemId: string, patch: Partial<BlockItem>) => {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : b,
      ),
    }))
  }, [])

  const removeItem = useCallback((blockId: string, itemId: string) => {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, items: b.items.filter((it) => it.id !== itemId) } : b,
      ),
    }))
  }, [])

  /* ── settings & data ───────────────────────────────────────────────── */

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const setDayCover = useCallback((weekday: number, url: string) => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, dayCovers: { ...s.settings.dayCovers, [weekday]: url } },
    }))
  }, [])

  const resetAll = useCallback(() => setState(seed()), [])

  const exportJSON = useCallback(() => JSON.stringify(state, null, 2), [state])

  /**
   * Import replaces everything, so the current state is stashed first and can be
   * restored with `undoImport`. Validation is `migrate`, the same gate `load`
   * uses, so a file that would not load cannot get in this way either.
   */
  const importJSON = useCallback((raw: string) => {
    try {
      const next = migrate(JSON.parse(raw))
      setCanUndoImport(stashPreImport(stateRef.current))
      setState(next)
      return true
    } catch {
      return false
    }
  }, [])

  const undoImport = useCallback(() => {
    const prev = readPreImport()
    if (!prev) return false
    setState(prev)
    clearPreImport()
    setCanUndoImport(false)
    return true
  }, [])

  const value = useMemo<Store>(
    () => ({
      state, storageError,
      saveStatus, bootStatus: boot.status, unsaved: saveStatus === 'pending', retrySave,
      addTask, updateTask, toggleTask, removeTask,
      addGoal, updateGoal, toggleGoal, setGoalNote, removeGoal, moveGoal,
      addDeadline, updateDeadline, removeDeadline, logDeadlineHours, removeDeadlineLog,
      saveJournal, logSession,
      addBlock, updateBlock, removeBlock, moveBlock, addItem, updateItem, removeItem,
      setSettings, setDayCover, resetAll, exportJSON, importJSON, undoImport, canUndoImport,
    }),
    [state, storageError, saveStatus, boot.status, retrySave, addTask, updateTask, toggleTask,
      removeTask, addGoal, updateGoal, toggleGoal, setGoalNote, removeGoal, moveGoal,
      addDeadline, updateDeadline, removeDeadline, logDeadlineHours, removeDeadlineLog, saveJournal,
      logSession, addBlock, updateBlock, removeBlock, moveBlock, addItem, updateItem, removeItem,
      setSettings, setDayCover, resetAll, exportJSON, importJSON, undoImport, canUndoImport],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
