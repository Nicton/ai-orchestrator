---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308435
source_type: confluence
---
# Shipments List — Table Columns

## Column Order & Configurability

Columns are fixed in order and width by the template. Users cannot reorder or hide individual columns. The set of visible columns changes based on the page scope (TRACKING / POD_REQUESTS / AIR_SEA_SHIPMENTS) and account type (Shipper / Carrier / Visibility Account).

The table renders in two formats:
- **Desktop**: `<div class="l-table">` — horizontal table layout with all columns
- **Mobile**: `<div class="l-shipment-cards">` — card layout with condensed information (name, cargo description, locations, dates, status)

The default sort order when no explicit sort is applied is: `COALESCE(rtd, etd) DESC NULLS LAST`, then `sh_request_id DESC`.

---

## Columns

### Spectator / Eye Icon (First Column)

- **Header**: None (empty)
- **Data field**: `shipment.isSpectator`
- **Shown for**: All accounts
- **Hidden for**: Shipments where `shipment.isSpectator` is falsy (no icon rendered)
- **Content**: Eye icon (`c-icon--eye`) rendered when `shipment.isSpectator = true`
- **Possible values / states**: Icon visible or empty cell
- **Sortable**: No
- **Click behavior**: Row click still navigates to shipment detail
- **Special cases**: `isSpectator` is computed server-side; indicates the current account is viewing this shipment as a spectator (not as the primary carrier or shipper)

---

### Mode Icon

- **Header**: "Mode"
- **Data field**: `shipment.shipment_mode.icon`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content**: CSS icon via `<i class="shiptify-icon {{shipment.shipment_mode.icon}}">`. If the shipment has an active `quote_request`, additionally renders `<table-component-active-services>` component showing active service badges
- **Possible values / states**: Icon per mode (road, air, sea, groupage, express, etc.). Blue color (`h-typo-blue`)
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `shipment.shipment_mode` is always populated (required include in query)

---

### Name / Reference

- **Header**: "Name"
- **Data field**: `shipment.name`, `shipment.id`, `shipment.creationDate`, `shipment.tracking_code`, `shipment.accountName`, `shipment.shipment_request.shipper_internal_name`, `shipment.container_name`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content** (multi-line cell):
  - **Line 1 (primary)**: `shipment.name` (capitalized). Optionally followed by:
    - `| shipment.shipment_request.shipper_internal_name` (secondary text) if `shipper_internal_name` is set
    - `- shipment.container_name` (secondary text) if `shipment.is_multicontainer = true`
  - **Line 2 (secondary)**:
    - If `shipment.accountName` is set: shows `shipment.accountName` (the partner company name when viewing via location access)
    - Else if `shipment.tracking_code` and NOT a Shipper: shows `shipment.tracking_code`
    - Else: shows `# shipment.id | shipment.creationDate`
  - **Tooltip icons** (left of name, shown when `shipment.tooltip` is set):
    - Red exclamation (`icon-exclamation--red.svg`) — when `shipment.hasClaim = true`
    - Orange exclamation (`icon-exclamation--orange.svg`) — when `!shipment.hasClaim && shipment.hasMissedMD`
    - Blue info (`icon-info--blue.svg`) — when `!shipment.hasClaim && !shipment.hasMissedMD`
  - **Tooltip content**: `shipment.tooltip` (HTML, rendered via `ng-bind-html`). Clicking the tooltip calls `ctrl.openClaim($event, shipment)` if `shipment.hasClaim = true`, routing to the claims view
- **Possible values / states**: Normal, with claim icon, with missing-metadata warning
- **Sortable**: No
- **Click behavior**: Row click navigates to `view shipment by id` with `{ id: shipment.id }`
- **Special cases**: `shipment.nameTooltip` is shown as native browser title on hover of the name span

---

### Documents

- **Header**: None (empty icon column)
- **Data field**: `shipment.attachments`, `shipment.missedDocs`, `shipment.uploadedDocsCount`, `shipment.commonDocsCount`
- **Shown for**: All roles; hidden on mobile (`l-table__td--no-mobile`)
- **Hidden for**: Never in DOM, but cell appears empty when no attachments and no missed docs
- **Content**:
  - When `shipment.attachments.length > 0` AND `shipment.missedDocs.length === 0`: file icon + count (`shipment.attachments.length`) in neutral color
  - When `shipment.missedDocs.length > 0`: file icon + `uploadedDocsCount/commonDocsCount` in orange
  - Hovering shows a tooltip with two sections:
    - Missing docs: `"N missing document(s)"` header followed by each missing doc label
    - Uploaded docs: `"N uploaded document(s):"` header followed by clickable links — `openAttachment(attachment.id)` — showing `attachment.att_label` and `attachment.file_name`
