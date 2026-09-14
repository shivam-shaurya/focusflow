import type { AppState, Settings } from './types'
import { seedBlocks, seedGoals, uid } from './seed'
import { todayISO } from './date'

/**
 * Everything that knows about the localStorage byte stream lives here, so the
 * migration ladder can be reasoned about (and tested) without React.
 */

export const SCHEMA = 2

/**
 * The key name is now just a legacy string — `version` inside the payload is the
 * real schema marker. Renaming the key would strand every existing user's data.
 */
export const KEY = 'focusflow.v2'
const CORRUPT_PREFIX = `${KEY}.corrupt.`
export const PREIMPORT_KEY = `${KEY}.preimport`

/** Covers stay empty here; bundled art is applied at render time, not stored. */
export const defaultSettings: Settings = {
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
  celebration: 'full',
  celebrationMedia: {},
  todayFocus: false,
}

export const seed = (): AppState => ({
  version: SCHEMA,
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
  deadlines: [],
  journal: [],
  sessions: [],
  blocks: seedBlocks(),
  // Covers are deliberately left empty: bundled art is applied at render time by
  // resolveCover(), so it shows for existing saved data too, not just fresh
  // installs. Storing it here as well would mean two mechanisms for one thing.
  settings: defaultSettings,
})

/* ── migration ───────────────────────────────────────────────────────────── */

/** Fill in fields added after a payload was written. */
function normalizeV1(p: Partial<AppState>): AppState {
  return {
    version: SCHEMA,
    tasks: (p.tasks ?? []).map((t) => ({ ...t, description: t.description ?? '' })),
    goals: p.goals?.length ? p.goals.map((g) => ({ ...g, notes: g.notes ?? {} })) : seedGoals(),
    deadlines: (p.deadlines ?? []).map((d) => ({
      ...d,
      log: d.log ?? [],
      workdays: d.workdays?.length ? d.workdays : [0, 1, 2, 3, 4, 5, 6],
    })),
    journal: (p.journal ?? []).map((j) => ({ ...j, template: j.template ?? 'daily' })),
    sessions: p.sessions ?? [],
    blocks: p.blocks ?? seedBlocks(),
    settings: {
      ...defaultSettings,
      ...p.settings,
      dayCovers: { ...p.settings?.dayCovers },
      celebrationMedia: { ...p.settings?.celebrationMedia },
    },
  }
}

export class ShapeError extends Error {}
export class FutureSchemaError extends Error {}

/**
 * The single definition of "valid saved data" — shared by load and by import, so
 * a file that would be rejected on import can never sneak in through load.
 */
export function migrate(raw: unknown): AppState {
  const p = raw as Partial<AppState> | null
  if (!p || typeof p !== 'object' || !Array.isArray(p.tasks)) {
    throw new ShapeError('not a FocusFlow payload')
  }
  const version = p.version ?? 1
  if (version > SCHEMA) {
    throw new FutureSchemaError(`payload is schema ${version}, this build reads ${SCHEMA}`)
  }
  // One rung so far. normalizeV1 is idempotent, so a current-schema payload
  // passes through it unchanged and new rungs can be appended below.
  return normalizeV1(p)
}

/* ── load ────────────────────────────────────────────────────────────────── */

export type LoadStatus = 'ok' | 'empty' | 'corrupt' | 'future'

export interface LoadResult {
  status: LoadStatus
  state: AppState
  /** Key the unreadable payload was copied to, when we managed to copy it. */
  quarantined?: string
}

/** Keep at most one quarantine copy: a corruption loop must not become a quota bomb. */
function quarantine(raw: string): string | undefined {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(CORRUPT_PREFIX)) localStorage.removeItem(k)
    }
    const key = `${CORRUPT_PREFIX}${Date.now()}`
    localStorage.setItem(key, raw)
    return key
  } catch {
    // Could not copy it aside. The caller must then refuse to write at all, so
    // the original bytes stay on disk for manual recovery.
    return undefined
  }
}

export function loadState(): LoadResult {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Storage is unavailable entirely (Safari private mode, locked-down WebView).
    return { status: 'empty', state: seed() }
  }
  if (!raw) return { status: 'empty', state: seed() }

  try {
    return { status: 'ok', state: migrate(JSON.parse(raw)) }
  } catch (err) {
    if (err instanceof FutureSchemaError) {
      // Do NOT overwrite. The user opened a newer build and then landed on a
      // cached older one; downgrading their data away would be unrecoverable.
      return { status: 'future', state: seed() }
    }
    return { status: 'corrupt', state: seed(), quarantined: quarantine(raw) }
  }
}

export function readQuarantined(): { key: string; raw: string } | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(CORRUPT_PREFIX)) {
        return { key: k, raw: localStorage.getItem(k) ?? '' }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

/* ── save ────────────────────────────────────────────────────────────────── */

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' }

const isQuotaError = (e: unknown): boolean => {
  if (!(e instanceof DOMException)) return false
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || // Firefox
    e.code === 22
  )
}

/**
 * Returns a result rather than throwing, so the caller owns the policy. Quota is
 * distinguished from everything else because Safari private mode throws on every
 * write and must not be reported as "storage is full".
 */
export function saveState(state: AppState): SaveResult {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: isQuotaError(e) ? 'quota' : 'unavailable' }
  }
}

export function stashPreImport(current: AppState): boolean {
  try {
    localStorage.setItem(PREIMPORT_KEY, JSON.stringify(current))
    return true
  } catch {
    return false
  }
}

export function readPreImport(): AppState | null {
  try {
    const raw = localStorage.getItem(PREIMPORT_KEY)
    return raw ? migrate(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function clearPreImport(): void {
  try {
    localStorage.removeItem(PREIMPORT_KEY)
  } catch {
    /* ignore */
  }
}
