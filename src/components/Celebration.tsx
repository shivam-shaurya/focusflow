import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../lib/store'
import { useCalm } from '../lib/prefs'
import {
  MILESTONE_COPY, MILESTONE_TONE, isMajor, onCelebrate,
  type Milestone, type MilestoneKind,
} from '../lib/celebrate'
import { resolveCover } from '../lib/covers'

/* ── Geometry ────────────────────────────────────────────────────────────── */

/**
 * Particle fan for a micro burst. Angles are jittered off an even spread rather
 * than random: pure randomness clumps, and a clump reads as a glitch.
 */
function fan(count: number, spread = 360, rotate = -90) {
  return Array.from({ length: count }, (_, i) => {
    const step = spread / count
    const angle = rotate + i * step + (Math.random() - 0.5) * step * 0.7
    const rad = (angle * Math.PI) / 180
    const distance = 38 + Math.random() * 34
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      rotate: (Math.random() - 0.5) * 220,
      scale: 0.6 + Math.random() * 0.6,
      delay: Math.random() * 0.05,
    }
  })
}

/** Confetti for the full-screen moments: falls, drifts, and tumbles. */
function rain(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: (i / count) * 100 + (Math.random() - 0.5) * (80 / count),
    drift: (Math.random() - 0.5) * 120,
    rotate: (Math.random() - 0.5) * 540,
    delay: Math.random() * 0.5,
    duration: 1.9 + Math.random() * 1.1,
    scale: 0.55 + Math.random() * 0.7,
    /** Alternating so the fall never reads as one solid colour. */
    tone: i % 3,
  }))
}

const TONES = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-tone-gold)']

/* ── Micro burst ─────────────────────────────────────────────────────────── */

/**
 * The response to ticking one thing: a ring that expands and fades, and a short
 * fan of particles, fired from the control that was pressed. It is over in
 * about half a second — a completion you notice, not one you wait through.
 */
