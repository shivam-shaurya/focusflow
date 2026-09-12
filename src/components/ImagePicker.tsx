import { useRef, useState } from 'react'
import { ImagePlus, Link2, Trash2, Upload, X } from 'lucide-react'
import { Button, cx } from './ui'

/** Uploads are inlined as data URLs into localStorage, so keep them small. */
const MAX_UPLOAD = 1_200_000

/**
 * Cover image or GIF for a card. Links are preferred (Giphy/Tenor direct .gif
 * URLs work); uploads are supported but count against browser storage.
 */
export function Cover({
  src, onChange, height = 120, label, rounded = 'rounded-t-[var(--radius-card)]',
}: {
  src?: string
  onChange: (url: string) => void
  height?: number
  label: string
  rounded?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="group/cover relative" style={{ height: src ? height : undefined }}>
      {src ? (
        <img
          src={src}
          alt=""
          className={cx('h-full w-full object-cover', rounded)}
          style={{ height }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.25' }}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cx(
            'flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed',
            'py-3 text-xs font-semibold text-[var(--color-fg-muted)]',
            'transition-colors duration-150 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
            rounded,
          )}
        >
          <ImagePlus size={14} aria-hidden="true" /> Add image or GIF
        </button>
      )}

      {src && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/cover:opacity-100">
          <Button size="sm" className="!min-h-8 bg-black/60 !px-2 text-white backdrop-blur" onClick={() => setOpen(true)}>
            Change
          </Button>
          <Button
            size="sm"
            className="!min-h-8 bg-black/60 !px-2 text-white backdrop-blur"
            onClick={() => onChange('')}
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      )}

      {open && (
        <Picker
          label={label}
          initial={src ?? ''}
          onClose={() => setOpen(false)}
          onPick={(url) => { onChange(url); setOpen(false) }}
        />
      )}
    </div>
  )
}

function Picker({
  label, initial, onPick, onClose,
}: { label: string; initial: string; onPick: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState(initial)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
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
              Paste a direct image or GIF link, or upload a small file.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer rounded-lg p-1.5 hover:bg-[var(--color-surface-2)]">
            <X size={16} />
          </button>
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onPick(url.trim())
          }}
        >
          <span className="grid min-h-11 place-items-center rounded-lg border px-3 text-[var(--color-fg-muted)]">
            <Link2 size={15} aria-hidden="true" />
          </span>
          <input
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErr('') }}
            placeholder="https://media.giphy.com/…/giphy.gif"
            aria-label="Image or GIF URL"
            className="min-h-11 min-w-0 flex-1 rounded-lg border bg-[var(--color-surface-2)] px-3 text-sm outline-none"
          />
          <Button type="submit" variant="primary">Use</Button>
        </form>

        {url.trim() && (
          <img
            src={url.trim()}
            alt=""
            className="mt-3 h-32 w-full rounded-lg border object-cover"
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
