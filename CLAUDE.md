# GG! Grog Games

Phone-to-forehead charades PWA. Pure static — no build step. Three files: `index.html`, `sw.js`, `manifest.json`.

**App name:** GG! (display) / GG! Grog Games (manifest) / GG! (home screen short name)
**Cache key:** `gg-v1` (bump when deploying breaking changes so old SW is evicted)

**Repo:** https://github.com/wk-joe/wj-charades.git (branch: `master`)

## How to deploy

Cloudflare Pages or GitHub Pages. HTTPS is required — device motion sensors and service workers won't work on plain HTTP. No build command, output directory is root.

App icon is `app-icon.png` (referenced in `manifest.json` and `index.html` as apple-touch-icon and favicon).

## Games

The app opens on a **Menu screen** where the player picks a game:

- **CHARADES** — the forehead tilt game (see below)
- **IMPOSTER** — social deduction / pass-and-peek card game

---

## Charades

### How it works

1. GG! hub → pick CHARADES → pick a category tile on the home screen.
2. Get Ready screen: tap "ENABLE MOTION" — on iOS this triggers the `DeviceOrientationEvent.requestPermission()` prompt.
3. Full-screen countdown (3 → 2 → 1 → GO!, 900ms ticks, pop animation), then 60-second round.
4. Phone held in **landscape** at forehead level, screen facing the guessing team.
5. Tilt **UP** (nose up) = correct ✅ — tilt **DOWN** (nose down) = skip ⏭.
6. Full-screen green/red flash with "GOT IT!" / "PASS" text on each guess.
7. Results screen shows score, correct chips, and passed chips.
8. Quit button (red ✕ top-left of play screen) opens a confirmation modal — saves score so far.

### Screen flow

`Menu → Home (category picker) → Get Ready → Countdown → Play → Results → (Play Again → Get Ready | Choose Category → Home | Change Game → Menu)`

- **Menu / Home / Get Ready / Results:** portrait
- **Countdown / Play:** landscape (portrait overlay pauses timer and prompts rotation)

### Word categories

| Key | Color | Content |
|-----|-------|---------|
| `mainstream` | `#FFD400` | Movies, TV shows, musicians, celebs |
| `everyday` | `#22A7FF` | Animals, food, jobs, everyday objects |
| `fiji` | `#FF7A1A` | Fiji towns, food, culture, landmarks |
| `party` | `#FF4D9D` | Actions/mimes, character impressions, party games |
| `sports` | `#00C8FF` | Sports, athletes, sporting moments |
| `nature` | `#39DB74` | Weather, landscapes, plants, creatures |
| `food` | `#FF5E3A` | Global dishes, drinks, food experiences |
| `places` | `#14B8A6` | Cities, countries, landmarks |
| `history` | `#D4A0FF` | World figures, historical events, inventions (full-width tile) |

All packs are in the `PACKS` object at the top of the `<script>` block — easy to edit freely.

### Tilt detection

`deviceorientation` axes are fixed to the physical device. In landscape the nose-up/nose-down gesture changes **`gamma`**, not `beta`.

```
screen.orientation.angle === 90  → CCW rotation → physical-top LEFT  → nose-down = negative gamma
screen.orientation.angle === 270 → CW rotation  → physical-top RIGHT → nose-down = positive gamma
```

Code normalises to `noseDown` (positive = nose up = correct).

Key constants (top of `<script>`):
```
TILT_GAMMA_CORRECT = 40   // landscape: noseDown > 40 → correct (nose up)
TILT_GAMMA_PASS    = 40   // landscape: noseDown < -40 → pass (nose down)
NEUTRAL_GAMMA      = 20   // landscape: |gamma| must drop below 20 to re-arm
TILT_CORRECT       = 25   // portrait fallback: beta < 25 → correct
TILT_PASS          = 155  // portrait fallback: beta > 155 → pass
NEUTRAL_LO         = 40   // portrait fallback: neutral zone low
NEUTRAL_HI         = 140  // portrait fallback: neutral zone high
ROUND_TIME         = 60   // seconds per round
FLASH_MS           = 450  // flash overlay duration
```

### Dynamic word sizing

