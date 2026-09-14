/** Class joiner. Its own module so `primitives` and `interactions` can both
 *  use it while `primitives` imports from `interactions` — importing it from
 *  either of those would make that a cycle. */
export const cx = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')