function Burst({ m, onDone }: { m: Milestone; onDone: () => void }) {
  const tone = MILESTONE_TONE[m.kind]
  const bits = useMemo(() => fan(m.kind === 'goal' ? 12 : 9), [m.kind])
  const origin = m.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }

  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[65]"
      style={{ left: origin.x, top: origin.y }}
    >
      <motion.span
        className="absolute rounded-full border-2"
        style={{ borderColor: tone, translateX: '-50%', translateY: '-50%' }}
        initial={{ width: 18, height: 18, opacity: 0.9 }}
        animate={{ width: 112, height: 112, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      />
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: TONES[b.id % TONES.length],
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: b.x,
            // A little extra downward travel at the end: particles that stop
            // dead in the air look like a sprite sheet, not like objects.
            y: [b.y, b.y + 14],
            scale: [0, b.scale, b.scale * 0.7],
            rotate: b.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.62, delay: b.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

/** The calm equivalent: one ring, no particles, no travel. */
function Pulse({ m, onDone }: { m: Milestone; onDone: () => void }) {
  const origin = m.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  useEffect(() => {
    const t = setTimeout(onDone, 500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none fixed z-[65] rounded-full border-2"
      style={{
        left: origin.x,
        top: origin.y,
        borderColor: MILESTONE_TONE[m.kind],
        translateX: '-50%',
        translateY: '-50%',
      }}
      initial={{ width: 20, height: 20, opacity: 0.8 }}
      animate={{ width: 72, height: 72, opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    />
  )
}

/* ── Medallion ───────────────────────────────────────────────────────────── */

/**
 * The centrepiece of a full-screen moment. With no custom media it is a drawn
 * mark: a ring that draws itself, rays, and a tick. With media it is the same
 * ring around the person's own picture or GIF.
 *
 * The important part is that the *second* case adds a layer to the first rather
 * than swapping one design for another — which is why an empty one never looks
 * like a missing image.
 */
function Medallion({ kind, media, calm }: { kind: MilestoneKind; media: string; calm: boolean }) {
  const tone = MILESTONE_TONE[kind]
  const size = 132
  const r = 58

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Soft bloom behind everything, so the mark sits in light rather than on a hole. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `color-mix(in oklab, ${tone} 45%, transparent)` }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: calm ? 0.35 : [0, 0.75, 0.45], scale: 1 }}
        transition={{ duration: calm ? 0.3 : 1.1, ease: 'easeOut' }}
      />

      {media && (
        <motion.span
          className="absolute overflow-hidden rounded-full"
          style={{ width: r * 2 - 10, height: r * 2 - 10 }}
          initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
        >
          <img src={media} alt="" className="h-full w-full object-cover" />
        </motion.span>
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="relative">
        {/* Rays. Dropped in calm mode — they are the decorative half. */}
        {!calm && Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180
          return (
            <motion.line
              key={i}
              x1={size / 2 + Math.cos(a) * (r + 8)}
              y1={size / 2 + Math.sin(a) * (r + 8)}
              x2={size / 2 + Math.cos(a) * (r + 16)}
              y2={size / 2 + Math.sin(a) * (r + 16)}
              stroke={tone}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0.35], scale: 1 }}
              transition={{ duration: 0.9, delay: 0.25 + i * 0.02 }}
              style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
            />
          )
        })}

        {/* The ring draws itself clockwise from the top — the "sealing" gesture. */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={calm ? { pathLength: 1, opacity: 0 } : { pathLength: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: calm ? 0.25 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* The tick only owns the middle when there is no picture there. */}
        {!media && (
          <motion.path
            d={`M${size / 2 - 22} ${size / 2 + 2} l14 15 l30 -32`}
            fill="none"
            stroke={tone}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={calm ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: calm ? 0.2 : 0.45, delay: calm ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </svg>
    </div>
  )
}

/* ── Full-screen moment ──────────────────────────────────────────────────── */

function Moment({ m, media, calm, onDone }: {
  m: Milestone
  media: string
  calm: boolean
  onDone: () => void
}) {
  const copy = MILESTONE_COPY[m.kind]
  const title = m.title ?? copy.title
  const detail = m.detail ?? copy.detail
  const confetti = useMemo(() => (calm ? [] : rain(26)), [calm])

  // Long enough to land, short enough that it never becomes a thing to dismiss.
  useEffect(() => {
    const t = setTimeout(onDone, calm ? 1600 : 2900)
    return () => clearTimeout(t)
  }, [onDone, calm])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <motion.div
      // Announced rather than trapped: it is feedback, not a dialog, and it
      // must never take focus away from whatever someone types next.
      role="status"
      aria-live="polite"
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[66] grid place-items-center bg-[var(--color-scrim)] px-6"
    >
      {confetti.map((c) => (
        <motion.span
          key={c.id}
          aria-hidden="true"
          className="absolute top-0 block rounded-[1px]"
          style={{
            left: `${c.left}%`,
            width: 7,
            height: 11,
            background: TONES[c.tone],
          }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{
            y: '100vh',
            x: c.drift,
            rotate: c.rotate,
            opacity: [0, 1, 1, 0],
            scale: c.scale,
          }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.92, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative flex flex-col items-center gap-4 text-center"
      >
        <Medallion kind={m.kind} media={media} calm={calm} />
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: calm ? 0.05 : 0.3 }}
            className="text-3xl font-extrabold tracking-tight text-[var(--color-on-overlay)] sm:text-4xl"
          >
            {title}
          </motion.p>
          {detail && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: calm ? 0.1 : 0.42 }}
              className="mt-2 max-w-sm text-balance text-sm font-medium text-[color-mix(in_oklab,var(--color-on-overlay)_72%,transparent)]"
            >
              {detail}
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Host ────────────────────────────────────────────────────────────────── */

type Live = Milestone & { key: number }

/**
 * Mounted once, at the app root. Everything else in the codebase just calls
 * `celebrate({ kind })` and never has to know this exists.
 */
export function Celebration() {
  const { state } = useStore()
  const calm = useCalm()
  const level = state.settings.celebration
  const [live, setLive] = useState<Live[]>([])
  const [moment, setMoment] = useState<Live | null>(null)

  useEffect(() => {
    if (level === 'off') return
    return onCelebrate((m) => {
      const entry: Live = { ...m, key: Date.now() + Math.random() }
      if (isMajor(m.kind)) setMoment(entry)
      // Bursts stack: ticking four things quickly should look like four things.
      else setLive((v) => [...v.slice(-5), entry])
    })
  }, [level])

  // A level change mid-flight should not leave a frozen burst on screen.
  useEffect(() => {
    if (level === 'off') { setLive([]); setMoment(null) }
  }, [level])

  if (level === 'off') return null
  const quiet = calm || level === 'calm'

  return (
    <>
      <AnimatePresence>
        {live.map((m) => (
          quiet
            ? <Pulse key={m.key} m={m} onDone={() => setLive((v) => v.filter((x) => x.key !== m.key))} />
            : <Burst key={m.key} m={m} onDone={() => setLive((v) => v.filter((x) => x.key !== m.key))} />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {moment && (
          <Moment
            key={moment.key}
            m={moment}
            media={resolveCover(state.settings.celebrationMedia[moment.kind])}
            calm={quiet}
            onDone={() => setMoment(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
