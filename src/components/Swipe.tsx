import { useEffect, useState, type ReactNode } from 'react'
import { motion, type PanInfo } from 'motion/react'
import { useCalm } from '../lib/prefs'

/** Distance, or flick speed, past which a drag counts as "next"/"previous". */
const DISTANCE = 72
const VELOCITY = 420

/** True on a device whose primary pointer cannot hover — i.e. a finger. */
export function useTouch(): boolean {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const sync = () => setTouch(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return touch
}

/**
 * Horizontal swipe over a region, with the page's vertical scroll left intact.
 *
 * `dragDirectionLock` is what makes that possible: motion decides from the
 * first few pixels whether a gesture is horizontal or vertical and then commits
 * to it, so a thumb scrolling down a long list never drags the view sideways by
 * accident — the failure that makes most swipe implementations feel broken.
 *
 * The content follows the finger and springs back, because a gesture that shows
 * no response until it is released feels like it did not register.
 */
export function Swipe({
  onPrev, onNext, children, className, enabled = true,
}: {
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
  className?: string
  enabled?: boolean
}) {
  const calm = useCalm()
  const touch = useTouch()

  // Pointer-only devices have the buttons and the arrow keys; adding a drag
  // there would just interfere with selecting text.
  if (!enabled || !touch || calm) return <div className={className}>{children}</div>

  const end = (_: unknown, info: PanInfo) => {
    const far = Math.abs(info.offset.x) > DISTANCE
    const fast = Math.abs(info.velocity.x) > VELOCITY
    if (!far && !fast) return
    if (info.offset.x < 0) onNext?.()
    else onPrev?.()
  }

  return (
    <motion.div
      className={className}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      // Keeps the page scrollable while the gesture is still undecided.
      dragMomentum={false}
      onDragEnd={end}
    >
      {children}
    </motion.div>
  )
}

/**
 * Left/right arrows for the same paging, for anyone on a keyboard. Ignored
 * while typing, so arrowing through a note never changes the week underneath.
 */
export function useArrowPaging(onPrev?: () => void, onNext?: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev?.() }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext?.() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])
}
