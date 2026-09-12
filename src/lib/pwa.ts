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
