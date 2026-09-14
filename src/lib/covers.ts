/**
 * Bundled cover art.
 *
 * Drop image files into `src/assets/covers/` and they appear here automatically —
 * `import.meta.glob` enumerates them at build time, Vite fingerprints them, and
 * the service worker precaches them, so the defaults work offline like the rest
 * of the app. Nothing else needs editing.
 *
 * Naming decides the role:
 *   monday.webp … sunday.webp   default cover for that weekday
 *   banner.webp                 default board banner on the Planner
 *   icon.webp                   default square board icon beside the title
 *   anything-else.webp          offered in the picker's gallery
 *
 * State stores the opaque ref `bundled:<id>`, never a resolved URL, so a saved
 * cover survives the app moving between the GitHub Pages base path and the
 * desktop build.
 */

const modules = import.meta.glob('../assets/covers/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const BUNDLED_PREFIX = 'bundled:'

/**
 * An explicit "no image here".
 *
 * An empty slot cannot mean this, because empty already means "show the art
 * bundled for this slot" — which is what makes the defaults appear for people
 * whose saved data predates them. Without a sentinel there is no way to say
 * you want nothing at all, and every cover in the app would be permanent.
 */
export const NONE_REF = 'none:'

export const isNone = (s?: string): boolean => s === NONE_REF

export interface BundledCover {
  id: string
  /** Title-cased from the filename, for the picker. */
  label: string
  url: string
}

const titleCase = (s: string) =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** id -> cover, keyed on the filename without its extension. */
export const COVERS: Record<string, BundledCover> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const id = path.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase()
    return [id, { id, label: titleCase(id), url }]
  }),
)

export const WEEKDAY_IDS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

export const isBundledRef = (s?: string): boolean => !!s?.startsWith(BUNDLED_PREFIX)

export const bundledRef = (id: string) => `${BUNDLED_PREFIX}${id}`

/**
 * Turn whatever is in state into something an <img> can use.
 *
 * `fallbackId` is the bundled art designed for this particular slot (the
 * weekday, the banner, the board icon). An empty slot falls back to it, so the
 * defaults show for everyone — including people whose saved data predates the
 * art being added — without rewriting anything on disk. Anything the user has
 * actually chosen wins.
 *
 * Http(s) and data URLs pass through untouched. A `bundled:` ref whose file is
 * gone falls back too, so a deleted image never leaves a broken <img>.
 */
export function resolveCover(src?: string, fallbackId?: string): string {
  const fallback = fallbackId ? COVERS[fallbackId]?.url ?? '' : ''
  if (isNone(src)) return ''
  if (!src) return fallback
  if (!isBundledRef(src)) return src
  return COVERS[src.slice(BUNDLED_PREFIX.length)]?.url ?? fallback
}

/** Whether a slot is showing bundled art rather than something the user picked. */
export const isShowingDefault = (src: string | undefined, fallbackId?: string): boolean =>
  !src && !!fallbackId && !!COVERS[fallbackId]

/** Everything not claimed by a weekday or the banner, for the picker gallery. */
export function galleryCovers(): BundledCover[] {
  return Object.values(COVERS).sort((a, b) => a.label.localeCompare(b.label))
}

