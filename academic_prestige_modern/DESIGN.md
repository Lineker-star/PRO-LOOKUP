---
name: Academic Prestige Modern
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#43474d'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#49607e'
  primary: '#000f22'
  on-primary: '#ffffff'
  primary-container: '#0a2540'
  on-primary-container: '#768dad'
  inverse-primary: '#b0c8eb'
  secondary: '#006a67'
  on-secondary: '#ffffff'
  secondary-container: '#78f6f1'
  on-secondary-container: '#00706e'
  tertiary: '#180d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#332100'
  on-tertiary-container: '#b28330'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#b0c8eb'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#314865'
  secondary-fixed: '#78f6f1'
  secondary-fixed-dim: '#58d9d5'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#00504e'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#f3be65'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-rank:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the credibility, rigor, and intellectual authority of higher education and advanced research institutions while maintaining the agility of a next-generation professional network. It is built for a peer-oriented ecosystem spanning university chairs, doctoral researchers, industry engineers, and emerging scholars.

The visual style blends **Corporate / Modern** precision with **Editorial / Institutional** prestige:
- **Tone:** Authoritative, disciplined, erudite, and focused. Interactions must feel calculated, substantive, and respectful of peer standing.
- **Architectural Clarity:** Layouts rely on structured horizontal bands, distinct rank tiers, and disciplined white space over casual, high-volume feed noise.
- **Dignified Dynamism:** Interactivity is sharp and immediate, avoiding playful or whimsical flourishes in favor of confident state transitions, crisp hairline framing, and focused typographic hierarchy.

## Colors

The palette establishes structural gravitas through deep midnight blue, punctuated by deliberate interactive teal and strictly disciplined ceremonial gold accents.

### Palette Architecture & Semantic Roles
- **Primary (`#0A2540`):** The structural spine. Used for foundational navigation framing, global headers, primary action buttons, dark brand surfaces, and key identity elements. Evokes academic institutional permanence.
- **Secondary (`#00A9A5`):** The interactive catalyst. Reserved for active navigational states, primary hyperlinked metadata, primary CTAs requiring immediate user progression, dynamic toggle switches, and input focus indicator rings.
- **Tertiary / Rank Gold (`#D4A24C`):** Strict prestige accent. **Never** deployed as expansive surface fills or decorative background washes. Strictly bounded to:
  - Rank taxonomy indicators (badges, honorific icons, verified scholarly status ribbons).
  - Degree and chair rings around profile avatars (e.g., *Professeur*, *Docteur*).
  - Milestone medals and peer validation marks.
- **Backgrounds:** Canvas uses `#F7F9FB` (cool, low-strain off-white), while active foreground modules and cards utilize `#FFFFFF`.
- **Typographic Neutral:** Primary text rests at `#1A1A1A` for near-ink high legibility; secondary supporting metadata, captions, and micro-labels reside at `#6B7280`.
- **System Delimiters:** Crisp hairlines use `#E2E8F0` to enforce architectural discipline across density tiers.
- **Feedback Alerts:** Affirmative state confirmation uses `#2F9E44` (forest green), while destructive actions or review alerts leverage `#D64545` (crimson red).

## Typography

The typography uses Inter across all viewports to deliver neutral, high-density clarity for research abstracts, professional titles, and tabular credentials. 

### Typographic Rules
- **Proportional Discipline:** Negative tracking is applied systematically to headlines above 20px to compress optical white space and maintain an authoritative, editorial density.
- **Rank Typographic Treatment (`label-rank`):** All canonical designations (*Professeur*, *Docteur*, *Ingénieur*, *Chercheur*, *Étudiant*) display in uppercase, bold, with `+0.05em` letter tracking to preserve instant legibility when paired with gold markers.
- **Numeric & Academic Data:** Tabular numerals (`tnum`) must be active across metrics, publication counts, citation indexes, and date stamps.

## Layout & Spacing

The design system implements a disciplined grid focused on vertical alignment, content density, and rapid scanning of member hierarchies.

### Grid Architecture
- **Desktop (1200px+):** 12-column layout. Default container max-width: `1240px`. Column gutter: `1.5rem` (`24px`). Outer margin: `2rem` (`32px`).
- **Tablet (768px – 1199px):** 8-column layout. Column gutter: `1.25rem` (`20px`). Outer margin: `1.5rem` (`24px`).
- **Mobile (<768px):** 4-column layout. Column gutter: `1rem` (`16px`). Outer margin: `1rem` (`16px`).

### Spatial Hierarchy
- Use `space-xs` (4px) and `space-sm` (8px) for tightly coupled metadata pairs, avatar-to-rank indicator relationships, and badge internal padding.
- Use `space-md` (16px) for interior card component separations, list items, and standard form layouts.
- Use `space-lg` (24px) for card body padding and internal quadrant division.
- Use `space-xl` (40px) exclusively for major structural section breaks within profile dossiers and search result groupings.

## Elevation & Depth

