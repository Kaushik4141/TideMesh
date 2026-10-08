# TideMesh
## Product Context & Development Brief

> **Purpose:** This file is the canonical product context for the codebase.  
> Any developer or AI coding agent working in this repository should read this file before making product, UX, architecture, or feature decisions.

---

## 1. Product Overview

**TideMesh** is an AI-powered **coastal flood intelligence and emergency response platform**.

The product is designed to answer four practical questions:

1. **Where** will flooding happen?
2. **When** will it start and peak?
3. **What / who** will be affected?
4. **What should people and emergency teams do next?**

The product is **not just a flood prediction map**.

Its core workflow is:

> **Forecast → Impact → Explain → Prioritize → Act**

The system combines environmental, geographic, infrastructure, and historical/simulated data to produce neighborhood-level flood intelligence and convert that intelligence into actionable recommendations.

---

## 2. Problem Statement

Coastal neighborhoods can experience dangerous flooding when multiple factors interact:

- Heavy rainfall
- Rising tides
- Storm surge
- Low elevation
- Poor or saturated drainage
- Local terrain
- Land use
- Historical flood patterns

Traditional warnings often stop at broad statements such as:

> "Flood risk: High"

That is not enough for a citizen, emergency responder, or municipal authority to make a timely decision.

TideMesh should instead provide:

- Location-specific flood probability
- Expected flood onset time
- Expected peak time
- Expected flood depth / severity range
- Affected roads and buildings
- Critical infrastructure at risk
- Risk explanations
- Emergency priority ranking
- Safer response routes
- Plain-language alerts and briefings

---

## 3. Product Vision

### Vision

Build a **decision layer for coastal flooding** that transforms raw environmental signals and flood models into understandable, location-specific actions.

### Product principle

> **Prediction alone is not the product. Decision support is the product.**

The platform should always move from:

**What is happening?**

to:

**Why is it happening?**

to:

**What will happen next?**

to:

**What should we do now?**

---

## 4. Primary Users

### 4.1 Citizen / Resident

Primary question:

> **"Am I in danger, when will flooding reach me, and what should I do?"**

Citizens need a simple, low-complexity experience.

They should see:

- Their location / selected area
- Flood risk level
- Probability
- Expected onset
- Expected peak
- Expected depth range
- Roads to avoid
- Recommended safety actions
- Nearby shelter information
- Safe route when appropriate
- Personalized alerts
- AI/voice Q&A

Citizens should **not** be overloaded with model internals, charts, or technical terminology.

---

### 4.2 Emergency Responder

Examples:

- Fire and rescue teams
- Police
- Ambulance teams
- Search and rescue teams
- Municipal emergency crews

Primary question:

> **"Where should we go first, and what action should we take?"**

They need:

- Live flood-risk map
- Forecast timeline
- Flood probability and severity
- Affected roads
- Affected buildings
- Critical facilities
- Exposed population estimates
- Priority ranking
- Recommended actions
- Safe emergency routing
- Risk explanations
- Incident briefings

This is the most operationally important user role.

---

### 4.3 Municipal / Disaster Management Officer

Examples:

- Municipal authorities
- District disaster-management teams
- Emergency operations centers
- Coastal administration

Primary question:

> **"How bad is the situation across my area, and where should resources be allocated?"**

They need:

- Regional / ward overview
- Risk distribution
- Population exposure
- Infrastructure exposure
- Critical facilities at risk
- Road accessibility
- Resource requirements
- Response team allocation
- Historical trends
- Incident summaries
- Scenario comparison

---

### 4.4 System / Data Operator

Internal/admin role.

Primary question:

> **"Can I trust the system and its data right now?"**

They need:

- Data-source health
- Data freshness
- Sensor/API status
- Model status
- Forecast confidence
- Missing-data detection
- Simulation status
- Error monitoring

This role is secondary for the hackathon demo but important in the architecture.

---

## 5. User Experience Philosophy

### For citizens

**Simple + conversational + safety focused**

The interface should answer:

> "What does this mean for me?"

### For responders

**Operational + map-first + action focused**

The interface should answer:

> "Where should I act first?"

### For authorities

**Strategic + analytical + resource focused**

The interface should answer:

> "How should I coordinate the response?"

### General UX rules

- Avoid unnecessary technical jargon.
- Prioritize location and time.
- Make risk understandable in seconds.
- Every prediction should have an explanation.
- Every high-risk condition should lead to a recommended action.
- Prefer ranges and uncertainty over false precision.
- Keep maps, timeline, alerts, and actions connected.
- Do not bury urgent information under analytics.

