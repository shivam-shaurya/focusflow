# FocusFlow

An ADHD-friendly daily planner, introspection journal, and long-horizon progress
tracker. Motion-style app shell, everything stored locally in the browser.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build into dist/
npm run build:pages    # build for GitHub Pages (base /focusflow/)
npm run build:tauri    # build for the desktop shell (base /, no service worker)
npm run icons          # regenerate every icon from scripts/make-icons.py
```

## Install it (offline app)

FocusFlow is a PWA: a service worker precaches the whole app shell, so after
one visit it opens with no connection at all. Data was already local-only —
offline changes nothing about where it lives.

| Platform | How to install |
|---|---|
| **Windows / macOS / Linux** (Chrome, Edge) | Install icon in the address bar, or Settings → Install FocusFlow |
| **Android** (Chrome) | Browser menu → *Install app* / *Add to Home screen* |
| **iPhone / iPad** (Safari) | Share → *Add to Home Screen* — the only route Apple allows |
| **Native desktop app** | Download the `.msi` / `.exe` / `.dmg` from the repo's Releases, or build it: `npm run desktop:build` |

Settings shows an **Install FocusFlow** card that detects your platform and
either installs directly or gives the exact steps. A sidebar badge appears
when you go offline, so it is never ambiguous whether edits are saving.

### Updates

The app never reloads itself. When a new version is deployed you get a
"new version is ready" toast with an explicit **Reload now** — losing a
half-written journal entry to a silent refresh would be worse than running one
version behind. Updating does not touch stored data.

## Deploy

### GitHub Pages (automatic)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
The app uses hash routing (`#/today`), so deep links work on Pages with no
404-rewrite trick.

```bash
git remote add origin https://github.com/<you>/focusflow.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: GitHub Actions**. The site lands
at `https://<you>.github.io/focusflow/`.

> If you name the repo something other than `focusflow`, change `base` in
> [vite.config.ts](vite.config.ts) to match.

### Desktop installers

`.github/workflows/desktop.yml` builds Windows (`.msi`, `.exe`), macOS
(Apple Silicon + Intel `.dmg`), and Linux (`.deb`, AppImage) installers and
attaches them to a draft GitHub Release:

```bash
git tag v1.0.0 && git push --tags
```

To build locally instead you need Rust plus your platform's C toolchain
(MSVC Build Tools on Windows, Xcode CLT on macOS):

```bash
npm run desktop:dev      # hot-reloading desktop window
npm run desktop:build    # installer in src-tauri/target/release/bundle/
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

Everything is in `localStorage` under `focusflow.v2`. Nothing leaves the device,
online or offline — the network is only ever used to fetch cover images you link
to, and those are cached for offline use too. Settings → Export backup writes a
JSON file; Import reads it back. That export is also how you move data between
the browser version and the desktop app, since they have separate stores.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · motion · lucide-react ·
vite-plugin-pwa (Workbox) · Tauri 2
