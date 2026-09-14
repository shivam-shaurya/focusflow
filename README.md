# FocusFlow

An ADHD-friendly daily planner, introspection journal, and long-horizon progress
tracker. Motion-style app shell, everything stored locally in the browser.

> **The system in this app is Shwetabh Gangwar's, not mine.** I built the
> software; he worked out the method it runs on. See [Credit](#credit).

## Credit

The system this app implements — the daily goals, the journal templates, the
New Me page, the framing behind all of it — is the work of **Shwetabh Gangwar**
([YouTube](https://www.youtube.com/@ShwetabhGangwar1)). The research, the
templates and the method are his.

This is a personal project. I wanted to run his system as software instead of a
document, so I built one for my own use. The app is mine — every line of the
code and every decision in the interface, written from scratch — but it is only
a container. What makes it worth using is his.

I make no claim over his system, his templates, or the work behind them, and
this project is not affiliated with him or endorsed by him. If you came here for
the method rather than the app, go to the source:
<https://www.youtube.com/@ShwetabhGangwar1>.

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
| `3` | Deadlines | Countdown, % bar, and the pace maths: give it hours + a due date and it tells you what today owes |
| `4` | Journal | Mood + focus ratings and **seven templates** — daily reflection, data drop, problem breakdown, solve it, 5 whys, preventive measures, self-compassion |
| `5` | New Me | The pointed re-read-daily page: collapsible colour-coded sections (rules, learnings, preventive measures, purpose, visualization), fully editable, add/delete/reorder |
| `6` | Progress | **Week / month / year** rollups: stat tiles, bar charts, consistency bars, full-year heatmap, table view |
| `7` | Settings | Name, year theme, all seven day covers, daily-goal editor, focus/break length, theme, JSON export/import |

## Deadlines

Add what it is, the hours you think it needs, and the date it is due. Everything
else is arithmetic rather than a guess:

- **Working days.** Pick which weekdays you can actually touch it. The daily
  target divides across those days only, so "I never study at weekends" produces
  a number you can hit instead of one you quietly ignore.
- **Do today.** The headline figure, already net of hours logged today.
- **Pace.** Logged hours are compared against a linear expectation across the
  working days of the whole run, so starting late shows up as a shortfall rather
  than hiding in an average. Ahead / on track / behind / at risk / past due.
- **Strategise** — daily, weekly or monthly. Remaining effort is split across
  remaining *days* and then grouped, so a three-day final week is asked for three
  days' worth, not a full week's. Past periods show what was actually logged,
  and an empty past period reads "missed".
- **Today** shows a nudge with the total hours the day owes across all deadlines,
  and names the ones that have slipped far enough that the plan needs changing.

A daily quote sits at the top of Today. It is derived from the date, so it is
fixed for the day and identical on every device, with nothing stored.

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

Everything is in `localStorage` under `focusflow.v2`, with a `version` field in the
payload driving a migration ladder (`src/lib/persist.ts`). Writes are debounced
~400ms and flushed on `pagehide`, so closing a tab mid-sentence does not lose it.

Three guarantees the app makes about saving:

- **A failed save is never silent.** If the quota fills or the browser blocks
  storage, a sticky banner appears wherever you are, with a **Download a backup**
  button. It does not go away until saving works again.
- **A damaged save is never overwritten.** If the stored payload can't be parsed
  it is copied to `focusflow.v2.corrupt.<ts>` *before* the app starts fresh, and
  you're offered the damaged file to download. If it can't be copied aside,
  saving is refused entirely so the bytes stay recoverable.
- **A newer save is never downgraded.** A payload written by a future version
  freezes writes instead of clobbering it.

The app also calls `navigator.storage.persist()` so the browser won't evict your
data under disk pressure — Settings shows whether that was granted. Import takes
a snapshot first and offers an **Undo import** for 20 seconds. Nothing leaves the device,
online or offline — the network is only ever used to fetch cover images you link
to, and those are cached for offline use too. Settings → Export backup writes a
JSON file; Import reads it back. That export is also how you move data between
the browser version and the desktop app, since they have separate stores.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · motion · lucide-react ·
vite-plugin-pwa (Workbox) · Tauri 2