---

# 6. Core Product Flow

```text
LIVE DATA
   ↓
DATA FUSION
   ↓
COMPOUND FLOOD MODEL
   ↓
FLOOD FORECAST
   ↓
IMPACT ANALYSIS
   ↓
EXPLAINABILITY
   ↓
RESPONSE PRIORITIZATION
   ↓
ALERTS + ROUTING + RECOMMENDATIONS
   ↓
USER ACTION
```

### End-to-end scenario

1. Weather/rainfall conditions change.
2. Tide and coastal conditions are updated.
3. The system combines environmental + geospatial signals.
4. Flood probability is estimated for local zones.
5. Onset, peak time, depth and severity are estimated.
6. Flood extent is mapped.
7. Roads, buildings and critical facilities are intersected with predicted inundation.
8. Exposed population and infrastructure are estimated.
9. The system explains the main risk drivers.
10. Zones are ranked by emergency priority.
11. Citizens receive location-specific alerts.
12. Responders receive recommended actions and safer routes.
13. Municipal users see the regional situation and resource needs.

---

# 7. Core Product Features

## 7.1 Flood Prediction

For each local zone, the system should estimate:

- Flood probability
- Severity / risk level
- Expected onset time
- Expected peak time
- Expected depth
- Confidence / uncertainty

Example:

```text
Zone B
Risk: HIGH
Probability: 87%
Onset: 2:38 PM
Peak: 4:10 PM
Expected depth: 0.45–0.80 m
Confidence: 82%
```

Do not present predictions as absolute certainty.

---

## 7.2 Compound Flood Intelligence

The model should consider interactions between multiple signals.

Example:

```text
Heavy Rainfall
      +
High Tide
      +
Storm Surge
      +
Low Elevation
      +
Drainage Saturation
      ↓
Higher Flood Risk
```

The product should communicate that combined conditions can create greater risk than any single factor alone.

---

## 7.3 Dynamic Flood Map

The map is one of the primary product surfaces.

It should support:

- Flood-risk zones
- Predicted inundation extent
- Flood depth
- Roads
- Buildings
- Hospitals
- Shelters
- Other critical facilities
- Response-team locations where applicable

The flood layer should be able to change over time as the forecast timeline moves.

---

## 7.4 Flood Timeline / Digital Twin View

The user should be able to move through a forecast timeline.

Example:

```text
2:00 PM
  ↓
2:38 PM  Flood begins
  ↓
3:15 PM  Road R12 affected
  ↓
3:40 PM  Residential area impacted
  ↓
4:10 PM  Flood peak
  ↓
5:30 PM  Water receding
```

The map and affected assets should update with the selected time.

---

## 7.5 Impact Intelligence

For every affected zone, estimate:

- Buildings affected
- Roads affected
- Critical facilities affected
- Population exposed
- Accessibility changes

Example:

```text
Zone B
Population exposed: ~3,200
Buildings affected: 124
Roads affected: 4
Critical facilities: 1
```

The exact numbers may initially be simulated for the hackathon if real local data is unavailable.

---

## 7.6 Explainability

Every risk prediction should have a "Why?" explanation.

Example:

```text
WHY IS ZONE B AT HIGH RISK?

Heavy rainfall        41%
High tide             29%
Low elevation         19%
Drainage saturation   11%
```

The technical implementation can use feature-importance or SHAP-style explanations.

The user-facing explanation should be plain language.

Example:

> Heavy rainfall is increasing surface runoff while the high tide reduces drainage outflow. The area's low elevation increases expected water accumulation.

---

## 7.7 Emergency Priority Engine

The system should rank affected zones based on more than flood probability.

A conceptual priority score is:

```text
Flood Risk
×
Population Exposure
×
Infrastructure Criticality
×
Accessibility
×
Vulnerability
=
Response Priority
```

Example:

```text
#1 Zone B — CRITICAL
#2 Zone D — HIGH
#3 Zone A — HIGH
```

This answers the operational question:

> **"Where should emergency teams act first?"**

---

## 7.8 Emergency Actions

For a high-priority zone, generate recommended actions.

Example:

```text
ZONE B — RECOMMENDED ACTIONS

1. Deploy Rescue Team A
2. Secure Road R12
3. Check Hospital H1 access
4. Prepare Shelter S2
5. Issue resident warning
```

Recommendations should be clearly labelled as AI-generated decision support and should not pretend to replace official emergency command.

