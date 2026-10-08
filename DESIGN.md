# CoastShield AI — DESIGN.md

## 1. Purpose

This document is the UI/UX design specification for **CoastShield AI**, an AI-powered coastal flood intelligence platform.

It is written to be used as a source of truth when generating and iterating the interface in **Google Stitch**.

The product has two experiences:

1. **Responder Command Center** — desktop-first web dashboard for emergency responders, municipal teams, and command-center operators.
2. **Citizen Safety App** — mobile-first app that gives residents simple, localized flood risk and safety guidance.

The design must communicate:

> **Forecast → Impact → Explain → Prioritize → Act**

The interface should feel like a serious emergency-management tool, not a generic AI dashboard.

---

# 2. Design Principles

## 2.1 Operational clarity

During a flood event, users need to understand the situation within seconds.

Prioritize:

- What is happening?
- Where is it happening?
- When will it happen?
- How severe is it?
- Who is affected?
- Why does the model think this?
- What should responders do next?

Avoid decorative UI that competes with these answers.

## 2.2 Map-first

The responder experience is fundamentally geospatial.

The map should be the dominant visual element on the overview screen.

Supporting information should appear as panels, cards, timelines, and ranked lists around the map.

## 2.3 Progressive disclosure

Do not overwhelm responders with every metric at once.

Overview:

- risk
- location
- timing
- impact
- priority

Drill-down:

- model explanation
- environmental drivers
- affected assets
- population exposure
- response actions

## 2.4 Explainable AI

AI predictions must never feel like unexplained magic.

Every important prediction should have a visible:

**Why?**

section containing:

- top contributing factors
- contribution magnitude
- plain-language explanation
- relevant environmental context

## 2.5 Calm under pressure

The product should feel urgent but not chaotic.

Use restrained warning colors.

Red should mean:

**Immediate danger / critical action**

Orange:

**High risk / attention required**

Yellow:

**Elevated risk**

Blue/teal:

**Information / environmental conditions**

Neutral colors:

**Normal interface structure**

## 2.6 No false precision

Flood predictions should be displayed as ranges where appropriate.

Example:

`0.31–0.71 m`

rather than:

`0.482937 m`

Times should be human-readable:

`Onset 14:30`

`Peak 15:10`

Probabilities should be visually prominent but not presented as certainty.

---

# 3. Visual Direction

## 3.1 Overall aesthetic

Style:

**Modern emergency operations center + premium geospatial analytics product**

Keywords:

- professional
- trustworthy
- technical
- calm
- geographic
- high-information
- clean
- modern
- accessible

Avoid:

- cyberpunk
- excessive gradients
- glassmorphism everywhere
- gaming UI
- neon colors
- overly rounded SaaS cards
- excessive shadows
- giant decorative illustrations

## 3.2 Color system

Primary background:

`#F8FAFC`

Surface:

`#FFFFFF`

Primary text:

`#0F172A`

Secondary text:

`#475569`

Borders:

`#E2E8F0`

Map / geographic blue:

`#0EA5E9`

Information teal:

`#0F766E`

Elevated risk:

`#EAB308`

High risk:

`#F97316`

Critical risk:

`#DC2626`

Success / safe:

`#16A34A`

The color system must remain accessible and should never rely on color alone to communicate severity.

Always pair risk colors with:

- labels
- icons
- values
- patterns or visual boundaries where useful

---

# 4. Typography

Use a clean modern sans-serif.

Preferred:

**Inter**

Fallback:

`system-ui, sans-serif`

Hierarchy:

- Page title: 24–30 px, semibold/bold
- Section title: 16–20 px, semibold
- Card title: 14–16 px, semibold
- Body: 14 px
- Supporting text: 12–13 px
- Data labels: 11–12 px
- Large KPI value: 24–32 px

Numbers should use tabular/monospaced numeric alignment where useful.

---

# 5. Shape and Spacing

Use a restrained radius system.

- Small controls: 6 px
- Cards: 8–10 px
- Major containers: 10–12 px
- Pills/status labels: fully rounded

Avoid excessive pill-shaped containers.

Spacing should follow an 8 px rhythm.

