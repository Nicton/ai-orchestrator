---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631898277
source_type: confluence
---
# Shipments List — Actions & Buttons

## Page-Level Actions

### Export Button

- **Label**: "Export"
- **Element ID**: `#loadingFile`
- **Condition**: `ng-if="ctrl.isShipper || (ctrl.isCarrier && !ctrl.search.history)"`
  - Shippers can always export
  - Carriers can only export non-history results
- **Disabled state**: `ctrl.total_items <= 0` — click is a no-op if no results
- **What it does**:
  1. Sets `query.limit = ctrl.total_items` (fetches all matching records, not just the current page)
  2. If `!query.history`, sets `query.last_deliveries = true`
  3. Adds `c-button--progress` CSS class to button (shows loading spinner)
  4. Chooses loader based on mode:
     - `ctrl.isTpIncidentPage = true`: calls `TrackingPoints.exportTrackingPointByShipmentsToExcel(copyQuery)`
     - Otherwise: calls `Shipments.exportToExcel(copyQuery)` → `GET /api/v1/shipments-excel`
  5. Polls S3 with `Utils.promiseWaitFor(S3.objectExists(res.headUrl), { interval: 3000 })` until the file is available
  6. Redirects `window.location = res.url` to trigger browser download
  7. Removes `c-button--progress` class after download URL resolves
- **After click**: Browser initiates file download. The button returns to normal state.
- **Notes**: Smart-list params (`isTpIncident`, etc.) are included in `copyQuery` via `buildAdditionalParams()` when not using advanced filters

---

### Page Toggle (List / Board)

- **Component**: `<shipment-page-toggle active-state="ctrl.currentState">`
- **Condition**: `ng-if="ctrl.canBook"` — only shown when `Global.canBook()` returns true
- **Location**: Rendered in two places: the fixed-right filter group AND inside the advanced filters panel
- **What it does**: Allows switching between the list view (`all shipments` route state) and the board view (`board shipments` route state)
- **Notes**: `ctrl.currentState = $state.current.name` is passed to the component so it can highlight the active view

---

### Pagination Controls

- **Items per page selector**: Dropdown with options `[3, 5, 10, 20, 50, 100]` (from `ctrl.num_per_page_opt`). Default is `20` (index `[3]`). Changing calls `ctrl.on_num_per_page_change(num)` which sets `ctrl.num_per_page` and calls `ctrl.load_page(1)`
- **Page counter**: Displays `ctrl.total_items` + "Shipments" (from `X-Total-Count` response header)
- **Pagination component**: `uib-pagination` directive. `max-size="3"`, `boundary-link-numbers="true"`, `rotate="false"`. Changing page calls `ctrl.load_page(ctrl.current_page)`

---

## Row-Level Actions

### Row Click (Navigate to Shipment Detail)

- **Condition**: Always active
- **Template**: `ng-click="$root.routerGo('view shipment by id', {id: shipment.id})"` on the row `div`
- **What it does**: Navigates to the shipment detail page
- **POD requests page exception**: When `ctrl.isPodRequests = true`, clicking a row does NOT navigate; instead it opens the attachment modal via `ctrl.openModalViewAttachments(shipment)`
  - Not found directly in the template for automatic POD mode — `ctrl.openShipment()` exists as an explicit method that calls `routerGo('view shipment by id', { id: shipment.id })` and is used from other contexts
  - The POD modal open is wired as: `ModalViewAttachments.open(shipment, SCOPE_POD_REQUESTS)`, and if the result is truthy, calls `routerReload()`
- **Previous shipment scroll restore**: On init, `localStorage.getItem('prev-shipment')` is read — if set, the page scrolls to `#shipment-{id}` via `$anchorScroll` with a 115px offset. This enables scroll position restoration when navigating back from detail

---

### Confirm Departure (Check Button on Start Date)

