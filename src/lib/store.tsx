import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import type {
  AppState, Block, BlockItem, BlockKind, DailyGoal, FocusSession, JournalEntry, Settings, Task,
} from './types'
import { seedBlocks, seedGoals, uid } from './seed'
import { todayISO } from './date'

const KEY = 'focusflow.v2'

const defaultSettings: Settings = {
  name: '',
  theme: 'dark',
  focusLength: 25,
  breakLength: 5,
  reduceMotion: false,
  yearTheme: '',
  dayCovers: {},
  banner: '',
  avatar: '',
  boardTitle: 'Become powerful',
}

const seed = (): AppState => ({
  tasks: [
    {
      id: uid(),
      title: 'Rename the seven daily goals to yours',
      description: 'Click a goal to open it, rename it, and write what “done” means for you.',
      done: false,
      date: todayISO(),
      bucket: 'today',
      createdAt: Date.now(),
    },
  ],
  goals: seedGoals(),
  journal: [],
  sessions: [],
  blocks: seedBlocks(),
  settings: defaultSettings,
})

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const p = JSON.parse(raw) as Partial<AppState>
    return {
      tasks: (p.tasks ?? []).map((t) => ({ ...t, description: t.description ?? '' })),
      goals: p.goals?.length ? p.goals.map((g) => ({ ...g, notes: g.notes ?? {} })) : seedGoals(),
      journal: (p.journal ?? []).map((j) => ({ ...j, template: j.template ?? 'daily' })),
      sessions: p.sessions ?? [],
      blocks: p.blocks ?? seedBlocks(),
      settings: { ...defaultSettings, ...p.settings, dayCovers: { ...p.settings?.dayCovers } },
    }
  } catch {
    return seed()
  }
}

interface Store {
  state: AppState
  /** Set when the last write to localStorage failed (usually a quota overflow). */
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
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      setStorageError('')
    } catch {
      setStorageError(
        'Browser storage is full — most likely from uploaded images. ' +
        'Use image links instead of uploads, or remove a few covers.',
      )
    }
  }, [state])

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
          id: uid(), name, emoji: '⭐', description: '', notes: {}, history: [],
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

  const importJSON = useCallback((raw: string) => {
    try {
      const p = JSON.parse(raw) as Partial<AppState>
      if (!p || typeof p !== 'object' || !Array.isArray(p.tasks)) return false
      setState({
        tasks: p.tasks ?? [],
        goals: (p.goals ?? seedGoals()).map((g) => ({ ...g, notes: g.notes ?? {} })),
        journal: p.journal ?? [],
        sessions: p.sessions ?? [],
        blocks: p.blocks ?? seedBlocks(),
        settings: { ...defaultSettings, ...p.settings },
      })
      return true
    } catch {
      return false
    }
  }, [])

  const value = useMemo<Store>(
    () => ({
      state, storageError,
      addTask, updateTask, toggleTask, removeTask,
      addGoal, updateGoal, toggleGoal, setGoalNote, removeGoal, moveGoal,
      saveJournal, logSession,
      addBlock, updateBlock, removeBlock, moveBlock, addItem, updateItem, removeItem,
      setSettings, setDayCover, resetAll, exportJSON, importJSON,
    }),
    [state, storageError, addTask, updateTask, toggleTask, removeTask, addGoal, updateGoal,
      toggleGoal, setGoalNote, removeGoal, moveGoal, saveJournal, logSession, addBlock, updateBlock,
      removeBlock, moveBlock, addItem, updateItem, removeItem, setSettings, setDayCover,
      resetAll, exportJSON, importJSON],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
