import { useRef, useState } from 'react'
import { Check, ImagePlus, Link2, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { NONE_REF, bundledRef, galleryCovers, isShowingDefault, resolveCover } from '../lib/covers'
import { useEditMode } from '../lib/edit'
import { Button, cx } from './ui'

/** The shared look for a control sitting on top of an image. */
const OVERLAY_BTN =
  '!min-h-8 pointer-coarse:!min-h-10 border-transparent bg-[var(--color-overlay)] ' +
  '!px-2 text-[var(--color-on-overlay)] backdrop-blur'

/** Uploads are inlined as data URLs into localStorage, so keep them small. */
const MAX_UPLOAD = 1_200_000

/**
 * Cover image or GIF for a card. Links are preferred (Giphy/Tenor direct .gif
 * URLs work); uploads are supported but count against browser storage.
 *
 * The controls live behind the page's edit mode. They used to appear on hover,
 * which on a phone — where nothing hovers — meant a "Change" button sitting
 * permanently on top of every image in the app.
 */
export function Cover({
  src, onChange, height = 120, label, rounded = 'rounded-t-[var(--radius-card)]',
  defaultId,
}: {
  src?: string
  onChange: (url: string) => void
  height?: number
  label: string
  rounded?: string
  /** Bundled cover designed for this slot, shown whenever nothing is chosen. */
  defaultId?: string
}) {
  const [open, setOpen] = useState(false)
  const { editing } = useEditMode()
  // State holds an opaque ref (`bundled:…`) or a plain URL; only the <img> needs
  // the resolved form, so a saved cover survives a change of base path.
  const resolved = resolveCover(src, defaultId)
  const onDefault = isShowingDefault(src, defaultId)
  /*
   * A slot this small (the board icon is 56px) cannot hold a row of labelled
   * buttons — they spilled off its left edge and over the title beside it. Below
   * this height the controls become two icons, centred on the image.
   */
  const tiny = height <= 100

  // Removed, and nobody is editing: the slot takes up no room at all. This is
  // what makes "delete the image" mean something on a page that has default art
  // waiting behind every slot.
  if (!resolved && !editing) return null

  return (
    <div className="group/cover relative" style={{ height: resolved ? height : undefined }}>
      {resolved ? (
        <img
          src={resolved}
          alt=""
          className={cx('h-full w-full object-cover', rounded)}
          style={{ height }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.25' }}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Add an image or GIF for ${label}`}
          className={cx(
            'flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed',
            'text-xs font-semibold text-[var(--color-fg-muted)]',
            'transition-colors duration-150 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
            // The label does not fit a 56px slot, so there it is the icon alone.
            tiny ? 'aspect-square' : 'py-3',
            rounded,
          )}
        >
          <ImagePlus size={14} aria-hidden="true" />
          {!tiny && 'Add image or GIF'}
        </button>
      )}

      {resolved && editing && (
        <div
          className={cx(
            'absolute flex gap-1',
            tiny ? 'inset-0 items-center justify-center' : 'right-2 top-2',
          )}
        >
          <Button
            size="sm"
            className={cx(OVERLAY_BTN, tiny && '!px-1.5')}
            onClick={() => setOpen(true)}
            aria-label={`Change ${label}`}
            title="Change image"
          >
            {tiny ? <ImagePlus size={13} /> : 'Change'}
          </Button>
          {/* Reset only exists where there is bundled art to go back to, and it
              is a different act from removing the image, so it is a different
              button rather than one that changes meaning. */}
          {!onDefault && defaultId && !tiny && (
            <Button
              size="sm"
              className={OVERLAY_BTN}
              onClick={() => onChange('')}
              aria-label={`Reset ${label} to the default`}
              title="Reset to default"
            >
              <RotateCcw size={13} />
            </Button>
          )}
          <Button
            size="sm"
            className={cx(OVERLAY_BTN, tiny && '!px-1.5')}
            onClick={() => onChange(NONE_REF)}
            aria-label={`Remove ${label}`}
            title="Remove image"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      )}

      {open && (
        <Picker
          label={label}
          current={src ?? ''}
          onClose={() => setOpen(false)}
          onPick={(url) => { onChange(url); setOpen(false) }}
        />
      )}
    </div>
  )
}

function Picker({
  label, current, onPick, onClose,
}: { label: string; current: string; onPick: (url: string) => void; onClose: () => void }) {
  // A `bundled:` ref is not something to show in a URL field, so the text input
  // starts empty for those rather than round-tripping the ref back as a "link".
  const [url, setUrl] = useState(current.startsWith('bundled:') ? '' : current)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const gallery = galleryCovers()

  const takeFile = (file: File) => {
    if (file.size > MAX_UPLOAD) {
      setErr(`That file is ${(file.size / 1e6).toFixed(1)} MB. Keep uploads under 1.2 MB, or paste a link instead.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onPick(String(reader.result))
    reader.onerror = () => setErr('Could not read that file.')
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-overlay)] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Set ${label}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">{label}</h2>
            <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
              {gallery.length > 0
                ? 'Pick one of the built-in covers, paste a link, or upload a file.'
                : 'Paste a direct image or GIF link, or upload a small file.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer rounded-[var(--radius-control)] p-1.5 hover:bg-[var(--color-surface-2)]">
            <X size={16} />
          </button>
        </div>

        {gallery.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
              Built in
            </p>
            <ul className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto pr-1">
              {gallery.map((c) => {
                const ref = bundledRef(c.id)
                const active = current === ref
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onPick(ref)}
                      aria-label={c.label}
                      aria-pressed={active}
                      className={cx(
                        'relative block h-16 w-full cursor-pointer overflow-hidden rounded-[var(--radius-control)] border transition-colors duration-150',
                        active
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                          : 'hover:border-[var(--color-primary)]',
                      )}
                    >
                      <img src={c.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      {active && (
                        <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onPick(url.trim())
          }}
        >
          <span className="grid min-h-11 place-items-center rounded-[var(--radius-control)] border px-3 text-[var(--color-fg-muted)]">
            <Link2 size={15} aria-hidden="true" />
          </span>
          <input
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErr('') }}
            placeholder="https://media.giphy.com/…/giphy.gif"
            aria-label="Image or GIF URL"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm outline-none"
          />
          <Button type="submit" variant="primary">Use</Button>
        </form>

        {url.trim() && (
          <img
            src={url.trim()}
            alt=""
            className="mt-3 h-32 w-full rounded-[var(--radius-control)] border object-cover"
            onError={() => setErr('That link did not load as an image.')}
          />
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Upload a file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) takeFile(f)
              e.target.value = ''
            }}
          />
          <span className="text-xs text-[var(--color-fg-muted)]">Max 1.2 MB</span>
        </div>

        {err && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-destructive)]">{err}</p>}
      </div>
    </div>
  )
}
