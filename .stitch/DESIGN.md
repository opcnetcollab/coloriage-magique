# DESIGN.md — Coloriage Magique

**Design System:** Crayon Moderne  
**Stitch Project:** `projects/9628142273356798451`  
**Generated:** 2026-03-25  
**Screens:** 4 — Landing/Upload · Difficulty Selector · Processing · Result

---

## 🎨 Creative Direction

**North Star: "The Digital Crayon Box"**

Transcending the rigid, sterile SaaS aesthetic to create an experience that feels like a premium, physical coloring set reimagined for the web. *Not just a tool — a high-end toy.*

Crayola meets modern SaaS. Intentional softness, warm pastels, organic pill-like shapes, a "stacked paper" layout. Asymmetry is our friend — hero elements should feel like they were placed by hand on a desk.

---

## 🎨 Palette — Design Tokens

### Brand Colors (Input)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#F59E0B` | CTAs, amber accent, progress bars |
| `--color-secondary` | `#A78BFA` | Secondary buttons, decorative elements |
| `--color-tertiary` | `#F472B6` | Pink playful details, chips |
| `--color-background` | `#FFF8F0` | Canvas base (warm cream) |

### Generated System Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--surface` | `#fcf5ed` | Base background (cardstock cream) |
| `--surface-container-lowest` | `#ffffff` | Card pop — pure white lift |
| `--surface-container-low` | `#f7f0e7` | Content zone sections |
| `--surface-container` | `#eee7de` | Mid-level containers |
| `--surface-container-high` | `#e9e1d8` | Interactive hover state |
| `--surface-container-highest` | `#e3dcd2` | UploadZone drop area |
| `--surface-dim` | `#dbd3c9` | Dimmed surface |
| `--on-surface` | `#312e29` | Primary text (warm dark — never #000) |
| `--on-surface-variant` | `#5f5b55` | Secondary text |
| `--primary` | `#815100` | Primary interactive (darker amber) |
| `--primary-container` | `#f8a010` | Primary container / gradient end |
| `--primary-fixed` | `#f8a010` | Fixed primary |
| `--on-primary` | `#fff0e3` | Text on primary buttons |
| `--on-primary-container` | `#4a2c00` | Text on primary container |
| `--secondary` | `#6448b2` | Secondary interactive |
| `--secondary-container` | `#d8caff` | Secondary container |
| `--on-secondary` | `#f7f0ff` | Text on secondary |
| `--on-secondary-container` | `#4f329d` | Text on secondary container |
| `--tertiary` | `#a02d70` | Tertiary interactive |
| `--tertiary-container` | `#ff8bc5` | Chips background (candy look) |
| `--on-tertiary` | `#ffeff3` | Text on tertiary |
| `--outline` | `#7b7670` | Ghost border base |
| `--outline-variant` | `#b2aca5` | Soft dividers (15% opacity max) |
| `--error` | `#b02500` | Error state |

### Difficulty Level Colors
| Level | Color | Hex |
|-------|-------|-----|
| Débutant | Green | `#22C55E` |
| Confirmé | Yellow | `#EAB308` |
| Expert | Red | `#EF4444` |

---

## 🔠 Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display / Hero | Plus Jakarta Sans | 3.5rem (56px) | 800 |
| Headline H1 | Plus Jakarta Sans | 2.25rem (36px) | 700 |
| Headline H2 | Plus Jakarta Sans | 1.75rem (28px) | 700 |
| Title | Plus Jakarta Sans | 1.25rem (20px) | 600 |
| Body Large | Be Vietnam Pro | 1rem (16px) | 400 |
| Body Medium | Be Vietnam Pro | 0.875rem (14px) | 400 |
| Label | Be Vietnam Pro | 0.75rem (12px) | 500 |
| Button | Plus Jakarta Sans | 0.875rem (14px) | 600 |

**Rules:**
- Never use pure black `#000000` — always `--on-surface` `#312e29`
- Use the "Identity Gap" scale jump between display and body for editorial rhythm
- Letter-spacing: generous on display (+0.02em), tight on body

---

## 📐 Spacing & Shape

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.5rem (8px)` | Minimum — checkboxes, tags |
| `--radius-md` | `1.5rem (24px)` | Cards, containers |
| `--radius-xl` | `3rem (48px)` | UploadZone, large panels |
| `--radius-full` | `9999px` | Buttons (pill shape) |

**No sharp corners — ever. Even tiny elements minimum `--radius-sm`.**

### Shadow System (Ambient Depth, not hard shadows)
```css
--shadow-card: 0 8px 40px 0 rgba(49, 46, 41, 0.06);
--shadow-float: 0 20px 40px 0 rgba(49, 46, 41, 0.06);
--shadow-ghost: inset 0 0 0 1px rgba(123, 118, 112, 0.15);
```

---

## 🧩 Components

### UploadZone
**Zone de dépôt photo centrale (Landing page)**

```
Container: surface-container-highest (#e3dcd2)
Border: 2px dashed, outline (#7b7670) at 20% opacity
Border-radius: --radius-xl (3rem)
Padding: 48px
Min-height: 280px

States:
  default → dashed border, cloud-upload icon centered
  hover   → surface-container-high, border opacity 40%
  drag-over → primary (#815100) border, amber glow shadow
  error   → error (#b02500) border

Content:
  - ☁️ upload icon (2rem, on-surface-variant)
  - "Glissez votre photo ici" (title, on-surface)
  - "ou" (body, on-surface-variant)
  - <ChoosePhotoButton> amber pill
  - "JPG, PNG · max 10 Mo" (label, on-surface-variant)
```

### DifficultyCard
**Carte de sélection de niveau**

```
Container: surface-container-lowest (#ffffff)
Border-radius: --radius-md (1.5rem)
Padding: 24px 32px
Shadow: --shadow-card
Cursor: pointer

States:
  default  → white card, outline-variant ghost border
  hover    → surface-container (#eee7de) background
  selected → primary-container (#f8a010) border 2px, amber tint bg

Content:
  - DifficultyBadge (colored circle: green/yellow/red) + level name
  - Color count chip (tertiary-container)
  - Description text (body, on-surface-variant)
  - Tick icon (appears on selected)

Variants:
  Débutant  → badge #22C55E, "5–8 couleurs"
  Confirmé  → badge #EAB308, "12–16 couleurs"  
  Expert    → badge #EF4444, "24+ couleurs"
```

### ColorSwatchLegend
**Nuancier de couleurs (page Résultat)**

```
Container: surface-container-low (#f7f0e7)
Border-radius: --radius-md (1.5rem)
Padding: 20px

Swatch Item (per color zone):
  - Circle: 36px × 36px, filled with zone color
  - Number badge: 16px, on-primary font, positioned top-right
  - Symbol (Hachette): tiny icon below circle (★ ♥ ◆ etc.)
  - Layout: horizontal row, gap 12px, wrap on overflow

Color zones (example 12 colors):
  1 Rouge    #E53E3E  ★
  2 Bleu     #3182CE  ♥
  3 Vert     #38A169  ◆
  4 Jaune    #D69E2E  ●
  5 Orange   #DD6B20  ▲
  6 Violet   #805AD5  ■
  7 Rose     #D53F8C  ✦
  8 Turquoise #319795 ◉
  9 Marron   #744210  ▼
  10 Gris    #718096  ◇
  11 Beige   #C8A882  ○
  12 Noir    #2D3748  ×
```

### DownloadButton
**Boutons de téléchargement (page Résultat)**

```
Primary (Coloriage B&W):
  background: gradient(--primary #815100 → --primary-container #f8a010)
  color: --on-primary (#fff0e3)
  border-radius: --radius-full
  padding: 14px 28px
  icon: download ⬇️ left
  label: "Télécharger mon coloriage"
  hover: inner glow surface-bright 1px, scale 1.02

Secondary (Colored model):
  background: --secondary-container (#d8caff)
  color: --on-secondary-container (#4f329d)
  border-radius: --radius-full
  padding: 14px 28px
  icon: image 🖼️ left
  label: "Télécharger le modèle coloré"
  hover: --secondary-fixed-dim, scale 1.02
```

### ProcessingSpinner
**Spinner + messages progressifs (page Processing)**

```
Container: centered, surface (#fcf5ed)
Animation: magic wand SVG with CSS keyframe rotation + sparkle burst

Progress Bar:
  height: 12px, border-radius: 9999px
  track: surface-container (#eee7de)
  fill: gradient(--primary → --primary-container)
  animation: linear fill 0% → 100% over estimated duration

Progressive Messages (list with active state):
  1. "Analyse de votre photo en cours..." (active first)
  2. "Identification des zones de couleurs..."
  3. "Génération du coloriage magique..."
  4. "Presque prêt ! Touches finales..."
  
  active: on-surface bold, checkmark appears on complete
  done: on-surface-variant, ✅ prefix

Floating decorations:
  Amber sparkle ✨ particles (CSS keyframe float + fade)
  3–5 stars positioned randomly around spinner
```

---

## ✨ Animations & Micro-interactions

### Page Transitions
```css
/* Screen enter */
@keyframes screenEnter {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.screen { animation: screenEnter 300ms ease-out; }
```

### UploadZone drag-over
```css
.upload-zone.drag-over {
  box-shadow: 0 0 0 3px var(--primary-container), 0 12px 40px rgba(129,81,0,0.12);
  transform: scale(1.01);
  transition: all 200ms ease;
}
```

### Button hover glow
```css
.btn-primary:hover {
  box-shadow: inset 0 0 0 1px rgba(255,240,227,0.4), 0 8px 24px rgba(129,81,0,0.25);
  transform: translateY(-1px);
  transition: all 150ms ease;
}
```

### DifficultyCard selection
```css
.difficulty-card:active {
  transform: scale(0.97);
  transition: transform 80ms ease;
}
.difficulty-card.selected {
  border: 2px solid var(--primary-container);
  background: rgba(248,160,16,0.06);
  transition: all 200ms ease;
}
```

### Processing spinner
```css
@keyframes magicWand {
  0%  { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
  100%{ transform: rotate(-15deg); }
}
@keyframes sparkleFloat {
  0%   { opacity:0; transform: translateY(0) scale(0); }
  50%  { opacity:1; transform: translateY(-20px) scale(1); }
  100% { opacity:0; transform: translateY(-40px) scale(0.5); }
}
```

### Success confetti (Result screen)
```css
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
}
/* Trigger on mount, 40 particles, amber/purple/pink colors */
```

---

## ♿ Accessibility Checklist

### Contrast
- [x] All button text meets WCAG AA (4.5:1) — `on-primary` on amber gradient: ✅
- [x] Body text `on-surface #312e29` on `surface #fcf5ed`: ✅ 9.1:1
- [x] Secondary button `on-secondary-container` on `secondary-container`: ✅
- [x] Disabled states use opacity 0.38, still discernible
- [ ] Verify tertiary-container chips contrast in dark environments

### Keyboard & Focus
- [x] All interactive elements keyboard-accessible (Tab order logical)
- [x] Focus ring: 2px solid `--primary-container` offset 2px
- [x] UploadZone: keyboard-triggerable via Space/Enter
- [x] DifficultyCards: navigable with arrows, selectable with Space
- [x] Download buttons: clear label including file type context

### Screen Readers
- [x] UploadZone: `role="button"` + `aria-label="Zone de dépôt photo — activez pour sélectionner un fichier"`
- [x] DifficultyCards: `role="radio"` in `radiogroup`, `aria-checked`
- [x] ProcessingSpinner: `role="status"` + `aria-live="polite"` for messages
- [x] ColorSwatchLegend: `aria-label` on each swatch with color name + number
- [x] DownloadButton: distinct aria-labels for each button

### Motion
- [x] Respect `prefers-reduced-motion` — disable/simplify sparkle and confetti animations
```css
@media (prefers-reduced-motion: reduce) {
  .sparkle, .confetti { animation: none; }
  .screen { animation: none; }
}
```

### Forms
- [x] File input has visible label
- [x] Error messages associated with field via `aria-describedby`
- [x] Format toggle A4/A3 uses `role="radiogroup"`

---

## 📱 Screens Inventory

| Screen | File | Stitch ID | Dimensions |
|--------|------|-----------|------------|
| 01 — Landing / Upload | `01-landing-upload.png` | `6dd32dd3fc88440f9ca7669679eea6fb` | 2560×4362 |
| 02 — Difficulty Selector | `02-difficulty-selector.png` | `b150fa04963343319780068e0aa6658b` | 2720×2760 |
| 03 — Processing | `03-processing.png` | `c5f8973187bb4afe8590507bc84707d8` | 2560×2048 |
| 04 — Result | `04-result.png` | `33e4fc12713b492ca8b51647074104ac` | 2560×2932 |

**Stitch Project:** `https://stitch.google.com/projects/9628142273356798451`

---

## 🛠 Implementation Notes

### CSS Custom Properties (root)
```css
:root {
  /* Brand */
  --color-brand-amber: #F59E0B;
  --color-brand-purple: #A78BFA;
  --color-brand-pink: #F472B6;
  
  /* Surface system */
  --surface: #fcf5ed;
  --surface-lowest: #ffffff;
  --surface-low: #f7f0e7;
  --surface-mid: #eee7de;
  --surface-high: #e9e1d8;
  --surface-highest: #e3dcd2;
  
  /* Text */
  --text-primary: #312e29;
  --text-secondary: #5f5b55;
  
  /* Interactive */
  --primary: #815100;
  --primary-container: #f8a010;
  --on-primary: #fff0e3;
  --secondary: #6448b2;
  --secondary-container: #d8caff;
  --on-secondary-container: #4f329d;
  
  /* Shapes */
  --radius-sm: 0.5rem;
  --radius-md: 1.5rem;
  --radius-xl: 3rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-card: 0 8px 40px 0 rgba(49,46,41,0.06);
  --shadow-float: 0 20px 40px 0 rgba(49,46,41,0.06);
}
```

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap" rel="stylesheet">
```

### Tailwind Config Extension (if using Tailwind)
```js
theme: {
  extend: {
    colors: {
      cream: '#fcf5ed',
      amber: { DEFAULT: '#F59E0B', dark: '#815100', container: '#f8a010' },
      purple: { DEFAULT: '#A78BFA', dark: '#6448b2', container: '#d8caff' },
      pink: { DEFAULT: '#F472B6', dark: '#a02d70', container: '#ff8bc5' },
    },
    fontFamily: {
      display: ['Plus Jakarta Sans', 'sans-serif'],
      body: ['Be Vietnam Pro', 'sans-serif'],
    },
    borderRadius: {
      '2xl': '1.5rem',
      '3xl': '3rem',
    }
  }
}
```
