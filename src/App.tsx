import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen, CalendarClock, CalendarDays, Flame, LayoutGrid, Menu,
  Settings as SettingsIcon, TrendingUp, X,
} from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { Today } from './views/Today'
import { Planner } from './views/Planner'
import { Journal } from './views/Journal'
import { Deadlines } from './views/Deadlines'
import { Progress } from './views/Progress'
import { NewMe } from './views/NewMe'
import { Settings } from './views/Settings'
import { cx } from './components/ui'
import { OfflineBadge, PwaToasts } from './components/PwaToasts'
import { StorageBanner } from './components/StorageBanner'
import { requestPersistence, useOnline } from './lib/pwa'
import { spring, viewVariants } from './lib/motion'

type Route = 'today' | 'planner' | 'deadlines' | 'journal' | 'newme' | 'progress' | 'settings'

const NAV: Array<{ id: Route; label: string; icon: typeof LayoutGrid; hint: string }> = [
  { id: 'today', label: 'Today', icon: LayoutGrid, hint: 'One day at a time' },
  { id: 'planner', label: 'Planner', icon: CalendarDays, hint: 'The week ahead' },
  { id: 'deadlines', label: 'Deadlines', icon: CalendarClock, hint: 'What is due' },
  { id: 'journal', label: 'Journal', icon: BookOpen, hint: 'Introspection' },
  { id: 'newme', label: 'New Me', icon: Flame, hint: 'Read every day' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, hint: 'Week · month · year' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, hint: 'Rhythm and data' },
]

const routeFromHash = (): Route => {
  const h = window.location.hash.replace('#/', '')
  return (NAV.find((n) => n.id === h)?.id ?? 'today') as Route
}

function Shell() {
  const { state, saveStatus } = useStore()
  const online = useOnline()

  // Ask once per session; the browser only shows a prompt where it wants to.
  useEffect(() => {
    void requestPersistence()
  }, [])
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (r: Route) => {
    window.location.hash = `#/${r}`
    setRoute(r)
    setNavOpen(false)
  }

  // Number keys jump between views — fewer clicks between thought and screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      const i = Number(e.key)
      if (i >= 1 && i <= NAV.length) go(NAV[i - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const Current = {
    today: Today,
    planner: Planner,
    deadlines: Deadlines,
    journal: Journal,
    newme: NewMe,
    progress: Progress,
    settings: Settings,
  }[route]

  return (
    <div className="flex min-h-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--color-on-primary)]"
      >
        Skip to content
      </a>

      {/* Sidebar — desktop */}
      <nav
        aria-label="Main"
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r bg-[var(--color-surface)] p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] lg:flex"
      >
        <Brand theme={state.settings.yearTheme} />
        <ul className="mt-6 flex flex-col gap-1">
          {NAV.map((n, i) => (
            <NavItem key={n.id} item={n} index={i} active={route === n.id} onClick={() => go(n.id)} scope="rail" />
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3">
        <OfflineBadge online={online} />
        <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
          Press <kbd className="rounded-[var(--radius-micro)] border px-1">1</kbd>–<kbd className="rounded-[var(--radius-micro)] border px-1">7</kbd> to
          switch views.{' '}
          {saveStatus === 'saved'
            ? 'Everything saves automatically.'
            : saveStatus === 'pending'
              ? 'Saving…'
              : 'Saving is paused — see the banner above.'}
        </p>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-[var(--color-scrim)] lg:hidden"
            onClick={() => setNavOpen(false)}
          >
            <motion.nav
              aria-label="Main"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-dvh w-64 flex-col overflow-y-auto border-r bg-[var(--color-surface)] p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between">
                <Brand theme={state.settings.yearTheme} />
                <button
                  onClick={() => setNavOpen(false)}
                  aria-label="Close menu"
                  className="cursor-pointer rounded-[var(--radius-control)] p-2 hover:bg-[var(--color-surface-2)]"
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="mt-6 flex flex-col gap-1">
                {NAV.map((n, i) => (
                  <NavItem key={n.id} item={n} index={i} active={route === n.id} onClick={() => go(n.id)} scope="drawer" />
                ))}
              </ul>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          One sticky container so the bar and the banner stack instead of
          overlapping. They were both `sticky top-0`, and the banner's higher
          z-index put it straight over the menu button.
        */}
        <div className="sticky top-0 z-30 bg-[var(--color-bg)] pt-[env(safe-area-inset-top)]">
          <header className="flex items-center gap-3 border-b bg-[var(--color-bg)]/90 px-4 py-3 backdrop-blur lg:hidden">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="cursor-pointer rounded-[var(--radius-control)] p-2 hover:bg-[var(--color-surface-2)]"
            >
              <Menu size={20} />
            </button>
            <span className="font-extrabold tracking-tight">FocusFlow</span>
            <span className="ml-auto"><OfflineBadge online={online} /></span>
          </header>

          <StorageBanner />
        </div>

        <main
          id="main"
          className="flex-1 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              variants={viewVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <Current />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PwaToasts />
    </div>
  )
}

function Brand({ theme }: { theme: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold tracking-tight">
        Focus<span className="text-[var(--color-primary)]">Flow</span>
      </p>
      <p className="text-xs text-[var(--color-fg-muted)]">
        {theme || 'Built for ADHD brains'}
      </p>
    </div>
  )
}

function NavItem({
  item, index, active, onClick, scope,
}: {
  item: (typeof NAV)[number]
  index: number
  active: boolean
  onClick: () => void
  /** Keeps the rail and the drawer from sharing one layoutId while both mount. */
  scope: string
}) {
  const Icon = item.icon
  return (
    <li>
      <motion.button
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        className={cx(
          'relative flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3',
          'text-sm font-semibold transition-colors duration-150',
          active
            ? 'text-[var(--color-on-primary)]'
            : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
        )}
      >
        {active && (
          <motion.span
            layoutId={`nav-active-${scope}`}
            transition={spring}
            className="absolute inset-0 -z-10 rounded-[var(--radius-control)] bg-[var(--color-primary)]"
          />
        )}
        <Icon size={17} aria-hidden="true" />
        <span className="flex-1 text-left">{item.label}</span>
        <span className={cx('text-xs opacity-50', active && 'opacity-80')}>{index + 1}</span>
      </motion.button>
    </li>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