Primary layout spacing:

- 8
- 12
- 16
- 24
- 32

---

# 6. Responder Command Center

## 6.1 Desktop layout

Target viewport:

`1440 × 900`

Minimum practical viewport:

`1280 × 720`

Structure:

```text
┌──────────────────────────────────────────────────────────────────┐
│ TOP HEADER                                                       │
├───────────────┬──────────────────────────────────────────────────┤
│               │                                                  │
│   SIDEBAR     │                 MAIN WORKSPACE                   │
│               │                                                  │
│ Overview      │                                                  │
│ Alerts        │                    MAP                           │
│ Zones         │                                                  │
│ Facilities    │                                                  │
│ Scenarios     │                                                  │
│               │                                                  │
│               ├──────────────────────────────────────────────────┤
│               │              TIMELINE                            │
└───────────────┴──────────────────────────────────────────────────┘
```

Recommended dimensions:

Sidebar:

`220–240 px`

Header:

`56–64 px`

Main content:

Remaining viewport.

---

# 7. Top Header

The top header should remain visually stable across the responder application.

Left:

- CoastShield logo
- product name
- optional event name

Center/right:

- current operational status
- selected event
- data freshness
- notification indicator
- user/profile menu

Example:

```text
CoastShield AI        Coastal Flood Event     ● LIVE     Updated 14:26
```

The LIVE indicator should be subtle.

Do not use flashing animations.

---

# 8. Sidebar Navigation

Primary navigation:

1. Overview
2. Alerts
3. Zones
4. Critical Facilities
5. Scenarios

Optional secondary section:

- Data status
- Model status
- Settings

Navigation should clearly show the current section.

Use simple line icons.

Recommended icon style:

Lucide-style icons.

---

# 9. Overview Screen

The Overview screen is the primary responder workspace.

## 9.1 Goal

A responder should understand the situation in approximately 5 seconds.

## 9.2 Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Situation Overview                                         │
│ 12 zones monitored     3 high risk     1 critical         │
├──────────────────────────────────────┬──────────────────────┤
│                                      │ Priority Zones       │
│                                      │                      │
│               FLOOD MAP              │ #1 Zone B            │
│                                      │ #2 Zone F            │
│                                      │ #3 Zone C            │
│                                      │                      │
├──────────────────────────────────────┴──────────────────────┤
│ Flood Timeline                                              │
└─────────────────────────────────────────────────────────────┘
```

## 9.3 KPI strip

Use 3–5 compact KPI cards.

Examples:

**High-risk zones**

`3`

**Critical zones**

`1`

**Estimated population exposed**

`12,840`

**Critical facilities affected**

`7`

**Next predicted onset**

`14:30`

KPI cards should not dominate the map.

---

# 10. Flood Map

The map is the centerpiece.

Use a clean basemap with:

- coastline
- roads
- waterways
- administrative boundaries
- important landmarks
- critical facilities

Overlay:

- flood extent
- risk zones
- predicted depth
- affected roads
- critical facilities
- selected zone

## 10.1 Map controls

Place controls vertically in the top-right:

- zoom in
- zoom out
- fit event
- layer selector
- basemap selector

Do not clutter the map.

## 10.2 Layer selector

Layers:

```text
Flood Extent       ✓
Risk Zones         ✓
Roads              ✓
Critical Facilities ✓
Buildings          ○
Population         ○
```

## 10.3 Risk visualization

Use geographic polygons.

Suggested visual semantics:

- Low: pale neutral/blue
- Moderate: yellow
- High: orange
- Critical: red

Opacity should allow the underlying map to remain visible.

Avoid solid opaque red polygons covering the whole map.

---

# 11. Map Zone Interaction

Hovering over a zone:

Show a compact tooltip:

```text
Zone B

HIGH RISK

Flood probability
84.7%

Depth
0.31–0.71 m

Onset
14:30
```

Clicking a zone opens the Zone Detail view or a right-side detail drawer.

---

# 12. Timeline

The timeline is essential.

It should allow responders to understand how the flood evolves.

Example:

```text
12:00      13:00      14:00      15:00      16:00
  |          |          |          |          |
  ─────────────────────────────────────────────
                       ▲
                    NOW 14:26

                 ONSET 14:30
                       PEAK 15:10
