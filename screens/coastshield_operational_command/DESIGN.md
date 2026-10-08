---
name: CoastShield Operational Command
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001d31'
  on-tertiary-container: '#188ace'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
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
    letterSpacing: -0.005em
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
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
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
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-metric-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  data-metric-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system establishes a mission-critical, high-assurance digital command environment for municipal, regional, and national emergency responders managing flood disasters. The interface prioritizes operational legibility, situational awareness, and split-second cognitive processing under high-stress conditions. 

The aesthetic is strictly **Corporate / Modern meets Tactical Institutional**. It deliberately rejects decorative trends such as glassmorphism, floating gradients, soft blurs, or playful micro-interactions. The visual tone communicates precision, sober authority, and institutional continuity through:
- Crisp white and cool slate surfaces with razor-sharp structural demarcation.
- Monolithic navy structural anchors balancing civic legitimacy with focused utility.
- Tabular figures and mono-spaced geospatial metrics that ensure data scannability without visual jitter.
- Rigid, unambiguous 4-tier alert signifiers engineered to prevent visual ambiguity during critical triage.

## Colors

The palette enforces a daylight-optimized, high-contrast operational environment designed for continuous multi-monitor monitoring, command-vehicle ruggedized tablets, and field command stations.

### Primary Structure & Anchors
- **Primary Navy (`#0F172A`):** Applied to top-level command headers, persistent navigation rails, primary action buttons, and dominant operational headlines.
- **Secondary Slate (`#1E293B`):** Structural sub-headers, dense telemetry table headers, and focused selection outlines.
- **Civic Sky Accent (`#0284C7`):** Interactive utility links, focal metrics, radar track overlays, and active tool states.

### Backgrounds & Structural Boundaries
- **Canvas Base (`#F8FAFC`):** Primary command workspace and map viewport canvas framing.
- **Panel Surface (`#FFFFFF`):** High-density cards, data panels, dispatch drawers, and modal sheets.
- **Border Frame (`#E2E8F0`):** Standard 1px solid hairline divider across all modular widgets.
- **Border Frame Subtle (`#F1F5F9`):** Sub-row separators in tabular feeds.

### Operational 4-Tier Severity Scale
Severity tokens must always be applied with strict pairing of text, 10% tinted background, and matching 1px border:
- **Tier 1 - CRITICAL (`#DC2626`):** Flash flood breaches, dam integrity failures, immediate structural evacuations. Surface tint: `#FEF2F2`, border: `#FCA5A5`. Icon: Octagon Alert.
- **Tier 2 - HIGH (`#F97316`):** Rapid river level rises, impending seawall overtopping, road network severance. Surface tint: `#FFF7ED`, border: `#FDBA74`. Icon: Triangle Alert.
- **Tier 3 - ELEVATED (`#EAB308`):** Rainfall rate thresholds exceeded, storm surge advisory active. Surface tint: `#FEFCE8`, border: `#FDE047`. Icon: Circle Alert.
- **Tier 4 - LOW (`#0EA5E9`):** Monitored sensor drift, standard catchment drainage, resolved alerts. Surface tint: `#F0F9FF`, border: `#BAE6FD`. Icon: Circle Check.

## Typography

Typography relies entirely on the Inter family, chosen for its neutral tone, tall x-height, and extensive OpenType features.

- **Tabular Figures Required:** All data displays, elevation readouts, coordinates, flood water gauges, and status counters must strictly enable OpenType tabular numbers (`font-feature-settings: "tnum" 1, "cv05" 1`). This eliminates horizontal displacement when live sensor streams update.
- **Label Formatting:** Small operational tags and status categories use uppercase styling with expanded letter-spacing to guarantee readability on low-resolution field displays or ambient control room projections.
- **Telemetry Readouts:** Metrics employ `data-metric-lg` and `data-metric-md` styles, paired with adjacent unit descriptors rendered in `label-sm` slate text.

## Layout & Spacing

The layout is built as an edge-to-edge, high-density modular workspace optimized for continuous data ingestion.

### Grid & Canvas Structure
- **Desktop (1440px and above):** 12-column or 16-column layout with fixed command bars. Three distinct work modes:
  1. *Tri-pane Tactical:* 280px incident roster (left), interactive GIS hydro-model (center fluid), 380px telemetry/dispatch panel (right).
  2. *Data Grid:* 12-column layout with 16px (`1rem`) gutters and zero canvas margin to maximize viewports.
- **Tablet / Rugged Vehicle Displays (768px - 1439px):** Adaptive split-screen. Left rail collapses to a 64px icon bar; map and telemetry switch to stacked or tabbed panels with 12px margins.
- **Mobile Handheld (Field Responder, 320px - 767px):** Single-column stacked layout with persistent bottom dispatch drawer, 12px outer canvas margins, and 8px inter-card vertical spacing.

