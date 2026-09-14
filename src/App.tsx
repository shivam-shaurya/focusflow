import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { Menu, Search, X } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { Today } from './views/Today'
import { Planner } from './views/Planner'
import { Journal } from './views/Journal'
import { Deadlines } from './views/Deadlines'
import { Progress } from './views/Progress'
import { NewMe } from './views/NewMe'
import { Settings } from './views/Settings'
import { cx, ShimmerText } from './components/ui'
import { OfflineBadge, PwaToasts } from './components/PwaToasts'
import { StorageBanner } from './components/StorageBanner'
import { CommandPalette, openPalette } from './components/CommandPalette'
import { MobileDock } from './components/MobileDock'
import { requestPersistence, useOnline } from './lib/pwa'
import { indicator, spring, viewVariants } from './lib/motion'
import { NAV, routeFromHash, type NavEntry, type Route } from './lib/nav'

const VIEWS: Record<Route, () => React.JSX.Element> = {
  today: Today,
  planner: Planner,
  deadlines: Deadlines,
  journal: Journal,
  newme: NewMe,
  progress: Progress,
  settings: Settings,
}

function Shell() {
  const { state, saveStatus } = useStore()
  const online = useOnline()
  const reduce = useReducedMotion()

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
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return
      const i = Number(e.key)
      if (i >= 1 && i <= NAV.length) go(NAV[i - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A new view should start at the top, not wherever the last one was scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [route, reduce])

  const Current = VIEWS[route]

  return (
    <div className="flex min-h-full">
      <ReadingProgress />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[var(--radius-control)] focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--color-on-primary)]"
      >
        Skip to content
      </a>

      {/* Sidebar — desktop */}
      <nav
        aria-label="Main"
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r bg-[var(--color-surface)] p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] lg:flex"
      >
        <Brand theme={state.settings.yearTheme} />

        {/*
          A fake search field rather than a real one. It reads as the place to
          start — which is the point — but the actual input lives in the palette,
          so there is one search box in the app instead of two that disagree.
        */}
        <button
          onClick={openPalette}
          className={cx(
            'mt-5 flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-control)]',
            'border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 text-left',
            'text-sm text-[var(--color-fg-subtle)]',
            'transition-colors duration-150 hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg-muted)]',
          )}
        >
          <Search size={15} aria-hidden="true" />
          <span className="flex-1">Search or add…</span>
          <span className="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
        </button>

        <ul className="mt-4 flex flex-col gap-1">
          {NAV.map((n, i) => (
            <NavItem key={n.id} item={n} index={i} active={route === n.id} onClick={() => go(n.id)} scope="rail" />
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3">
          <OfflineBadge online={online} />
          <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
            <Kbd>1</Kbd>–<Kbd>7</Kbd> switch views. <Kbd>⌘</Kbd><Kbd>K</Kbd> opens the
            command bar.{' '}
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
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
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
        <div className="sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
          <header className="ff-glass flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="cursor-pointer rounded-[var(--radius-control)] p-2 hover:bg-[var(--color-surface-2)]"
            >
              <Menu size={20} />
            </button>
            <span className="font-extrabold tracking-tight">
              Focus<span className="text-[var(--color-primary)]">Flow</span>
            </span>
            <span className="ml-auto flex items-center gap-2">
              <OfflineBadge online={online} />
              <button
                onClick={openPalette}
                aria-label="Search or add"
                className="cursor-pointer rounded-[var(--radius-control)] p-2 hover:bg-[var(--color-surface-2)]"
              >
                <Search size={19} />
              </button>
            </span>
          </header>

          <StorageBanner />
        </div>

        <main
          id="main"
          className={cx(
            'flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10',
            // Room for the floating dock on phones; none is needed on desktop.
            'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10',
          )}
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

      <MobileDock route={route} onGo={go} onMore={() => setNavOpen(true)} />
      <CommandPalette />
      <PwaToasts />
    </div>
  )
}

/**
 * A hairline at the very top that fills as the page scrolls. On the long views
 * (New Me, a month of Progress) it is the only cue for how much is left, and it
 * costs one composited transform — no scroll listener in React.
 */
function ReadingProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })
  if (reduce) return null
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[55] h-0.5 origin-left bg-[var(--color-primary)]"
    />
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[var(--radius-micro)] border bg-[var(--color-surface-2)] px-1 font-sans text-[11px] font-semibold">
      {children}
    </kbd>
  )
}

function Brand({ theme }: { theme: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold tracking-tight">
        <ShimmerText>FocusFlow</ShimmerText>
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
  item: NavEntry
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
          'group relative flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3',
          'text-sm font-semibold transition-colors duration-150',
          active
            ? 'text-[var(--color-on-primary)]'
            : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
        )}
      >
        {active && (
          <motion.span
            layoutId={`nav-active-${scope}`}
            transition={indicator}
            className="absolute inset-0 -z-10 rounded-[var(--radius-control)] bg-[var(--color-primary)]"
          />
        )}
        <motion.span
          aria-hidden="true"
          // The icon leads the label in by a hair on hover: enough to feel
          // responsive, not enough to look like the row is rearranging.
          whileHover={{ x: 1 }}
          transition={spring}
          className="flex"
        >
          <Icon size={17} />
        </motion.span>
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
