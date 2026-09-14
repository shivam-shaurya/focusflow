import { motion, useReducedMotion } from 'motion/react'
import { MoreHorizontal } from 'lucide-react'
import { DOCK, NAV, type Route } from '../lib/nav'
import { indicator, spring } from '../lib/motion'
import { cx } from './ui'

/**
 * A floating bottom dock for phones. The drawer it sits beside is still there
 * for the full list, but the four views a person actually moves between all day
 * now cost one thumb-reach instead of tap-menu-read-tap — and the bottom of the
 * screen is the only part of a phone that is comfortably reachable one-handed.
 *
 * The active pill is a single shared `layoutId`, so switching views slides it
 * across rather than blinking it from one slot to the next.
 */
export function MobileDock({
  route, onGo, onMore, hidden = false,
}: {
  route: Route
  onGo: (r: Route) => void
  onMore: () => void
  /** Set while the page is being scrolled down — see the shell. */
  hidden?: boolean
}) {
  const reduce = useReducedMotion()
  const items = DOCK.map((id) => NAV.find((n) => n.id === id)!).filter(Boolean)
  const inDock = DOCK.includes(route)

  return (
    <motion.nav
      aria-label="Primary"
      initial={reduce ? false : { y: 90, opacity: 0 }}
      animate={{ y: hidden ? 130 : 0, opacity: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          // No entry delay once it is just reacting to scroll, or coming back
          // would always feel a beat late.
          : { type: 'spring', stiffness: 300, damping: 30, delay: hidden ? 0 : 0.05 }
      }
      className={cx(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center lg:hidden',
        'px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2',
        // The page can scroll under it; the dock only catches taps on itself.
        'pointer-events-none',
      )}
    >
      <ul
        className={cx(
          'ff-glass pointer-events-auto flex items-center gap-1 rounded-full border',
          'border-[var(--color-line-strong)] p-1.5 shadow-[var(--shadow-overlay)]',
        )}
      >
        {items.map((n) => {
          const Icon = n.icon
          const active = route === n.id
          return (
            <li key={n.id}>
              <motion.button
                onClick={() => onGo(n.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={n.label}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                transition={spring}
                className={cx(
                  'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3.5',
                  'text-xs font-bold transition-colors duration-150',
                  active ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-fg-muted)]',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    transition={indicator}
                    className="absolute inset-0 -z-10 rounded-full bg-[var(--color-primary)]"
                  />
                )}
                <Icon size={18} aria-hidden="true" />
                {/*
                  Only the current item carries a label. Five labelled icons do
                  not fit a 360px screen without shrinking the touch targets
                  below 44px, and an unlabelled icon is only ambiguous when you
                  are not already looking at that screen.
                */}
                <motion.span
                  initial={false}
                  // maxWidth rather than width:auto — auto has to be measured,
                  // and a mid-flight measurement on a five-item bar shows up as
                  // a stutter on exactly the low-end phones this has to be calm on.
                  animate={{
                    opacity: active ? 1 : 0,
                    maxWidth: active ? 120 : 0,
                    marginLeft: active ? 0 : -4,
                  }}
                  transition={indicator}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {n.label}
                </motion.span>
              </motion.button>
            </li>
          )
        })}

        <li>
          <motion.button
            onClick={onMore}
            aria-label="More views"
            whileTap={reduce ? undefined : { scale: 0.9 }}
            transition={spring}
            className={cx(
              'relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full',
              'transition-colors duration-150',
              // A view that lives behind "More" still shows as the current one.
              !inDock
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-fg-muted)]',
            )}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </motion.button>
        </li>
      </ul>
    </motion.nav>
  )
}
