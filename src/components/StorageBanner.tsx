import { useEffect } from 'react'
import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { useStore } from '../lib/store'
import { readQuarantined } from '../lib/persist'
import { todayISO } from '../lib/date'
import { Button } from './ui'

const saveText = (raw: string, name: string) => {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * A failed save has to be visible where the person is typing, not on a Settings
 * page they have no reason to open. Sticky and non-dismissible on purpose: the
 * escape hatch is downloading a backup, not hiding the message.
 */
export function StorageBanner() {
  const { storageError, saveStatus, bootStatus, unsaved, retrySave, exportJSON } = useStore()

  // Warn before a reload would drop edits that never reached disk.
  useEffect(() => {
    if (!unsaved && saveStatus === 'saved') return
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [unsaved, saveStatus])

  const quarantined = bootStatus === 'corrupt' ? readQuarantined() : null
  const failing = saveStatus === 'quota' || saveStatus === 'unavailable' || saveStatus === 'frozen'

  if (!failing && bootStatus !== 'corrupt') return null

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 border-b border-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_14%,var(--color-surface))] px-4 py-3 sm:px-6 lg:px-10"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
        <AlertTriangle size={18} className="shrink-0 text-[var(--color-destructive)]" aria-hidden="true" />

        <p className="min-w-0 flex-1 text-sm">
          {failing ? (
            <>
              <span className="font-bold">Your last changes could not be saved. </span>
              <span className="text-[var(--color-fg-muted)]">{storageError}</span>
            </>
          ) : (
            <>
              <span className="font-bold">
                We couldn&rsquo;t read your saved data, so FocusFlow started fresh.{' '}
              </span>
              <span className="text-[var(--color-fg-muted)]">
                {quarantined
                  ? 'The damaged copy was set aside — download it before adding new data over it.'
                  : 'The damaged copy could not be set aside, and saving is paused so it stays intact.'}
              </span>
            </>
          )}
        </p>

        <div className="flex shrink-0 gap-2">
          {failing && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => saveText(exportJSON(), `focusflow-rescue-${todayISO()}.json`)}
            >
              <Download size={15} /> Download a backup
            </Button>
          )}
          {quarantined && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => saveText(quarantined.raw, `focusflow-damaged-${todayISO()}.json`)}
            >
              <Download size={15} /> Download damaged file
            </Button>
          )}
          {saveStatus === 'frozen' ? (
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={15} /> Reload
            </Button>
          ) : (
            failing && (
              <Button size="sm" onClick={retrySave}>
                <RefreshCw size={15} /> Try again
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
