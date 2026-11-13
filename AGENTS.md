# AGENTS.md — working notes for AI agents (and humans) on this repo

PS5 Dashboard is a [Decky Loader](https://decky.xyz) plugin that makes SteamOS Game Mode look and
feel like the PlayStation 5 home screen. This repo is a **fork** of
[kromossomo/decky-ps5-dashboard](https://github.com/kromossomo-debug/decky-ps5-dashboard) branched
at v1.10.0. The fork's own additions (see README "What this fork adds") are: clock, battery
indicator, **UI scale setting (80–160%)**, hide-top-bar-status, and correct playtime for non-Steam
games. Most of the layout knowledge below exists because of the UI scale feature.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm run build       # rollup -c → dist/index.js
npm run watch       # rollup watch while iterating
bash scripts/package.sh   # build + ps5-dashboard.zip (Decky "Install from ZIP" format)
```

- `package.sh` **refuses to build** if `const VERSION` in `src/index.tsx` doesn't match
  `package.json` — bump both together when releasing.
- Release flow: bump `package.json` + `src/index.tsx`, add a `CHANGELOG.md` entry, build, package,
  attach the ZIP to the GitHub release.
- Test on device: install the ZIP via Game Mode → Quick Access → Decky → Developer → *Install
  plugin from ZIP* (Developer mode must be on). Settings survive reinstall.

## File map

| File | What it is |
|---|---|
| `src/styles.ts` | **All plugin CSS** in one exported template string (`PS5_CSS`). The plugin's own screens only. |
| `src/palette.ts` | PS5 repaint of Steam's *own* colors (injected into Steam's documents, see `injector.ts`). |
| `src/injector.ts` | Finds Steam's Game Mode windows/popups and injects the palette; keepalive re-injects. |
| `src/Shell.tsx` | Tab bar (Games/Media, L1/R1), top icons (search, settings, power, avatar, battery, clock), page switching. |
| `src/Ps5Home.tsx` | The home screen: top tile row, hero (game info + Play), info cards segment, lower rows. |
| `src/InfoCards.tsx` | `GameCards` (HLTB/playtime/reviews/achievements) and `ActionCards` (Store/Library shortcuts). |
| `src/components.tsx` | `Focusable` wrappers, `useFocusHook`, `Row`, tiles, `Button`. |
| `src/Library.tsx` | Game Library grid with filter chips. |
| `src/steam.ts` | Steam app queries, launch, routes, menus. `src/gameinfo.ts`: playtime/HLTB/achievements hooks. |
| `src/i18n.ts` + `src/locales/*.ts` | Translations, one file per language; always emit user-facing strings via `t.*`, never hardcoded. |
| `src/settings.ts` | Settings (incl. `uiScale`, `infoCards`, `hltb`, `openSteamLibrary`, hide-top-bar). |
| `main.py`, `py_modules/` | Python backend: HowLongToBeat lookup with on-disk cache (`hltb_client.py`). |

## The scaling model — READ THIS BEFORE TOUCHING LAYOUT

`.psd-root` (styles.ts) does the whole trick:

```css
zoom: var(--psd-scale, 1);
height: calc(100vh / var(--psd-scale, 1));  /* width stays 100% of parent */
```

Consequences that are easy to get wrong:

1. **Every `vh`/`vw`/`px` inside `.psd-root` renders at the same on-screen size at any uiScale.**
   Zoom scales the content up by `s` while SteamOS shrinks the CSS viewport by the same factor
   (`viewport = device / s`), so `X vh` = `X · deviceHeight/100` device px, independent of `s`.
   Don't "compensate" for scale in CSS; the zoom already did it.
2. **Steam's own overlays do NOT zoom**: the top status bar (top 46px) and the bottom
   button-hint footer (~bottom 8–9% of the screen). Content placed near either edge must leave
   clearance in *device* terms. The footer is the usual culprit: anything below ~92% of screen
   height gets hidden behind it at higher scales.
3. **Device targets:** Retroid Pocket 6, 5.5", 1920×1080 landscape, typically **125% UI scale**
   → CSS viewport 1536×864 (vh = 8.64px, vw = 15.36px). Steam Deck: 1280×800 at 100% (vh = 8px).
   Verify layouts at both 100% and 125% (and 150% for margin).

### Home screen layout (Ps5Home.tsx `HomeTab`)

The scroller is a `Focusable` with `flow-children="column"`; DOM order = navigation order:

```
TopRow .psd-home-row        ← tile row; A/←→ between tiles
.psd-hero                   ← logo + sub + Play/⋯; D-pad down from tiles lands on Play
.psd-home-cards             ← info cards (GameCards or ActionCards); next press
LowerRows                   ← Favorites / Installed / Shortcuts; further presses
.psd-bottom-space (70vh)    ← scroll slack
```

- **The scroller starts below the tabs** (`.psd-scroller { inset: calc(46px + 8vh) 0 0 0 }`), not at
  the top of the screen, so anything that scrolls up is clipped there instead of showing through
  behind the Games / Media tabs and the top icons (the Media page, `.psd-page`, starts below them
  too). That 8vh is also the clearance the top row gets from Steam's bar, which is why there is no
  top spacer element any more — don't add one back (it would push the home screen down).
- **Required navigation flow:** Play button → info cards → lower rows. The cards are their own
  column-flow segment *on purpose* (moved out of the hero in v1.11.0) so they can be full-width
  and larger. Don't move them back beside the Play button.
- **The hero is content-sized (no fixed height).** Its bottom edge therefore sits directly under
  the Play button at every scale, clear of the footer. A previous fixed-height formula
  (`min(57vh, calc((46px + 89.6vh)/scale − 46px − 32.6vh))`) pinned the bottom edge to 89.6vh of
  screen and broke at 125% (button behind the footer + ~29vh of dead space above the logo).
  Don't reintroduce fixed heights here.
- **Scroll-on-focus pattern** (established, mirror it for new segments):
  - `onLowerRow`: `section.offsetTop`, i.e. the row's title lands flush with the top of the
    scroller, right under the tab bar, and the segment above (cards, hero) is out of view above the
    clip — an anchor, not a "30% down the screen" offset. Also sets `lowered` → fades the home row +
    hero (`.psd-lowered`). Every lower row must be able to reach that position, which is what the
    70vh `.psd-bottom-space` is for (slack ≥ visible height − last row's height); with 40vh the
    browser clamped the scroll and the last rows stopped short of the top.
  - `onCardsFocus`: scrolls so the card row's bottom rests `0.08 · screen height + 8px` above the
    bottom of the screen (8 local px ≈ 10px on screen at 125% — deliberate breathing room above
    Steam's footer; the user asked for it). Measure the footer from `.psd-root`'s height, **not**
    the scroller's: the scroller starts below the tabs, so its height is not the screen's. Does
    **not** set `lowered` — the game info stays visible while cards are focused.
  - All offsets are in *local* (pre-zoom) px, which is what `offsetTop`/`clientHeight` report
    inside `.psd-root`.
- **`PINNED` scroll guard:** the browser can auto-scroll clipped ancestors when Steam calls
  `element.focus()`. `Ps5Home.tsx` has a capture-phase scroll listener that resets
  `scrollLeft/scrollTop` on `.psd-root, .psd-content, .psd-section-clip, .psd-row-anchor`. If you
  add new clipped containers, add them to `PINNED`.
- **Tile row is transform-only** (`.psd-row-anchor` slides by `i · (slot + gap)`; the selected
  tile's art box scales up). Keep row animations to transforms/opacity — no per-frame layout.
- **Focus hooks:** `useFocusHook(onFocus)` in components.tsx passes the focused `HTMLElement` to
  `onFocus` (signature `(el: HTMLElement) => void`), which is how the scroll handlers find their
  section via `el.closest(...)`.

## CSS pitfalls (learned the hard way)

- **`PS5_CSS` is one stylesheet; duplicate class names MERGE, they don't override.** v1.11.0
  regression: the home card segment was named `.psd-cards`, colliding with the **Media tab's
  grid** `.psd-cards` (`display: grid; grid-template-columns: repeat(auto-fill, 36vh)`). The two
  rules merged and the home row's single `.psd-infocards` child collapsed into one 36vh grid
  column — four cards shrunk to ~25% of their size. The home segment is now **`.psd-home-cards`**
  (comment in styles.ts warns about this). When adding home-screen classes, check they don't
  collide with the Media/Library/tile namespaces; when grepping a class name, expect hits in
  `styles.ts`, `Ps5Home.tsx`, `Shell.tsx`, `components.tsx` (the `closest(".psd-grid,
  .psd-cards")` focus-navigation selector).
- **Card sizes** (`.psd-infocard-s/m/l`): flex-basis *and* max-width, 30/44/60vh, height 17vh.
  With all four game cards shown they exceed 92vw and flex-shrink to fit — that's intended, not
  a bug.
- The theme uses `--psd-*` local variables because Steam registers some short names via
  `@property` (a bare `--r` was eaten by Steam's angle type — see the comment at the top of
  styles.ts).
- `@property`-typed or Steam-owned selectors: don't fight Steam's stylesheet; the plugin's own
  screens use the `psd-` prefix exclusively.

## Conventions

- Comments in this codebase are dense, lowercase-ish prose explaining *why*; match the style and
  keep them current — several document scale-related invariants.
- User-facing text **only** through `t.*` from `i18n.ts`; new strings need entries in **every**
  locale file in `src/locales/` (13 languages).
- `CHANGELOG.md` uses Keep-a-Changelog-ish version sections; document behavior changes there and
  in the README if user-visible.
- Git: small, prefixed commits (`fix: …`, `feat: …`); the fork's history is all `fix:` since
  v1.10.0.
- `docs/screenshots/` images are rendered from the plugin's stylesheet at Deck resolution —
  refresh them if you change the home layout noticeably.

## Current work state (Nov 2026)

v1.11.0: info cards moved from beside the Play button into their own full-width segment between
hero and lower rows; navigation is Play → cards → lower rows; hero is content-sized;
`.psd-home-cards` rename fixed the Media-grid collision; cards scroll into view above the footer
with ~10px breathing room on focus. Verified on the Retroid Pocket 6 at 125%.

v1.11.1 (uncommitted as of writing): the home scroller now starts below the tabs, so scrolled
content is clipped there instead of running up behind the Games / Media tabs and the top icons (the
top spacer `.psd-top-space` is gone — the scroller's own top offset does that job); focusing a lower
row anchors its title flush under the tab bar with everything above out of view, and the bottom
slack grew to 70vh so even the last row can reach that position. Geometry checked in a browser
harness at 100%/125% equivalents; needs a pass on the Retroid Pocket 6.
