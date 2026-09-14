import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { spring } from '../../lib/motion'

export const cx = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')

/* ── Surfaces ──────────────────────────────────────────────────────────────── */

export type Elevation = 'flat' | 'tile' | 'raised'
export type CardTone = 'default' | 'focal' | 'danger'

const ELEVATION: Record<Elevation, string> = {
  // Sits in the page plane: inner panels, things already inside a tile.
  flat: 'bg-[var(--color-surface)]',
  // The default bento tile — lifted off the background.
  tile: 'bg-[var(--color-surface)] shadow-[var(--shadow-tile)]',
  // The one tile on a screen that should pull the eye first.
  raised: 'bg-[var(--color-surface-3)] shadow-[var(--shadow-raised)]',
}

const CARD_TONE: Record<CardTone, string> = {
  default: 'border-[var(--color-line)]',
  focal:
    'border-[var(--color-primary)] ' +
    'bg-[color-mix(in_oklab,var(--color-primary)_7%,var(--color-surface))]',
  danger:
    'border-[var(--color-destructive)] ' +
    'bg-[color-mix(in_oklab,var(--color-destructive)_8%,var(--color-surface))]',
}

/**
 * A bento tile. `elevation` sets how far off the page it sits and `tone` marks
 * the one tile per screen that matters most — which is what lets a plain grid
 * read as a bento layout without changing the grid itself.
 */
export function Card({
  children,
  className,
  as: As = 'section',
  elevation = 'tile',
  tone = 'default',
  hover = false,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'figure'
  elevation?: Elevation
  tone?: CardTone
  /** Lift on pointer hover — only for tiles that are themselves interactive. */
  hover?: boolean
}) {
  const reduce = useReducedMotion()
  const classes = cx(
    'rounded-[var(--radius-card)] border p-5',
    ELEVATION[elevation],
    CARD_TONE[tone],
    className,
  )
  if (!hover || reduce) return <As className={classes}>{children}</As>
  const M = motion[As]
  return (
    <M
      className={classes}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-raised)' }}
      transition={spring}
    >
      {children}
    </M>
  )
}

export function SectionTitle({
  title, hint, action,
}: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {hint && <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/** The standing micro-label: small, heavy, spaced, muted. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        'text-xs font-bold uppercase tracking-wider text-[var(--color-fg-muted)]',
        className,
      )}
    >
      {children}
    </p>
  )
}

/* ── Controls ──────────────────────────────────────────────────────────────── */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'outline' | 'subtle' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'outline', size = 'md', className, ...rest
}: ButtonProps) {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] ' +
    'font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 ' +
    'disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = {
    sm: 'min-h-9 px-3 text-xs',
    md: 'min-h-11 px-4 text-sm',
  }
  const variants = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-tile)] ' +
      'hover:bg-[var(--color-secondary)]',
    accent:
      'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[var(--shadow-tile)] ' +
      'hover:opacity-90',
    outline:
      'border border-[var(--color-line-strong)] bg-[var(--color-surface)] text-[var(--color-fg)] ' +
      'hover:bg-[var(--color-surface-2)]',
    // For actions that are real but shouldn't look like buttons in a row of six.
    subtle:
      'bg-[var(--color-surface-2)] text-[var(--color-fg)] hover:bg-[var(--color-surface-3)]',
    ghost:
      'bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
    danger:
      'bg-transparent text-[var(--color-destructive)] ' +
      'hover:bg-[color-mix(in_oklab,var(--color-destructive)_14%,transparent)]',
  }
  return <button className={cx(base, sizes[size], variants[variant], className)} {...rest} />
}

export function Pill({
  children, tone = 'muted',
}: { children: ReactNode; tone?: 'muted' | 'primary' | 'accent' }) {
  const tones = {
    muted: 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]',
    primary: 'bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-primary)]',
    accent: 'bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]',
  }
  return (
    <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

/**
 * Accessible progress bar. Re-exported from the motion layer so every existing
 * call site picks up the spring fill and sheen without being touched.
 */
export { MotionBar as Bar } from '../motion'

export function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-6 py-10 text-center">
      <span className="text-[var(--color-fg-subtle)]" aria-hidden="true">{icon}</span>
      <p className="font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">{hint}</p>}
    </div>
  )
}

/** Inline alert strip, shared by the storage banner and Settings. */
export function Alert({
  children, tone = 'danger',
}: { children: ReactNode; tone?: 'danger' | 'accent' }) {
  const tones = {
    danger:
      'border-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface))]',
    accent:
      'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface))]',
  }
  return (
    <p
      role="alert"
      className={cx('rounded-[var(--radius-card)] border p-4 text-sm font-semibold', tones[tone])}
    >
      {children}
    </p>
  )
}

/* ── Field shells ──────────────────────────────────────────────────────────── */

/**
 * The shared look for text inputs, selects and textareas: inset into the tile
 * rather than floating on it. Composed as a string so call sites can append.
 */
export const fieldClass =
  'w-full rounded-[var(--radius-control)] border border-[var(--color-line)] ' +
  'bg-[var(--color-surface-2)] text-[var(--color-fg)] outline-none ' +
  'placeholder:text-[var(--color-fg-subtle)] ' +
  'transition-[border-color,background-color] duration-150 ' +
  'focus:border-[var(--color-primary)]'
