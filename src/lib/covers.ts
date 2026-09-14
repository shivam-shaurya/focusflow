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
 * Turn whatever is in state into something an <img> can use. Http(s) URLs, data
 * URLs and '' pass through untouched; a `bundled:` ref for a file that is no
 * longer present resolves to '' so the slot shows its empty state rather than a
 * broken image.
 */
export function resolveCover(src?: string): string {
  if (!src) return ''
  if (!isBundledRef(src)) return src
  return COVERS[src.slice(BUNDLED_PREFIX.length)]?.url ?? ''
}

/** Everything not claimed by a weekday or the banner, for the picker gallery. */
export function galleryCovers(): BundledCover[] {
  return Object.values(COVERS).sort((a, b) => a.label.localeCompare(b.label))
}

/** Seeds `settings.dayCovers`, skipping weekdays with no bundled file. */
export function defaultDayCovers(): Record<string, string> {
  const out: Record<string, string> = {}
  WEEKDAY_IDS.forEach((day, i) => {
    if (COVERS[day]) out[String(i)] = bundledRef(day)
  })
  return out
}

export const defaultBanner = (): string => (COVERS.banner ? bundledRef('banner') : '')

export const defaultAvatar = (): string => (COVERS.icon ? bundledRef('icon') : '')
