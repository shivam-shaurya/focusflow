import { useEffect, useState } from 'react'

/** The Chromium-only event that lets us show our own install button. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState = 'unsupported' | 'available' | 'installed' | 'ios'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari reports installed state on navigator, not via display-mode.
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ reports as a Mac; the touch points give it away.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * Install affordance. Chromium fires `beforeinstallprompt` and we can show a
 * real button; iOS/Safari never does, so callers show Add-to-Home-Screen steps.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<InstallState>(() =>
    isStandalone() ? 'installed' : isIOS() ? 'ios' : 'unsupported',
  )

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setState('available')
    }
    const onInstalled = () => {
      setDeferred(null)
      setState('installed')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setState('installed')
    setDeferred(null)
    return outcome === 'accepted'
  }

  return { state, install }
}

/** Live network status, so the UI can say plainly that offline is fine. */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/**
 * Ask the browser to mark this origin's storage as persistent. Without it the
 * data is "best-effort": evictable under disk pressure, and on iOS subject to
 * the 7-day cap for a site that has not been added to the home screen.
 * Every call is feature-detected — Safari < 17 and the Tauri WebView lack it.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function isPersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false
  } catch {
    return false
  }
}

/** Real quota figures, covering everything this origin stores — not just localStorage. */
export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const { usage, quota } = await navigator.storage.estimate()
    if (usage === undefined || quota === undefined) return null
    return { usage, quota }
  } catch {
    return null
  }
}

/** Rough localStorage footprint, so the data page can warn before the quota bites. */
export function storageUsedKB(): number {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      total += k.length + (localStorage.getItem(k)?.length ?? 0)
    }
    return Math.round((total * 2) / 1024) // UTF-16: 2 bytes per code unit
  } catch {
    return 0
  }
}