---

## 7.9 Safe Emergency Routing

The routing engine should consider predicted flooding.

Do not optimize only for shortest distance.

Instead use:

> **Safest practical route under predicted flood conditions**

Example:

```text
Fire Station
     ↓
Road C    SAFE
     ↓
Road F    SAFE
     ↓
Zone B
```

Avoid roads expected to exceed an accessibility threshold.

Example:

```text
Road R12
Predicted depth: 0.65 m
Vehicle accessibility: LOW
```

---

## 7.10 Citizen Alerts

Alerts should be location-specific and action-oriented.

Example:

```text
🚨 FLOOD ALERT

Zone B

Flooding may begin in ~35 minutes.

Probability: 87%
Expected depth: 0.45–0.80 m

Avoid:
• Road R12
• Road R18

Recommended:
Prepare for evacuation and move valuables above floor level.

[ View Safe Route ]
```

Avoid sending generic alerts when the system can provide localized guidance.

---

## 7.11 AI / Voice Assistant

Users may ask natural-language questions such as:

> "Will the water reach my house?"

> "Which road should I avoid?"

> "When will the flood peak?"

> "Where is the nearest safe shelter?"

> "Why is my area high risk?"

The AI assistant should answer from structured product data and model outputs.

### Important rule

The LLM should **not invent or directly predict the flood**.

Use deterministic/model outputs for:

- risk
- timing
- depth
- affected assets
- route decisions

Use the LLM primarily for:

- natural-language interaction
- summarization
- explanation
- incident briefings
- translation / voice interaction

---

# 8. Main User Flows

## 8.1 Citizen Flow

```text
Open app
  ↓
Use location / choose location
  ↓
See current flood risk
  ↓
See onset + peak + depth
  ↓
View forecast timeline
  ↓
View affected roads / shelters
  ↓
Read recommended safety action
  ↓
Receive alerts
  ↓
Ask AI questions
  ↓
Use safe route when relevant
```

### Citizen Home Screen

Should prioritize:

1. Current location
2. Risk level
3. Time to expected onset
4. Expected severity
5. What to do now

---

## 8.2 Responder Flow

```text
Login
  ↓
Command Center
  ↓
Live flood map
  ↓
View active/high-risk zones
  ↓
Select a zone
  ↓
Inspect probability + timing + depth
  ↓
View affected roads/buildings/facilities
  ↓
Click "Why?"
  ↓
View risk drivers
  ↓
View response priority
  ↓
View recommended actions
  ↓
Deploy team
  ↓
Generate safest route
  ↓
Read incident briefing
```

---

## 8.3 Municipal Flow

```text
Login
  ↓
Regional dashboard
  ↓
View overall flood status
  ↓
Select ward / zone
  ↓
Inspect population + infrastructure exposure
  ↓
View critical facilities at risk
  ↓
View response priorities
  ↓
Assess resource requirements
  ↓
Allocate teams / resources
  ↓
Monitor evolving situation
```

---

## 8.4 Data Operator Flow

```text
Login
  ↓
System health
  ↓
Check data feeds
  ↓
Check freshness
  ↓
Check model status
  ↓
Investigate anomalies
  ↓
Review prediction confidence
```

---

# 9. Dashboard Structure

## Citizen Dashboard

```text
+------------------------------------------------+
| TIDEMESH                                       |
|                                                |
| 📍 Zone B                                      |
|                                                |
| 🔴 HIGH FLOOD RISK                             |
| 87% probability                                |
|                                                |
| Onset: 2:38 PM                                |
| Peak: 4:10 PM                                  |
| Depth: 0.45–0.80 m                             |
|                                                |
| WHAT SHOULD YOU DO?                            |
| Avoid Road R12                                 |
| Prepare for possible evacuation                |
|                                                |
| [ View Forecast ] [ Safe Route ] [ Ask AI ]   |
+------------------------------------------------+
```

---

## Responder Command Center

```text
+------------------------------------------------+
| TIDEMESH COMMAND CENTER                ● LIVE  |
+-------------------------------+----------------+
|                               | PRIORITY       |
|         LIVE FLOOD MAP        |                |
|                               | #1 Zone B 🔴  |
|    🔴 Zone B                  | #2 Zone D 🟠  |
|       🟠 Zone D               | #3 Zone A 🟡  |
|                               |                |
| Hospitals / Roads / Shelters  | [View Action] |
+-------------------------------+----------------+
| Forecast Timeline                              |
| 2PM ── 3PM ── 4PM ── 5PM ── 6PM              |
+-----------------------------------------------+
```

