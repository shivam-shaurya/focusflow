import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlignLeft, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtLong } from '../lib/date'
import { Button, cx } from './ui'
import { CheckBox } from './motion'

/**
 * The seven-per-day goal list. The name and emoji are shared across every day;
 * the note is written against the date this list was rendered for, so Monday's
 * "Reading" note is independent of Tuesday's.
 *
 * `scope="shared"` drops the per-date note and edits the shared description
 * instead — that is the Settings view of the same goals.
 */
export function GoalList({
  date, compact = false, scope = 'day',
}: { date: string; compact?: boolean; scope?: 'day' | 'shared' }) {
  const { state, toggleGoal, updateGoal, setGoalNote, removeGoal, addGoal, moveGoal } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)

  const goals = useMemo(() => [...state.goals].sort((a, b) => a.order - b.order), [state.goals])

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {goals.map((g, i) => {
          const on = g.history.includes(date)
          const open = openId === g.id
          const note = g.notes[date] ?? ''
          const hasNote = note.trim().length > 0
          return (
            <li key={g.id} className="group">
              <div
                className={cx(
                  'flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 transition-colors duration-150 hover:bg-[var(--color-surface-2)]',
                  compact ? 'py-1.5' : 'py-2',
                )}
              >
                <CheckBox
                  checked={on}
                  onChange={() => toggleGoal(g.id, date)}
                  label={on ? `Uncheck ${g.name}` : `Check ${g.name}`}
                  size="sm"
                />

                <span aria-hidden="true" className="shrink-0 text-sm">{g.emoji}</span>

                <button
                  onClick={() => setOpenId(open ? null : g.id)}
                  aria-expanded={open}
                  className={cx(
                    'min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium',
                    on && 'text-[var(--color-fg-muted)] line-through',
                  )}
                >
                  {g.name}
                </button>

                {hasNote && !open && (
                  <AlignLeft
                    size={13}
                    className="shrink-0 text-[var(--color-fg-muted)]"
                    aria-label="Has a note for this day"
                  />
                )}

                {!compact && (
                  <span className="flex shrink-0 items-center opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={() => moveGoal(g.id, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${g.name} up`}
                      className="cursor-pointer rounded-[var(--radius-micro)] p-1 text-[var(--color-fg-muted)] disabled:opacity-30"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => moveGoal(g.id, 1)}
                      disabled={i === goals.length - 1}
                      aria-label={`Move ${g.name} down`}
                      className="cursor-pointer rounded-[var(--radius-micro)] p-1 text-[var(--color-fg-muted)] disabled:opacity-30"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </span>
                )}
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
                    <div className="mb-2 ml-2 flex flex-col gap-3 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-3">
                      {scope === 'day' ? (
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                            Note for {fmtLong(date)}
                          </span>
                          <textarea
                            value={note}
                            onChange={(e) => setGoalNote(g.id, date, e.target.value)}
                            rows={3}
                            placeholder="What does this look like today? Chapter, set, call, page…"
                            className="w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface)] p-2.5 text-sm leading-relaxed outline-none"
                          />
                          <span className="text-xs text-[var(--color-fg-muted)]">
                            This note belongs to this day only. Other days keep theirs.
                          </span>
                        </label>
                      ) : (
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
                            Shared description &mdash; shown on every day
                          </span>
                          <textarea
                            value={g.description}
                            onChange={(e) => updateGoal(g.id, { description: e.target.value })}
                            rows={3}
                            placeholder="What counts as done, in general?"
                            className="w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface)] p-2.5 text-sm leading-relaxed outline-none"
                          />
                        </label>
                      )}

                      {scope === 'day' && g.description.trim() && (
                        <p className="rounded-[var(--radius-control)] border border-dashed p-2.5 text-xs leading-relaxed text-[var(--color-fg-muted)]">
                          <span className="font-bold">Shared: </span>{g.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 border-t pt-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
                          Shared &mdash; changing this changes every day
                        </span>
                        <div className="flex gap-2">
                          <input
                            value={g.emoji}
                            onChange={(e) => updateGoal(g.id, { emoji: e.target.value.slice(0, 4) })}
                            aria-label={`Emoji for ${g.name}`}
                            className="min-h-10 w-12 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-center text-sm"
                          />
                          <input
                            value={g.name}
                            onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                            aria-label="Goal name"
                            placeholder="Goal name"
                            className="min-h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-sm font-semibold outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-fg-muted)]">
                          Done {g.history.length} times
                        </span>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => { removeGoal(g.id); setOpenId(null) }}
                        >
                          <Trash2 size={13} /> Delete goal
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      {!compact && (
        <Button size="sm" variant="ghost" className="mt-1 self-start" onClick={() => addGoal()}>
          <Plus size={14} /> Add daily goal
        </Button>
      )}
    </div>
  )
}