```

Timeline controls:

- play
- pause
- previous
- next
- drag time

Optional:

- rainfall
- tide
- flood probability
- depth

The map should update when the selected time changes.

---

# 13. Zone Detail Screen

URL concept:

`/zones/[id]`

Purpose:

Provide a complete operational picture of one zone.

Layout:

```text
┌───────────────────────────────────────────────────────────┐
│ ← Back     Zone B                        HIGH RISK        │
├──────────────────────┬────────────────────────────────────┤
│ Prediction           │ Map                                │
│                      │                                    │
│ 84.7% probability    │      zone highlighted              │
│ 0.31–0.71 m depth    │                                    │
│ onset 14:30          │                                    │
│ peak 15:10           │                                    │
├──────────────────────┴────────────────────────────────────┤
│ WHY?                                                      │
│ Rainfall 41% | Tide 29% | Elevation 19% | Drainage 11%  │
├───────────────────────────────────────────────────────────┤
│ IMPACT                                                    │
│ Buildings   Roads   Facilities   Population               │
├───────────────────────────────────────────────────────────┤
│ RESPONSE PRIORITY                                         │
│ Priority #1                                               │
│ Recommended actions...                                    │
└───────────────────────────────────────────────────────────┘
```

---

# 14. Prediction Card

The prediction card should be the visual anchor of zone detail.

Display:

### Flood probability

`84.7%`

### Expected depth

`0.31–0.71 m`

### Predicted onset

`14:30`

### Predicted peak

`15:10`

### Severity

`HIGH`

Add a small label:

`Model v1.2 • Updated 14:26`

Do not use confidence scores unless the backend defines what they mean.

---

# 15. Explainability / "Why?" Panel

This is one of the most important product differentiators.

Heading:

**Why is this zone at high risk?**

Show a horizontal contribution chart.

Example:

```text
Rainfall     ████████████████████  41%
Tide         ██████████████        29%
Elevation    █████████             19%
Drainage     █████                 11%
```

Then translate it into plain language:

> Heavy rainfall combined with a high tide is increasing flood risk in this low-lying zone. Limited drainage further increases expected water accumulation.

The explanation should be readable by a non-ML expert.

Avoid:

- raw SHAP values without context
- technical model jargon
- long AI-generated paragraphs

---

# 16. Environmental Conditions

Display relevant drivers:

```text
RAIN
41 mm / 3 hr
↑ Heavy

TIDE
2.8 m
↑ High

ELEVATION
2.1 m avg
↓ Low

DRAINAGE
Limited
```

Use small trend indicators where meaningful.

---

# 17. Impact Panel

Impact should answer:

**What happens if this prediction is correct?**

Cards:

### Buildings

`1,284`

affected / exposed

### Roads

`8.4 km`

potentially affected

### Critical facilities

`3`

at risk

### Population

`4,820`

estimated exposed

Every impact number should be clearly labeled as:

- predicted
- affected
- exposed
- estimated

Do not imply exact census accuracy if the source is an estimate.

---

# 18. Critical Facilities

Use facility icons and types.

Examples:

- Hospital
- Fire station
- Police station
- School
- Shelter
- Power infrastructure

Facility card:

```text
City Hospital

CRITICAL

0.4–0.7 m expected depth
Estimated onset 14:40

Route status
Potentially affected
```

---

# 19. Response Priority

This is the action layer.

Heading:

**Response Priority**

Rank zones.

Example:

```text
#1  Zone B       CRITICAL
    High probability
    4,820 people
    3 critical facilities

    Why:
    High rainfall + high tide + low elevation

    Suggested actions:
    • Check City Hospital access
    • Prepare evacuation route
    • Position response team nearby
```

The interface should make it obvious:

**why this zone is ranked first**

Do not let the LLM arbitrarily determine priority.

Priority should come from deterministic/backend decision logic.

The LLM can explain the ranking.

---

# 20. Alerts

Alert screen should prioritize active events.

Example:

```text
ACTIVE ALERTS

