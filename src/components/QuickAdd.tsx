import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CornerDownLeft, Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, cx } from './ui'
import { easeFast } from '../lib/motion'

/** One input, nothing else. Capture has to cost nothing or the thought is gone. */
export function QuickAdd({ date, placeholder = 'Add a task…' }: { date?: string; placeholder?: string }) {
  const { addTask } = useStore()
  const reduce = useReducedMotion()
  const [title, setTitle] = useState('')
  const ready = title.trim().length > 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    addTask({ title: v, date, bucket: date ? 'today' : 'inbox' })
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div
        className={cx(
          'flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-control)] border px-3',
          'bg-[var(--color-surface-2)]',
          'transition-[border-color,box-shadow] duration-150',
          // The field lights up as a whole rather than growing a focus outline
          // around the bare input, which is what made it read as an afterthought.
          'focus-within:border-[var(--color-primary)]',
          'focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]',
        )}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          aria-label="New task"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-fg-subtle)]"
        />
        {/* The Enter hint only appears once pressing Enter would do something. */}
        <AnimatePresence initial={false}>
          {ready && !reduce && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={easeFast}
              aria-hidden="true"
              className="hidden shrink-0 text-[var(--color-fg-subtle)] sm:block"
            >
              <CornerDownLeft size={14} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Button type="submit" variant="primary" aria-label="Add task">
        <Plus size={16} /> Add
      </Button>
    </form>
  )
}