---

## Municipal Dashboard

```text
CITY FLOOD STATUS

Safe zones:        18
Moderate:           7
High risk:          4
Critical:           2

Population at risk: 12,480
Roads affected:       18
Critical facilities:   6
Active teams:           9
```

---

# 10. Data Inputs

The system may consume:

### Environmental

- Rainfall observations
- Rainfall forecasts
- Weather radar data
- Tide levels
- Storm surge / coastal water-level information
- Wave information where available

### Geospatial

- Digital elevation model
- Terrain / slope
- Drainage network
- Land use / land cover
- Coastline
- Rivers / channels
- Roads
- Buildings
- Critical facilities

### Historical / training

- Historical flood events
- Historical rainfall
- Historical tide
- Simulated flood events
- Past inundation maps

### Operational

- Road closures
- Rescue-team locations
- Shelter availability
- Hospital accessibility
- Sensor/API health

---

# 11. Suggested Technical Architecture

The architecture should remain modular so individual model/data components can be replaced.

```text
                    DATA SOURCES
                         |
              +----------+----------+
              |                     |
         Environmental          Geospatial
              |                     |
              +----------+----------+
                         |
                   DATA PIPELINE
                         |
                +--------+--------+
                |                 |
          Flood Simulation     ML Models
                |                 |
                +--------+--------+
                         |
                  FLOOD ENGINE
                         |
       +-----------------+------------------+
       |                 |                  |
   Prediction        Impact Engine     Explainability
       |                 |                  |
       +-----------------+------------------+
                         |
                  DECISION ENGINE
                         |
        +----------------+----------------+
        |                |                |
      Alerts          Routing        Priorities
        |                |                |
        +----------------+----------------+
                         |
                     API LAYER
                         |
        +----------------+----------------+
        |                |                |
     Citizen         Responder        Municipality
       App            Dashboard         Dashboard
```

---

# 12. Recommended Modeling Strategy

A **hybrid approach** is preferred.

## Flood simulation

Where feasible, use a physical/hydrodynamic or simplified inundation simulation to estimate water extent/depth.

A tool such as **SFINCS** can be considered for rapid flood simulation and compound flooding scenarios.

## Machine learning

Use ML for tasks such as:

- Flood probability
- Risk classification
- Onset prediction
- Peak-time prediction
- Severity/depth estimation

Potential models:

- XGBoost
- LightGBM
- CatBoost
- Random Forest
- Temporal models where justified

Start with simpler, interpretable models before using complex deep learning.

---

# 13. Explainability Strategy

Model predictions must be auditable.

Use:

- SHAP
- Feature importance
- Input comparison against normal conditions
- Prediction confidence / uncertainty

Example:

```text
Current vs normal

Rainfall: +42%
Tide: +0.35 m
Drainage utilization: 78%
Elevation: Low
```

Then:

```text
Top risk drivers

1. Rainfall
2. Tide
3. Elevation
4. Drainage
```

---

# 14. Scenario Simulation

A major product feature is the ability to ask:

> **"What happens if conditions change?"**

Example controls:

```text
Rainfall      [ 85 mm ]
Tide          [ +0.35 m ]
Storm surge   [ +0.80 m ]
```

The user can modify a variable and re-run the scenario.

Possible outputs:

- Flooded area change
- Risk change
- New affected roads
- New affected buildings
- Changed emergency priority

This should be presented as a scenario/simulation, not as a guaranteed future outcome.

---

# 15. Uncertainty

Never communicate false precision.

Prefer:

```text
Flood depth: 0.45–0.80 m
Peak time: around 4:10 PM ± uncertainty
Probability: 87%
Confidence: 82%
```

rather than pretending the system knows an exact value with certainty.

---

# 16. Critical Product Objects

The codebase will likely need domain objects similar to:

### User

```text
id
name
role
location
notificationPreferences
```

### Zone

```text
id
name
geometry
elevation
risk
```

### FloodPrediction

```text
zoneId
probability
severity
onsetTime
peakTime
depthRange
confidence
drivers[]
timestamp
```

### Impact

```text
zoneId
affectedBuildings
affectedRoads
criticalFacilities
populationExposed
```

### Alert

```text
type
severity
zoneId
message
recommendedActions[]
createdAt
```

### ResponsePriority

```text
zoneId
score
rank
reason
recommendedActions[]
```