Visual hierarchy uses **tonal layering anchored by hairline borders and ambient low-opacity shadows**. Depth supports content structure rather than dramatic visual effects.

### Elevation Levels
- **Level 0 (Base Canvas):** Background color `#F7F9FB`. Flat with no elevation.
- **Level 1 (Card & Module Resting):** Surface `#FFFFFF`, bounded by a single continuous border `1px solid #E2E8F0`. Shadow: `0px 1px 3px rgba(10, 37, 64, 0.04), 0px 1px 2px rgba(10, 37, 64, 0.02)`.
- **Level 2 (Active/Hover Cards & Navigation):** Surface `#FFFFFF`, border remains `1px solid #E2E8F0`. Shadow: `0px 4px 12px rgba(10, 37, 64, 0.08), 0px 2px 4px rgba(10, 37, 64, 0.04)`.
- **Level 3 (Flyouts, Rank Filters & Menus):** Surface `#FFFFFF`, border `1px solid #E2E8F0`. Shadow: `0px 10px 24px rgba(10, 37, 64, 0.10), 0px 4px 8px rgba(10, 37, 64, 0.04)`.
- **Level 4 (Modals & Academic Dossiers):** Surface `#FFFFFF`, backdrop overlay `#0A2540` at `40% opacity` with 4px backdrop blur. Modal shadow: `0px 20px 32px rgba(10, 37, 64, 0.16)`.

Shadows are tinted with the primary hue (`#0A2540`) to maintain brand cohesion rather than using neutral greys.

## Shapes

The design system enforces **Soft (Option 1)** geometry to communicate institutional structure, architectural stability, and academic rigor.

### Rounding Scale
- **Base Components (Inputs, Small Badges, Cards, Containers):** `0.25rem` (`4px`).
- **Mid-Tier Elements (Standard Buttons, Dialogues, Popovers):** `0.5rem` (`8px`).
- **Structural Overlays (Full Page Modals, Large Cards):** `0.75rem` (`12px`).
- **Exceptions (Avatars, Verification Rings, Rank Chips):** Profile pictures remain circular (`rounded-full`). Academic rank pill badges utilize a fully rounded capsule (`rounded-full`) to contrast against the rectilinear cards and inputs.

## Components

### 1. Buttons
- **Primary Action:** Solid `#0A2540` background, pure white `#FFFFFF` text, `4px` border radius, medium font weight (`600`). Hover: `#00A9A5` transition (150ms). Focus: `2px` solid `#00A9A5` offset by `2px`.
- **Secondary Action (Teal Accent):** Solid `#00A9A5` background, `#FFFFFF` text. Used for immediate social interactions (e.g., "Connecter", "Contacter"). Hover: brightness 90%.
- **Tertiary / Outline:** Transparent background, `1px solid #E2E8F0`, text `#0A2540`. Hover: background `#F7F9FB`, border color `#0A2540`.

### 2. Rank Badges & Status Rings
- **Rank Badges:** Capsule-shaped (`rounded-full`), height `22px`, internal padding `2px 10px`. Background is `#D4A24C` at `12% opacity`, text is `#D4A24C` (darkened for contrast to `#9B7023` when text size requires WCAG AA compliance), carrying the `label-rank` typography.
- **Rank Avatar Rings:** Standard avatars (`48px`, `64px`, `96px`) feature a `2px` offset ring. Rank tiers determine ring style:
  - *Professeur & Docteur:* Dual-ring with `2px` solid `#D4A24C`.
  - *Ingénieur & Chercheur:* Single `2px` solid `#00A9A5`.
  - *Étudiant:* Single `1.5px` solid `#E2E8F0`.

### 3. Cards (Academic & Member Dossiers)
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `4px`, padding `space-lg` (`24px`).
- Header includes member identity, primary rank badge pinned top-right, followed by institution subtitle in `#6B7280`.
- Card footer is partitioned by a `1px solid #E2E8F0` divider containing micro-metrics (e.g., publications, index, citations) using `space-sm` gap.

### 4. Input Fields
- Height `40px`, background `#FFFFFF`, border `1px solid #E2E8F0`, radius `4px`, padding `0 12px`.
- Text color `#1A1A1A`, placeholder `#6B7280`.
- Active/Focus: Border color `#00A9A5`, accompanied by an outer box-shadow ring `0 0 0 3px rgba(0, 169, 165, 0.15)`.

### 5. Checkboxes & Radio Buttons
- Checkbox dimensions `18x18px`, radius `3px`, default border `1px solid #E2E8F0`.
- Checked State: Fill `#0A2540` with white checkmark.
- Radio dimensions `18x18px`, full circle. Checked state: Border `#00A9A5`, centered circular dot `#00A9A5`.

### 6. Lists & Research Feeds
- Row items partitioned via border-bottom `1px solid #E2E8F0`.
- Left-hand accent indicator: dynamic left border (`3px solid #00A9A5`) on unread peer requests or newly published preprints.
- Hover states transition background from `#FFFFFF` to `#F7F9FB`.