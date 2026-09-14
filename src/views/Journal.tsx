import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { addDays, fmtLong, iso, parseISO, todayISO } from '../lib/date'
import type { Mood } from '../lib/types'
import { TEMPLATES, templateById } from '../lib/templates'
import { Button, Card, PageHeader, Pill, SectionTitle, cx } from '../components/ui'
import { Swipe, useArrowPaging } from '../components/Swipe'

const MOODS: Array<{ v: Mood; label: string }> = [
  { v: 1, label: 'Rough' },
  { v: 2, label: 'Low' },
  { v: 3, label: 'Okay' },
  { v: 4, label: 'Good' },
  { v: 5, label: 'Great' },
]

function Scale({
  value, onChange, label,
}: { value: Mood; onChange: (v: Mood) => void; label: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-bold tracking-wide uppercase text-[var(--color-fg-muted)]">
        {label}
      </legend>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {MOODS.map((m) => (
          <button
            key={m.v}
            role="radio"
            aria-checked={value === m.v}
            onClick={() => onChange(m.v)}
            className={cx(
              'min-h-11 flex-1 cursor-pointer rounded-[var(--radius-control)] border px-2 text-xs font-semibold transition-colors duration-150',
              value === m.v
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-primary)]',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Remounted per date via `key`, so switching days loads that day without an effect. */
function Editor({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const { state, saveJournal } = useStore()
  const entry = useMemo(() => state.journal.find((j) => j.date === date), [state.journal, date])

  const [mood, setMood] = useState<Mood>(entry?.mood ?? 3)
  const [focusRating, setFocusRating] = useState<Mood>(entry?.focusRating ?? 3)
  const [templateId, setTemplateId] = useState(entry?.template ?? 'daily')
  const [answers, setAnswers] = useState<Record<string, string>>(entry?.answers ?? {})
  const [freeform, setFreeform] = useState(entry?.freeform ?? '')
  const [saved, setSaved] = useState(false)

  const template = templateById(templateId)

  const save = () => {
    saveJournal({ date, mood, focusRating, template: templateId, answers, freeform })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const answered = template.fields.filter((f) => (answers[f.id] ?? '').trim().length > 0).length

  const recent = state.journal
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 14)

  const goPrevDay = () => setDate(iso(addDays(parseISO(date), -1)))
  // Never past today: the journal is a record, not a plan.
  const goNextDay = () => { if (date < todayISO()) setDate(iso(addDays(parseISO(date), 1))) }
  useArrowPaging(goPrevDay, goNextDay)

  return (
    <Swipe onPrev={goPrevDay} onNext={goNextDay} className="flex flex-col gap-4">
      <PageHeader
        icon={BookOpen}
        eyebrow="Introspection"
        title={fmtLong(date)}
        actions={<>
          <Button size="sm" variant="ghost" onClick={goPrevDay} aria-label="Previous day">
            <ChevronLeft size={16} />
          </Button>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Journal date"
            className="min-h-9 cursor-pointer rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-2 text-sm font-semibold"
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={date >= todayISO()}
            onClick={goNextDay}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </Button>
        </>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle title="How did today land?" hint="Two scales. Ten seconds. Then you're allowed to stop." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Scale label="Mood" value={mood} onChange={setMood} />
              <Scale label="Focus" value={focusRating} onChange={setFocusRating} />
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Template"
              hint="Pick the one that matches what you're actually doing right now."
            />
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  aria-pressed={templateId === t.id}
                  className={cx(
                    'min-h-9 cursor-pointer rounded-[var(--radius-control)] border px-3 text-sm font-semibold transition-colors duration-150',
                    templateId === t.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                      : 'text-[var(--color-fg-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-fg)]',
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{template.blurb}</p>
          </Card>

          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Card>
              <SectionTitle
                title={template.name}
                hint={`${answered} of ${template.fields.length} answered`}
              />
              <div className="flex flex-col gap-5">
                {template.fields.map((f) => (
                  <div key={f.id}>
                    <label htmlFor={`f-${f.id}`} className="block text-sm font-bold">
                      {f.q}
                    </label>
                    {f.hint && <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">{f.hint}</p>}
                    <textarea
                      id={`f-${f.id}`}
                      value={answers[f.id] ?? ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                      rows={f.rows ?? 3}
                      placeholder="Write badly. Nobody is reading this."
                      className="mt-2 w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-3 text-sm leading-relaxed outline-none placeholder:text-[var(--color-fg-muted)]"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <Card>
            <SectionTitle title="Anything else" hint="Unstructured space, no prompt, no rules." />
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={6}
              aria-label="Free writing"
              className="w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-3 text-sm leading-relaxed outline-none"
            />
            <div className="mt-4 flex items-center gap-3">
              <Button variant="primary" onClick={save}>
                {saved && <Check size={16} />}
                {saved ? 'Saved' : 'Save entry'}
              </Button>
              <span className="text-xs text-[var(--color-fg-muted)]">
                Answers from every template you use today are kept on the same entry.
              </span>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <SectionTitle title="Recent entries" hint="Patterns show up over weeks, not days." />
          <ul className="flex flex-col gap-2">
            {recent.map((j) => (
              <li key={j.id}>
                <button
                  onClick={() => setDate(j.date)}
                  className={cx(
                    'w-full cursor-pointer rounded-[var(--radius-control)] border px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--color-surface-2)]',
                    j.date === date && 'border-[var(--color-primary)]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{j.date}</span>
                    <Pill tone={j.mood >= 4 ? 'primary' : 'muted'}>
                      {MOODS.find((m) => m.v === j.mood)?.label}
                    </Pill>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-muted)]">
                    {j.freeform || Object.values(j.answers).find(Boolean) || 'No text'}
                  </p>
                </button>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="text-sm text-[var(--color-fg-muted)]">
                No entries yet. The first one is the hardest.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </Swipe>
  )
}

export function Journal() {
  const [date, setDate] = useState(todayISO())
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Editor key={date} date={date} setDate={setDate} />
    </div>
  )
}
