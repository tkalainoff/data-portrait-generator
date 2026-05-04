# Data Portrait Generator

A browser-based tool that generates personalized circular data portraits for Innovation Week. Attendees fill in a form and receive a 600×600 px portrait suitable for printing as a 2″ wearable button.

## Tech stack

Vite · React 18 · TypeScript · Canvas 2D API (no external chart libraries)

---

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Building

```bash
npm run build
```

Output goes to `dist/`.

---

## Deploying to GitHub Pages

### One-time setup

1. Install the deploy dependency (already in `devDependencies`):

   ```bash
   npm install
   ```

2. In `package.json` the `deploy` script is already configured:

   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. Make sure your repository has GitHub Pages enabled (Settings → Pages → Source: `gh-pages` branch).

### Deploy

```bash
VITE_BASE_PATH=/your-repo-name npm run deploy
```

Replace `your-repo-name` with the exact repository name (e.g. `/data-portrait-generator`).

The `VITE_BASE_PATH` environment variable sets the Vite `base` config so all asset paths resolve correctly when served from a subdirectory.

---

## Asset system

Placeholder SVGs live in `public/assets/`. Each category has a `manifest.json` describing the available assets and their corresponding field values.

```
public/assets/
  department/   → background texture per department (600×600)
  tenure/       → repeatable unit per tenure band (60×60)
  community/    → badge per contribution type (60×60)
  desk/         → location marker per office/remote (60×60)
  skills/       → token per skill (60×60)
  charts/       → structural motif per chart type (600×600)
```

**To swap in real assets:** replace any SVG file while keeping the same filename. The rendering logic loads by filename — no code changes required.

---

## Portrait layer stack (bottom → top)

| # | Layer | Asset source |
|---|-------|-------------|
| 1 | Background fill | `department/{value}.svg` |
| 2 | Chart motif overlay (22% opacity) | `charts/{favorite_chart}.svg` |
| 3 | Tenure ring (units repeated N times) | `tenure/{tenure}.svg` |
| 4 | Community badges (upper-left arc) | `community/{contribution}.svg` |
| 5 | Desk location marker (lower-right) | `desk/{desk_location}.svg` |
| 6 | Skills tokens (layout by chart type) | `skills/{skill}.svg` |
| 7 | Typography (name, title, pronouns) | Canvas text |
| ∞ | Circular clip mask | Canvas `arc()` clip |

---

## Export

Click **Download PNG (600×600)** to save the portrait at full resolution.

Filename: `firstname_lastname_portrait.png`

---

## Sample data (pre-filled)

The form loads with a demo submission — Alex Rivera, Creative / 3–5 years / Remote — so you see a complete portrait immediately after clicking Generate.

---

## Phase 1 scope

- [x] Form + live portrait preview
- [x] PNG export at 600×600
- [x] Placeholder SVG asset system
- [x] GitHub Pages deployment
- [ ] Email delivery (Phase 2)
- [ ] Batch export (Phase 2)
- [ ] Asset upload UI (Phase 2)
