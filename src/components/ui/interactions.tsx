import { useCallback, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cx } from './cx'

/**
 * A cursor-following highlight on a surface. The pointer position is written to
 * motion values and interpolated into a radial gradient, so the wash tracks the
 * cursor without a single React re-render.
 *
 * Kept very low contrast (a ~10% mix) on purpose: the point is that the surface
 * feels lit and physical under the hand, not that it draws attention to itself.
 * Pointer-coarse devices never see it — there is no cursor to follow, and the
 * gradient would only cost paint.
 */
export function Spotlight({
  className, size = 380, strength = 10, tone = 'var(--color-primary)',
}: { className?: string; size?: number; strength?: number; tone?: string }) {
  const bg = useMotionTemplate`radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklab, ${tone} ${strength}%, transparent), transparent 70%)`
  return (
    <motion.span
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute inset-0 rounded-[inherit] opacity-0',
        'transition-opacity duration-300 group-hover/spot:opacity-100',
        'max-[1023px]:hidden',
        className,
      )}
      style={{ background: bg }}
    />
  )
}

/**
 * Wraps any surface so `Spotlight` inside it has coordinates to follow. The two
 * are split because some surfaces (the hero) want the tracking without the
 * default wash, and some want it on a child element.
 */
export function SpotlightArea({
  children, className, as: As = 'div',
}: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  const reduce = useReducedMotion()
  const onMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }, [])
  if (reduce) return <As className={className}>{children}</As>
  return (
    <As className={cx('group/spot relative', className)} onPointerMove={onMove}>
      {children}
    </As>
  )
}

/**
 * Pulls a control a few pixels toward the cursor. The displacement is capped at
 * `strength` px and springs back on leave, so it reads as weight rather than as
 * the button running away from the pointer — which is what a larger offset,
 * and the version of this effect that scales with distance, actually looks like.
 */
export function Magnetic({
  children, strength = 4, className,
}: { children: ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 320, damping: 24, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 320, damping: 24, mass: 0.6 })

  if (reduce) return <span className={className}>{children}</span>
  return (
    <motion.span
      className={cx('inline-flex', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        // Touch drags shouldn't drag the control around under the finger.
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set(Math.max(-strength, Math.min(strength, (e.clientX - (r.left + r.width / 2)) / 4)))
        y.set(Math.max(-strength, Math.min(strength, (e.clientY - (r.top + r.height / 2)) / 4)))
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.span>
  )
}

/**
 * Text that carries a slow highlight sweep. Used once per screen at most — on
 * the wordmark — because animated text everywhere is noise, and this app is for
 * people who are already fighting for their attention.
 */
export function ShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{children}</span>
  return <span className={cx('ff-shimmer', className)}>{children}</span>
}
