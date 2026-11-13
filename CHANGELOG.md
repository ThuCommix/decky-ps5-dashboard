# Changelog

## 1.12.0

- **Steam's own top bar is kept off the PS5 screens.** Pressing up from the top row no longer slides Steam's bar in
  over the PS5 home — the global search plus the clock, WiFi, battery and avatar that the PS5 bar already shows.
  Steam's own pages (store, settings, its library) keep their bar, and with the setting off the press behaves
  exactly like stock Steam.
- **More room for the layout.** The space the native bar reserved is now ours: the Games / Media tabs, the top
  icons, the Media page and the home content all move up together, so every screen gains a little height. The
  setting is the existing one, now called **Hide Steam's top bar**.
- Changing a setting in the panel now applies to the PS5 screens immediately — the shell re-renders when a setting
  changes, instead of only picking the new value up on the next visit.

## 1.11.1

- **The home screen no longer shows through the tabs.** Scrolling down used to push the game row, the info
  cards and the rows below up behind the Games / Media tabs and the top icons, so two layers of text sat on
  top of each other. The home screen's scrolling area now starts just under the tab bar (the same place the
  Media tab's page starts), so whatever scrolls up is clipped there and the tabs stay readable.
- **Favorites / Installed / Shortcuts anchor under the tabs.** Moving down to one of the lower rows now
  scrolls that row's title flush with the top of the visible area instead of stopping a third of the way down
  the screen, so the game info and cards above it are no longer peeking into view. The scroll slack at the
  bottom grew along with it, so even the last row can reach that spot.

## 1.11.0

- **The clock is on the dashboard.** The PS5's top-right corner now shows the current time, ticking live and
  following SteamOS' own "24-hour clock" setting, so it's 12-hour or 24-hour exactly the way you set it. It reads
  the setting from the Steam client's own API rather than parsing Steam's config files, so it always matches.
- **Battery indicator.** Beside the clock sits the PS5's monochrome battery: a vertical outlined cell that fills
  with the charge level, a terminal on top, a bolt while it's on AC power, and the percentage next to it — but only
  when SteamOS' "Show Battery Percentage" toggle is on. Low charge tints the cell yellow (11–20%) or red (0–10%),
  and on a console without a battery the icon simply disappears.
- **New setting: UI scale.** Under the Appearance section, scales the plugin's own screens between 80% and 160%
  (100% is the default) — handy on a small handheld or a large TV display.
- **New setting: Hide top bar status.** Under the Layout section, hides the clock, WiFi, battery and avatar from
  Steam's own top bar, since the PS5 bar already shows them. It only applies while the PS5 home screen is on, so
  Steam's bar is never left without a status bar of its own.
- **Correct playtime for non-Steam games.** Steam's library overview reports 0 for non-Steam shortcuts (it only
  counts the running session), so the "Your time" card and the playtime under the Play button now read Steam's own
  playtime, which knows the accumulated hours. Lookups run only for shortcuts and are cached for a minute.
- **Info cards sit under Play again.** The time-to-beat, playtime, reviews and achievements cards are back in a
  row under the Play button, full screen width, so they can be larger. At a high UI scale that row falls below
  the visible screen, so scrolling down focuses the cards first — one more press then reaches the rows below —
  rather than jumping straight past them to the lower rows.
- The game's hero area caps its height at high UI scale, so the cards' row keeps a stable spot below it and the
  game info never drifts off screen.

## 1.10.0

- **The plugin speaks your Steam language.** 1.9.0 detected Steam's language, but the plugin only had English and
  Portuguese text. It now ships 14 languages: English, Portuguese, Spanish, French, German, Italian, Polish, Russian,
  Ukrainian, Turkish, Japanese, Korean, Simplified Chinese and Traditional Chinese. Any other Steam language gets
  English, never the operating system's language.
- Plurals follow each language's rules ("2 дня" / "5 дней", "2 miesiące" / "5 miesięcy"...).
- Translations live in `src/locales/`, one file per language, all checked against the English one so no string
  can go missing.
- **Rounded corners actually work now.** Steam registers a CSS property called `--r` as an angle, and the plugin used
  that same name for its corner radius, so Steam threw the value away and every tile, card and button on the plugin's
  screens came out square. The plugin's variables now have their own names, and the **Tile corner radius** setting
  (0–24 px) rounds the game covers on the home row, the lower rows, the Game Library, the info cards and the buttons.
- **The glass aura follows the corners.** The animated edge around the focused game now curves with the tile, and its
  light shades through grey and the accent blue as well as white and translucent black.

## 1.9.0

- **New setting: Hide bottom bar (Ocultar barra inferior).** Under the Layout section, users can now toggle off the
  controller button hints footer bar (A, B, X, Y buttons, Legion Go / Xbox / Steam glyphs) at the bottom of the screen.
