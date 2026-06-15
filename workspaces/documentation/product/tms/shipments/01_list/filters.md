---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632356946
source_type: confluence
---
# Shipments List — Filters

## Filter Persistence

Filters are persisted via the `FilterStorage` service under the key `shipments_filter` (for the main list and Air/Sea variant) or a separate key for POD Requests (`PodRequestsFilter`).

- On page load, `serviceFilter.restore(this.search)` rehydrates the `query` object from localStorage.
- After every successful data fetch, `serviceFilter.store(query)` writes the current state back.
- All filter values are serialized into a `filters.value` JSON string that encodes an array of "advanced filter" objects (`[{ field_name, rule, value }]`).
- Filter data is then converted back via `convertToSimpleFilters(storeAdvancedFilters)` for binding to UI controls.
- Two additional special states live outside the advanced filter array: `query.history` (boolean) and `query.toBeBooked` (boolean).

### Default Locations

If the user has configured default locations (`dataLocationsUserDefault`) and no location filters are stored, `initFiltersWithDefaultLocations()` pre-populates `departureIds` and `arrivalIds` from the user's saved defaults. These are injected into the advanced filter after the first data fetch via `applyDefaultLocationsToAdvancedFilter()`.

### URL State

Smart-list params (`isNotConfirmed`, `tpIncident`, `isTpDelayed`, `withoutPod`) are read from `$stateParams` and added to the query inside `buildAdditionalParams()` but are NOT stored in `FilterStorage` — they are ephemeral per page load.

---

## Filter Fields

### Mode (Transport Mode Toggle)

- **Type**: Multi-toggle button group (switcher)
- **Shown for**: All roles
- **Hidden for**: Never; for Air/Sea scope, only Air and Sea mode buttons are rendered
- **API param name**: Part of `filters.value` JSON — field `mode`; values are mode name strings (e.g. `"road"`, `"air"`, `"sea"`, `"groupage"`)
- **Allowed values**: All modes from `dataShipmentModes` filtered by `getAllowedAccountModes()`; Air/Sea scope restricts to `MODE_ID_AIR` and `MODE_ID_SEA` only
- **Default**: No mode selected (all modes returned)
- **Behavior**: Each toggle is independently clickable. State stored in `ctrl.search.mode` as a map `{ [mode.name]: true/false }`. Clicking any toggle calls `ctrl.apply_filter()` immediately (no debounce at this point — debounce is on `apply_filter` itself)
- **Backend handling**: Backend reads `filters.mode.value` as an array of mode name strings, maps each to an integer ID via `MODES_TO_ID`, then filters `shipment_mode_id IN (...)` or uses the `rule` operator

---

### Status

- **Type**: Multi-select dropdown (grouped)
- **Shown for**: All roles
- **Hidden for**: Never
- **API param name**: Part of `filters.value` — field `status`
- **Allowed values** (main list, both Shipper and Carrier):
  - `planned` — Planned (no slot booking, no delays)
  - `expected_pick_up` — Expected Pick-up (ETD in the past, departure not confirmed, `is_pick_up_expected=true`)
  - `slot_confirmed` — Slot Confirmed (slot-booking source, status in_transit or planned, not delayed)
  - `in_transit_estimate` — In Transit (Estimate) — `status=in_transit`, `eta < now`, `eta >= etd`
  - `in_transit` — In Transit
  - `expected_delivery` — Expected Delivery (ETA in the past, arrival not confirmed, `is_delivery_expected=true`)
  - `delivered_estimate` — Delivered (Estimate) — `rta IS NOT NULL`, `eta < now >= etd`
  - `delivered` — Delivered (`rta IS NOT NULL`)
  - `canceled` — Cancelled (`canceler_id IS NOT NULL`)