- **Possible values / states**: Empty, count-only (all docs present), orange ratio (docs missing)
- **Sortable**: No
- **Click behavior**: Tooltip links call `openAttachment(attachment.id)` (opens attachment viewer); `$event.stopPropagation()` prevents row navigation
- **Special cases**: `missedDocs` is computed from `attachmentRequests` with `status = 'new'`

---

### Tags

- **Header**: None (empty icon column)
- **Data field**: `shipment.id`, `ctrl.tags`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content**: `<tag-cell-component>` with `ident=shipment.id`, `tags=ctrl.tags`, `entity=shipment`, `scope='shipment'`. Renders colored tag circles for the shipment's current tags
- **Possible values / states**: Empty (no tags), one or more colored circles
- **Sortable**: No
- **Click behavior**: Tag cell component handles its own click — allows inline tag add/remove without navigating
- **Special cases**: Tags can exist at shipment level (`shipment.shipment_tag`) or at booking level (`shipment_request.sh_request_tag`)

---

### Cargo

- **Header**: "Cargo"
- **Data field**: `shipment.description`, `shipment.is_content_updated`, `shipment.isDangerousContent`, `shipment.tooltipCargo`, `shipment.specificationsInfo`, `shipment.shipment_mode.id`, `shipment.temperatureInfo`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content**: `<table-component-cargo-type>` component. Renders a summary of cargo type/description with icons for dangerous goods and temperature-controlled cargo. `description` is a computed object with lines (`line1`, `line4`, etc.) derived from `formatterShipment()`
- **Possible values / states**: Text description, with/without dangerous goods icon, with/without temperature indicator
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `is_content_updated` flag indicates manual content overrides; `isDangerousContent` triggers a warning icon; `temperatureInfo` shows temperature range if applicable

---

### By / For (Avatar)

- **Header**: "By" (for Shippers) / "For" (for Carriers) — dynamically: `{{ ctrl.isCarrier ? 'For' : 'By' | translate }}`
- **Data field**: `shipment.image`, `shipment.carrier`, `shipment.shipper`, `shipment.countSpectator`, `shipment.oneSpectatorImage`, `shipment.isNotOwn`, `shipment.isShared`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content**:
  - **Primary avatar** (`shipment.image`): company logo (carrier logo for Shippers, shipper logo for Carriers). Background-image CSS
  - **Shared avatar** — if `shipment.countSpectator === 1`: second avatar showing `shipment.oneSpectatorImage`
  - **Carrier logo on Carrier** — if `shipment.countSpectator <= 1 && shipment.isNotOwn && ctrl.isCarrier`: shows `shipment.carrier.logo_img`
  - **Multiple spectators** — if `shipment.countSpectator > 1`: number badge showing count
  - **Tooltip** (on Shipper): if not shared, shows `shipment.carrier.name`; if shared, shows `shipment.carrier.name` + "for" + `shipment.shipper.name`
- **Possible values / states**: Single avatar, dual avatar (shared), count badge
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `shipment.isShared = true` when the shipment belongs to a partner shipper connected via spectator (computed in `prepareShipmentsWithAccountName()`)

---

### From (Origin)

- **Header**: "From"
- **Data field**: `shipment.from.title`, `shipment.from.subtitle`, `shipment.from.isGlobalLocation`, `shipment.from.isSlotBookLocation`, `shipment.from.instructions`, `shipment.unBookedFrom`, `shipment.destCountBrothers`, `shipment.fromDockDoorName`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content** (multi-line):
  - **Line 1**: `shipment.from.title` + optional `+N` label (`c-label--rounded`) if `shipment.destCountBrothers > 0` (milkrun brother shipments at destination)
  - **Line 2 (secondary)**: status circle + `shipment.from.subtitle` + optional dock door label
  - **Status circles** (mutually exclusive):
    - Green circle: `shipment.from.isGlobalLocation && !shipment.unBookedFrom` — location is a master (global) location
    - Orange circle: `shipment.from.isSlotBookLocation && !shipment.isExpressMode` — slot-booking required location
    - Yellow circle: `shipment.unBookedFrom` — slot was unbooked / booking required but not confirmed
    - Blue circle: `!isGlobalLocation && !isSlotBookLocation && instructions` — has instructions
  - **Tooltip** (on hover):
    - Normal: shows `shipment.from.instructions` HTML
    - Unbooked (not canceled): shows "Online slotbooking required. Click here to book a slot." with link that calls `ctrl.openSlotBookModal($event, shipment, 'from')`
  - **Dock door label**: `shipment.fromDockDoorName` shown as a blue chip (`c-label--blue`)
