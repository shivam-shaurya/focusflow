import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check, ChevronDown, ChevronUp, ExternalLink, Flame, GripVertical, Plus, Trash2,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useEditMode } from '../lib/edit'
import type { Block, BlockItem, BlockKind, BlockTone } from '../lib/types'
import { Button, cx, Page, PageHeader, EditToggle } from '../components/ui'
import { Cover } from '../components/ImagePicker'

/** Tone tints borrow the Notion callout colours without the saturation. */
const TONES: Record<BlockTone, string> = {
  neutral: 'border-[var(--color-line)] bg-[var(--color-surface)]',
  warn: 'border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-surface))]',
  danger: 'border-[color-mix(in_oklab,var(--color-destructive)_45%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-destructive)_7%,var(--color-surface))]',
  gold: 'border-[color-mix(in_oklab,var(--color-tone-gold)_45%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-tone-gold)_8%,var(--color-surface))]',
  blue: 'border-[color-mix(in_oklab,var(--color-tone-blue)_45%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-tone-blue)_8%,var(--color-surface))]',
}

const TONE_LABELS: Array<[BlockTone, string]> = [
  ['neutral', 'Plain'],
  ['warn', 'Caution'],
  ['danger', 'Danger'],
  ['gold', 'Purpose'],
  ['blue', 'Vision'],
]

const KINDS: Array<[BlockKind, string]> = [
  ['bullets', 'Bullet list'],
  ['checklist', 'Checklist'],
  ['prompts', 'Prompts to answer'],
  ['links', 'Links & images'],
]

export function NewMe() {
  const { state, addBlock } = useStore()
  const { editing } = useEditMode()

  const blocks = useMemo(
    () => [...state.blocks].sort((a, b) => a.order - b.order),
    [state.blocks],
  )

  const purpose = blocks.find((b) => b.kind === 'checklist')
  const purposeDone = purpose?.items.filter((i) => i.done).length ?? 0

  return (
    <Page width="reading">
      <PageHeader
        icon={Flame}
        eyebrow="Read this every day"
        title="NEW ME"
        hint={purpose ? `${purposeDone} of ${purpose.items.length} purpose items done` : undefined}
        actions={<EditToggle />}
      />

      {blocks.map((b, i) => (
        <BlockCard key={b.id} block={b} index={i} count={blocks.length} />
      ))}

      {editing && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-dashed p-4">
          <span className="text-sm font-semibold text-[var(--color-fg-muted)]">Add a section:</span>
          {KINDS.map(([kind, label]) => (
            <Button key={kind} size="sm" onClick={() => addBlock(kind)}>
              <Plus size={14} /> {label}
            </Button>
          ))}
        </div>
      )}
    </Page>
  )
}

