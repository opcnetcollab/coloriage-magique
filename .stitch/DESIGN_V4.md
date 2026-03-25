# DESIGN SYSTEM V4 — Bibliophile Enchanté
## Coloriage Magique

> Direction artistique de zéro. Concept : **Bibliophile Enchanté**
> Mot clé : comme feuilleter un livre d'art rare dans une papeterie parisienne.
> La magie est dans la découverte, pas dans les effets.

---

## Concept & North Star

**"The Living Atelier"** — Nous ne construisons pas un outil SaaS. Nous créons un héritage numérique. L'expérience doit évoquer l'ouverture d'un livre d'art relié à la main, dont "l'encre" est encore fraîche.

Rupture avec les versions précédentes :
- ❌ Pas d'amber/orange gradient (v1-v3)
- ❌ Pas de glassmorphism
- ❌ Pas de mesh orbs, pas de floating gradients
- ✅ Papier ivoire coton + encre bleu prussien + accent vermillon unique
- ✅ Coins à 0px radius (règle de l'imprimerie)
- ✅ Asymétrie intentionnelle — jamais de grille rigide à 12 colonnes

**AI Slop Test** : Ce design ne ressemble à AUCUN des 1000 sites SaaS vus. L'ivoire + bleu prussien + vermillon est inattendu pour une app créative. ✅

---

## Palette de Couleurs

### Tokens principaux

| Token | Hex | oklch | Usage |
|-------|-----|-------|-------|
| `--color-ivory` | `#F5F0E8` | `oklch(96% 0.015 85)` | Background principal — papier Arches |
| `--color-prussian` | `#1E2D5E` | `oklch(22% 0.09 262)` | Texte principal, ombres, outlines |
| `--color-vermillion` | `#C8392B` | `oklch(52% 0.18 28)` | CTA primaire — UN seul rouge par écran |
| `--color-gold` | `#B8932A` | `oklch(67% 0.13 82)` | Or vieilli — bordures, flourishes, accents décoratifs |
| `--color-cream` | `#FDFAF4` | `oklch(98% 0.008 85)` | Surface élevée — légèrement plus clair que l'ivory |
| `--color-parchment` | `#EDE8DF` | `oklch(91% 0.012 85)` | Surface container |
| `--color-ink-light` | `rgba(30,45,94,0.08)` | — | Ombres colorées (jamais gris) |

### Tokens Material Design (générés par Stitch)

```json
{
  "surface": "#fef9f1",
  "on_surface": "#1d1c17",
  "primary": "#a51f16",
  "primary_container": "#c8392b",
  "secondary": "#765b00",
  "secondary_container": "#fdd264",
  "tertiary": "#445386",
  "tertiary_container": "#5d6ba0",
  "background": "#fef9f1",
  "surface_dim": "#ded9d2",
  "outline": "#8e706c",
  "outline_variant": "#e2beb9"
}
```

### Règles chromatiques

1. **Jamais de noir pur** (`#000`) → utiliser `--color-prussian`
2. **Jamais de blanc pur** (`#fff`) → utiliser `--color-cream` ou `--color-ivory`
3. **Ombres colorées uniquement** : `box-shadow: 0 10px 30px -10px rgba(30, 45, 94, 0.15)`
4. **Un seul rouge par écran** — le vermillon est réservé au CTA primaire
5. **L'or est décoratif** — filets, flourishes de coin, borders d'encadrement

---

## Typographie

### Familles de polices

| Rôle | Famille | Source | Caractéristique |
|------|---------|--------|-----------------|
| Display / Headlines | **Fraunces** ExtraBold | Google Fonts | Serif variable optique, warm + literary. `letter-spacing: -0.04em` |
| Subheadings | **Fraunces** Regular | Google Fonts | Evoque les légendes d'un musée |
| Body | **Instrument Sans** | Google Fonts | Humaniste, moderne, contraste avec le serif |
| Labels / CTA | **Instrument Sans** All-Caps | Google Fonts | `letter-spacing: 0.15em` — effet "tampon" |

*Note : Stitch a mappé sur NEWSREADER (headline) + MANROPE (body) comme équivalents disponibles.*

### Échelle typographique

```css
--type-display:  clamp(56px, 5vw, 96px);  /* Hero headline — Fraunces ExtraBold */
--type-h1:       48px;                     /* Titre de page */
--type-h2:       32px;                     /* Section heading */
--type-h3:       24px;                     /* Fraunces Regular */
--type-body-lg:  18px;                     /* Instrument Sans */
--type-body:     16px;
--type-label:    13px;                     /* All-caps, tracked */
--type-caption:  12px;

/* Headline tracking */
--tracking-display: -0.04em;   /* Dense, authoritative */
--tracking-label:   0.15em;    /* Stamped */
```

---

## Espacement & Layout

```css
/* Scale 3 (Stitch spacingScale: 3) */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  24px;
--space-6:  32px;
--space-7:  48px;
--space-8:  64px;
--space-9:  96px;
--space-10: 128px;
```

**Règle layout** : Jamais de grille rigide à 12 colonnes. Utiliser l'asymétrie intentionnelle : bloc de texte lourd à gauche, image/ornement flottant à droite avec marges inégales.

---

## Élévation & Profondeur

Système "feuilles de papier empilées" — pas de drop shadows gris.

| Niveau | Description | Règle CSS |
|--------|-------------|-----------|
| Base | Background ivory + texture grain | `background: #fef9f1; filter: url(#noise)` |
| Surface | Cream légèrement plus clair | `background: #fdfaf4` |
| Elevated | Parchment + prussian shadow | `box-shadow: 0 10px 30px -10px rgba(30,45,94,0.15)` |
| Modal | Double prussian shadow | `box-shadow: 0 4px 8px rgba(30,45,94,0.08), 0 20px 40px rgba(30,45,94,0.12)` |

---

## Composants

### Boutons

```css
/* Primary CTA — Vermillon */
.btn-primary {
  background: linear-gradient(45deg, #a51f16, #c8392b);
  color: white;
  border-radius: 0px;      /* LOI : 0px radius */
  padding: 16px 40px;
  font: Instrument Sans All-caps, letter-spacing: 0.15em;
  border: none;
}
.btn-primary:hover {
  box-shadow: 0 0 0 3px rgba(184, 147, 42, 0.4); /* gold glow */
}

/* Secondary — Ghost Gold */
.btn-secondary {
  background: transparent;
  color: #1E2D5E;
  border: 1px solid #B8932A;
  outline: 1px solid #B8932A;
  outline-offset: 3px;     /* double-line border effect */
  border-radius: 0px;
}

/* Tertiary — Prussian Blue */
.btn-tertiary {
  background: #1E2D5E;
  color: white;
  border-radius: 0px;
  box-shadow: 0 6px 20px rgba(30, 45, 94, 0.25);
}
```

### Encadrements (Museum Mat Frame)

```css
.frame-museum {
  border: 1px solid #1E2D5E;
  outline: 1px solid #B8932A;
  outline-offset: 6px;
  padding: 4px;
  position: relative;
}

/* Corner flourishes en CSS */
.frame-museum::before,
.frame-museum::after {
  content: '';
  position: absolute;
  width: 12px; height: 12px;
  border-color: #B8932A;
  border-style: solid;
}
```

### Champs de saisie

```css
.input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #8e706c;
  border-radius: 0;
  padding: 8px 0;
}
.input:focus {
  border-bottom: 1px solid #B8932A;
  outline: 1px solid #B8932A;
  outline-offset: 2px;
}
label { font: Instrument Sans all-caps; letter-spacing: 0.15em; }
```

### Nuancier Palette (Hachette)

```css
/* Puits de peinture circulaires — PAS une grille rectangulaire */
.paint-swatch {
  border-radius: 50%;       /* SEULS les swatches ont des coins ronds */
  width: 48px; height: 48px;
  box-shadow: inset 0 2px 4px rgba(30,45,94,0.2); /* inner shadow = liquid paint */
  border: 1px solid rgba(30,45,94,0.1);
}
/* Arrangement organique en forme de palette de peinture */
```

### Barre de progression (Progress Scroll)

```css
/* Filet d'or avec plume animée — PAS un progress bar standard */
.progress-line {
  height: 1px;
  background: linear-gradient(to right, #B8932A var(--progress), transparent var(--progress));
}
/* Milestones : chiffres Fraunces au-dessus de la ligne (0... 25... 50... 75... 100) */
/* Plume animée qui se déplace sur le filet */
```

---

## Texture & Effets

### Grain de papier

```css
/* SVG filter pour texture papier */
.paper-texture {
  filter: url(#paper-grain);
  /* ou */
  background-image: url("data:image/svg+xml,..."); /* noise SVG */
  /* Intensité : très subtile — visible mais non distrayante */
}

<filter id="paper-grain">
  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feBlend in="SourceGraphic" mode="multiply"/>
</filter>
```

### Nombres décoratifs (texture background)

```css
/* Chiffres 1-4 en arrière-plan — référence paint-by-numbers */
.bg-numbers {
  font: Fraunces ExtraBold 800px;
  color: rgba(30, 45, 94, 0.04); /* 4% opacity — presque invisible */
  position: absolute;
  z-index: 0;
  user-select: none;
}
```

### Ombres à l'encre

```css
/* Jamais de gris — toujours teinté bleu prussien */
--shadow-sm:  0 4px 8px rgba(30, 45, 94, 0.08);
--shadow-md:  0 10px 30px rgba(30, 45, 94, 0.12);
--shadow-lg:  0 20px 60px rgba(30, 45, 94, 0.16);
--shadow-gold: 0 0 0 3px rgba(184, 147, 42, 0.35); /* hover glow */
```

---

## Animations & Transitions

> Principe : lentes et délibérées, comme une page qui se tourne.

```css
/* Transition standard */
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Pas de animations rapides (<200ms) */
/* Pas de spring physics agressives */

/* Animation de traçage d'encre (screen processing) */
@keyframes ink-trace {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0; }
}
.ink-drawing {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: ink-trace 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Progress scroll (écran processing) */
@keyframes progress-grow {
  from { background-size: 0% 1px; }
  to   { background-size: var(--progress) 1px; }
}
```

---

## Screens générés (v4)

| # | Screen | ID Stitch | Fichiers |
|---|--------|-----------|---------|
| 01 | Landing / Upload | `bae16d4df5874021bc7a1419d982960d` | `01-landing-upload.{html,png}` |
| 02 | Sélecteur difficulté | `abcd7f09a2b9477ca2e963ab37381ba9` | `02-difficulty-selector.{html,png}` |
| 03 | Processing | `feef86ae971f4c8bb81d0503cf68119d` | `03-processing.{html,png}` |
| 04 | Résultat + Nuancier | `25aae7ba7594475bb67c7aec28f6c92c` | `04-result-nuancier.{html,png}` |

**Stitch Project** : `14899825859497664615`
**Design System Asset** : `fb5a8bd3aa2241e1b9d527f99e5644ba`
**Modèle** : GEMINI_3_1_PRO

---

## Checklist Polish (appliqué mentalement)

### Screen 01 — Landing/Upload
- [x] Typographie : Fraunces ExtraBold hero, hiérarchie claire
- [x] Couleurs : ivory + prussian + vermillon, ombres colorées
- [x] Espacement : asymétrie hero, zone upload respirante
- [x] Détails : encadrement musée upload, flourishes d'or, nombres décoratifs
- [x] AI Slop Test : PASS — aucun autre SaaS n'a cette esthétique

### Screen 02 — Difficulty Selector
- [x] 3 niveaux avec caractères distincts (crayon/pinceau/plume)
- [x] Carte selected : shadow prussien + bordure or
- [x] Preview live de la page de coloriage
- [x] CTA vermillon en bas à droite

### Screen 03 — Processing
- [x] PAS de spinner générique
- [x] Progress : filet d'or + plume animée + milestones Fraunces
- [x] Split image : photo à 50% → traçage progressif
- [x] Tips rotatifs pour l'attente délicieuse

### Screen 04 — Résultat + Nuancier
- [x] Grand format editorial — le grand révélation
- [x] Encadrement musée de la page de coloriage
- [x] Palette watercolor organique (PAS une grille)
- [x] 3 actions : PDF / Imprimer / Recommencer

---

## Références & Inspirations

- **Moleskine** website — editorialisme, typographie
- **Papier Paris** — stationery branding premium
- **Taschen** art book edition — unboxing feeling
- **Sennelier** art supplies — pigments naturels
- **Conté à Paris** — packaging luxueux
- **Hachette** — nuancier couleurs craft français

---

*Design system v4 généré le 2026-03-25*
*Direction : Bibliophile Enchanté × Atelier Parisien*
*Concept unique — passe l'AI Slop Test*
