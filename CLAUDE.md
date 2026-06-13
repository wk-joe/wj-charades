# Tilt!

Phone-to-forehead charades PWA. Pure static — no build step. Three files: `index.html`, `sw.js`, `manifest.json`.

**Repo:** https://github.com/wk-joe/wj-charades.git (branch: `master`)

## How to deploy

Cloudflare Pages or GitHub Pages. HTTPS is required — device motion sensors and service workers won't work on plain HTTP. No build command, output directory is root.

Missing before first deploy: `icon-192.png` and `icon-512.png` (referenced in `manifest.json` and `index.html` but not yet in the repo).

## How the game works

1. Player picks a category tile on the home screen.
2. Get Ready screen: tap "ENABLE MOTION" — on iOS this triggers the `DeviceOrientationEvent.requestPermission()` prompt.
3. Full-screen countdown (3 → 2 → 1, 900ms ticks, pop animation), then 60-second round.
4. Phone held in **landscape** at forehead level, screen facing the guessing team.
5. Tilt **UP** (nose up) = correct ✅  — tilt **DOWN** (nose down) = skip ⏭.
6. Full-screen green/red flash with "GOT IT!" / "PASS" text on each guess.
7. Results screen shows score, correct chips, and passed chips.

## Design system (neobrutalist)

Design handoff lives at `/home/william/Tilt_design_handoff/design_handoff_tilt_game/`.

### Colors
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#141414` | All borders, shadows, primary text |
| `--purple` | `#6322d6` | Home + Results background |
| `--cream` | `#F6F1E7` | Play screen background |
| `--cream-shade` | `#E4DCC8` | Timer track (unfilled) |
| `--correct` | `#18C964` | Correct flash, score banner, got-it chips |
| `--pass` | `#FF3A30` | Pass flash, passed chips |

### Deck colors (flood Get Ready + Countdown bg)
| Deck | Color |
|---|---|
| Mainstream | `#FFD400` |
| Everyday | `#22A7FF` |
| Fiji / Local | `#FF7A1A` |
| Party | `#FF4D9D` |
| Sports | `#00C8FF` |
| Nature | `#39DB74` |
| History | `#D4A0FF` |

### Typography
- **Display:** `Archivo Black` — wordmark, headings, play word, countdown, score, buttons
- **UI:** `Archivo` weights 600–900 — sublabels, badges, hints
- Loaded from Google Fonts

### Borders & shadows
- All borders: `5px solid #141414` (tiles, buttons) or `3px` (chips), `6px` (wordmark box)
- Hard offset shadows: `8px 8px 0 #141414` (tiles, buttons); `12px 12px 0 #141414` (wordmark)
- Press feedback on every tappable: `translate(4px,4px)` + shadow shrinks to `2px`
- Border radius: **0** everywhere (hard corners are the brand)

## Screen flow

`Home → Get Ready → Countdown → Play → Results → (Play Again → Get Ready | Choose Category → Home)`

- **Home / Get Ready / Results:** portrait
- **Countdown / Play:** landscape (portrait overlay prompts rotation)

## Tilt detection

`deviceorientation` axes are fixed to the physical device. In landscape the nose-up/nose-down gesture changes **`gamma`**, not `beta`.

```
screen.orientation.angle === 90  → CCW rotation → physical-top LEFT  → nose-down = negative gamma
screen.orientation.angle === 270 → CW rotation  → physical-top RIGHT → nose-down = positive gamma
```

Code normalises to `noseDown` (positive = nose up = correct).

Key constants (top of `<script>`):
```
TILT_GAMMA_CORRECT = 40   // noseDown > 40 → correct (nose up)
TILT_GAMMA_PASS    = 40   // noseDown < -40 → pass (nose down)
NEUTRAL_GAMMA      = 20   // |gamma| must drop below 20 to re-arm
ROUND_TIME         = 60   // seconds per round
FLASH_MS           = 450  // flash overlay duration
```

## Word categories

| Key | Color | Content |
|-----|-------|---------|
| `mainstream` | `#FFD400` | Movies, TV shows, musicians, celebs |
| `everyday` | `#22A7FF` | Animals, food, jobs, everyday objects |
| `fiji` | `#FF7A1A` | Fiji towns, food, culture, landmarks |
| `party` | `#FF4D9D` | Actions/mimes, character impressions, party games |
| `sports` | `#00C8FF` | Sports, athletes, sporting moments |
| `nature` | `#39DB74` | Weather, landscapes, plants, creatures |
| `history` | `#D4A0FF` | World figures, historical events, inventions |

All packs are in the `PACKS` object at the top of the `<script>` block — easy to edit freely.

## Dynamic word sizing

Play word font size is computed per word so long words always fit landscape:
```js
maxTok   = longest whitespace-separated token in the word
wordSize = clamp(76, floor(720 / (maxTok * 0.64)), 140)  // px
```

## Tap / keyboard fallback

Left tap zone = pass, right tap zone = correct (each 50% width, below timer bar).
Arrow keys: `↑` / Enter = correct, `↓` / Space = pass.