- **Condition**: `ng-if="!shipment.rtd && !ctrl.isVisibilityAccount"`
  - `!shipment.rtd` — departure real date is not set (departure not yet confirmed)
  - `!ctrl.isVisibilityAccount` — user has full TMS product access (not a read-only visibility account)
- **Appearance**: Check icon (`shiptify-icon -is-check`) in a small button overlay at the bottom of the Start date cell
- **What it does**:
  1. Calls `ctrl.confirmPoint($event, shipment, true)` with `isStartPoint = true`
  2. `$event.stopPropagation()` prevents row navigation
  3. Resolves `{ minPoint, maxPoint } = getStartEndPoints(shipment.points)` — finds the first tracking point (min) and last (max)
  4. `point = minPoint` (the departure/origin tracking point)
  5. Attaches `point.milkrun_shipments_count = (shipment.fromGroup || {}).count` for milkrun grouping info
  6. If `point.real_date` is already set, exits early (point already confirmed)
  7. Opens `TrackingPointsUI.editCtrl({ point, mode: 2 }, shipment.id, point.id)` — a modal for entering the real date/time
  8. On modal close (resolved): calls `routerReload()` to refresh the list
- **After click**: The modal appears for the user to enter the actual departure time. On save, the page reloads and `shipment.rtd` is now set — the button disappears

---

### Confirm Arrival (Check Button on End Date)

- **Condition**: `ng-if="!shipment.rta && !ctrl.isVisibilityAccount"`
  - `!shipment.rta` — arrival real date not set
  - `!ctrl.isVisibilityAccount` — user has confirmation access
- **Appearance**: Green check icon (`l-table__button--green` class) in the End date cell
- **What it does**:
  1. Calls `ctrl.confirmPoint($event, shipment, false)` with `isStartPoint = false`
  2. `point = maxPoint` (the arrival/destination tracking point)
  3. Attaches `point.milkrun_shipments_count = (shipment.destGroup || {}).count`
  4. If `point.real_date` already set, exits
  5. Opens `TrackingPointsUI.editCtrl({ point, mode: 2 }, shipment.id, point.id)` modal
  6. On modal save: `routerReload()`
- **After click**: Modal for entering actual arrival time. Page reloads after save

---

### Open Claims

- **Trigger**: Clicking the claim tooltip area (the red exclamation tooltip on the Name column)
- **Condition**: `if (!shipment.hasClaim) return` — only activates when `shipment.hasClaim = true`. Also guards against clicking a child `.show-full-comment` element
- **What it does**: `routerGo('view claims by shipment id', { id: shipment.id })` — navigates to the claims detail view for the shipment
- **Note**: This action is on `ctrl.openClaim($event, shipment)` triggered inside the tooltip div

---

### Slot Book Modal (Inline Booking)

- **Trigger**: "Click here" link inside the slot-booking tooltip on From or To columns. Only visible when `shipment.unBookedFrom` or `shipment.unBookedDest` is true AND `!shipment.canceler_id`
- **What it does**:
  1. `$event.stopPropagation()` prevents row navigation
  2. `getAddressesFromShipments([shipment])` — extracts all addresses from the shipment
  3. `formatMultiShipmentsAddresses(addressses, additionalData)` — formats addresses for the slot-booking modal
  4. Finds the address matching `ADDRESS_FROM` or `ADDRESS_DEST` direction
  5. Calls `ShipmentRequestsUI.openSlotBookModal(address, { withLoadingEntity: false, isReplan: true })`
  6. On modal close (resolved): `routerReload()`
- **After click**: Slot-booking modal opens. On booking completion, the page reloads and the yellow "unbooked" indicator is replaced by the orange slot-booking circle

---

### Transit Details Modal (Air/Sea only)

- **Trigger**: `ctrl.openTransitDetailsModal($event, shipment)` — not directly exposed in `index.html`; wired from the Air/Sea variant columns (not visible in the base template)
- **What it does**:
  1. `$event.stopPropagation()`
  2. Opens `TransitDetailsModal.openTransitDetails({ dataTransitDetails: shipment.transit_details, dataShipment: shipment })`
