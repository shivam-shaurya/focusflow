import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const cx = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')

export function Card({
  children, className, as: As = 'section',
}: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return (
    <As
      className={cx(
        'rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-5',
        className,
      )}
    >
      {children}
    </As>
  )
}

export function SectionTitle({
  title, hint, action,
}: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'outline', size = 'md', className, ...rest
}: ButtonProps) {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold ' +
    'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
  }
  const variants = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-secondary)]',
    accent:
      'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90',
    outline:
      'border bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]',
    ghost:
      'bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
    danger:
      'bg-transparent text-[var(--color-destructive)] hover:bg-[color-mix(in_oklab,var(--color-destructive)_14%,transparent)]',
  }
  return <button className={cx(base, sizes[size], variants[variant], className)} {...rest} />
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'primary' | 'accent' }) {
  const tones = {
    muted: 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]',
    primary: 'bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] text-[var(--color-primary)]',
    accent: 'bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]',
  }
  return (
    <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

/** Accessible progress bar: value is also exposed as text next to it by callers. */
export function Bar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
    >
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-6 py-10 text-center">
      <span className="text-[var(--color-fg-muted)]" aria-hidden="true">{icon}</span>
      <p className="font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">{hint}</p>}
    </div>
  )
}