- **Possible values / states**: Location with various booking-state indicators
- **Sortable**: No (Sort by origin location is available via advanced sort key `'departureLocation'` not exposed in this table header)
- **Click behavior**: Row click; slot-book tooltip has its own click via `openSlotBookModal`
- **Special cases**: `shipment.unBookedFrom` is true when a slot-booking location has no confirmed slot. `shipment.canceler_id` being set suppresses the slot-booking tooltip

---

### To (Destination)

- **Header**: "To"
- **Data field**: `shipment.dest.title`, `shipment.dest.subtitle`, `shipment.dest.isGlobalLocation`, `shipment.dest.isSlotBookLocation`, `shipment.dest.instructions`, `shipment.unBookedDest`, `shipment.fromCountBrothers`, `shipment.destDockDoorName`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content**: Same structure as "From" column, mirrored for destination address
  - `+N` label if `shipment.fromCountBrothers > 0` (milkrun brother shipments at origin)
  - Slot-booking tooltip calls `ctrl.openSlotBookModal($event, shipment, 'dest')`
- **Possible values / states**: Same status circles as From column
- **Sortable**: No
- **Click behavior**: Row click; slot-book tooltip has its own click
- **Special cases**: Note: the unbooked-dest tooltip has a bug where it references `shipment.from.isSlotBookLocation` instead of `shipment.dest.isSlotBookLocation` for the `l-table__tooltip--slotbook` class

---

### Incidents

- **Header**: "Incidents"
- **Data field**: `shipment.incidents`
- **Shown for**: Only when `ctrl.isTpIncidentPage = true` (i.e. page loaded with `tpIncident` URL param)
- **Hidden for**: All pages without `tpIncident` URL param — both the header and data cells use `ng-if="ctrl.isTpIncidentPage"`
- **Content**:
  - If `shipment.incidents.length === 1`: red chip (`c-chip--red`) showing `shipment.incidents[0].name`
  - If `shipment.incidents.length > 1`: red-outline chip (`c-chip--red-outline`) showing `"N Items"`
- **Possible values / states**: Single incident chip, multi-incident count chip
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `shipment.incidents` array is populated by the formatter from backend tracking point incident data

---

### Replanned Departure Indicator

- **Header**: None (narrow indicator column between From/dates)
- **Data field**: `shipment.replannedDeparture`
- **Shown for**: All roles; hidden on mobile (`l-table__td--no-mobile`)
- **Hidden for**: Cell is present but empty when `!shipment.replannedDeparture`
- **Content**: Blue dot (`c-typo-circle--blue`) with hover tooltip showing `shipment.replannedDeparture` HTML text (the replan description)
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `replannedDeparture` is computed in `formatterShipment()` when the departure date was replanned

---

### Start Date (Departure Date)

- **Header**: "Start" — sortable column
- **Data field**: `shipment.startDateStr`, `shipment.startTimeStr`, `shipment.startYearStr`, `shipment.rtd`, `shipment.isDepartureDelayed`, `shipment.fromGroup`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content** (multi-line):
  - **Line 1**: `shipment.startDateStr` (formatted date). Color-coded:
    - Blue (`h-typo-blue`): `shipment.rtd && !shipment.isDepartureDelayed` — departure confirmed, on time
    - Orange (`h-typo-orange`): `shipment.rtd && shipment.isDepartureDelayed && !shipment.isExpressMode` — departure confirmed but delayed
    - Default (gray): not yet departed
  - Optional `+N` count label if `shipment.fromGroup` exists (milkrun group; `ctrl.getGroupCount(shipment.fromGroup.count)` — returns `"+N"` only if count-1 < 10, else null)
  - **Line 2**: `shipment.startTimeStr` if present and `!startYearStr`; OR `shipment.startYearStr` if set (shown when year is different from current year)
  - **Confirm button**: `ng-if="!shipment.rtd && !ctrl.isVisibilityAccount"` — shown when departure not confirmed and user is not a Visibility Account. Clicking calls `ctrl.confirmPoint($event, shipment, true)`