CRITICAL
Zone B
Flood onset expected in 15 minutes
3 critical facilities potentially affected

HIGH
Zone F
Flood probability increased to 72%

WATCH
Zone C
Conditions deteriorating
```

Each alert should have:

- severity
- location
- time
- reason
- recommended next action

Avoid excessive notification noise.

---

# 21. Scenario Simulator

The scenario screen lets responders test:

**What if rainfall or tide gets worse?**

Controls:

```text
Rainfall
────────────●────────
+20%

Tide
────────●────────────
+10 cm

[ Run Scenario ]
```

After execution:

```text
BASELINE                 SCENARIO

Probability              Probability
84.7%                     91.2%

Depth                    Depth
0.31–0.71 m              0.42–0.86 m

Onset                    Onset
14:30                     14:20
```

Clearly label scenario outputs.

Use:

`SIMULATION`

rather than:

`LIVE`

for scenario results.

---

# 22. Citizen Mobile App

The citizen experience should be dramatically simpler than the responder dashboard.

Primary goal:

**Tell me if I am at risk and what I should do.**

Do not expose:

- SHAP values
- model metrics
- complex timelines
- technical probability explanations
- responder priorities

---

# 23. Citizen Home

Mobile viewport:

`390 × 844`

Example:

```text
┌──────────────────────────────┐
│ CoastShield          🔔      │
│                              │
│ Your area                    │
│ Surathkal                    │
│                              │
│        HIGH RISK             │
│                              │
│ Flooding possible            │
│ in your area                 │
│                              │
│ Expected: 14:30              │
│ Peak: 15:10                  │
│                              │
│ [ View Safety Plan ]         │
│                              │
├──────────────────────────────┤
│ What you should do           │
│                              │
│ ✓ Move valuables higher      │
│ ✓ Keep phone charged         │
│ ✓ Avoid flooded roads        │
│                              │
├──────────────────────────────┤
│ Nearby                        │
│ Shelter    Hospital    Route │
└──────────────────────────────┘
```

---

# 24. Citizen Risk Card

The primary card should contain:

- location
- severity
- expected timing
- expected depth range if useful
- simple action

Example:

**HIGH RISK**

> Flooding may affect your area around 14:30.

`Peak conditions expected around 15:10.`

CTA:

**View Safety Plan**

---

# 25. Citizen Safety Plan

The safety plan should be checklist-based.

Example:

```text
YOUR SAFETY PLAN

Before flooding
✓ Charge your phone
✓ Move valuables above floor level
✓ Prepare essential medicines
✓ Keep emergency contacts ready

During flooding
→ Avoid walking or driving through floodwater
→ Move to higher ground if instructed
→ Follow official evacuation notices

Emergency
[ Call emergency services ]
[ Find nearest shelter ]
```

Keep language short.

---

# 26. Citizen Map

The citizen map should show only useful information:

- current location
- flood risk
- shelters
- hospitals
- safe/unsafe roads where available

Do not expose the complex responder map.

---

# 27. Notification Design

Push notifications should be short and action-oriented.

Example:

**CoastShield Alert**

> High flood risk detected near your area. Flooding may begin around 14:30. Avoid low-lying roads and prepare to move to higher ground if advised.

CTA:

**View Safety Plan**

Critical alerts should not rely only on color.

---

# 28. Component System

Build reusable components.

Responder:

```text
AppShell
Sidebar
TopHeader
KpiCard
RiskBadge
RiskLegend
FloodMap
MapControls
ZoneTooltip
ZoneDrawer
PredictionCard
Timeline
WhyPanel
ContributionChart
EnvironmentalCard
ImpactCard
FacilityCard
PriorityList
AlertCard
ScenarioPanel
```

Citizen:

```text
MobileShell
RiskHero
SafetyChecklist
AlertCard
NearbyPlaceCard
CitizenMap
EmergencyButton
NotificationPreview
```

---

# 29. Interaction Rules

## Hover

Use for:

- map tooltips
- data points
- secondary information

## Click

Use for:

- selecting zones
- opening details
- toggling layers
- changing timeline
- launching scenarios

## Drawer

Use for:

- quick zone details
- alert details
- facility details

## Full page

Use for:

- zone investigation
- scenario analysis
- larger analytical workflows

---

# 30. Responsive Behavior

## Desktop

Primary target for responder dashboard.

Use:

- persistent sidebar
- large map
- multi-column information panels

## Tablet

Collapse sidebar into icon navigation.

Stack secondary panels below map where necessary.

## Mobile

Responder dashboard should be usable but is not the primary target.

Citizen app is mobile-first.

---

# 31. Accessibility

Requirements:

- WCAG-conscious contrast
- keyboard navigation
- visible focus states
- semantic headings
- ARIA labels where required
- tooltips must not contain the only source of important information
- do not communicate severity by color alone
- buttons must have clear labels
- touch targets at least approximately 44 × 44 px

---

# 32. Motion

Motion should communicate state, not decorate.

Good:

- timeline playback
- map layer transitions
- drawer opening
- alert arrival
- subtle loading states

Avoid:

- bouncing cards
- constant map animation
- flashing critical states
- excessive hover animations

Critical alerts may use a subtle pulse, but never an aggressive flashing effect.

---

# 33. Loading States

Use skeletons for:

- map metadata
- prediction cards
- impact metrics
- priority list

Example:

```text
Flood probability
████████

