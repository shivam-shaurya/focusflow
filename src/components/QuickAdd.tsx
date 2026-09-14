import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button } from './ui'

/** One input, nothing else. Capture has to cost nothing or the thought is gone. */
export function QuickAdd({ date, placeholder = 'Add a task…' }: { date?: string; placeholder?: string }) {
  const { addTask } = useStore()
  const [title, setTitle] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    addTask({ title: v, date, bucket: date ? 'today' : 'inbox' })
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label="New task"
        className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border bg-[var(--color-surface-2)] px-3 text-sm font-medium outline-none placeholder:text-[var(--color-fg-muted)]"
      />
      <Button type="submit" variant="primary" aria-label="Add task">
        <Plus size={16} /> Add
      </Button>
    </form>
  )
}