function BlockCard({
  block, index, count,
}: { block: Block; index: number; count: number }) {
  const { editing } = useEditMode()
  const { updateBlock, removeBlock, moveBlock, addItem, updateItem, removeItem } = useStore()

  return (
    <motion.section
      layout
      className={cx('overflow-hidden rounded-[var(--radius-card)] border', TONES[block.tone])}
    >
      {(block.image || editing) && (
        <Cover
          src={block.image}
          height={140}
          label={`${block.title} image`}
          onChange={(url) => updateBlock(block.id, { image: url })}
        />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => updateBlock(block.id, { open: !block.open })}
            aria-expanded={block.open}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
          >
            <motion.span
              animate={{ rotate: block.open ? 0 : -90 }}
              transition={{ duration: 0.15 }}
              className="mt-1 shrink-0 text-[var(--color-fg-muted)]"
              aria-hidden="true"
            >
              <ChevronDown size={16} />
            </motion.span>
            <span className="min-w-0">
              {editing ? (
                <input
                  value={block.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                  aria-label="Section title"
                  className="w-full rounded-[var(--radius-micro)] bg-transparent text-lg font-extrabold outline-none focus:bg-[var(--color-surface-2)]"
                />
              ) : (
                <span className="block text-lg font-extrabold tracking-tight">{block.title}</span>
              )}
              {editing ? (
                <input
                  value={block.subtitle}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                  placeholder="Subtitle"
                  aria-label="Section subtitle"
                  className="mt-0.5 w-full rounded-[var(--radius-micro)] bg-transparent text-sm text-[var(--color-fg-muted)] outline-none focus:bg-[var(--color-surface-2)]"
                />
              ) : (
                block.subtitle && (
                  <span className="mt-0.5 block text-sm text-[var(--color-fg-muted)]">{block.subtitle}</span>
                )
              )}
            </span>
          </button>

          {editing && (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => moveBlock(block.id, -1)}
                disabled={index === 0}
                aria-label="Move section up"
                className="cursor-pointer rounded-[var(--radius-micro)] p-1.5 text-[var(--color-fg-muted)] disabled:opacity-30"
              >
                <ChevronUp size={15} />
              </button>
              <button
                onClick={() => moveBlock(block.id, 1)}
                disabled={index === count - 1}
                aria-label="Move section down"
                className="cursor-pointer rounded-[var(--radius-micro)] p-1.5 text-[var(--color-fg-muted)] disabled:opacity-30"
              >
                <ChevronDown size={15} />
              </button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm(`Delete the "${block.title}" section?`)) removeBlock(block.id)
                }}
                aria-label="Delete section"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>

        {editing && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs font-bold uppercase text-[var(--color-fg-muted)]">Colour</span>
            {TONE_LABELS.map(([tone, label]) => (
              <button
                key={tone}
                onClick={() => updateBlock(block.id, { tone })}
                aria-pressed={block.tone === tone}
                className={cx(
                  'min-h-8 cursor-pointer rounded-[var(--radius-micro)] border px-2 text-xs font-semibold',
                  TONES[tone],
                  block.tone === tone && 'ring-2 ring-[var(--color-primary)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {block.open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-2">
                {block.items.map((it) => (
                  <Item
                    key={it.id}
                    item={it}
                    kind={block.kind}
                    onChange={(patch) => updateItem(block.id, it.id, patch)}
                    onRemove={() => removeItem(block.id, it.id)}
                  />
                ))}
                <Button size="sm" variant="ghost" className="self-start" onClick={() => addItem(block.id)}>
                  <Plus size={14} /> Add line
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

function Item({
  item, kind, onChange, onRemove,
}: {
  item: BlockItem
  kind: BlockKind
  onChange: (patch: Partial<BlockItem>) => void
  onRemove: () => void
}) {
  const shared =
    'w-full resize-none rounded-[var(--radius-control)] border border-transparent bg-transparent p-2 text-sm leading-relaxed ' +
    'outline-none focus:border-[var(--color-line)] focus:bg-[var(--color-surface-2)]'

  return (
    <div className="group flex items-start gap-2">
      {kind === 'checklist' ? (
        <button
          onClick={() => onChange({ done: !item.done })}
          aria-pressed={!!item.done}
          aria-label={item.done ? `Uncheck ${item.text}` : `Check ${item.text}`}
          className={cx(
            'mt-2 grid size-5 shrink-0 cursor-pointer place-items-center rounded-[var(--radius-micro)] border-2 transition-colors duration-150',
            item.done
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'border-[var(--color-fg-muted)] hover:border-[var(--color-primary)]',
          )}
        >
          {item.done && <Check size={12} strokeWidth={3} />}
        </button>
      ) : (
        <GripVertical
          size={14}
          aria-hidden="true"
          className="mt-3 shrink-0 text-[var(--color-fg-muted)] opacity-40"
        />
      )}

      <div className="min-w-0 flex-1">
        {kind === 'prompts' ? (
          <>
            <input
              value={item.text}
              onChange={(e) => onChange({ text: e.target.value })}
              aria-label="Prompt"
              className={cx(shared, 'font-bold')}
            />
            <textarea
              value={item.url ?? ''}
              onChange={(e) => onChange({ url: e.target.value })}
              rows={3}
              placeholder="Answer…"
              aria-label={`Answer to: ${item.text}`}
              className="mt-1 w-full resize-y rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] p-2.5 text-sm leading-relaxed outline-none"
            />
          </>
        ) : kind === 'links' ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={item.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Name"
              aria-label="Link name"
              className={cx(shared, 'min-w-0 flex-1 font-semibold')}
            />
            <input
              value={item.url ?? ''}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://…"
              aria-label="URL"
              className={cx(shared, 'min-w-0 flex-1')}
            />
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${item.text}`}
                className="rounded-[var(--radius-micro)] p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <div className="w-full">
              <Cover
                src={item.image}
                height={120}
                label={`${item.text || 'Link'} image`}
                rounded="rounded-[var(--radius-control)]"
                onChange={(url) => onChange({ image: url })}
              />
            </div>
          </div>
        ) : (
          <textarea
            value={item.text}
            onChange={(e) => {
              onChange({ text: e.target.value })
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            rows={Math.max(1, Math.ceil(item.text.length / 90))}
            placeholder="Write a line…"
            aria-label="Line"
            className={cx(shared, item.done && 'text-[var(--color-fg-muted)] line-through')}
          />
        )}
      </div>

      <button
        onClick={onRemove}
        aria-label="Delete line"
        className="mt-2 shrink-0 cursor-pointer rounded-[var(--radius-micro)] p-1.5 text-[var(--color-fg-muted)] opacity-0 transition-opacity duration-150 hover:text-[var(--color-destructive)] focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