- **Fixed SteamOS native language detection.** Robust locale detection mapping 30+ internal Steam language codes
  (such as "brazilian", "portuguese", "latam", etc.) to proper ISO prefixes, ensuring SteamOS in Portuguese or English
  always shows the matching UI text seamlessly.
- **Improved header and game row spacing.** Adjusted spacing between the top-right option buttons (search, settings,
  power, profile avatar) and the main home game tiles to prevent overlap when tiles or avatar focus labels are selected.

## 1.8.0

- **New setting: Open Steam's library.** When it's on, the Game Library tile at the end of the home row, its shortcut
  cards, the Game Library shortcut and the Media tab's Apps card open Steam's own library instead of the PS5 Game
  Library, so your TabMaster tabs and sorting are right there. The tile then shows "Steam Library". It's off by
  default, so the PS5 Game Library stays the default. Requested by a user on Reddit.

## 1.7.0

- **New setting: Style Steam's library.** Turn it off to leave Steam's own library as Steam draws it (capsule corners,
  focus, tabs and page background), for example to use TabMaster's tabs and sorting. The PS5 home screen, menus and
  Game Library are not affected. Requested by a user on Reddit.

## 1.6.0

- **Steam menu pills fixed.** Steam scaled the focused and the current item to 110%, pushing the pill past the
  panel's edge, where it lost its right corners. Items now stay inside the panel, the focus gets a gentle 2% lift,
  and its glow is no longer cut into a hard band.
- **Long labels fit.** Items are sized so "Friends & Chat" and similar labels fit instead of turning into Steam's
  scrolling marquee, and the focused label is always black on white.
- **Quick Access tabs are real circles.** The tabs are 48 × 64 px, so rounding them gave stretched ovals; a fixed
  circle behind the icon is the highlight now, without Steam's scale-and-clip focus effect.
- **Steam's library looks like the PS5.** A navy gradient page, tabs as pills in sentence case with dimmed counts, and
  a crisp white edge with a soft lift on the focused capsule instead of a wide white bloom.

## 1.5.0

- **Steam menu (left side) in PS5 style.** Dark navy glass panel, rounded items, a white focused item with black text
  and a soft glow, and the current page in bold with a small PlayStation-blue dot. Steam's blue panel and its
  translucent focus animation are gone.
- **The theme now reaches the Steam menu and Quick Access windows.** In Game Mode they don't always appear in Steam's
  popup list, so the plugin also looks them up through Steam's controller navigation, the way Steam itself tracks them.
- **Your time** card: non-Steam games show when you last played them instead of "Not played yet".
- The plugin panel shows its version, so you can check which build Steam has loaded.

## 1.4.0

- **Home row like the PS5.** The next games now sit right after the selected one instead of leaving a wide gap, and
  the game's name moves under them. The tile before the selected one peeks in at the left edge.
- **Lift and glass aura.** The focused game lifts slightly with a drop shadow, and a glass light band keeps circling
  its edge, blending white, grey and translucent black. It only rotates (a GPU transform), so it costs nothing per
  frame, and only the focused tile has it.

## 1.3.0

- **Game options on Select.** Press Select (View) or ≡ on any game tile, on Home, in the lower rows or in the Game
  Library, to open Steam's own game menu, with whatever other plugins add to it, such as SteamGridDB's
  "Change artwork…".
- The round **⋯** button next to Play now opens the same game menu, like on the PS5.
- If Steam's game menu can't be found after a client update, these buttons open the game's page instead.

## 1.2.0

- **Info cards under Play:** Time to beat (HowLongToBeat), Your time, Reviews and Achievements. Each opens the
  matching page. The Store and Game Library tiles get shortcut cards.
- HowLongToBeat lookups run only after the selection rests on a game, and are cached on disk for a week.
- **Menus are PlayStation blue and white now.** The Power menu and every other option menu get a dark rounded panel
  and a white focused item. Steam used to paint "Switch to Desktop" and other items red or green.
- The Steam menu and Quick Access are themed reliably: Steam bundles several copies of their style modules, and every
  copy is matched now instead of only the first.
- Shortcut tiles are glass tiles with a round icon instead of flat grey boxes.
- The background dims to PlayStation navy in the lower rows, and the game row and info fade out instead of sliding
  under the tabs.

## 1.1.0

- The selected game on the home row no longer hides or gets cut off. The row now slides by whole tiles with a GPU
  transform instead of resizing tiles and scrolling mid-animation, and the browser can no longer scroll it on its own.
- The game art crossfades with a slight zoom, and the row slides in when Home opens.
- Lighter on performance: every animation is a transform or an opacity change.

## 1.0.0

- First release: PS5 home screen, Games and Media tabs, Game Library, PS5 colors everywhere, Control Center-style
  menus, accent colors and PlayStation-style font.
