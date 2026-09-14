import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlignLeft, Trash2 } from 'lucide-react'
import type { Task } from '../lib/types'
import { useStore } from '../lib/store'
import { cx } from './ui'
import { CheckBox } from './motion'

/** Click the title to open the task and write a description. */
export function TaskRow({ task, showDate = false }: { task: Task; showDate?: boolean }) {
  const { toggleTask, removeTask, updateTask } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group"
    >
      <div
        className={cx(
          'flex items-center gap-2.5 rounded-[var(--radius-control)] border border-transparent px-2 py-2',
          'transition-colors duration-150 hover:border-[var(--color-line)] hover:bg-[var(--color-surface-2)]',
        )}
      >
        <CheckBox
          checked={task.done}
          onChange={() => toggleTask(task.id)}
          label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          size="sm"
        />

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cx(
            'min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium',
            task.done && 'text-[var(--color-fg-muted)] line-through',
          )}
        >
          {task.title}
        </button>

        {task.description.trim() && !open && (
          <AlignLeft size={13} className="shrink-0 text-[var(--color-fg-muted)]" aria-label="Has a description" />
        )}
        {showDate && task.date && (
          <span className="hidden shrink-0 text-xs font-semibold text-[var(--color-fg-muted)] md:inline">
            {task.date.slice(5)}
          </span>
        )}

        <button
          onClick={() => removeTask(task.id)}
          aria-label={`Delete "${task.title}"`}
          className="shrink-0 cursor-pointer rounded-[var(--radius-micro)] p-1.5 text-[var(--color-fg-muted)] opacity-0 transition-opacity duration-150 hover:text-[var(--color-destructive)] focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mb-2 ml-2 flex flex-col gap-2 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-3">
              <input
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                aria-label="Task title"
                className="min-h-10 w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-sm font-semibold outline-none"
              />
              <textarea
                value={task.description}
                onChange={(e) => updateTask(task.id, { description: e.target.value })}
                rows={4}
                placeholder="Description — the detail, the link, the first step…"
                aria-label="Task description"
                className="w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface)] p-2.5 text-sm leading-relaxed outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}
