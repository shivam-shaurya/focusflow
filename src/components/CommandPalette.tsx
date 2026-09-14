import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight, Check, CornerDownLeft, Download, Moon, Pencil, Plus, Search, Sun,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { NAV, goTo, routeFromHash } from '../lib/nav'
import { todayISO } from '../lib/date'
import { dialogVariants, scrimVariants } from '../lib/motion'
import { cx } from './ui'
import { useEditMode } from '../lib/edit'

/**
 * Opens the palette from anywhere without threading state through the shell.
 * Touch users have no Cmd-K, so the visible triggers (the rail's search field,
 * the mobile header button) have to be able to reach it too.
 */
export const openPalette = () => window.dispatchEvent(new CustomEvent('ff:palette'))

type Action = {
  id: string
  label: string
  hint: string
  keywords: string
  icon: typeof Search
  /** Marks the row that is really "create what you typed". */
  dynamic?: boolean
  run: () => void
}

/** Cheap subsequence match: "dl" finds Deadlines, which is what makes it feel fast. */
function matches(haystack: string, q: string): boolean {
  if (!q) return true
  const h = haystack.toLowerCase()
  if (h.includes(q)) return true
  let i = 0
  for (const ch of q) {
    i = h.indexOf(ch, i)
    if (i === -1) return false
    i += 1
  }
  return true
}

/**
 * Cmd-K / Ctrl-K. The app already had number-key view switching, but nothing
 * that let you capture a task without first navigating to a view that has an
 * input — and that gap is exactly where a thought gets lost. Typing anything
 * that is not a command offers to file it as a task, so this is a capture box
 * first and a navigator second.
 */
export function CommandPalette() {
  const { addTask, setSettings, state, exportJSON } = useStore()
  const { editing, setEditing } = useEditMode()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      // "/" is the other muscle memory for search, but only when not typing.
      const el = e.target as HTMLElement | null
      const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('ff:palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('ff:palette', onOpen)
    }
  }, [])

  // A fresh query every time it opens; reopening into a stale search is jarring.
  useEffect(() => { if (open) { setQ(''); setCursor(0) } }, [open])

  /*
   * The action list is memoised, so it cannot read the route through a bare
   * function call — it would keep whichever route was current the first time it
   * was built, and go on offering "Edit this page" on a page with nothing to
   * edit. Tracked as state instead, and re-read on open in case the hash was
   * changed without an event.
   */
  const [route, setRoute] = useState(routeFromHash)
  useEffect(() => {
    const sync = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => { if (open) setRoute(routeFromHash()) }, [open])

  const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark'

  const actions = useMemo<Action[]>(() => {
    const trimmed = q.trim()
    const list: Action[] = []

    if (trimmed) {
      list.push({
        id: 'capture',
        label: `Add task "${trimmed}"`,
        hint: 'Lands on today',
        keywords: 'add new task capture todo',
        icon: Plus,
        dynamic: true,
        run: () => { addTask({ title: trimmed, date: todayISO(), bucket: 'today' }) },
      })
      list.push({
        id: 'capture-inbox',
        label: `Add "${trimmed}" to the inbox`,
        hint: 'Decide later',
        keywords: 'inbox later someday capture',
        icon: ArrowRight,
        dynamic: true,
        run: () => { addTask({ title: trimmed, bucket: 'inbox' }) },
      })
    }

    for (const n of NAV) {
      list.push({
        id: `go-${n.id}`,
        label: `Go to ${n.label}`,
        hint: n.hint,
        keywords: `${n.label} ${n.keywords} open view navigate`,
        icon: n.icon,
        run: () => goTo(n.id),
      })
    }

    // Only where the current view has media or layout to change.
    if (NAV.find((n) => n.id === route)?.editable) {
      list.push({
        id: 'edit',
        label: editing ? 'Done editing this page' : 'Edit this page',
        hint: editing ? 'Hide the controls again' : 'Change its images',
        keywords: 'edit customise customize change image cover gif remove',
        icon: Pencil,
        run: () => setEditing(!editing),
      })
    }

    list.push({
      id: 'theme',
      label: `Switch to ${nextTheme} mode`,
      hint: 'Applies immediately',
      keywords: 'theme dark light appearance contrast',
      icon: nextTheme === 'dark' ? Moon : Sun,
      run: () => setSettings({ theme: nextTheme }),
    })
    list.push({
      id: 'backup',
      label: 'Download a backup',
      hint: 'Everything, as JSON',
      keywords: 'export save json backup data download',
      icon: Download,
      run: () => {
        const blob = new Blob([exportJSON()], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `focusflow-${todayISO()}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
    })

    const needle = trimmed.toLowerCase()
    return list.filter((a) => a.dynamic || matches(`${a.label} ${a.keywords}`, needle))
  }, [q, addTask, setSettings, nextTheme, exportJSON, editing, setEditing, route])

  // The cursor is an index, so it has to be pulled back in when the list shrinks.
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, actions.length - 1)))
  }, [actions.length])

  const run = (a: Action | undefined) => {
    if (!a) return
    a.run()
    setOpen(false)
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
      e.preventDefault()
      setCursor((c) => (c + 1) % Math.max(1, actions.length))
    } else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
      e.preventDefault()
      setCursor((c) => (c - 1 + actions.length) % Math.max(1, actions.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(actions[cursor])
    }
  }

  // Keep the highlighted row on screen when arrowing past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={scrimVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[60] bg-[var(--color-scrim)] px-4 pt-[max(6vh,calc(1rem+env(safe-area-inset-top)))]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            variants={reduce ? undefined : dialogVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            className={cx(
              'ff-glass mx-auto flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden',
              'rounded-[var(--radius-card)] border border-[var(--color-line-strong)]',
              'shadow-[var(--shadow-overlay)]',
            )}
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search size={17} className="shrink-0 text-[var(--color-fg-muted)]" aria-hidden="true" />
              <input
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setCursor(0) }}
                placeholder="Search views, or type a task…"
                aria-label="Command palette"
                className="min-h-14 w-full bg-transparent text-base font-medium outline-none placeholder:text-[var(--color-fg-subtle)]"
              />
              <kbd className="hidden shrink-0 rounded-[var(--radius-micro)] border px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-fg-muted)] sm:block">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
              {actions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[var(--color-fg-muted)]">
                  Nothing matches that.
                </p>
              )}
              {actions.map((a, i) => {
                const Icon = a.icon
                const active = i === cursor
                return (
                  <button
                    key={a.id}
                    data-active={active}
                    onMouseMove={() => setCursor(i)}
                    onClick={() => run(a)}
                    className={cx(
                      'relative flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-control)]',
                      'px-3 py-2.5 text-left transition-colors duration-100',
                      active ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="palette-cursor"
                        transition={{ type: 'spring', stiffness: 600, damping: 40, mass: 0.6 }}
                        className="absolute inset-0 -z-10 rounded-[var(--radius-control)] bg-[var(--color-surface-2)]"
                      />
                    )}
                    <Icon size={16} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{a.label}</span>
                    <span className="hidden shrink-0 text-xs sm:block">{a.hint}</span>
                    {active && (
                      <CornerDownLeft size={13} className="shrink-0 text-[var(--color-fg-subtle)]" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>

            <p className="flex items-center gap-2 border-t px-4 py-2.5 text-[11px] font-semibold text-[var(--color-fg-muted)]">
              <Check size={12} aria-hidden="true" />
              Everything you do here saves to this device only.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
