import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { AlignLeft, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { DailyGoal } from '../lib/types'
import { useStore } from '../lib/store'
import { fmtLong } from '../lib/date'
import { Button, cx } from './ui'
import { CheckBox } from './motion'
import { celebrate, originOf } from '../lib/celebrate'
import { useCalm } from '../lib/prefs'

/**
 * The seven-per-day goal list. The name and emoji are shared across every day;
 * the note is written against the date this list was rendered for, so Monday's
 * "Reading" note is independent of Tuesday's.
 *
 * `scope="shared"` drops the per-date note and edits the shared description
 * instead — that is the Settings view of the same goals.
 *
 * Order is changed by dragging. The up/down buttons that used to sit on the row
 * have moved inside the expanded panel: there they were hover-only, which meant
 * they did not exist at all on a phone, and they cost two permanent controls
 * for something most people do twice a year.
 */
export function GoalList({
  date, compact = false, scope = 'day',
}: { date: string; compact?: boolean; scope?: 'day' | 'shared' }) {
  const { state, addGoal, reorderGoals } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const calm = useCalm()

  const goals = useMemo(() => [...state.goals].sort((a, b) => a.order - b.order), [state.goals])

  return (
    <div className="flex flex-col">
      <Reorder.Group
        as="ul"
        axis="y"
        values={goals}
        onReorder={(next) => reorderGoals(next.map((g) => g.id))}
        className="flex flex-col"
      >
        {goals.map((g, i) => (
          <GoalRow
            key={g.id}
            goal={g}
            index={i}
            total={goals.length}
            date={date}
            scope={scope}
            compact={compact}
            calm={calm}
            open={openId === g.id}
            onOpen={() => setOpenId(openId === g.id ? null : g.id)}
            onClose={() => setOpenId(null)}
          />
        ))}
      </Reorder.Group>

      {!compact && (
        <Button size="sm" variant="ghost" className="mt-1 self-start" onClick={() => addGoal()}>
          <Plus size={14} /> Add daily goal
        </Button>
      )}
    </div>
  )
}

function GoalRow({
  goal: g, index, total, date, scope, compact, calm, open, onOpen, onClose,
}: {
  goal: DailyGoal
  index: number
  total: number
  date: string
  scope: 'day' | 'shared'
  compact: boolean
  calm: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const { toggleGoal, updateGoal, setGoalNote, removeGoal, moveGoal } = useStore()
  const boxRef = useRef<HTMLSpanElement>(null)
  /*
   * Drag starts from the grip only. Listening on the whole row would put a
   * gesture under every tap on the checkbox and under every attempt to scroll
   * the page with a thumb — the two things this list exists to make easy.
   */
  const controls = useDragControls()

  const on = g.history.includes(date)
  const note = g.notes[date] ?? ''
  const hasNote = note.trim().length > 0

  const toggle = () => {
    toggleGoal(g.id, date)
    // Only checking earns a burst. Unchecking is a correction, and rewarding a
    // correction is how a reward stops meaning anything.
    if (!on) celebrate({ kind: 'goal', origin: originOf(boxRef.current) })
  }

  return (
    <Reorder.Item
      as="li"
      value={g}
      dragListener={false}
      dragControls={controls}
      className="group relative"
      whileDrag={calm ? undefined : { scale: 1.02, zIndex: 20 }}
    >
      <div
        className={cx(
          'flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 transition-colors duration-150 hover:bg-[var(--color-surface-2)]',
          compact ? 'py-1.5' : 'py-2',
        )}
      >
        {!compact && (
          <span
            onPointerDown={(e) => controls.start(e)}
            aria-hidden="true"
            title="Drag to reorder"
            className={cx(
              'shrink-0 cursor-grab touch-none text-[var(--color-fg-subtle)] active:cursor-grabbing',
              // Fades in under a cursor; always there on touch, where there is
              // no hover state to reveal it with.
              'lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100',
            )}
          >
            <GripVertical size={14} />
          </span>
        )}

        <span ref={boxRef} className="flex">
          <CheckBox
            checked={on}
            onChange={toggle}
            label={on ? `Uncheck ${g.name}` : `Check ${g.name}`}
            size="sm"
          />
        </span>

        <button
          onClick={onOpen}
          aria-expanded={open}
          className={cx(
            'min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium',
            'transition-colors duration-200',
            on && 'text-[var(--color-fg-muted)]',
          )}
        >
          <span className="ff-strike" data-done={on}>{g.name}</span>
        </button>

        {hasNote && !open && (
          <AlignLeft
            size={13}
            className="shrink-0 text-[var(--color-fg-muted)]"
            aria-label="Has a note for this day"
          />
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
                    value={g.name}
                    onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                    aria-label="Goal name"
                    placeholder="Goal name"
                    className="min-h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-sm font-semibold outline-none"
                  />
                </div>
              </div>

              {/*
                The keyboard route to reordering. A drag cannot be operated from
                a keyboard or a screen reader, so these two have to exist
                somewhere — here, visible whenever the goal is open, instead of
                hover-only on a row nobody is pointing at.
              */}
              <div className="flex items-center gap-2 border-t pt-3">
                <span className="flex-1 text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
                  Position {index + 1} of {total}
                </span>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={index === 0}
                  onClick={() => moveGoal(g.id, -1)}
                  aria-label={`Move ${g.name} up`}
                >
                  <ChevronUp size={13} />
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={index === total - 1}
                  onClick={() => moveGoal(g.id, 1)}
                  aria-label={`Move ${g.name} down`}
                >
                  <ChevronDown size={13} />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-fg-muted)]">
                  Done {g.history.length} times
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { removeGoal(g.id); onClose() }}
                >
                  <Trash2 size={13} /> Delete goal
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}
