# Bundled cover art

Drop image files in this folder and they become the app's built-in covers. No
code changes needed — `src/lib/covers.ts` enumerates this directory at build
time with `import.meta.glob`, Vite fingerprints each file, and the service
worker precaches them so they work offline.

## Naming decides the role

| Filename | Where it shows up |
|---|---|
| `monday.webp` … `sunday.webp` | Default cover for that weekday, on Today and the Planner board |
| `banner.webp` | Default banner across the top of the Planner |
| `icon.webp` | Default square board icon beside the Planner title |
| anything else, e.g. `ocean.webp` | Offered in the picker's "Built in" gallery |

Every file also appears in the gallery, so a user can put Friday's art on
Tuesday if they want.

## Accepted formats

`.webp` `.png` `.jpg` `.jpeg` `.gif` `.avif` `.svg` — animated GIFs work.

## Sizes

- Day covers render at roughly **640×240** (a wide band). Source around
  1200×675 is ideal — a 16:9 image crops cleanly.
- The banner renders up to **1280×180**. Source around 1600×500.
- The board icon is square, **56×56**. Use a 1:1 source.

Images are drawn with `object-cover`, so any aspect ratio works — but a tall
portrait image will be cropped to a narrow horizontal band through its middle.
Landscape sources look best.

## Keep them small

Everything here is precached, so the total lands in every user's browser on
first visit. Aim for **under ~150 KB per file**; WebP at quality 80 gets there
easily. The precache is capped at 6 MB per file — anything larger is silently
skipped and will not work offline.

## Licensing

These ship to every user, so only use art you have the right to redistribute:
your own work, or something under a permissive licence (Unsplash, Pexels,
CC0). Avoid fan art and anything scraped from Giphy or Tenor — users can still
paste those as links for their own private copy.

## After adding files

Restart `npm run dev` (new files are picked up at startup). Existing installs
keep whatever covers they already have; the defaults apply to fresh installs,
and anyone can pick the new art from the picker's gallery.