### Route

```text
origin
destination
segments[]
riskScore
travelTime
accessibility
```

---

# 17. Demo Scenario

The hackathon demo should tell a single continuous story.

### Scenario

A coastal neighborhood is experiencing:

- Heavy rainfall
- Rising tide
- Coastal surge
- Saturated drainage
- Low-lying terrain

### Demo sequence

```text
2:00 PM
Incoming environmental data
        ↓
AI detects increasing compound risk
        ↓
Zone B reaches HIGH risk
        ↓
Prediction:
87% probability
Onset 2:38 PM
Peak 4:10 PM
        ↓
Map begins showing predicted inundation
        ↓
Roads/buildings become affected
        ↓
Hospital access becomes threatened
        ↓
Zone B becomes Priority #1
        ↓
Responder receives action list
        ↓
Safest emergency route is generated
        ↓
Citizen in Zone B receives localized alert
        ↓
AI generates incident briefing
```

This should feel like a real incident unfolding rather than a collection of disconnected screens.

---

# 18. Product Differentiation

TideMesh should differentiate itself through the combination of:

### 1. Compound flood modeling

Rainfall + tide + surge + terrain + drainage.

### 2. Hyper-local impact intelligence

Not just "city at risk", but:

- zone
- road
- building
- facility

### 3. Explainable predictions

Show **why** a location is at risk.

### 4. Time-aware forecasting

Show:

- onset
- progression
- peak
- recession

### 5. Response prioritization

Determine:

> **Who/what needs attention first?**

### 6. Safe emergency routing

Routes account for predicted flood conditions.

### 7. Multi-user experience

One intelligence platform, different experiences for:

- citizens
- responders
- authorities

---

# 19. What NOT to Build

Avoid these unless they directly support the core product:

- Generic AI chatbot with no connection to flood data
- A static map with red/green zones only
- Generic weather app functionality
- A dashboard overloaded with charts
- Pure LLM-based flood prediction
- Unexplained black-box risk scores
- "Shortest route" without flood-aware routing
- Huge national-scale scope for the hackathon

---

# 20. MVP Priority

Build in this order.

### P0 — Essential

- Interactive flood map
- Zones
- Flood probability
- Onset time
- Peak time
- Flood depth/severity
- Affected roads/buildings
- Priority ranking
- Explainability
- Responder dashboard

### P1 — Strong differentiators

- Dynamic timeline
- Scenario simulation
- Safe emergency routing
- Citizen alerts
- AI incident briefing

### P2 — Advanced

- Voice assistant
- Live sensor integration
- Shelter optimization
- Team/resource tracking
- More advanced forecasting models

---

# 21. Design Language

The product should feel like a **professional emergency intelligence platform**, not a gaming dashboard.

Preferred style:

- Clean
- High-information but uncluttered
- Map-first
- Strong hierarchy
- Clear severity states
- Accessible typography
- Minimal decorative UI
- Clear call-to-action buttons

Use severity consistently:

```text
LOW       → normal monitoring
MODERATE  → prepare
HIGH      → action required
CRITICAL  → immediate response
```

Do not rely on color alone; combine color with labels/icons/text.

---

# 22. Core Terminology

Use these product terms consistently:

- **Flood Risk** — likelihood/severity of flooding
- **Onset Time** — expected start of meaningful flooding
- **Peak Time** — expected maximum impact period
- **Flood Depth** — predicted water depth range
- **Impact Zone** — geographic area expected to be affected
- **Critical Facility** — hospital, shelter, emergency facility, etc.
- **Response Priority** — ranking of where responders should act first
- **Risk Drivers** — factors contributing to the prediction
- **Safe Route** — route selected while considering predicted flood conditions
- **Incident Brief** — plain-language summary of the current event

---

# 23. Product North Star

Every major feature should help improve one or more of these outcomes:

```text
PREDICT BETTER
      ↓
LOCALIZE BETTER
      ↓
EXPLAIN BETTER
      ↓
RESPOND FASTER
      ↓
REDUCE IMPACT
```

The final product should make a user feel:

> **"I know what is happening, I understand why, I know what will happen next, and I know what I should do."**

---

## 24. Final Product Statement

**TideMesh is a compound coastal flood intelligence platform that transforms live environmental and geospatial data into neighborhood-level predictions, impact maps, explainable risk, emergency priorities, safe routing, and actionable alerts for citizens, responders, and authorities.**

### Core promise

> **From rainfall and tide to rescue decision — in one system.**
