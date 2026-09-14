import type { Transition, Variants } from 'motion/react'

/**
 * One motion vocabulary for the whole app, so timing and easing are a decision
 * made once rather than re-invented in every component.
 *
 * Springs are used for anything that moves or resizes (they feel physical);
 * tweens are used for pure fades and colour (a spring on opacity looks wrong).
 * Durations sit in the 0.18–0.5s band — long enough to read, short enough that
 * a person tabbing through the app never waits for the UI.
 */

/** Crisp, barely-overshooting. The default for layout and transforms. */
export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }

/** Softer and slower, for large surfaces entering. */
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 1 }

/** A little bounce, for satisfying confirmations (a check landing). */
export const springPop: Transition = { type: 'spring', stiffness: 700, damping: 18, mass: 0.6 }

export const ease: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
export const easeFast: Transition = { duration: 0.15, ease: [0.22, 1, 0.36, 1] }

/**
 * Container/item pair for cascading a list or grid in. Children animate in
 * sequence rather than all at once, which is most of what makes an interface
 * feel composed instead of assembled.
 */
export const stagger = (delayChildren = 0.04, staggerChildren = 0.045): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: springSoft },
}

export const fadeItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: ease },
}

/** View-level transition used by the router shell. */
export const viewVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ...springSoft, staggerChildren: 0.04, delayChildren: 0.02 } },
  exit: { opacity: 0, y: -6, transition: easeFast },
}

/** Hover/press feedback for a tile that is itself clickable. */
export const tileHover = {
  whileHover: { y: -3, transition: spring },
  whileTap: { scale: 0.995, transition: easeFast },
}
