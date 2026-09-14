import { useEffect, useRef, useState } from 'react'
import { Check, Download, ExternalLink, Monitor, Moon, PartyPopper, Play, Settings as SettingsIcon, Share, ShieldCheck, Sun, Trash2, Undo2, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { AlwaysEditing } from '../lib/edit'
import { Alert, Button, Card, Page, PageHeader, SectionTitle, cx } from '../components/ui'
import { Cover } from '../components/ImagePicker'
import { WEEKDAY_IDS } from '../lib/covers'
import { GoalList } from '../components/GoalList'
import { todayISO } from '../lib/date'
import {
  estimateStorage, isPersisted, requestPersistence, useInstallPrompt, useOnline,
} from '../lib/pwa'
import {
  MILESTONE_LABEL, celebrate, type CelebrationLevel, type MilestoneKind,
} from '../lib/celebrate'

const CELEBRATION_LEVELS: Array<{ id: CelebrationLevel; label: string; hint: string }> = [
  { id: 'full', label: 'Full', hint: 'Particles, rings, and a moment for the big ones.' },
  { id: 'calm', label: 'Calm', hint: 'The moment stays; the particles go.' },
  { id: 'off', label: 'Off', hint: 'Nothing but the tick itself.' },
]

const MILESTONES: MilestoneKind[] = ['day', 'deadline', 'streak']

const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`

export function Settings() {
  const {
    state, storageError, saveStatus, setSettings, setDayCover, resetAll,
    exportJSON, importJSON, undoImport, canUndoImport,
  } = useStore()
  const { settings } = state
  const { state: installState, install } = useInstallPrompt()
  const online = useOnline()
  const [msg, setMsg] = useState('')
  const [showUndo, setShowUndo] = useState(false)
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null)
  const [persisted, setPersisted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Re-read the real figures whenever a write lands, so the number is not stale.
  useEffect(() => {
    void estimateStorage().then(setUsage)
    void isPersisted().then(setPersisted)
  }, [saveStatus, state])

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusflow-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File) => {
    const ok = importJSON(await file.text())
    setMsg(ok ? 'Data imported.' : 'That file did not look like a FocusFlow backup.')
    if (ok) {
      // Import replaces everything, so leave the way back open for a while.
      setShowUndo(true)
      window.setTimeout(() => setShowUndo(false), 20_000)
    }
    window.setTimeout(() => setMsg(''), 6000)
  }

  return (
    <AlwaysEditing>
    <Page width="reading">
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Settings"
        title="Rhythm and data"
        hint="Everything here is stored on this device only."
      />

      {storageError && <Alert>{storageError}</Alert>}

      <Card>
        <SectionTitle title="You" hint="Used only to greet you on the Today screen." />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Name
            <input
              value={settings.name}
              onChange={(e) => setSettings({ name: e.target.value })}
              placeholder="Optional"
              className="min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Theme for this year
            <input
              value={settings.yearTheme}
              onChange={(e) => setSettings({ yearTheme: e.target.value })}
              placeholder="e.g. Finish what I start"
              className="min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Day covers"
          hint="One image or GIF per weekday, shown on Today and on the planner board. Links load fastest."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAY_FULL.map((name, i) => (
            <div key={name} className="overflow-hidden rounded-[var(--radius-card)] border">
              <Cover
                src={settings.dayCovers[String(i)]}
                height={90}
                label={`${name} cover`}
                defaultId={WEEKDAY_IDS[i]}
                onChange={(url) => setDayCover(i, url)}
              />
              <p className="px-3 py-2 text-xs font-bold">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Daily goals"
          hint="These seven repeat every day. Names and the shared description apply to every day — the per-day note lives on Today and the planner."
        />
        <GoalList date={todayISO()} scope="shared" />
      </Card>

      <Card>
        <SectionTitle title="Focus timer" hint="Short blocks beat heroic ones." />
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ['focusLength', 'Focus block (min)', 5, 90],
            ['breakLength', 'Break (min)', 1, 30],
          ] as const).map(([key, label, min, max]) => (
            <label key={key} className="flex flex-col gap-1.5 text-sm font-semibold">
              {label}
              <input
                type="number"
                min={min}
                max={max}
                value={settings[key]}
                onChange={(e) => setSettings({ [key]: Number(e.target.value) })}
                className="min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-semibold">Appearance</span>
          <div className="flex rounded-[var(--radius-control)] border p-0.5">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                aria-pressed={settings.theme === t}
                className={cx(
                  'flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[var(--radius-micro)] px-3 text-sm font-semibold capitalize transition-colors duration-150',
                  settings.theme === t
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-fg-muted)]',
                )}
              >
                {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />} {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Celebrations"
          hint="What happens when you finish something."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-[var(--radius-control)] border p-0.5">
            {CELEBRATION_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setSettings({ celebration: l.id })}
                aria-pressed={settings.celebration === l.id}
                className={cx(
                  'min-h-9 cursor-pointer rounded-[var(--radius-micro)] px-3 text-sm font-semibold transition-colors duration-150',
                  settings.celebration === l.id
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-fg-muted)]',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {CELEBRATION_LEVELS.find((l) => l.id === settings.celebration)?.hint}
          </p>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => setSettings({ reduceMotion: e.target.checked })}
            className="size-4 cursor-pointer accent-[var(--color-primary)] pointer-coarse:size-5"
          />
          Reduce motion everywhere
          <span className="font-medium text-[var(--color-fg-muted)]">
            — same as the system setting, without changing it for every app.
          </span>
        </label>

        {settings.celebration !== 'off' && (
          <>
            <p className="mt-6 text-sm text-[var(--color-fg-muted)]">
              Each of these is drawn by the app and finished as it is. Adding a picture
              or a GIF puts it inside the ring — an extra layer on the same moment,
              never the thing that makes it work.
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {MILESTONES.map((k) => (
                <div key={k} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{MILESTONE_LABEL[k]}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => celebrate({ kind: k })}
                      aria-label={`Preview the ${MILESTONE_LABEL[k]} celebration`}
                    >
                      <Play size={13} /> Preview
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-[var(--radius-card)] border">
                    <Cover
                      src={settings.celebrationMedia[k]}
                      height={96}
                      rounded=""
                      label={`Image or GIF for ${MILESTONE_LABEL[k]}`}
                      onChange={(url) =>
                        setSettings({
                          celebrationMedia: { ...settings.celebrationMedia, [k]: url },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-fg-muted)]">
              <PartyPopper size={13} aria-hidden="true" />
              Ticking a task or a goal always gets the small burst; only these three
              take over the screen.
            </p>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Install FocusFlow"
          hint="Installed, it opens in its own window, starts from the home screen, and runs with no connection at all."
        />
        {installState === 'installed' ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <Check size={16} aria-hidden="true" /> Installed. You are running the app version.
          </p>
        ) : installState === 'available' ? (
          <Button variant="primary" onClick={() => void install()}>
            <Download size={16} /> Install app
          </Button>
        ) : installState === 'ios' ? (
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-[var(--color-fg-muted)]">
            <li>
              Tap the <Share size={13} className="inline align-[-2px]" aria-hidden="true" />{' '}
              <span className="font-semibold text-[var(--color-fg)]">Share</span> button in Safari.
            </li>
            <li>
              Choose <span className="font-semibold text-[var(--color-fg)]">Add to Home Screen</span>.
            </li>
            <li>Open it from the home screen — it runs full-screen and offline.</li>
          </ol>
        ) : (
          <p className="flex items-start gap-2 text-sm text-[var(--color-fg-muted)]">
            <Monitor size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              On Chrome or Edge, use the install icon in the address bar. On Android, open the
              browser menu and choose <span className="font-semibold text-[var(--color-fg)]">Install app</span>.
              On iPhone or iPad, use Safari&rsquo;s Share menu &rarr; Add to Home Screen.
            </span>
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Your data"
          hint="Everything lives on this device. Nothing is uploaded anywhere, online or off."
        />

        <dl className="mb-4 flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-[var(--color-fg-muted)]">Space used</dt>
            <dd className="font-semibold tabular-nums">
              {usage ? `${mb(usage.usage)} of ${mb(usage.quota)} available` : 'Not reported by this browser'}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-[var(--color-fg-muted)]">Connection</dt>
            <dd className="font-semibold">
              {online ? 'Online — nothing is syncing' : 'Offline — edits are still saving'}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-[var(--color-fg-muted)]">Eviction protection</dt>
            <dd className="flex items-center gap-2 font-semibold">
              {persisted ? (
                <>
                  <ShieldCheck size={15} className="text-[var(--color-primary)]" aria-hidden="true" />
                  Protected from automatic cleanup
                </>
              ) : (
                <>
                  <span className="text-[var(--color-fg-muted)]">
                    Your browser may clear this if the device runs low on space
                  </span>
                  <Button
                    size="sm"
                    onClick={() => void requestPersistence().then(setPersisted)}
                  >
                    Request protection
                  </Button>
                </>
              )}
            </dd>
          </div>
        </dl>

        <p className="mb-4 text-sm text-[var(--color-fg-muted)]">
          Export writes a single JSON file. It is also how you move data between the
          browser version and the desktop app, which keep separate stores.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}><Download size={16} /> Export backup</Button>
          <Button onClick={() => fileRef.current?.click()}><Upload size={16} /> Import backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
              e.target.value = ''
            }}
          />
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Delete every task, goal, journal entry, and New Me section? This cannot be undone.')) {
                resetAll()
              }
            }}
          >
            <Trash2 size={16} /> Reset everything
          </Button>
        </div>
        {msg && (
          <div role="status" className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[var(--color-primary)]">{msg}</p>
            {showUndo && canUndoImport && (
              <Button
                size="sm"
                onClick={() => {
                  undoImport()
                  setShowUndo(false)
                  setMsg('Import undone — your previous data is back.')
                  window.setTimeout(() => setMsg(''), 4000)
                }}
              >
                <Undo2 size={15} /> Undo import
              </Button>
            )}
          </div>
        )}
      </Card>

      {/*
        The same credit as the README, in the app itself. Someone using this on
        their phone every morning never sees a repository, and the person whose
        system they are actually following should not only be named somewhere
        they will never look.
      */}
      <Card>
        <SectionTitle title="Credit" hint="Whose system this is." />
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          <p>
            The system this app runs on — the daily goals, the journal templates, the
            New&nbsp;Me page and the thinking behind all of it — is the work of{' '}
            <span className="font-bold text-[var(--color-fg)]">Shwetabh Gangwar</span>.
            The research, the templates and the method are his.
          </p>
          <p>
            This app is a personal project: somebody wanted to run his system as
            software instead of a document. The code and the interface are built
            from scratch, but they are only a container. What makes it worth using
            is his.
          </p>
          <p>
            No claim is made over his system or the work behind it, and this project
            is not affiliated with him or endorsed by him.
          </p>
          <a
            href="https://www.youtube.com/@ShwetabhGangwar1"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-line-strong)] px-4 text-sm font-semibold text-[var(--color-fg)] transition-colors duration-150 hover:bg-[var(--color-surface-2)]"
          >
            <ExternalLink size={15} aria-hidden="true" />
            Shwetabh Gangwar on YouTube
          </a>
        </div>
      </Card>
    </Page>
    </AlwaysEditing>
  )
}