Expected depth
████████████

Onset
██████
```

Map should show a clear loading state if geospatial data is still loading.

---

# 34. Empty States

Example:

**No active flood alerts**

> Conditions are currently below alert thresholds.

Do not leave empty areas unexplained.

---

# 35. Error States

Example:

**Prediction unavailable**

> The latest flood prediction could not be loaded.

Actions:

`Retry`

`View last available prediction`

Never display stale data as live.

---

# 36. Data Freshness

Where live data is shown, include:

`Updated 2 min ago`

or:

`Data timestamp: 14:26`

If data becomes stale:

`STALE DATA`

should be visually obvious.

---

# 37. Mock Data During Frontend Development

Frontend development may use mock data.

Mock values must be clearly replaceable by API data.

Recommended structure:

```text
apps/dashboard/mocks/
├── zones.ts
├── predictions.ts
├── impacts.ts
├── priorities.ts
└── alerts.ts
```

Do not hardcode model outputs directly inside UI components.

Components should consume typed objects.

---

# 38. Frontend Data Flow

Preferred:

```text
UI Component
     ↓
Hook
     ↓
lib/api.ts
     ↓
Hono API
     ↓
PostGIS / FastAPI
```

Avoid:

```text
Component
   ↓
random fetch()
   ↓
API
```

Keep API access centralized.

---

# 39. Stitch Generation Instructions

When generating screens in Stitch, preserve the following product hierarchy:

### Responder

1. Map
2. Current risk
3. Timeline
4. Priority
5. Impact
6. Explanation
7. Secondary metadata

### Citizen

1. Risk
2. Timing
3. Action
4. Safety plan
5. Nearby resources

The responder dashboard should visually resemble an emergency operations system.

The citizen app should visually resemble a trustworthy public-safety utility.

---

# 40. Stitch Prompt — Responder Overview

Use the following prompt as the starting point for generating the responder dashboard:

> Design a desktop emergency flood intelligence command center called CoastShield AI. Create a clean, modern, professional emergency-management interface at 1440x900. Use a light neutral background, white surfaces, dark navy text, subtle borders, and restrained red/orange/yellow severity colors. The central workspace must be dominated by a large interactive coastal map showing flood-risk polygons, roads, coastline, waterways, and critical facilities. Add a compact left navigation sidebar with Overview, Alerts, Zones, Critical Facilities, and Scenarios. Add a top header with CoastShield AI, the current flood event, LIVE status, and data freshness. Above or beside the map show compact KPI cards for high-risk zones, critical zones, population exposed, critical facilities, and next predicted onset. Below the map add a horizontal time slider showing current time, predicted onset, and peak. On the right side show a ranked Priority Zones list with Zone B, Zone F, and Zone C, severity labels, population exposed, and critical facilities. The design should feel like a real emergency operations center, not a generic SaaS dashboard. Avoid excessive gradients, glassmorphism, neon colors, decorative illustrations, and oversized rounded cards.

---

# 41. Stitch Prompt — Zone Detail

> Design a desktop flood-risk investigation page for CoastShield AI. Create a professional emergency response interface focused on one geographic zone called Zone B. At the top show Zone B, HIGH RISK, model version, and data freshness. Show a prominent prediction card with flood probability 84.7%, expected depth 0.31–0.71 m, onset 14:30, and peak 15:10. Place a large geographic map beside the prediction card with Zone B highlighted. Below, create a prominent "Why is this zone at high risk?" explainability panel with a horizontal contribution chart showing Rainfall 41%, Tide 29%, Elevation 19%, and Drainage 11%, followed by a concise plain-language explanation. Add environmental condition cards for rainfall, tide, elevation, and drainage. Add impact cards for buildings, roads, critical facilities, and estimated population exposed. Finish with a Response Priority section showing why Zone B is ranked first and a concise list of suggested responder actions. Use a clean white and light-gray interface with dark navy typography, restrained orange/red risk colors, subtle borders, and minimal shadows. Avoid futuristic AI visuals.

---

# 42. Stitch Prompt — Citizen Home

> Design a mobile public-safety flood alert app called CoastShield. Create a trustworthy, extremely simple mobile interface for a resident whose area is currently at HIGH RISK. Use a clean white background, dark navy text, subtle blue/teal accents, and restrained orange/red severity indicators. At the top show CoastShield and a notification icon. The main content should prominently show the user's area, HIGH RISK status, a short statement that flooding may affect the area around 14:30, and expected peak around 15:10. Add a primary "View Safety Plan" button. Below, show a simple checklist of actions such as charging the phone, moving valuables higher, avoiding flooded roads, and following official instructions. Add a small nearby resources section for shelters, hospitals, and safe routes. The interface should feel calm, trustworthy, accessible, and designed for someone under stress. Do not show SHAP, model metrics, technical AI language, or responder-only information.

---

# 43. Stitch Prompt — Alerts

> Design a CoastShield AI emergency flood alerts page for a desktop command center. Use a professional light emergency-management interface with a left navigation sidebar and compact top header. The main content should contain an "Active Alerts" heading and a vertically ranked list of alert cards. Each card should clearly show severity, location, timing, reason, affected assets, and recommended next action. Include one CRITICAL alert for Zone B with flood onset expected in 15 minutes, one HIGH alert for Zone F where probability has increased, and one WATCH alert for Zone C with deteriorating conditions. Use restrained red, orange, and yellow severity accents, but also include text labels and icons. Add filtering controls for severity, zone, and time. Avoid flashy notifications or excessive animation.

---

# 44. Stitch Prompt — Scenario Simulator

> Design a CoastShield AI flood scenario simulator for emergency responders. Create a desktop professional geospatial analytics interface. Show a large map on the left and a scenario control panel on the right. The panel should contain sliders for rainfall and tide adjustments, a prominent "Run Scenario" button, and a clearly marked SIMULATION badge. Below the controls show a baseline-versus-scenario comparison for flood probability, expected depth, and onset time. Example baseline: 84.7% probability, 0.31–0.71 m depth, onset 14:30. Example scenario: 91.2% probability, 0.42–0.86 m depth, onset 14:20. Use clear typography, restrained colors, subtle borders, and strong data hierarchy. Make it visually obvious that scenario results are simulated and not live observations.

---

# 45. Final Design Rule

Every screen should answer the appropriate operational question:

**Overview**

> What is happening?

**Map**

> Where is it happening?

**Timeline**

> When will it happen?

**Prediction**

> How bad could it be?

**Why**

> Why does the system believe this?

**Impact**

> Who and what could be affected?

**Priority**

> What needs attention first?

**Scenario**

> What happens if conditions change?

**Citizen**

> Am I at risk, and what should I do?

The interface succeeds when a responder can move from:

**Forecast → Impact → Explain → Prioritize → Act**

without having to interpret the underlying machine-learning system themselves.