Font size is computed per word using a binary search with canvas `measureText` so words always fit the landscape screen without overflow:
- Searches `40px`–`160px` for the largest size where the longest token fits `availW` (screenWidth − 128px padding) and total text height fits `availH` (screenHeight − 120px reserved).
- `el.style.fontSize` set directly; no fixed formula.

### Tap / keyboard fallback

Left tap zone = pass, right tap zone = correct (each 50% width, below timer bar).
Arrow keys: `↑` / Enter = correct, `↓` / Space = pass.

---

## Imposter

Social deduction game. One player secretly gets a hint instead of the word — everyone tries to blend in during discussion while the crew tries to identify the imposter.

### How it works

1. GG! hub → pick IMPOSTER → enter player names (3+ required, max 20 chars each, duplicates rejected).
2. Tap **START GAME** — the app picks one player as the imposter using the fair-rotation logic (see below).
3. **Deal screen:** Each player's name is shown as their header. They tap the card to reveal their role privately, then tap "NEXT PLAYER →". Last player sees "START DISCUSSION →".
   - **Crew members** see the full word and "THE WORD — KEEP IT SECRET!"
   - **Imposter** sees only a one-word hint (e.g. word: "Pizza", hint: "Doughy") and "YOUR HINT — BLEND IN!"
4. **Discuss screen:** Group discusses, then votes. Host can tap to reveal the word. Play Again shuffles a new round using the same player list.

### Imposter selection logic (`pickImposter()`)

Weighted random — all players stay in the pool every round:

| Constant | Value | Effect |
|---|---|---|
| `IMP_PENALTY` | `0.15` | Weight multiplier when picked as imposter |
| `IMP_RECOVERY` | `1.8` | Weight multiplier per round not picked (caps at 1.0) |

- **Hard rule:** last round's imposter has weight `0` — no back-to-back ever.
- **Soft rule:** being picked drops your weight to 15% of its current value — much less likely soon after, but never impossible.
- Each round you're not picked your weight recovers ×1.8, returning to `1.0` after ~3–4 rounds.
- Nobody can deduce who's next — probabilities are invisible and the same person *could* be picked again at low odds.
- State: `imposterWeights` (per-player float), `lastImposterName`. Both reset on entering setup from the hub. Removing a player also clears their weight entry.

### Imposter word pool

`IMPOSTER_WORDS` array — flat list of `{word, hint}` objects covering Food, Animals, Movies/TV, Sports, Places, Nature, and Everyday items. One random entry is picked per game.

### Screen flow

`Menu → Imposter Setup → Imposter Deal → Imposter Discuss → (Play Again → Imposter Deal | Change Game → Menu)`

All Imposter screens are portrait.

---

## Design system (neobrutalist)

Design handoff lives at `/home/william/Tilt_design_handoff/design_handoff_tilt_game/`.

### Colors
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#141414` | All borders, shadows, primary text |
| `--purple` | `#6322d6` | Menu + Home + Results background |
| `--cream` | `#F6F1E7` | Play screen background (tinted per category) |
| `--cream-shade` | `#E4DCC8` | Timer track (unfilled) |
| `--correct` | `#18C964` | Correct flash, score banner, got-it chips |
| `--correct-dk` | `#18A34A` | Correct hint label on play screen |
| `--pass` | `#FF3A30` | Pass flash, passed chips, quit button |
| `--cat-color` | *(dynamic)* | CSS variable set per selected deck; floods Get Ready + Countdown bg |

### Typography
- **Display:** `Archivo Black` — wordmark, headings, play word, countdown, score, buttons
- **UI:** `Archivo` weights 600–900 — sublabels, badges, hints
- Loaded from Google Fonts
- Icons: **Phosphor Icons** (`@phosphor-icons/web@2.1.1`) — tile and card glyphs

### Borders & shadows
- All borders: `5px solid #141414` (tiles, buttons) or `3px` (chips), `6px` (wordmark box)
- Hard offset shadows: `8px 8px 0 #141414` (tiles, buttons); `12px 12px 0 #141414` (wordmark)
- Press feedback on every tappable: `translate(4px,4px)` + shadow shrinks to `2px`
- Border radius: **0** everywhere (hard corners are the brand)
