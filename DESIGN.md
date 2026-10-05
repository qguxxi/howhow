---
name: Shadcn UI System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe0'
  on-secondary-container: '#616364'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e3'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#FFFFFF'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
  foreground: '#000000'
  muted: '#F4F4F5'
  border: '#E4E4E7'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.025em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies a clean, modern, and minimalist aesthetic tailored for professional developer tools. It bridges the gap between raw functional utility and refined visual polish. The design style relies on a high-precision, low-noise environment that reduces cognitive load, allowing developers to focus entirely on code and component architecture. 

The emotional response is one of absolute confidence, reliability, and technical competence. The visual narrative speaks the language of modern engineering: precise, intentional, and stripped of unnecessary ornament.

## Colors

The color palette is built on a sophisticated zinc neutral foundation that emphasizes content over chrome. Monochromatic tones dominate, utilizing deep blacks for maximum contrast on primary actions, stark whites for primary surfaces, and cool zinc grays for structural boundaries and secondary states. 

Use `#000000` for primary actions and key focal points, `#FFFFFF` for main surfaces, and `#F4F4F5` for subtle structural backgrounds and hover states. Borders and dividers must maintain high legibility without visual heaviness using `#E4E4E7`.

## Typography

Typography is systematic, highly legible, and neutral, utilizing Inter to maintain a crisp developer-first aesthetic. Headings employ tighter letter-spacing (`-0.025em`) to create a solid, authoritative block feel at larger scales, while body sizes prioritize optical comfort during long reading sessions in documentation or code editors. 

Ensure line heights remain proportional to font sizing. For headings exceeding 32px on mobile viewports, strictly utilize the designated mobile alternatives to prevent text wrapping issues and maintain interface rhythm.

## Layout & Spacing

The layout philosophy relies on a structured, responsive 12-column fluid grid system paired with an intentional 4px/8px base-4 spacing rhythm. Content areas adapt dynamically to viewport shifts, bounded by consistent outer margins that scale down on mobile devices. 

Maintain structural consistency by applying `space-sm` (0.5rem) for tight component groupings (e.g., icon-to-text gaps), `space-md` (1rem) for standard padding inside cards and containers, and `space-xl` (2rem) for major section breaks. Gutters must remain fixed at `1.5rem` across desktop layouts to preserve breathing room between grid columns.

## Elevation & Depth

Visual hierarchy is communicated primarily through low-contrast outlines, crisp borders, and minimalist structural layering rather than heavy drop shadows. 

Surfaces remain flat with clean 1px borders (`#E4E4E7`) to delineate containers, floating panels, and dropdown menus. When elevation is required for modals, tooltips, or command palettes, apply subtle, diffused ambient shadows with extremely low opacity to give elements a delicate, paper-like lift without breaking the flat developer aesthetic.

## Shapes

The shape language uses a soft, restrained corner radius profile. UI elements feature a baseline `0.25rem` (4px) to `0.5rem` (8px) roundedness, avoiding overly bubbly or aggressive geometric forms. 

Inputs, buttons, and badges utilize `rounded-md`, while larger containers and cards employ `rounded-lg`. This subtle rounding softens the industrial precision of the monochrome palette just enough to feel approachable and modern.

## Components

### Buttons
Buttons must feature crisp height boundaries (36px for default, 32px for compact/sm) with `rounded-md` corners. Primary variants use solid `#000000` backgrounds with white text; secondary variants use transparent backgrounds with a 1px border and subtle hover states (`#F4F4F5`). 

### Input Fields
Inputs require a 1px border (`#E4E4E7`), a `rounded-md` radius, and 14px body text. Focus states must transition smoothly with a 2px ring offset in neutral dark tones.

### Cards
Cards are structured with a clean white background, 1px solid border, and `rounded-lg` corners. Internal padding should be standardized to `space-lg`.

### Checkboxes & Radios
Checkboxes and radios must use precise square or circular geometry with a 1px border, utilizing solid black fills upon selection with a crisp, centered white checkmark or dot indicator.

### Chips & Badges
Badges should be compact, using `label-sm`, subtle neutral backgrounds (`#F4F4F5`), and zero border for tag-like elements or categorization.

### Additional Components
- **Command Menu (Kbd):** Styled with high-contrast mono styling, subtle surface backgrounds, and tight padding for shortcut indicators.
- **Code Blocks:** High-contrast dark or muted slate containers featuring copy actions and clear syntax distinction.