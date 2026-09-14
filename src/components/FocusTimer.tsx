import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Pause, Play, RotateCcw, Coffee } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Card, cx, Magnetic } from './ui'

/**
 * A single visible countdown. ADHD design note: time blindness means an
 * abstract "25 min" is useless — the ring makes remaining time spatial.
 */
export function FocusTimer({ compact = false }: { compact?: boolean }) {
  const { state, logSession } = useStore()
  const reduce = useReducedMotion()
  const { focusLength, breakLength } = state.settings
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(focusLength * 60)
  const [taskId, setTaskId] = useState<string>('')
  const startedAt = useRef<number>(0)

  const total = (mode === 'focus' ? focusLength : breakLength) * 60

  useEffect(() => {
    if (!running) setLeft(total)
  }, [total, running])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((v) => {
        if (v > 1) return v - 1
        clearInterval(id)
        setRunning(false)
        if (mode === 'focus') {
          logSession({
            taskId: taskId || undefined,
            minutes: focusLength,
            startedAt: startedAt.current || Date.now(),
            completed: true,
          })
        }
        setMode((m) => (m === 'focus' ? 'break' : 'focus'))
        return 0
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode, focusLength, taskId, logSession])

  const start = () => {
    if (!running && left === total) startedAt.current = Date.now()
    setRunning((r) => !r)
  }

  const reset = () => {
    setRunning(false)
    setLeft(total)
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = total === 0 ? 0 : ((total - left) / total) * 100
  const R = 52
  const C = 2 * Math.PI * R

  const open = state.tasks.filter((t) => !t.done)

  return (
    <Card className={cx('flex h-full flex-col gap-4', compact && 'p-4')}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--color-fg-muted)]">
          {mode === 'focus' ? 'Focus block' : 'Break'}
        </h2>
        {mode === 'break' && <Coffee size={16} className="text-[var(--color-accent)]" aria-hidden="true" />}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {/*
            A slow breath behind the ring while the clock is running. Time
            blindness is the problem this whole component exists for, and a
            static dial gives no cue that it is still counting — this does,
            without ever pulling the eye off the work.
          */}
          {running && !reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-3 rounded-full blur-xl"
              style={{
                background: mode === 'focus'
                  ? 'color-mix(in oklab, var(--color-primary) 30%, transparent)'
                  : 'color-mix(in oklab, var(--color-accent) 30%, transparent)',
              }}
              animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.94, 1.04, 0.94] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <svg width="128" height="128" viewBox="0 0 128 128" role="img"
               aria-label={`${mm} minutes ${ss} seconds remaining`}>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="8"
                    stroke="var(--color-surface-2)" />
            <motion.circle
              cx="64" cy="64" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
              stroke={mode === 'focus' ? 'var(--color-primary)' : 'var(--color-accent)'}
              transform="rotate(-90 64 64)"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C - (pct / 100) * C }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-mono text-2xl font-bold tabular-nums">{mm}:{ss}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-fg-muted)]">
            Working on
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="min-h-11 w-full cursor-pointer truncate rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium text-[var(--color-fg)]"
            >
              <option value="">Nothing specific</option>
              {open.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Magnetic>
              <Button variant={running ? 'outline' : 'primary'} onClick={start}>
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? 'Pause' : left === total ? 'Start' : 'Resume'}
              </Button>
            </Magnetic>
            <Button variant="ghost" onClick={reset} aria-label="Reset timer">
              <RotateCcw size={16} /> Reset
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