- **After click**: Transit details modal showing port information, ETD/ETA, container tracking

---

### Container ID Modal (Air/Sea only)

- **Trigger**: `ctrl.openContainerIdModal($event, shipment)` — wired from Air/Sea variant
- **What it does**:
  1. `$event.stopPropagation()`
  2. Calls `ShipmentsUI.openContainerIdModal(shipment)` — opens a modal to view/edit the container ID (`container_name` or `external_container_id`)
- **After click**: Modal for container ID management

---

## Driver Assignment (Bulk Action)

### Selecting Shipments for Driver Assignment

- **Mechanism**: `ctrl.shipmentsForDrivers` object with map `all: {}` keyed by shipment ID
- **Toggle**: `ctrl.shipmentsForDrivers.toggle($event, shipment)` — not exposed in current `index.html` (may be in a carrier-specific variant or hidden feature); `$event.stopPropagation()` is called
- **Count**: `ctrl.shipmentsForDrivers.count()` — number of selected shipments (values that are truthy)
- **Check state**: `ctrl.shipmentsForDrivers.isEmpty()` — true when no shipments selected

### Drivers Modal

- **Condition**: `ng-if="ctrl.driversModal.isOpen"` — shown when `ctrl.driversModal.isOpen = true`
- **Opening**: `ctrl.driversModal.open()` — loads drivers via `Drivers.query().$promise`, sets `ctrl.driversModal.drivers`, and sets `isOpen = true`
- **Content**: Modal with title "Assign N Shipments", search input (`ctrl.driversModal.search`), and a list of driver chips filtered by name
- **Submit** (`ctrl.driversModal.submit(driver)`):
  1. Builds `data = { shipment_ids: [], driver_id: driver.id }`
  2. Iterates `ctrl.shipmentsForDrivers.all` to collect truthy IDs
  3. Calls `Shipments.bulkUpdate(data).$promise` — `PATCH /api/v1/shipments`
  4. On success: closes modal, calls `routerGo('all shipments', {}, { reload: true })`
- **Close**: `ctrl.driversModal.close($event)` — closes if click target has class `ship_modal-wrapper`; otherwise ignores

---

## Advanced Filters Panel Actions

### Apply Advanced Filters (`ctrl.applyAdvancedFilters(data, params)`)

Called when the advanced filter panel emits an apply event. Receives a `data` object (the full filter structure) and optional `params` containing `useHistory` and `useToBeBooked`. Rebuilds `query` from scratch using only the advanced filter value, then calls `load_page(1)`.

### Reset Advanced Filters (`ctrl.resetAdvancedFilters()`)

- Calls `resetFilters()` internally — clears all filter state: `showAdvancedFilters`, `dataAdvancedFilter`, `magic_search`, `mode`, all location arrays, all date ranges
- Emits `$rootScope.$emit('reset-filters')` for any listeners
- Calls `_apply_filter()` with empty query

---

## Pagination Actions

### `ctrl.load_page(page)`

Sets `ctrl.current_page = page`, enables loader, calls `ctrl.fetch_data()`. The `fetch_data()` method:
1. Builds `requestQuery` from current `query` state
2. Calls `Shipments.query(requestQuery).$promise`
3. On success: maps results through `formatterShipment()`, converts to `Immutable.List`, sets `ctrl.total_items` from `X-Total-Count` header, stores filters, calls `update_header_num_status()`

### `ctrl.sorting(key)`

Cycles sort direction: `desc` → `asc` → off. If key changes, starts at `desc`. Calls `_apply_filter()`.
- Sort keys: `arrivalDate`, `departureDate`, `transitArrivalDate`, `transitDepartureDate` (accessible from `ctrl.sortKeys`)

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_list.actions`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631898277 · **repo:** `tms/shipments/01_list/actions.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

