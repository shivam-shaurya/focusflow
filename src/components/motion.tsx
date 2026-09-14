import { useEffect, useRef, type ReactNode } from 'react'
import {
  motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform,
} from 'motion/react'
import { riseItem, stagger, springPop } from '../lib/motion'
import { cx } from './ui'

/**
 * Cascades its children in. Everything here degrades to "just render it" under
 * prefers-reduced-motion — the app's global CSS already kills transitions, and
 * these JS-driven animations have to opt out separately.
 */
export function Stagger({
  children, className, as = 'div', delay = 0.04,
}: { children: ReactNode; className?: string; as?: 'div' | 'ul' | 'section'; delay?: number }) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  if (reduce) return <Comp className={className}>{children}</Comp>
  return (
    <Comp
      className={className}
      variants={stagger(delay)}
      initial="hidden"
      animate="show"
    >
      {children}
    </Comp>
  )
}

export function StaggerItem({
  children, className, as = 'div',
}: { children: ReactNode; className?: string; as?: 'div' | 'li' | 'section' }) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  if (reduce) return <Comp className={className}>{children}</Comp>
  return <Comp className={className} variants={riseItem}>{children}</Comp>
}

/** Fades a section in the first time it scrolls into view. */
export function Reveal({
  children, className, amount = 0.25,
}: { children: ReactNode; className?: string; amount?: number }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount })
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Counts up to `value`. A number that animates reads as a live measurement
 * rather than a static label, which is most of the perceived polish on a
 * dashboard — and it costs nothing at rest.
 */
export function AnimatedNumber({
  value, decimals = 0, suffix = '', prefix = '', className,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 })

  useEffect(() => { mv.set(value) }, [value, mv])

  // Written straight to the DOM node rather than through state: a counter that
  // re-renders React ~60 times a second would drag the whole subtree with it.
  useEffect(() => {
    if (reduce) return
    return spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`
    })
  }, [spring, reduce, decimals, prefix, suffix])

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}

/**
 * The tick that lands when something is completed: the path draws itself and
 * the box gives one small pop. Deliberately the most expressive moment in the
 * app — it is the only one that marks an achievement.
 */
export function CheckMark({ checked, size = 12 }: { checked: boolean; size?: number }) {
  const reduce = useReducedMotion()
  if (!checked) return null
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      initial={reduce ? false : { scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={springPop}
    >
      <motion.path
        d="M2.5 6.2l2.2 2.3L9.5 3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  )
}

/**
 * A checkbox that pops when it becomes checked. The scale pulse is driven off
 * the transition into `checked`, so unchecking is quiet — undoing something
 * should not feel like an accomplishment.
 */
export function CheckBox({
  checked, onChange, label, size = 'md',
}: {
  checked: boolean
  onChange: () => void
  label: string
  size?: 'sm' | 'md'
}) {
  const reduce = useReducedMotion()
  const px = size === 'sm' ? 'size-5' : 'size-6'
  return (
    <motion.button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
      whileTap={reduce ? undefined : { scale: 0.85 }}
      animate={checked && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={springPop}
      className={cx(
        px,
        'grid shrink-0 cursor-pointer place-items-center rounded-[var(--radius-micro)] border-2',
        'transition-colors duration-150',
        checked
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
          : 'border-[var(--color-fg-subtle)] hover:border-[var(--color-primary)]',
      )}
    >
      <CheckMark checked={checked} size={size === 'sm' ? 11 : 13} />
    </motion.button>
  )
}

/** Progress bar whose fill springs and carries a slow travelling sheen. */
export function MotionBar({
  value, label, tone = 'primary',
}: { value: number; label: string; tone?: 'primary' | 'accent' }) {
  const reduce = useReducedMotion()
  const pct = Math.max(0, Math.min(100, value))
  const fill = tone === 'accent' ? 'var(--color-accent)' : 'var(--color-primary)'

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative h-2.5 w-full overflow-hidden rounded-[var(--radius-micro)] bg-[var(--color-surface-2)]"
    >
      <motion.div
        className="relative h-full rounded-[var(--radius-micro)]"
        style={{ background: fill }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.7 }}
      >
        {/* Sheen only while there is something to show and motion is welcome. */}
        {!reduce && pct > 6 && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 w-1/3"
            style={{
              background:
                'linear-gradient(90deg, transparent, color-mix(in oklab, white 38%, transparent), transparent)',
            }}
            animate={{ x: ['-120%', '420%'] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
    </div>
  )
}

/**
 * A slow, very low-contrast colour wash for the one hero surface per screen.
 * Kept under 8% mix so it reads as depth rather than decoration.
 */
export function Aurora({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <motion.div
      aria-hidden="true"
      className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute -left-1/4 -top-1/2 aspect-square w-[70%] rounded-full blur-3xl"
        style={{ background: 'color-mix(in oklab, var(--color-primary) 18%, transparent)' }}
        animate={{ x: ['0%', '22%', '0%'], y: ['0%', '14%', '0%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/4 aspect-square w-[60%] rounded-full blur-3xl"
        style={{ background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)' }}
        animate={{ x: ['0%', '-18%', '0%'], y: ['0%', '-12%', '0%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

/** Ring that sweeps to a percentage — used for at-a-glance completion. */
export function ProgressRing({
  value, size = 56, stroke = 6, children,
}: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const reduce = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  const progress = useSpring(useMotionValue(reduce ? offset : c), {
    stiffness: 90, damping: 22,
  })
  useEffect(() => { progress.set(offset) }, [offset, progress])
  const dash = useTransform(progress, (v) => v)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          strokeWidth={stroke} stroke="var(--color-surface-2)"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          strokeWidth={stroke} strokeLinecap="round"
          stroke="var(--color-primary)"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={c}
          style={{ strokeDashoffset: dash }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  )
}
