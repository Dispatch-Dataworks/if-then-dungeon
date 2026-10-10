# If Then Dungeon — Web Style Guide

This guide defines the visual language, colors, type and UI styling for the game and website. It is derived from the concept art in `branding/`. The overall look is a dark, magical fantasy dungeon lit by glowing runic technology.

## 1. Mood and textures
- **Theme:** dark fantasy, dungeon crawler, magic-tech, adventure.
- **Atmosphere:** mysterious, ancient, glowing and slightly perilous. Lighting comes mainly from magic runes and fire.
- **Textures:**
  - **Stone:** rough, cracked, ancient blocks with deep shadows.
  - **Magic/runes:** glowing neon energy etched into stone or flowing through conduits.
  - **Parchment:** aged and worn with slightly burned edges; used for borders and UI panels.
  - **Leather and metal:** worn leather armor and dark forged metal with glowing accents.

## 2. Color palette
Define these as CSS custom properties and use the tokens, not raw hex values.

### Backgrounds and surfaces
| Token | Value | Use |
|---|---|---|
| `--stone-deep` | `#0A0A14` | Page background |
| `--stone-dark` | `#1A1A2E` | Panels, cards |
| `--stone-mid` | `#2C3146` | Raised surfaces, art frames |
| `--parchment-light` | `#CDB38B` | Borders, secondary text on dark |
| `--parchment-dark` | `#8B6F47` | Border shading; text only at 24px+ (3.6:1 on `--stone-dark`) |

### Glow and magic accents
| Token | Value | Use |
|---|---|---|
| `--rune-cyan` | `#00F0FF` | Primary glow, focus rings, sensor cards |
| `--rune-blue` | `#0066FF` | Glow gradients (decorative only; too dark for text on stone) |
| `--magic-purple` | `#9D00FF` | Decorative runes and gears |
| `--magic-purple-text` | `#C77DFF` | Purple when used for text or icons (readable on dark stone) |

### State colors
| Token | Value | Use |
|---|---|---|
| `--true` | `#00FF66` | TRUE / success |
| `--false` | `#FF6600` | FALSE / danger (`#FF3300` is the deeper shade for glows and gradients) |
| `--torch` | `#FFD700` | Fire, highlights, action cards |
| `--torch-deep` | `#FF8C00` | Fire gradients, hero-action cards |

### Card type colors
Used by cards and the placeholder images (`scripts/gen-placeholders.mjs`).
| Card type | Color | Glyph |
|---|---|---|
| Sensor | `--rune-cyan` | Eye |
| Action | `--torch` | Arrow |
| Operator | `--magic-purple-text` | Diamond |
| Hero action | `--torch-deep` | Star |

## 3. Accessibility (required)
- **Never use color alone.** Every color-coded meaning also has a shape, icon or label:
  - TRUE = green **check mark**; FALSE = orange-red **cross**. Always include the icon, and the word where space allows.
  - Card types use the glyphs in the table above.
- About 1 in 12 boys has red-green color vision deficiency, so TRUE and FALSE must stay distinguishable in grayscale. Check designs with a color-blindness simulator.
- **Contrast:** body text at least 4.5:1 against its background; large text and icons at least 3:1. `--parchment-light` and `#F2E6CF` on `--stone-dark` both pass for body text.
- **Glow is decoration.** Text must stay readable with glow effects turned off. Honor `prefers-reduced-motion` by disabling pulsing and flicker.
- **Focus:** every interactive element shows a visible `--rune-cyan` focus ring (at least 2px) for keyboard users.
- **Touch targets:** at least 44×44 px.

## 4. Typography
| Role | Font | Notes |
|---|---|---|
| Headings, logo-style text | Cinzel Decorative or Cinzel | Headings and card titles only; never for body text |
| Body and UI | Montserrat (or Lora for a serif feel) | Minimum 16px for body text |
| Card IDs, code, rule rows | A monospace font | Used where players read logic |

Suggested scale (rem): 0.875 (small labels), 1 (body), 1.25, 1.5, 2, 3 (page title). Line height 1.5 for body text.

## 5. Spacing and layout
- 4px base unit; use multiples (4, 8, 12, 16, 24, 32, 48).
- Corner radius: 8px for buttons and inputs, 14–18px for cards and panels.
- Cards use a portrait ratio of 5:7 (placeholders are 300×420).

## 6. UI elements
- **Panels:** parchment texture with a torn/burned edge for main content and modals, or dark stone panels with a glowing cyan border.
- **Primary buttons:** dark stone background with a glowing cyan or gold rune border that pulses on hover (static when reduced motion is on).
- **TRUE/FALSE buttons:** circular, glowing, with the check and cross icons from the art.
- **Dividers:** glowing blue lines, gear patterns or parchment edges.

## 7. Icons
Icons look glowing, runic or etched. Each icon must still be recognizable as a flat single-color shape, so it works at small sizes and without glow.
