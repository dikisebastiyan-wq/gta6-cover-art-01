# Neon Shore Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/dikisebastiyan-wq/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/dikisebastiyan-wq/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA-style poster
cover art — multi-panel layouts, a Vice City sunset or neon colour grade,
bold original lettering, grain and vignette — and exports it as a PNG to
share. Photos never leave the machine: everything is read and drawn locally
in the browser.

## Try it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080 — load your own photos or try the two
built-in samples, pick a layout and grade, edit the caption, and export a
PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## What it does

- **Any photo** — upload one or several photos from your machine; crop and
  position each panel by dragging, zoom with a slider, or fill every panel
  with one photo.
- **Five panel layouts** — hero + three, full bleed, duo, trio, and a
  nine-panel grid.
- **Four colour grades** — Vice Sunset, Neon Night, Palm Gold, Cold Violet —
  applied as a colour wash over the photos and a sky band.
- **Caption** — a big display title (Anton) with outline, sunset-fill or
  neon-glow styles, plus a script subtitle (Pacifico), movable and resizable.
- **Poster effects** — procedural palm silhouettes, a halftone title strip,
  film grain and a vignette, all drawn by the app itself.
- **Undo / redo** and a shuffle button for instant cover variants.
- **Export** — one click downloads the exact post-size PNG.

## Files

- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library.
- `app/index.html`, `app/style.css` — the editor shell and styling.
- `app/src/cover.js` — the cover renderer (layouts, grades, palms, grain,
  halftone, title block).
- `app/src/editor.js` — editor state, history, photos, dragging, export.
- `app/src/shots.js` — `?shot=editor` / `?shot=cover` scene modes for
  screenshots, drawn by the app itself.
- `app/src/main.js` — entrypoint.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License, with
  their licence texts.
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use.
- `vendor/makefun-app.ts` — the kit's dossier library, copied unchanged.

## Originality

Everything in this entry is original: no Rockstar Games logo, wordmark,
artwork, character or font is used. The lettering is Anton and Pacifico
(SIL OFL), the sample photos were made with an image model for make.fun,
and every panel, palm, halftone dot and gradient is drawn by the app.

## License

MIT — see [LICENSE](LICENSE).
