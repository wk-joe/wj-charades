# wj_charades

Heads Up-style charades PWA. Pure static — no build step. Three files: `index.html`, `sw.js`, `manifest.json`.

**Repo:** https://github.com/wk-joe/wj-charades.git (branch: `master`)

## How to deploy

Cloudflare Pages or GitHub Pages. HTTPS is required — device motion sensors and service workers won't work on plain HTTP. No build command, output directory is root.

Missing before first deploy: `icon-192.png` and `icon-512.png` (referenced in `manifest.json` and `index.html` but not yet in the repo).

## How the game works

1. Player picks a category on the home screen.
2. Tap "Enable Motion & Start" — on iOS this triggers the `DeviceOrientationEvent.requestPermission()` prompt.
3. 3-second countdown, then 60-second round starts.
4. Phone is held in **landscape** at forehead level, screen facing the guessing team.
5. Tilt **UP** (nose up) = correct ✅ — tilt **DOWN** (nose down) = skip ⏭.
6. Results screen shows score, correct list, and passed list.

## Tilt detection

`deviceorientation` axes are fixed to the physical device, not the screen orientation. In landscape mode the nose-up/nose-down gesture rotates around the phone's long (Y) axis, which is **`gamma`**, not `beta`.

```
screen.orientation.angle === 90  → device rotated CCW → physical-top on LEFT → nose-down = negative gamma
screen.orientation.angle === 270 → device rotated CW  → physical-top on RIGHT → nose-down = positive gamma
```

The code normalises to `noseDown` (positive = nose tilting up = correct).

Key constants (top of `<script>`):
```
TILT_GAMMA_CORRECT = 40   // noseDown > 40 → correct
TILT_GAMMA_PASS    = 40   // noseDown < -40 → pass
NEUTRAL_GAMMA      = 20   // |gamma| must drop below 20 to re-arm between tilts
ROUND_TIME         = 60   // seconds per round
```

## Word categories

| Key | Emoji | Content |
|-----|-------|---------|
| `mainstream` | 🎬 | Movies, TV shows, musicians, celebs |
| `everyday` | 🐘 | Animals, food, jobs, everyday objects |
| `fiji` | 🌺 | Fiji towns, food, culture, landmarks |
| `party` | 🎉 | Actions/mimes, character impressions, party games |
| `sports` | 🏆 | Sports, athletes, sporting moments |
| `nature` | 🌍 | Weather, landscapes, plants, creatures |
| `history` | 👑 | World figures, historical events, inventions |

All packs are in the `PACKS` object at the top of the `<script>` block — easy to edit freely.

## Tap fallback

Left and right tap zones (`#tap-pass`, `#tap-correct`) cover 45% of the screen each for desktop testing or when motion isn't available. Arrow keys and spacebar also work on desktop.
