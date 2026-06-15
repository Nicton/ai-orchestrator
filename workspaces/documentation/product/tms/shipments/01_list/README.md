---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632782946
source_type: confluence
---
# Shipments List Page

## Overview

The Shipments List page is the primary TMS shipment tracking view. It displays a paginated, sortable table of all shipments the current user has access to, with rich filter capabilities and inline actions for confirming departure/arrival. The same controller (`ShipmentsCtrl`) powers three distinct page variants distinguished by the `scope` URL parameter: the main tracking list, a POD (Proof of Delivery) requests list, and an air/sea shipments list.

---

## URL & Entry Points

- **Primary URL**: `/shipments` — route state `all shipments`
- **Air/Sea variant**: `/air-sea-shipments` — route state `air sea shipments`
- **POD Requests variant**: `/pod-requests` — route state (uses `SCOPE_POD_REQUESTS`)

### Smart-list URL Params

These query parameters, when present on the URL at page load, bypass user-settings redirects and activate special filter modes. They are read from `$stateParams` in the controller and mapped to backend query params via `buildAdditionalParams()`.

| URL param | Value | Effect / Backend param sent |
|---|---|---|
| `isNotConfirmed=departure` | `"departure"` | Sets `isDeparturesNotConfirmed=true`; also sorts by `departureDate DESC` on load |
| `isNotConfirmed=arrival` | `"arrival"` | Sets `isDeliveriesNotConfirmed=true`; also sorts by `arrivalDate DESC` on load |
| `tpIncident` | any truthy value | Sets `isTpIncident=<value>`; enables the Incidents column; changes export to use `TrackingPoints.exportTrackingPointByShipmentsToExcel` |
| `isTpDelayed` | any truthy value | Sets `isTpDelayed=<value>`; filters shipments with tracking points where `planned_date < real_date` |
| `withoutPod` | any truthy value | Sets `withoutPod=<value>`; filters shipments missing a POD attachment |

---

## Route & Controller

- **Route state**: `all shipments`
- **Controller**: `ShipmentsCtrl` (ES6 class-style constructor function)
- **Template**: `public/app/shipments/views/index.html`

---

## Scope Variants

The controller reads `($state.params || {}).scope` at construction time to determine which variant is active.

### `SCOPE_TRACKING` (default — main list)

- Value: `"tracking"` (imported from `../../helper/scopes`)
- `this.isPodRequests = false`, `this.isAirSeaShipments = false`
- Uses `ShipmentsFilter` service for filter persistence
- Status dropdown uses `ShipmentStatuses.getStatuses()` — full set of shipment statuses
- Modes dropdown includes all allowed account modes
- Backend query sends `tracking: true`

### `SCOPE_POD_REQUESTS`

- Value: `"pod_requests"`
- `this.isPodRequests = true`
- Uses `PodRequestsFilter` service for filter persistence (separate localStorage key)
- Status dropdown switches to `ShipmentStatuses.getPodStatuses()` — POD-specific statuses (`expected`, `loaded`, `approved`, `declined`, `pending`)
- Backend query sends `isPodRequests: true`
- Backend additionally constrains results to shipments with `eta` ≤ end of today (in user timezone) and `canceler_id IS NULL`
- Row click opens `ModalViewAttachments` instead of navigating to shipment detail

### `SCOPE_AIR_SEA_SHIPMENTS`

- Value: `"air_sea_shipments"`
- `this.isAirSeaShipments = true`
- Uses `ShipmentsFilter` service for filter persistence
- Modes dropdown is filtered to only show Air (`MODE_ID_AIR`) and Sea (`MODE_ID_SEA`) modes
- Backend query sends `isAirSeaShipments: true`
- Backend joins `ShipmentTransitDetail` and surfaces additional transit fields (ETD, ETA ports, container info) — handled by `addTransitDetailsPartToQuery()`

---

## Resolve Dependencies

These are injected into the controller constructor as pre-resolved data (loaded before the page renders).

| Injected Key | Source Service | What It Loads | When Skipped |
|---|---|---|---|
| `dataLocationsUserDefault` | `FilterStorage` / user settings | Default departure/arrival location IDs for the current user | Never; may be empty array |
| `dataShippers` | Backend — shipper directory | List of shipper-division records the carrier account has access to | Only populated for Carrier accounts |
| `dataTags` | Backend — tags API | All tags the account has defined | Never; may be empty |
| `dataShipmentModes` | Backend — modes dictionary | Full list of shipment mode definitions (road, air, sea, groupage, etc.) | Never |
| `dataExternalAccounts` | Backend — connected accounts | External shipper accounts linked via spectator connections | Never; may be empty |
| `dataBookers` | Backend — users | Users who can book shipments for this account | Never; may be empty |
| `dataAccountingEntities` | Backend — accounting entities | Accounting entity definitions for the account | Never; may be empty |
| `dataMetadataPrototypes` | Backend — metadata | Metadata prototype definitions used for "Missing Data" filter | Never; may be empty |
| `dataAccountAttachmentTypes` | Backend — attachment types | Attachment type definitions used for "Missing Doc" filter | Never; may be empty |
| `dataDictTransitCompanies` | Backend — dictionaries | Transit company records (used in Air/Sea filter) | Never; may be empty |
| `dataAccountIncidents` | Backend — incidents | Incident type definitions for the account (used for Incidents filter) | Never; may be empty |

---

## Page-Level Permissions

### `permissionsControl.accessTracking()`

This is evaluated in the route resolve (not shown in controller source but referenced in domain map). If the user does not have access to the tracking module, they are redirected away from the page before the controller is instantiated.

### `permissionsControl.accessManageAdvancedFilters()`

Stored as `ctrl.allowManageAdvancedFilters`. Controls whether the advanced filter panel and filter-button component are rendered. If `false`:
- The `<advanced-filters>` panel component is hidden (`ng-if="ctrl.showAdvancedFilters && ctrl.allowManageAdvancedFilters"`)
- The `<filter-button>` component is hidden (`ng-if="ctrl.allowManageAdvancedFilters"`)
- Simple filter bar is always shown regardless

### `ctrl.isVisibilityAccount`

Computed as: for a Shipper account, `true` when the account has neither `accessTmsSpectatorProducts` nor `accessDockLightProducts`; for a Carrier account, `true` when `Global.isVisibilityAccount()` returns true. Visibility accounts cannot confirm departure or arrival (the check buttons are hidden with `ng-if="!ctrl.isVisibilityAccount"`).

### `ctrl.canBook`

Set from `Global.canBook()`. When `true`, the page-toggle component (`<shipment-page-toggle>`) is rendered, allowing the user to switch between List / Board views.

### Export Button Visibility

The export button is shown when: `ctrl.isShipper || (ctrl.isCarrier && !ctrl.search.history)`. Carriers cannot export historical shipments.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_list`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632782946 · **repo:** `tms/shipments/01_list/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

