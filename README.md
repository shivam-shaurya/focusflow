# FocusFlow

An ADHD-friendly daily planner, introspection journal, and long-horizon progress
tracker. Motion-style app shell, everything stored locally in the browser.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## Views

| Key | View | What it is |
|-----|------|------------|
| `1` | Today | Today's cover image, the seven daily goals, one-off tasks, brain-dump Inbox, focus timer, week strip |
| `2` | Planner | Notion-style board: editable banner, icon and title, one cover image per weekday, all seven goals on every day card |
| `3` | Journal | Mood + focus ratings and **seven templates** — daily reflection, data drop, problem breakdown, solve it, 5 whys, preventive measures, self-compassion |
| `4` | New Me | The pointed re-read-daily page: collapsible colour-coded sections (rules, learnings, preventive measures, purpose, visualization), fully editable, add/delete/reorder |
| `5` | Progress | **Week / month / year** rollups: stat tiles, bar charts, consistency bars, full-year heatmap, table view |
| `6` | Settings | Name, year theme, all seven day covers, daily-goal editor, focus/break length, theme, JSON export/import |

## Customization

- **Images and GIFs** anywhere a cover appears — board banner, board icon, each
  weekday card, each New Me section, each visualization link. Paste a direct
  link (Giphy/Tenor `.gif` URLs work) or upload a file under 1.2 MB.
- **Daily goals** ship as seven (Meditation, Interpersonal skills, Reading,
  Sales, Studying, Workout, Running). Reorder, delete, or add more.
  - The **name and emoji are shared** — renaming "Reading" renames it on every day.
  - The **note is per-date** — open Reading on Monday's card and write "chapter 4";
    Tuesday's Reading keeps its own note, and changing one never touches the other.
  - An optional **shared description** (edited in Settings) shows under every day's
    note as general context for what the goal means.
- **Tasks** have no estimate or energy field — click a task to open it and write
  a description instead.

## Design decisions

The visual system came from the **UI/UX Pro Max** skill
(`npx ui-ux-pro-max-cli init --ai claude`, installed into `.claude/skills/`),
queried as an ADHD productivity dashboard at variance 6 / motion 6 / density 5:

- **Style** Flat Design — no gradient noise, no shadow depth games
- **Color** teal focus (`#0D9488` / `#2DD4BF`) + orange action accent (`#EA580C` / `#FB923C`)
- **Type** Plus Jakarta Sans
- Tokens live in `src/index.css`; dark is the default shell, light is a toggle.

ADHD-specific choices, on purpose:

- **Capture costs nothing.** One always-visible input per screen, with no
  required metadata standing between a thought and the list.
- **One target, not twenty.** The Today screen elevates a single next task above
  the list.
- **Time is made spatial.** The focus ring shows remaining time as area, not a
  number, because "25 minutes" means nothing under time blindness.
- **Gaps are neutral.** The year heatmap and streak counters never scold; missed
  days read as data.
- **Motion is short and meaningful** (150–450ms) and fully respects
  `prefers-reduced-motion`.

## Data

Everything is in `localStorage` under `focusflow.v1`. Nothing leaves the browser.
Settings → Export backup writes a JSON file; Import reads it back.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · motion · lucide-react
