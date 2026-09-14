import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Whether the current page is in edit mode.
 *
 * New Me had this idea first and kept it to itself: an "Edit page" button that
 * reveals the controls for changing the page, and hides them the rest of the
 * time. Every other page put its customisation controls on hover instead —
 * which meant they were invisible on a desktop until you went looking, and
 * permanently in the way on a phone, where a "Change" button sat on top of
 * every single image.
 *
 * So it is one mode, shared. Pages ask for it; `Cover` and anything else that
 * edits the page read it without being handed a prop through four components.
 *
 * It is deliberately not persisted. Edit mode is something you enter to do one
 * thing and leave — nobody wants to reopen the app tomorrow and find every
 * image wearing a button again.
 */
const Ctx = createContext<{ editing: boolean; setEditing: (v: boolean) => void }>({
  editing: false,
  setEditing: () => {},
})

export function EditModeProvider({
  children, value, onChange,
}: {
  children: ReactNode
  /** Controlled mode — the shell owns the flag so it can clear it on navigation. */
  value?: boolean
  onChange?: (v: boolean) => void
}) {
  const [own, setOwn] = useState(false)
  const editing = value ?? own
  const setEditing = onChange ?? setOwn
  const ctx = useMemo(() => ({ editing, setEditing }), [editing, setEditing])
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export const useEditMode = () => useContext(Ctx)

/**
 * Forces edit mode on for a subtree. Settings is entirely a page for changing
 * things, so making you press "Edit" there would be a toggle that guards
 * nothing.
 */
export function AlwaysEditing({ children }: { children: ReactNode }) {
  const ctx = useMemo(() => ({ editing: true, setEditing: () => {} }), [])
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}
