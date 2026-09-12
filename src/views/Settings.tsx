import { useRef, useState } from 'react'
import { Check, Download, Monitor, Moon, Share, Sun, Trash2, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Card, SectionTitle, cx } from '../components/ui'
import { Cover } from '../components/ImagePicker'
import { GoalList } from '../components/GoalList'
import { todayISO } from '../lib/date'
import { storageUsedKB, useInstallPrompt, useOnline } from '../lib/pwa'

const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function Settings() {
  const {
    state, storageError, setSettings, setDayCover, resetAll, exportJSON, importJSON,
  } = useStore()
  const { settings } = state
  const { state: installState, install } = useInstallPrompt()
  const online = useOnline()
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
    window.setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>

      {storageError && (
        <p role="alert" className="rounded-[var(--radius-card)] border border-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface))] p-4 text-sm font-semibold">
          {storageError}
        </p>
      )}

      <Card>
        <SectionTitle title="You" hint="Used only to greet you on the Today screen." />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Name
            <input
              value={settings.name}
              onChange={(e) => setSettings({ name: e.target.value })}
              placeholder="Optional"
              className="min-h-11 rounded-lg border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Theme for this year
            <input
              value={settings.yearTheme}
              onChange={(e) => setSettings({ yearTheme: e.target.value })}
              placeholder="e.g. Finish what I start"
              className="min-h-11 rounded-lg border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
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
                className="min-h-11 rounded-lg border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-semibold">Appearance</span>
          <div className="flex rounded-lg border p-0.5">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                aria-pressed={settings.theme === t}
                className={cx(
                  'flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold capitalize transition-colors duration-150',
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
          hint={`Everything lives on this device — about ${storageUsedKB()} KB so far. Nothing is uploaded anywhere, online or off.`}
        />
        <p className="mb-4 text-sm text-[var(--color-fg-muted)]">
          {online
            ? 'Connected. Nothing is being synced — the network is only used to load images you link to.'
            : 'Offline. Everything still works; your edits are saving normally.'}
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
        {msg && <p role="status" className="mt-3 text-sm font-semibold text-[var(--color-primary)]">{msg}</p>}
      </Card>
    </div>
  )
}