- **Allowed values** (POD Requests scope — `getPodStatuses()`):
  - `expected` — carrier pending, `allow_pod_requests=true`
  - `loaded` — POD document loaded
  - `approved` — POD approved
  - `declined` — POD declined
  - `pending` — not yet expected (`allow_pod_requests=false`); hidden for Shipper accounts
- **Default**: None selected (all statuses returned)
- **Behavior**: Multi-select grouped dropdown. Calls `ctrl.apply_filter()` on change. Status values are stored as `.selected = true/false` on each status object
- **Backend handling**: Complex compound SQL — each status value generates a specific Sequelize WHERE clause checking combinations of `rtd`, `rta`, `etd`, `eta`, `canceler_id`, `status`, `booking_source`, `is_pick_up_expected`, `is_delivery_expected`. See `buildQueryStatuses()` in `services/shipments/query.js`. For POD requests, delegates to `filterPodStatus()` which joins `Shipper` and filters by `allow_pod_requests`

---

### Carrier (Carrier Filter)

- **Type**: Multi-select dropdown with search
- **Shown for**: `ctrl.isShipper` — the current account type is SHIPPER
- **Hidden for**: Carrier and Visibility accounts (`ng-if="ctrl.isShipper"`)
- **API param name**: Part of `filters.value` — field `carrier_id`
- **Allowed values**: Loaded via `getCarriers(Carriers, storeFilters, { byShipments: true, excludeKilled: true })` — carriers associated with the shipper's shipments, excluding deactivated ones
- **Default**: None selected (all carriers)
- **Behavior**: Multi-select dropdown with search (`dd-search="true"`). Calls `ctrl.apply_filter()` on change. Selections stored as `.selected = true/false` on `ctrl.parent_carriers` array
- **Backend handling**: `injectFilterByAccountTypes()` applies `carrier_id IN (...)` when user is a shipper and `filters.carrier_id` is set

---

### Shipper (Shipper Filter)

