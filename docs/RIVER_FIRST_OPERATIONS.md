# River-first operations foundation

This repository now separates four things that must not be presented as one
forecast:

1. **Mapped waterways** — blue OSM river, stream, and canal lines loaded for a
   small map viewport.
2. **Flood extent** — red polygons supplied by a validated forecast frame or
   an explicitly labelled non-operational artifact.
3. **Jurisdictions** — team responsibility boundaries, which are separate from
   hydrological basins.
4. **Scenarios** — private requests that must be executed by an approved
   background runner; they do not update the official forecast or create alerts.

## Laptop-safe defaults

No local SFINCS/Docker run is started by the dashboard, hourly runner, or
operations scenario endpoint by default. This is intentional: the current
Mangaluru template is not an India-wide model and a hydrodynamic solver can
consume enough CPU/RAM to make a laptop unusable.

The following are disabled unless explicitly enabled on a bounded background
machine:

```text
ENABLE_SFINCS_LOCAL_RUNNER=true
```

Before enabling it, apply a job queue, one concurrent run, a memory/CPU limit,
and a real terrain/forcing configuration. The current template remains a
Mangaluru-only, non-operational scenario artifact.

## River map API

Mounting is already wired at `/api/v1/rivers`.

```text
GET /api/v1/rivers/config
GET /api/v1/rivers?bbox=west,south,east,north&zoom=10
```

The viewport endpoint performs one bounded Overpass request for OSM waterways
(`river`, `stream`, `canal`). It enforces zoom/span/area, response-size,
feature-count, timeout, cache, and one-in-flight limits. It returns mapped
geometry only; it does not estimate flow, depth, or flood extent. If the OSM
request fails, the API returns `503` rather than drawing a fake fallback.

For national display, configure a real vector-tile dataset and its source layer:

```text
RIVER_VECTOR_TILE_URL=https://tiles.example/{z}/{x}/{y}.pbf
RIVER_VECTOR_SOURCE_LAYER=waterways
RIVER_ATTRIBUTION="Dataset attribution"
```

The API does not guess a source layer or claim national coverage when these are
missing. Without vector tiles, the dashboard asks for a sufficiently zoomed
viewport and clearly labels OSM lines as mapped waterways, not modelled water.

## Operations API

Mounting is already wired at `/api/v1/operations`.

```text
GET  /context
GET  /jurisdictions
GET  /forecasts/latest
POST /forecasts
POST /jurisdictions
GET  /alerts
POST /alerts/:id/acknowledge
POST /scenarios
```

The public context contains an approximate, unverified Mangaluru pilot
boundary. It is never used for operational alerts. To enable persisted
publication and alert reads, configure a local data directory:

```text
OPERATIONS_DATA_DIR=/absolute/path/outside-public-web-root
OPERATIONS_AUTH_TOKEN=<server-managed-token>
OPERATIONS_AUTH_USER_JSON=<server-managed-user-json>
OPERATIONS_PUBLISHER_TOKEN=<server-managed-publisher-token>
```

Do not commit these values. The local repository is single-process storage with
an atomic snapshot and lock; use PostGIS/shared durable storage before running
multiple API instances.

Official forecast publication requires validated provenance, fresh inputs, a
maximum six-hour horizon, ordered frames, and polygon flood extents. A verified
jurisdiction geometry is required before high/critical alerts can be produced.
Alerts are intersected with that geometry and scoped to the authenticated
team's jurisdiction membership.

`POST /scenarios` currently returns `503` in laptop-safe mode. This is a safe
incomplete state: no phantom job, result, notification, or fabricated impact
numbers is created.

## What is implemented versus not yet claimed

Implemented now:

- India map view with separate blue mapped-waterway and red supplied-flood
  layers.
- Bounded OSM viewport river mapping with optional vector-tile configuration.
- Honest unavailable state when no validated operational forecast exists.
- Server-side publisher/authentication checks.
- Verified-boundary intersection and scoped alert acknowledgement logic.
- Six-hour input limit and explicit laptop-safe solver guard.

Not claimed yet:

- National hydraulic prediction.
- Upstream catchment discharge forecasting.
- Verified Indian administrative boundaries.
- Reservoir/lake storage and release modelling.
- Automatic emergency notifications from live data.

The next scientific step is to load licensed basin/catchment data, verified
gauge and rainfall inputs, real DEMs, and calibrated model artifacts into a
single bounded basin worker. The national map can then display its published
frames without running a national solver in the browser.
