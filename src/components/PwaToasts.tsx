import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { CloudOff, Download, RefreshCw, X } from 'lucide-react'
import { Button } from './ui'

/**
 * Two transient messages, bottom-right:
 *  - "ready offline" the first time the service worker finishes precaching
 *  - "update ready" when a new build is waiting, with an explicit reload
 * Nothing auto-reloads: losing a half-written journal entry to a silent
 * refresh would be worse than running one version behind.
 */
export function PwaToasts() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  const [showOffline, setShowOffline] = useState(false)

  useEffect(() => {
    if (!offlineReady) return
    setShowOffline(true)
    const t = window.setTimeout(() => {
      setShowOffline(false)
      setOfflineReady(false)
    }, 6000)
    return () => window.clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  const show = showOffline || needRefresh

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-50 flex max-w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-4 shadow-lg shadow-black/20"
        >
          <span className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden="true">
            {needRefresh ? <RefreshCw size={18} /> : <Download size={18} />}
          </span>

          <div className="min-w-0 flex-1">
            {needRefresh ? (
              <>
                <p className="text-sm font-bold">A new version is ready</p>
                <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                  Your data is untouched by updating.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => void updateServiceWorker(true)}>
                    Reload now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
                    Later
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">Ready to work offline</p>
                <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                  FocusFlow is saved to this device. You can open it with no connection.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setShowOffline(false)
              setOfflineReady(false)
              setNeedRefresh(false)
            }}
            aria-label="Dismiss"
            className="shrink-0 cursor-pointer rounded-md p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A quiet marker in the sidebar so "am I offline?" is never a mystery. */
export function OfflineBadge({ online }: { online: boolean }) {
  if (online) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--color-fg-muted)]">
      <CloudOff size={12} aria-hidden="true" />
      Offline — still saving
    </span>
  )
}