- **Type**: Multi-select dropdown
- **Shown for**: `ctrl.isCarrier` — the current account type is CARRIER
- **Hidden for**: Shipper accounts (`ng-if="ctrl.isCarrier"`)
- **API param name**: Part of `filters.value` — field `shipper_id`
- **Allowed values**: `ctrl.parent_shippers` — built from `dataShippers`, sorted alphabetically
- **Default**: None selected (all shippers within carrier's ACL)
- **Behavior**: Multi-select dropdown. Calls `ctrl.apply_filter()` on change. After applying, the backend cross-checks the selected shipper IDs against `acl.shipper_ids` to only allow IDs that the carrier actually has access to
- **Backend handling**: `injectFilterByAccountTypes()` applies `shipper_id IN (...)` intersected with `acl.shipper_ids`

---

### External Shipper

- **Type**: Multi-select dropdown with search
- **Shown for**: Accounts that have external shipper connections (`ctrl.externalShippers.length > 0`)
- **Hidden for**: Accounts with no external connections (`ng-if="ctrl.externalShippers.length"`)
- **API param name**: Part of `filters.value` — field `externalShipperIds`
- **Allowed values**: From `dataExternalAccounts` — external shipper accounts accessed via spectator/booker connections
- **Default**: None selected
- **Behavior**: Multi-select dropdown with search. Calls `ctrl.apply_filter()` on change
- **Backend handling**: `buildFilterByExternalShippers()` cross-checks requested shipper IDs against `allowedPartnerAccounts` to ensure only actually-connected external shippers are accepted, then adds `shipper_id IN (...)` filter

---

### Booker

- **Type**: Multi-select dropdown with search
- **Shown for**: `ctrl.isShipper` — only visible for Shipper accounts
- **Hidden for**: Carrier accounts (`ng-if="ctrl.isShipper"`)
- **API param name**: Part of `filters.value` — field `bookerIds`
- **Allowed values**: `ctrl.parent_bookers` — built from `dataBookers` (users in the account), deduplicated by user ID, sorted alphabetically. A special "My bookings" entry is prepended with `value = ctrl.userId`
- **Default**: None selected (all bookers)
- **Behavior**: Multi-select dropdown with search. Calls `ctrl.apply_filter()` on change. `searchQuery.bookerIds` is extracted from `ctrl.parent_bookers` filtered where `.selected === true`
- **Backend handling**: `srInclude.where.user_id = buildFilterCondition(filters.bookerIds)` — filters by the `user_id` column on the `ShipmentRequest` join

---

### Location (Origin / Destination)

- **Type**: `<locations-period-filter>` compound component — handles address IDs, countries, zipcodes, and logistic zones for both origin (departure) and destination (arrival)
- **Shown for**: All roles
- **Hidden for**: Never (marked as optional with `p-table__filters-item--optional` class but always rendered)
- **API param names** (all carried as fields in `filters.value`):
  - `departureIds` — array of address IDs for origin
  - `departureCountries` — array of country strings for origin
  - `departureZipcodes` — array of zipcode strings for origin
  - `departureLogzones` — array of logistic zone strings for origin
  - `arrivalIds` — array of address IDs for destination
  - `arrivalCountries` — array of country strings for destination
  - `arrivalZipcodes` — array of zipcode strings for destination
  - `arrivalLogzones` — array of logistic zone strings for destination
- **Default**: Populated from `dataLocationsUserDefault` if no stored filter exists
- **Behavior**: Changing any location field triggers `ctrl.apply_filter({ actor: 'dates' })`. The `actor` parameter causes the filter to only execute if `this.filter_dates.changed` is truthy — this prevents spurious reloads on initial bind
- **Backend handling**: `filtersWhere.push({ dest_address_id: buildFilterCondition(filters.arrivalIds) })` and `filtersWhere.push({ from_address_id: buildFilterCondition(filters.departureIds) })`. Country/zipcode/logzone filters are handled by `buildAddressIncludeWhere(filters)` which adds WHERE conditions on the joined address models

---

### Departure Date

- **Type**: Date range picker (part of `<locations-period-filter>`)
- **Shown for**: All roles
- **API param name**: Part of `filters.value` — field `departureDate` — object `{ from, to }`
- **Default**: `{ from: null, to: null }`
- **Backend handling**: `buildDepartureDate(filters.departureDate)` — if both `from` and `to` are present, generates `$or: [{ rtd: between }, { rtd: null, etd: between }]`; if only `from`, generates `$or: [{ etd: null, rtd: >= from }, { rtd: >= from }]`

---

### Arrival Date

- **Type**: Date range picker (part of `<locations-period-filter>`)
- **Shown for**: All roles
- **API param name**: Part of `filters.value` — field `arrivalDate` — object `{ from, to }`
- **Default**: `{ from: null, to: null }`
- **Backend handling**: `filterByArrival(filters.arrivalDate)` — generates `$or: [{ rta: condition }, { rta: null, eta: condition }]`

---

### Creation Date

- **Type**: Date range picker (not shown in basic filter bar — available in advanced filters)
- **API param name**: Part of `filters.value` — field `creationDate` — object `{ from, to }`
- **Default**: `{ from: null, to: null }`
- **Backend handling**: `buildDateFilterCondition(filters.creationDate, 'created_at')` — direct date condition on `Shipment.created_at`

---

### ETD Date (Estimated Time of Departure — Air/Sea)

- **Type**: Date range picker
- **Shown for**: Air/Sea scope (`ctrl.isAirSeaShipments`)
- **API param name**: Part of `filters.value` — field `etdDate` — object `{ from, to }`; also `etdCountries` and `etdLocodes` arrays
- **Default**: `{ from: null, to: null }`
- **Backend handling**: Handled by `addTransitDetailsPartToQuery()` — joins `ShipmentTransitDetail` and `ShipmentTransitDetailPoint` models

---

### ETA Date (Estimated Time of Arrival — Air/Sea)

- **Type**: Date range picker
- **Shown for**: Air/Sea scope (`ctrl.isAirSeaShipments`)
- **API param name**: Part of `filters.value` — field `etaDate` — object `{ from, to }`; also `etaCountries` and `etaLocodes` arrays
- **Default**: `{ from: null, to: null }`
- **Backend handling**: Handled by `addTransitDetailsPartToQuery()`

---

### Tags

- **Type**: `<tags-filter>` multi-select color-chip picker
- **Shown for**: Accounts with at least one tag defined (`ctrl.showTagFilter` — set to `formattedTags.length`)
- **Hidden for**: Accounts with no tags (`ng-if="ctrl.showTagFilter"`)
- **API param name**: Part of `filters.value` — field `tag_list`
- **Allowed values**: Account-specific tags from `dataTags`, each with `id`, `description`, `color`
- **Default**: None selected
- **Behavior**: Multi-select. Calls `ctrl.apply_filter()` on change. Tags are formatted into a grouped structure `ctrl.tag_list = [{ tags: [...], type: 'circle' }]`
- **Backend handling**: `filterByAccountingTags(filters.tag_list, account_id)` — complex query joining both `ShipmentTag` (shipment-level tag) and `ShipmentRequestTag` (booking-level tag), supporting `IS` (include) and `IS_NOT` (exclude) rules and a special `FILTER_VALUE_NONE` for "no tag" filter

---

### Accounting Entity

- **Type**: Multi-select dropdown with search
- **Shown for**: `ctrl.hasAccountingEntity` — accounts with `Global.accessAccountingEntities = true`
- **Hidden for**: Accounts without accounting entity feature (`ng-if="ctrl.hasAccountingEntity"`)
- **API param name**: Part of `filters.value` — field `accounting_entity_id`
- **Allowed values**: `ctrl.entities` — built from `dataAccountingEntities` prepended with a special `{ name: 'No entity', id: 'none' }` entry
- **Default**: None selected
- **Behavior**: Multi-select dropdown with search. Calls `ctrl.apply_filter()` on change
- **Backend handling**: `filterByAccountingEntities()` — checks both `shipment_request.accounting_entity_id` and `pre_shipment.accounting_entity_id`. The special `'none'` value (mapped to `FILTER_VALUE_NONE`) allows filtering for shipments with no entity assigned. Uses `subQuery = false` to allow cross-join filtering

---

### Missing Metadata ("Missing Data")

- **Type**: Multi-select dropdown (grouped)
- **Shown for**: All roles (rendered always; may be empty if no metadata prototypes defined)
- **API param name**: Part of `filters.value` — field `missingMetadata`
- **Allowed values**: Metadata prototype definitions from `dataMetadataPrototypes`, filtered to `isActivatedForAccount = true`, formatted by `formatMetadataPrototypesForGroupedFilter()`
- **Default**: None selected
- **Behavior**: Multi-select grouped dropdown. Calls `ctrl.apply_filter()` on change. Uses `preparedFilterWithAllTypeOption(self.missingMetadata, 'id')` to extract selected IDs
- **Backend handling**: `filterMissingMetadataForSH(filters)` — generates an `EXISTS` subquery against the `metadata_requests` table: `EXISTS (SELECT 1 FROM metadata_requests mr WHERE (mr.shipment_id = "Shipment"."id" OR mr.quote_request_id = ...) AND mr.status = 'new' AND mr.prototype_id IN (...))`

---

### Missing Documents ("Missing Doc")

- **Type**: Multi-select dropdown (grouped)
- **Shown for**: All roles
- **API param name**: Part of `filters.value` — field `missingDocuments`
- **Allowed values**: Attachment type definitions from `dataAccountAttachmentTypes`, formatted by `formatAccountAttachmentTypesForGroupedFilter()`
- **Default**: None selected
- **Behavior**: Multi-select grouped dropdown. Calls `ctrl.apply_filter()` on change. Uses `preparedFilterWithAllTypeOption(self.missingDocuments, 'attachment_type_id')`
- **Backend handling**: `filterMissingDocumentsForSH(filters)` — generates an `EXISTS` subquery against the `attachment_requests` table: `EXISTS (SELECT 1 FROM attachment_requests ar WHERE (ar.shipment_id = ... OR ar.quote_request_id = ...) AND ar.status = 'new' AND ar.type_id IN (...))`

---

### Incidents (Smart-list only)

- **Type**: Multi-select dropdown
- **Shown for**: `ctrl.isTpIncidentPage` — only when the page was loaded with the `tpIncident` URL param
- **Hidden for**: All pages without `tpIncident` URL param (`ng-if="ctrl.isTpIncidentPage"`)
- **API param name**: Part of `filters.value` — field `incidents`
- **Allowed values**: `dataAccountIncidents` mapped to `{ id: incident.incident_id, name: incident.name }`
- **Default**: None selected (all incident types)
- **Behavior**: Multi-select dropdown. Calls `ctrl.apply_filter()` on change
- **Backend handling**: `filterByTrackingSettings()` — when `isTpIncident` is set AND specific incident IDs are selected, generates `EXISTS (SELECT 1 FROM tracking t WHERE t.shipment_id = ... AND t.incident_id = <id>)` for each selected ID. If no IDs selected but `isTpIncident` is set, generates `t.incident IS NOT NULL`

---

### Magic Search (Text Search)

- **Type**: Text input
- **Shown for**: All roles (optional, always rendered)
- **API param name**: Part of `filters.value` — field `magic_search`
- **Minimum characters**: 2 (enforced in `_apply_filter`: `searchQuery.magic_search.length > 1`)
- **Default**: Empty string
- **Behavior**: `<text-filter-component>` bound to `ctrl.search.magic_search`. On change calls `ctrl.wrapper_on_magic_search()` which sets loader and calls a debounced `on_magic_search()`. The debounce prevents API calls on every keystroke
- **Backend handling**: `filterMagicSearch(filters.magic_search)` — generates a large `$or` query across: `name`, `tracking_code`, `container_name`, `external_container_id`, `bl_id`, `address_from.name`, `address_from.address_1`, `address_from.city`, `address_from.country`, `address_dest.name`, `address_dest.address_1`, `address_dest.city`, `address_dest.country`, `id` (numeric), `sh_request_id` (numeric). Uses `ILIKE '%value%'` (substring match with diacritics)

---

### History Toggle

- **Type**: Checkbox
- **Shown for**: All roles
- **API param name**: `history` (top-level query param, not inside `filters.value`)
- **Default**: Unchecked (`false`)
- **Behavior**: Toggling immediately calls `ctrl.apply_filter()`. When unchecked, the fetch call appends `last_deliveries: true` to the request, which limits results to shipments with recent dates (within last 30 days). When checked, `last_deliveries` is set to `''` (empty string / falsy) and the full history is fetched
- **Backend handling**: When `last_deliveries` is truthy, `LAST_DELIVERIES_QUERY()` is applied: filters to shipments where `rta >= 30 days ago`, OR `rta IS NULL AND eta >= 30 days ago`, OR `eta IS NULL AND rtd >= 30 days ago`, OR `eta IS NULL AND rtd IS NULL AND etd >= 30 days ago`

---

### To Be Booked

- **Type**: Checkbox
- **Shown for**: All roles
- **API param name**: `toBeBooked` (top-level query param, not inside `filters.value`)
- **Default**: Unchecked (`false`)
- **Behavior**: Toggling immediately calls `ctrl.apply_filter()`. When checked, adds the `buildToBeBookedQuery()` condition
- **Backend handling**: `buildToBeBookedQuery()` filters shipments where EITHER: `address_from.is_master = true AND Shipment.is_full_day_departure = true`, OR `address_dest.is_master = true AND Shipment.is_full_day_arrival = true`

---

### Transit Companies (Air/Sea)

- **Type**: Multi-select dropdown
- **Shown for**: Air/Sea scope
- **API param name**: Part of `filters.value` — field `transitCompaniesIds`
- **Allowed values**: `dataDictTransitCompanies`
- **Default**: None selected
- **Backend handling**: handled by `addTransitDetailsPartToQuery()` — not found in `buildListShipmentsQuery` main flow; needs verification for exact SQL logic

---

### Arrival Late Detections

- **Type**: Multi-select dropdown (grouped)
- **Shown for**: All roles (available in advanced filters panel)
- **API param name**: Part of `filters.value` — field `arrivalLateDetections`
- **Allowed values**: Enum from `FILTER_ARRIVAL_LATE_DETECTION` (defined in `../../helper/filters`) — exact values not found in source files read; needs verification
- **Default**: None selected
- **Behavior**: Multi-select. Uses `preparedFilterWithAllTypeOption(self.arrivalLateDetections, 'key')`

---

### Departure Late Detections

- **Type**: Multi-select dropdown (grouped)
- **Shown for**: All roles (available in advanced filters panel)
- **API param name**: Part of `filters.value` — field `departureLateDetections`
- **Allowed values**: Enum from `FILTER_DEPARTURE_LATE_DETECTION` — exact values not found in source files read; needs verification
- **Default**: None selected
- **Behavior**: Multi-select. Uses `preparedFilterWithAllTypeOption(self.departureLateDetections, 'key')`

---

### Metadata Request (Contextual Filter)

- **Type**: Read-only chip with dismiss button (not a user-controllable filter)
- **Shown for**: When `ctrl.metadataRequest` is set — only activated when navigating to the shipment list from a metadata-request context (e.g. a specific missing-metadata widget elsewhere in the app)
- **Behavior**: Displays `metadataRequest.name : metadataRequest.value`. Clicking the `×` button calls `ctrl.deselectMetadata()` which nulls `ctrl.metadataRequest` and `ctrl.shipmentIds`, then re-applies filters
- **API param name**: `metadataRequest` (top-level), `shipmentIds` (top-level) — the server uses the pre-resolved shipment ID list to restrict the query

---

### Freight Units (Contextual Filter)

- **Type**: Read-only chip with dismiss button
- **Shown for**: When `ctrl.freightUnits` is set
- **Behavior**: Displays `freightUnits.customer_key`. Clicking `×` calls `ctrl.deselectFreightUnits()`
- **API param name**: `freightUnits` (top-level), `shipmentIds` (top-level)

---

### Serial Codes / SSCC (Contextual Filter)

- **Type**: Read-only chip with dismiss button
- **Shown for**: When `ctrl.serialCodes` is set
- **Behavior**: Displays `serialCodes.sscc_key`. Clicking `×` calls `ctrl.deselectSerialCodes()`
- **API param name**: `serialCodes` (top-level), `shipmentIds` (top-level)

---

## Advanced Filters Panel

When `ctrl.allowManageAdvancedFilters = true` AND `ctrl.showAdvancedFilters = true`, the simple filter bar is replaced by the `<advanced-filters>` component. This component manages the same filter fields as the simple bar but in a structured UI with AND/OR relation support, save/load capabilities, and the full set of filter fields represented as `ctrl.dropDownFiltersData` keyed by `FILTER_NAME_*` constants.

The relation mode (`filters.relation`) determines whether multiple filter conditions are combined with AND or OR logic in `buildRelationCondition()`.

---

## Filter Expand/Collapse

The filter bar has a "More" / "Hide" toggle (`ctrl.expandedFilters`). Optional filters (CSS class `p-table__filters-item--optional`) are hidden until the bar is expanded. This is purely visual — all optional filters are rendered in the DOM but collapse to hidden via CSS.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_list.filters`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632356946 · **repo:** `tms/shipments/01_list/filters.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