- **Possible values / states**: Unconfirmed (plain text + check button), confirmed on-time (blue), confirmed late (orange)
- **Sortable**: Yes — sort key `arrivalDate` in `ctrl.sortKeys.departure` = `'departureDate'`. Header click calls `ctrl.sorting(ctrl.sortKeys.departure)`. Backend uses `COALESCE(rtd, etd) ASC/DESC NULLS LAST`
- **Click behavior**: Check button click fires confirm; otherwise row click
- **Special cases**: `isExpressMode` suppresses the delay orange color

---

### Replanned Arrival Indicator

- **Header**: None (narrow indicator column between dates)
- **Data field**: `shipment.replannedArrival`
- **Shown for**: All roles; hidden on mobile
- **Content**: Blue dot with tooltip showing `shipment.replannedArrival` HTML
- **Sortable**: No

---

### End Date (Arrival Date)

- **Header**: "End" — sortable column
- **Data field**: `shipment.endDateStr`, `shipment.endTimeStr`, `shipment.endYearStr`, `shipment.rta`, `shipment.isArrivaltDelayed`, `shipment.destGroup`, `shipment.endLiveReplanStr`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content** (multi-line):
  - **Line 1**: `shipment.endDateStr`. Color-coded:
    - Blue: `shipment.rta && !shipment.isArrivaltDelayed` — arrived on time
    - Orange: `shipment.rta && shipment.isArrivaltDelayed && !shipment.isExpressMode` — arrived late
  - Optional milkrun group count label if `shipment.destGroup` exists
  - **Line 2**:
    - `shipment.endTimeStr` (secondary, if present and no `endYearStr`)
    - `shipment.endLiveReplanStr` (red text — live tracking replan date)
    - OR `shipment.endYearStr` (secondary, if year differs)
  - **Confirm button** (green): `ng-if="!shipment.rta && !ctrl.isVisibilityAccount"` — shown when arrival not confirmed. Clicking calls `ctrl.confirmPoint($event, shipment, false)`
- **Possible values / states**: Unconfirmed (plain text + green check button), confirmed on-time (blue), confirmed late (orange), with live replan warning (red text)
- **Sortable**: Yes — sort key `ctrl.sortKeys.arrival` = `'arrivalDate'`. Backend uses `COALESCE(rta, eta) ASC/DESC NULLS LAST`
- **Click behavior**: Check button click fires confirm; otherwise row click
- **Special cases**: Note: template has a typo — `shipment.isArrivaltDelayed` (extra 't') — this must match the exact property name set by `formatterShipment()`

---

### Status Badge

- **Header**: "Status"
- **Data field**: `shipment.trackingStatus.title`, `shipment.trackingStatus.desc`, `shipment.trackingStatus.descExpecetedText`, `shipment.trackingStatus.descSlotText`, `shipment.statusClass`
- **Shown for**: All roles
- **Hidden for**: Never
- **Content** (multi-line):
  - **Line 1**: `shipment.trackingStatus.title` — uppercase status label
  - **Line 2** (secondary):
    - `shipment.trackingStatus.desc` if present and `!shipment.isExpressMode`
    - `shipment.trackingStatus.descExpecetedText` if present (e.g. "Expected X hours ago")
    - `shipment.trackingStatus.descSlotText` if present (slot booking confirmation text)
  - **Cell background class**: `l-table__td--{{shipment.statusClass}}` — status-specific color. `statusClass` values: `'gray'`, `'blue-light'`, `'green-light'`, `'green'`, `'red'`, `''` (empty = default blue)
  - **Line 2 color**: Blue if `!shipment.statusClass`; secondary-gray if `shipment.statusClass` is set
- **Possible values / states**: 9 shipment tracking statuses (see statuses.js) rendered with color-coded backgrounds
- **Sortable**: No
- **Click behavior**: Row click
- **Special cases**: `trackingStatus` is computed by `formatterShipment()` from a combination of `rtd`, `rta`, `etd`, `eta`, `canceler_id`, and the shipment's `status` field

---

## Mobile Card Layout

On mobile, the table is replaced by `<div class="l-shipment-cards">`. Each card contains:
- Spectator eye icon (if applicable)
- Mode icon
- Shipment name and cargo description (line4 or line1)
- Carrier/shipper avatar
- Origin location name + start date/time
- Destination location name + end date/time
- Status label + progress bar (`shipment.statusProgress` as width percentage)

The mobile card always navigates to `view shipment by id` on click.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_list.table-columns`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631308435 · **repo:** `tms/shipments/01_list/table-columns.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

