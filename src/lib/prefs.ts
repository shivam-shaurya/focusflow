import { useReducedMotion } from 'motion/react'
import { useStore } from './store'

/**
 * The app's single answer to "should this move?".
 *
 * There are two ways to say no — the OS setting and the in-app switch — and
 * until now only the OS one was read, while `settings.reduceMotion` sat in the
 * payload doing nothing. Either saying no is enough; nothing asks which.
 */
export function useCalm(): boolean {
  const os = useReducedMotion()
  const { state } = useStore()
  return Boolean(os) || state.settings.reduceMotion
}