### Density and Cadence
Vertical cadence follows a rigid 4px baseline. Interior component padding maintains compact vertical metrics (`space-sm` for inputs and table rows) to maximize visible data volume on a single screen without scrolling.

## Elevation & Depth

This system avoids ambient shadows, colored glows, and atmospheric drop-shadows. Depth is communicated strictly through **structural flat layering and explicit hairline boundaries**:

- **Hairline Boundary Tiers:** Structural elevation is achieved with `1px solid #E2E8F0` borders on `#FFFFFF` surfaces sitting on `#F8FAFC` backgrounds.
- **Active / Drag State Elevation:** Flyout drawers, incident filter dropdowns, and spatial map controls utilize an ultra-restrained utility shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Modals and Alert Interrupts:** When life-safety confirmation overrides require modal isolation, use a high-contrast backing scrim (`#0F172A` at 60% opacity) with a card shadow of `0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)`.
- **Panel Z-Indexing:** Layering is deterministic: Map Canvas (0) &lt; Data Panels (10) &lt; Sticky Header/Footer Bars (20) &lt; Slide-out Dispatch Drawers (30) &lt; Emergency Interrupt Overrides (50).

## Shapes

The geometric character is strictly controlled, clinical, and precise.

- **Panels & Cards:** Fixed `8px` corner radius. This prevents excessive screen space loss at dense multi-window intersections while providing modern structural containment.
- **Buttons, Controls, & Inputs:** Uniform `6px` corner radius.
- **Status Badges, Chips, & Severity Indicators:** Exact `4px` corner radius. Rounded pill shapes are prohibited to avoid the appearance of consumer-oriented mobile software.
- **Severity Icon Geometry:** 
  - Critical: Octagonal glyph container.
  - High: Triangular glyph container.
  - Elevated: Circular outline glyph.
  - Low: Subdued square-rounded glyph.

## Components

### Buttons
- **Primary Action:** Solid `#0F172A` background, `#FFFFFF` text, `6px` radius, 36px height, font `label-md`. Hover: `#1E293B`. Active: `#0284C7`. Focus-visible: 2px solid `#0284C7` with 2px offset.
- **Secondary Action:** `#FFFFFF` background, `1px solid #CBD5E1`, text `#0F172A`. Hover: `#F1F5F9`.
- **Critical Emergency Action:** Solid `#DC2626` background, `#FFFFFF` text. Used exclusively for evacuation declarations, siren activation, and barrier control triggers.

### Chips & Severity Badges
- Displayed with `4px` radius, 20px fixed height, font `label-sm` uppercase, padding 2px 6px.
- Constructed strictly using the 4-tier palette:
  - *Critical Badge:* Text `#DC2626`, background `#FEF2F2`, border `1px solid #FCA5A5`.
  - *High Badge:* Text `#C2410C`, background `#FFF7ED`, border `1px solid #FDBA74`.
  - *Elevated Badge:* Text `#854D0E`, background `#FEFCE8`, border `1px solid #FDE047`.
  - *Low Badge:* Text `#0369A1`, background `#F0F9FF`, border `1px solid #BAE6FD`.

### Data Cards & Telemetry Blocks
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `8px`, inner padding 12px or 16px.
- Metric cards feature an anchored top metadata bar: left-aligned descriptive label in `label-sm` (`#64748B`), right-aligned sensor health indicator, centered `data-metric-lg` value with tabular digits, and bottom delta comparison indicator.

### Input Fields & Controls
- Height: 36px. Border: `1px solid #CBD5E1`. Background: `#FFFFFF`. Radius: `6px`. Text: `body-md` (`#0F172A`).
- Focus state: Border color `#0284C7` with a matching 1px outline.
- Checkboxes & Radios: 16px box dimension with `4px` radius on checkboxes; filled with `#0F172A` when checked; never rounded into pills or decorative switches.

### Tables & Incident Feeds
- Header row: 32px height, `#F8FAFC` background, `label-sm` uppercase text in `#475569`, border bottom `1px solid #E2E8F0`.
- Data rows: 40px compact height, alternating `#FFFFFF` and hover `#F8FAFC`, tabular text alignment, border bottom `1px solid #F1F5F9`.

### Specialized Emergency Components
- **Telemetry Gauge Card:** Compact linear progress indicator displaying catchment flood capacities with demarcated threshold markers at 70%, 85%, and 100%.
- **Evacuation Zone Pill:** Segmented status indicator showing ward identifier, resident population count, and active transit channel health.
- **Audio/Visual Alert Bar:** Persistent top-of-screen announcement rail flashing a 2px alert bar in `#DC2626` during unacknowledged flash flood alerts.