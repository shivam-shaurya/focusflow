/**
 * The reward layer.
 *
 * Finishing something is the only moment in this app that is worth a flourish,
 * and it is the moment ADHD brains get the least from — the task disappears and
 * nothing marks that it happened. So completion gets a deliberate, drawn
 * response: particles, a ring, a medallion, all rendered from tokens and SVG.
 *
 * Two rules shape the whole design:
 *
 *  1. Nothing here needs an asset. The default state is not an empty frame
 *     waiting for a picture — it is a finished piece of motion in the app's own
 *     colours, and most people will never add anything to it.
 *  2. A picture or GIF, if someone adds one, is *layered into* that same moment
 *     rather than replacing it. The ring, the headline and the timing stay put;
 *     the image fills the medallion. Customising makes it theirs, not complete.
 */

/** What just happened. Drives copy, colour, and how big the moment is. */
export type MilestoneKind =
  | 'task'      // one task ticked
  | 'goal'      // one daily goal checked
  | 'day'       // everything scheduled for today is done
  | 'deadline'  // a dated commitment finished
  | 'streak'    // a streak crossed a round number

export interface Milestone {
  kind: MilestoneKind
  /** Headline for the full-screen moments. Ignored by the micro bursts. */
  title?: string
  /** One supporting line under the headline. */
  detail?: string
  /**
   * Viewport coordinates the burst radiates from — the checkbox that was just
   * ticked. Without it a burst would fire from the middle of the screen, which
   * reads as a notification rather than as a consequence of what you did.
   */
  origin?: { x: number; y: number }
}

/** The micro kinds fire in place; the rest take over the screen for a beat. */
export const isMajor = (k: MilestoneKind) => k === 'day' || k === 'deadline' || k === 'streak'

/** How much of the reward layer a person wants. Stored in settings. */
export type CelebrationLevel = 'full' | 'calm' | 'off'

const EVENT = 'ff:celebrate'

/**
 * Fired from wherever the state change actually happens, so the UI layer does
 * not have to thread a callback through four components to say "that counted".
 */
export function celebrate(m: Milestone) {
  window.dispatchEvent(new CustomEvent<Milestone>(EVENT, { detail: m }))
}

export function onCelebrate(fn: (m: Milestone) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<Milestone>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

/** The centre of an element, for `origin`. */
export function originOf(el: Element | null | undefined) {
  if (!el) return undefined
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/* ── Copy and colour ─────────────────────────────────────────────────────── */

/**
 * Defaults, used whenever a caller does not pass its own words. Written to be
 * true rather than enthusiastic: "day cleared" is a fact, "AMAZING JOB!!" is a
 * slot machine, and the second one stops working by Thursday.
 */
export const MILESTONE_COPY: Record<MilestoneKind, { title: string; detail: string }> = {
  task: { title: 'Done', detail: '' },
  goal: { title: 'Checked', detail: '' },
  day: { title: 'Day cleared', detail: 'Everything you planned for today is done.' },
  deadline: { title: 'Deadline met', detail: 'Finished, and on the record.' },
  streak: { title: 'Streak', detail: 'Showing up is the whole trick.' },
}

/** Label shown against each milestone in Settings, where media is attached. */
export const MILESTONE_LABEL: Record<MilestoneKind, string> = {
  task: 'Task ticked',
  goal: 'Daily goal checked',
  day: 'Day cleared',
  deadline: 'Deadline met',
  streak: 'Streak milestone',
}

/** Tokens, not hex, so a celebration re-themes with everything else. */
export const MILESTONE_TONE: Record<MilestoneKind, string> = {
  task: 'var(--color-primary)',
  goal: 'var(--color-primary)',
  day: 'var(--color-primary)',
  deadline: 'var(--color-accent)',
  streak: 'var(--color-tone-gold)',
}

/** Round numbers worth stopping for. Anything else passes without comment. */
export const STREAK_MARKS = [3, 7, 14, 30, 60, 100, 200, 365]
export const isStreakMark = (n: number) => STREAK_MARKS.includes(n)
