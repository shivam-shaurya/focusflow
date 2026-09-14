import { useMemo } from 'react'
import { Quote as QuoteIcon } from 'lucide-react'
import { quoteOfTheDay } from '../lib/quotes'
import { todayISO } from '../lib/date'
import { Card } from './ui'

/**
 * One quote, fixed for the day. Derived from the date rather than stored or
 * randomised, so it does not change on every re-render — which would make it
 * noise instead of a small fixed point in the morning.
 */
export function QuoteCard({ date = todayISO() }: { date?: string }) {
  const q = useMemo(() => quoteOfTheDay(date), [date])

  return (
    <Card as="figure" className="m-0">
      <QuoteIcon
        size={16}
        className="text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <blockquote className="mt-2 text-balance text-base font-medium leading-relaxed">
        {q.text}
      </blockquote>
      {q.author && (
        <figcaption className="mt-2 text-sm text-[var(--color-fg-muted)]">
          — {q.author}
        </figcaption>
      )}
    </Card>
  )
}
