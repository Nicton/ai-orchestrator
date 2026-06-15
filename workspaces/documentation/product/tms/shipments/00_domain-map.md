---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668869
source_type: confluence
---
# TMS Shipments — Domain Map

> Generated: 2026-06-08  
> Sources: router.js, index.js, all view templates, backend route files, constants.js, statuses.js

---

## 1. Pages & Routes

### 1.1 Page inventory table

| Page name | URL pattern | Angular state | Controller | Template | Permission resolve |
|-----------|-------------|---------------|------------|----------|--------------------|
| Shipments List | `/shipments?isNotConfirmed?tpIncident?isTpDelayed?withoutPod` | `all shipments` | `ShipmentsCtrl` | `views/index.html` | `permissionsControl.accessTracking()` |
| Shipment Detail | `/shipments/{id:int}?tab?t?app` | `view shipment by id` | `ShipmentCtrl` | `views/view.html` | `permissionsControl.accessTracking()` |
| New Shipment (modal) | `/shipments/add` | `all shipments.add` | `NewShipmentCtrl` | `views/new.html` (blank template in state, modal rendered inline) | inherits parent |
| Add Tracking Point (modal) | `/shipments/:shipment_id/track` | `all shipments.add tracking point` | `NewTrackingPointCtrl` | `views/new-tracking-point.html` | inherits parent |
| Edit Tracking Point (modal) | `/shipments/:shipment_id/track/:id` | `all shipments.edit tracking point` | `EditTrackingPointModalCtrl` | `views/edit-tracking-point.html` | inherits parent |
| Board (Kanban) | `/shipments/board` | `board shipments` | `BoardListCtrl` | `views/board-list.html` | `permissionsControl.accessAllowBoardShipments()` |
| POD Requests | `/pod-requests` | `pod requests` | `ShipmentsCtrl` | `views/pod-requests.html` | `permissionsControl.accessPodRequests()` |
| Air/Sea Shipments | `/air-sea-shipments` | `air sea shipments` | `ShipmentsCtrl` | `views/air-sea-shipment.html` | `permissionsControl.accessAirSeaShipments()` |

**Modal overlays** (rendered inside `ui-view="modal"` on list or detail pages, not separate routes with full URL ownership):

| Modal | Controller | Template |
|-------|------------|----------|
| Cancel / Re-activate Shipment | `ActivateReactivateModal` | `views/activate-reactivate-modal.html` |
| Cancel Slot Booking | `CancelSlotBookingCtrl` | `views/cancel-slot-booking.html` |
| Container ID / BL ID | `ContainerIdModal` | `views/container-id-modal.html` |
| Request Proof of Delivery | `RequestProofOfDeliveryCtrl` | `views/request-proof-of-delivery.html` |
| Update Dock Door | `UpdateDockDoorCtrl` | `views/update-dock-door.html` |
| Parcel Details | `ParcelDetailsCtrl` | `views/parcel-details.html` |

---

### 1.2 Page descriptions

#### `all shipments` — Shipments List (`/shipments`)

Main tracking list. Shows all shipments accessible to the current user. Supports pagination, rich filtering (mode, status, location, date, carrier/shipper, tags, accounting entity, missing metadata/docs, incidents, magic search, history, to-be-booked), and column-based sorting by departure and arrival date.

Main sections:
- Filter bar (basic and advanced filters toggle)
- Sortable table with columns: Mode, Name, Documents, Tags, Cargo, By/For avatar, From, To, [Incidents column if `ctrl.isTpIncidentPage`], Start date, End date, Status
- Mobile card view (parallel rendering)
- Pagination bar + Export button
- `ui-view="modal"` slot for child state modals
- Inline driver assignment modal (`ctrl.driversModal.isOpen`)

URL query params act as smart-list activators: `isNotConfirmed`, `tpIncident`, `isTpDelayed`, `withoutPod`. When any is truthy the user-settings-based redirect is bypassed and the list is shown directly.

---

#### `view shipment by id` — Shipment Detail (`/shipments/{id}`)

Full detail view for a single shipment. Tabs controlled by `ctrl.tab` / `entity-page-tabs`.

Main sections / tabs:
- **requests-page-header-component**: shared header (name, shipper, carrier, collapse toggle)
- **Tracking tab** (default): tracking point timeline, subcontract banner, action buttons, chat panel, metadata/attachments panel
- **Transport Requests tab** (`tab=transport-requests`, Shipper-only): `tab-transport-requests` component

Tracking tab sub-sections:
- Subcontract widget (visible if `ctrl.canSubcontract`)
- Tracking Points list with add/replan/confirm/update actions
- WMS button (`ctrl.showWMSButton`)
- "Send API carrier update" button (`ctrl.showAskCarrierToUpdateBtn`)
- "Share shipment tracking" button (`ctrl.showShareShipmentTracking`)
- Parcel Details button (`ctrl.showParcelButtons`)
- "Request a proof of delivery" button (`ctrl.showRequestPODButton`)
- Contact button (`ctrl.isVisibilityAccount`)
- Open Claim button (`ctrl.isShipper && !ctrl.isVisibilityAccount && ctrl.hasAccessToClaims && (!ctrl.claims.length || ctrl.claim.status == 'canceled')`)
- See Opened Claim button (`ctrl.canViewClaim`)
- Truck-Driver Info button (`ctrl.allowManageTruckDriver`)
- Cancel / Re-activate Shipment link (`ctrl.isSelfAdmin && ctrl.canCancelShipment`)
- Cancel Slot link (`ctrl.isSelfAdmin && ctrl.canCancelShipment && ctrl.showCancelSlotButton`)
- Drivers component (Carrier only, not visibility account)
- Chat panel (shown if `ctrl.allowManageChat`; locked placeholder if not)
- Attachments/documents section (shown if `ctrl.allowManageAttachments`; locked placeholder if not)
- Marine Traffic / external links alerts
- Integration error / info alerts
- Milkrun TP locked popup (`ctrl.milkrunTPPopup.isOpen`)

---

#### `all shipments.add` — New Shipment Modal (`/shipments/add`)

Modal overlay (child state of `all shipments`). Simple form: Carrier select, Tracking code, Shipping date, From address, To address, Mode select, Cost, Weight. Only renders the modal; background page stays visible.

---

#### `all shipments.add tracking point` — Add Tracking Point (`/shipments/:shipment_id/track`)

Modal overlay. Allows adding a new tracking point to a shipment. Fields: point type (dropdown), location (typeahead), date/time range, comment, optional cargo details + update cause toggle.

---

#### `all shipments.edit tracking point` — Edit Tracking Point (`/shipments/:shipment_id/track/:id`)

Modal overlay (uses `EditTrackingPointModalCtrl`). Multi-mode modal covering: confirm, replan, update comment, delay dialog, milkrun selection, notify users. Renders using `views/edit-tracking-point.html`.

---

#### `board shipments` — Board / Kanban (`/shipments/board`)

Kanban-style view for shipments. Only accessible if `permissionsControl.accessAllowBoardShipments()`. Renders `slotify-shipments-board-list` component.

Main sections:
- Filter bar: Mode switcher, Pick-up/Delivery mode switcher, Carrier dropdown, Location picker, Date picker
- `shipment-page-toggle` (visible if `ctrl.canBook`)
- Kanban board component

---

#### `pod requests` — POD Requests (`/pod-requests`)

List of shipments filtered by POD status. Uses same `ShipmentsCtrl` as the main list but with `scope: SCOPE_POD_REQUESTS`. Date filter capped to `ctrl.currentDateEndOfDay`. No "To be booked" checkbox. Has two document columns (uploaded docs + declined POD comments). Status column shows `shipment.podStatus` rather than tracking status. Row click opens attachment-view modal rather than navigating to detail page.

---

#### `air sea shipments` — Air/Sea List (`/air-sea-shipments`)

Dedicated list for air and sea mode shipments. Uses same `ShipmentsCtrl` with `scope: SCOPE_AIR_SEA_SHIPMENTS`. Extends standard filters with:
- `transit-details-filter` (ETD/ETA countries, locodes, dates, transit company)
- POL / POD late detection dropdowns (Shipper only)
- Container ID column (clickable to open Container ID modal, or "+" icon if empty)
- Transit details column (ETD/ETA ports, transit company avatar, clickable for transit details modal)
- Sortable ETD and ETA columns

---

### 1.3 Resolve dependencies (data pre-loaded before page renders)

| Resolve key | Service | Notes |
|---|---|---|
| `route` | `UserSettings` | Redirects user to their preferred sub-view; skipped for smart-list params |
| `permissions` | `permissionsControl` | Guards route access |
| `dataLocationsUserDefault` | `Locations` | Default location filter seed |
| `dataShippers` | `Shippers` | Dropdown data, `byShipments: true` |
| `dataExternalAccounts` | `ConnectedAccounts` | External shipper filter |
| `dataShipmentModes` | `ShipmentModes` | Mode switcher data |
| `dataTags` | `Tags` | Tag filter, scope=tracking, isActive=true |
| `dataBookers` | `ShipmentRequests` | Booker filter; returns `[]` for Carrier users |
| `dataAccountingEntities` | `AccountingEntities` | Entity filter |
| `dataMetadataPrototypes` | `MetadataPrototypes` | Missing metadata filter |
| `dataAccountAttachmentTypes` | `AccountAttachmentTypes` | Missing doc filter |
| `dataDictTransitCompanies` | `DictTransitCompanies` | Transit company filter |
| `dataAccountIncidents` | `AccountIncidents` | Loaded only when `tpIncident` param truthy |
| `dataShipment` | `Shipments` | Detail page: loads shipment with `include_points: true`; also loads transport requests for Shipper on transport-requests tab |
| `dataTrackPoints` | `TrackingPoints` | Detail page: skipped if no manage/see access |
| `dataSpectators` | `ConnectedAccounts` | Detail page: connected spectators |
| `dataCarriers` | `Carriers` | Board page only |

---

## 2. Role-based Visibility Rules

### 2.1 Roles in the system

| Role / account type | Detection expression | Description |
|---------------------|---------------------|-------------|
| Shipper | `ctrl.isShipper` / `Global.isShipper()` | A company that books shipments |
| Carrier | `ctrl.isCarrier` / `Global.isCarrier()` | A company that executes transport |
| Visibility account | `ctrl.isVisibilityAccount` | Read-only external observer (cannot confirm points, cannot see chat) |
| Spectator | `shipment.isSpectator` / `shipment.spectator` | Connected account granted view access to a specific shipment |
| Self Admin | `ctrl.isSelfAdmin` | Administrative user within their own organization |
| Booker | referenced via ACL constants `ACL_PERMISSION_KEY` / `CAN_CANCEL_SHIPMENT_KEY` / `CAN_EDIT_BOOKING_KEY` | Sub-user of a Shipper with limited permissions |
| Mini-app (kiosk) | `ctrl.isMiniApp` | Token-based kiosk mode, no full auth |

### 2.2 Visibility matrix (summary)

| UI element | Shipper | Carrier | Visibility Account | Notes |
|---|---|---|---|---|
| "All Carriers" filter | Yes | No | – | `ng-if="ctrl.isShipper"` |
| "All Shippers" filter | No | Yes | – | `ng-if="ctrl.isCarrier"` |
| "All Bookers" filter | Yes | No | – | `ng-if="ctrl.isShipper"` |
| Export button | Yes | Yes (active only) | – | `ng-if="ctrl.isShipper \|\| (ctrl.isCarrier && !ctrl.search.history)"` |
| Carrier avatar tooltip | Yes | No | – | `ng-if="ctrl.isShipper && !shipment.isShared && shipment.carrier"` |
| Confirm departure (list button) | Yes (if not confirmed) | Yes | No | `ng-if="!shipment.rtd && !ctrl.isVisibilityAccount"` |
| Confirm arrival (list button) | Yes (if not confirmed) | Yes | No | `ng-if="!shipment.rta && !ctrl.isVisibilityAccount"` |
| Transport Requests tab | Yes | No | – | `ng-if="ctrl.tab.isActive('transport-requests') && !ctrl.isCarrier"` |
| Open Claim button | Yes | No | No | `ng-if="ctrl.isShipper && !ctrl.isVisibilityAccount && ctrl.hasAccessToClaims && ..."` |
| Contact button (detail) | No | No | Yes | `ng-if="ctrl.isVisibilityAccount"` |
| Drivers component (detail) | No | Yes | No | `ng-if="ctrl.isCarrier && !ctrl.isVisibilityAccount"` |
| Subcontract widget | Carrier-only | Yes | – | `ng-if="ctrl.canSubcontract"` |
| Cancel / Re-activate Shipment | SelfAdmin only | SelfAdmin only | – | `ng-if="ctrl.isSelfAdmin && ctrl.canCancelShipment"` |
| Add tracking point | conditional | conditional | No | `ctrl.point.allowAddPoint()` |
| Chat panel | Yes (if allowed) | Yes (if allowed) | – | `ng-if="ctrl.allowManageChat"` / placeholder if not |
| Attachments upload zone | conditional | conditional | – | `ng-if="ctrl.allowManageAttachments"` |
| POD Request button | conditional | – | – | `ng-if="ctrl.showRequestPODButton"` |
| Board page | conditional | conditional | – | `permissionsControl.accessAllowBoardShipments()` |
| Spectator eye icon | – | – | – | `ng-if="shipment.isSpectator"` (shows on row) |
| POL/POD late detection filter | Yes | No | – | `ng-if="ctrl.isShipper"` (air-sea page) |

### 2.3 Detailed conditions

**`ng-if="ctrl.isShipper"` — Carrier filter (list page)**  
Shows "All Carriers" dropdown in filter bar. Only shippers can filter their shipments by carrier. Carriers see "All Shippers" instead.

**`ng-if="ctrl.isCarrier"` — Shipper filter (list page)**  
Shows "All Shippers" dropdown. Carriers filter shipments by the shipper they are executing for.

**`ng-if="ctrl.isShipper || (ctrl.isCarrier && !ctrl.search.history)"` — Export button**  
Shippers can always export. Carriers can export only in the current/active view, not when viewing history.

**`ng-if="!shipment.rtd && !ctrl.isVisibilityAccount"` — Confirm departure button (list)**  
`rtd` = "real time departure" (departure already confirmed). The green checkmark button appears in the Start date cell only when departure has NOT been confirmed yet, and only for non-visibility accounts.

**`ng-if="!shipment.rta && !ctrl.isVisibilityAccount"` — Confirm arrival button (list)**  
Same logic for arrival confirmation.

**`ng-if="ctrl.isShipper && !ctrl.isVisibilityAccount && ctrl.hasAccessToClaims && (!ctrl.claims.length || ctrl.claim.status == 'canceled')"` — Open Claim button (detail)**  
Shippers who have claims access can open a new claim only when no open claim exists (or the only claim is canceled).

**`ng-if="ctrl.isSelfAdmin && ctrl.canCancelShipment"` — Cancel/Re-activate footer (detail)**  
`isSelfAdmin` is the user's admin role within their own account. `canCancelShipment` is a capability flag computed from shipment state. The footer contains two sub-conditions:  
- `ng-if="ctrl.showCancelShipmentButton"` — shows "Cancel Shipment" or "Re-activate canceled Shipment" text depending on `ctrl.shipment.canceler_id`  
- `ng-if="ctrl.showCancelSlotButton"` — shows "Cancel slot" when relevant

**`ng-if="ctrl.tab.isActive('transport-requests') && !ctrl.isCarrier"` — Transport Requests tab content**  
Transport requests sub-page is completely hidden for carriers. The tab itself would not be shown to them.

**`ng-if="ctrl.isCarrier && !ctrl.isVisibilityAccount"` — Drivers component (detail)**  
Only Carrier users (who are not read-only visibility accounts) can assign/view truck drivers.

**`ng-if="ctrl.allowManageChat"` vs `ng-if="!ctrl.allowManageChat"` — Chat panel (detail)**  
When chat is not allowed (determined by `ctrl.allowManageChat`), a locked-state placeholder is shown: "Chats are visible by [shipperName]". This typically happens for carrier users on certain shipper configurations.

**`ng-if="ctrl.allowManageAttachments"` — Attachment upload zone (detail)**  
When not allowed, locked placeholder: "Documents are visible by [shipperName]".

**`ng-if="shipment.isSpectator"` — Eye icon on list row**  
Indicates the current account is a spectator (not owner) on this shipment. Rendered for both table and mobile card views.

**`ng-if="ctrl.isMiniApp"` — Kiosk header (detail)**  
Shows branded header with login link when accessed via token-based URL without full authentication.

**`ng-if="ctrl.canSubcontract"` — Subcontract widget (detail)**  
Carrier-only feature. Allows sending a PDF transport order to a subcontractor.

**`ng-if="ctrl.isShowMarineTrafficLink"` — Marine Traffic alert (detail)**  
Shows a tracking alert with external link to Marine Traffic when a container ID integration is active.

**`ng-if="ctrl.isTpIncidentPage"` — Incidents column (list)**  
Only shown when the list is opened with `?tpIncident=...` query parameter, enabling a dedicated incident view.

**`ng-if="ctrl.canBook"` — Page toggle (all list pages)**  
The `shipment-page-toggle` component (switches between list views: tracking / booking) only appears if the current account has booking capability.

**Container ID modal condition (air-sea list)**  
`ng-if="shipment.external_container_id || shipment.bl_id"` — clickable cell showing existing IDs  
`ng-if="!shipment.external_container_id && !shipment.bl_id"` — "+" icon to add IDs

**`ng-if="ctrl.isShowBlId"` — BL ID field (container-id-modal)**  
The Bill of Lading field is shown or hidden based on mode-specific configuration.

---

## 3. API Endpoints Inventory

> Base prefix: `/api/v1`

### 3.1 Shipments API (`shipments.js`)

| Method | Path | Key Middleware | Controller fn | Purpose |
|--------|------|----------------|---------------|---------|
| GET | `/shipments` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations`, `extendAddressForMatchMiddleware` | `ctrl.list` | Paginated shipment list with filters |
| POST | `/shipments` | `requireShipper`, `loadAllowedShipperDivisionsForShipperUser`, `loadAllowedCarrierDivisionsForShipperUser`, `loadAllowedShippersForCarrierUser` | `ctrl.create` | Create new shipment (Shipper only) |
| GET | `/shipments/:id(\\d+)` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations`, `loadAllowedShipment` | `ctrl.show` | Load single shipment detail |
| PUT | `/shipments/:shipment_id(\\d+)` | `requireCollaborative`, ACL divisions, `loadAllowedLocations`, `putValueToAcl(CAN_CANCEL_SHIPMENT_KEY)`, `loadAllowedShipment`, `loadFollowers`, `loadAllowedShipmentRequest` | `ctrl.update` | Update shipment (cancel/reactivate, etc.) |
| PATCH | `/shipments` | — | `ctrl.bulkUpdate` | Bulk update shipments |
| PATCH | `/shipments/:id(\\d+)/driver` | — | `ctrl.assignDriver` | Assign driver to shipment |
| GET | `/shipments/:shipment_id(\\d+)/spectators` | ACL chain, `loadAllowedShipment` | `ctrl.getShipmentSpectators` | List spectators on a shipment |
| GET | `/shipments/:shipment_id(\\d+)/shipper-rights-management` | ACL chain, `loadAllowedShipment` | `ctrl.getShipperRightsManagement` | Load shipper-specific rights config |
| POST | `/shipments/:shipment_id(\\d+)/request-pod` | `requireShipper`, ACL chain, `loadAllowedShipment` | `ctrl.requestProofOfDelivery` | Request POD from carrier (Shipper only) |
| GET | `/shipments-info` | ACL division chains | `ctrl.shipmentsInfo` | Aggregate/summary information |
| GET | `/shipments-excel` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.shipmentsExcel` | Export shipments to Excel |
| GET | `/shipments/canceled-excel` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.canceledShipmentsExcel` | Export canceled shipments to Excel |
| GET | `/shipments/canceled/filter-options` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.canceledShipmentFilterOptions` | Filter options for canceled shipments |
| GET | `/shipments-labels/:id(\\d+)` | `requireCollaborative`, ACL chain, `loadAllowedShipment` | `ctrl.shipmentsLabels` | Generate shipment label(s) PDF |
| GET | `/shipments-single-label/:id(\\d+)` | `requireCollaborative`, ACL chain, `loadAllowedShipment` | `ctrl.shipmentsSingleLabel` | Single label PDF |
| POST | `/shipments-cmr/:id(\\d+)` | `requireShipper`, ACL chain, `loadAllowedShipment` | `ctrl.shipmentsCmr` | Generate CMR document (Shipper only) |
| POST | `/shipments-single-cmr/:id(\\d+)` | `requireShipper`, ACL chain, `loadAllowedShipment` | `ctrl.shipmentsSingleCmr` | Single CMR document (Shipper only) |
| GET | `/site-shipments` | `requireShipper`, `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.siteShipmentsList` | Shipments for site/dock management (Shipper only) |
| POST | `/site-shipments/:shipment_id(\\d+)/status` | `requireShipper`, `_load_shipment`, ACL | `ctrl.createSiteShipmentStatus` | Create site status event (Shipper only) |
| GET | `/site-shipments/:shipment_id(\\d+)/status/:id(\\d+)` | `requireShipper`, `_load_shipment` | `ctrl.loadSiteShipmentStatus` | Load single site status |
| DELETE | `/site-shipments/:shipment_id(\\d+)/status/:id(\\d+)` | `requireShipper`, `_load_shipment`, `_load_site_status` | `ctrl.deleteSiteShipmentStatus` | Delete site status |
| PATCH | `/site-shipments/:shipment_id(\\d+)/status/:id(\\d+)` | `requireShipper`, `_load_shipment`, `_load_site_status` | `ctrl.updateSiteShipmentStatus` | Update site status |
| GET | `/site-shipments-excel` | `requireShipper`, ACL chain | `ctrl.siteShipmentsExcel` | Export site shipments to Excel |
| GET | `/spectator-shipment-brothers/:shipment_id(\\d+)` | `loadAllowedShipmentForSpectator` | `ctrl.getShipmentBrothersForSpectator` | Load multi-container siblings (spectator view) |
| GET | `/shipment-brothers/:sh_request_id(\\d+)` | Full ACL division chain, `loadAllowedShipmentRequest` | `ctrl.getShipmentBrothers` | Load multi-container siblings |
| POST | `/shipment-brothers/:sh_request_id(\\d+)` | Full ACL division chain, `loadAllowedShipmentRequest` | `ctrl.addContainers` | Add container(s) to multi-container request |
| GET | `/shipment-brothers/:sh_request_id(\\d+)/tracking/:tracking_id(\\d+)/available` | Full ACL chain | `ctrl.getAvailableShipmentIdsForTracking` | Available shipment IDs for tracking grouping |
| GET | `/shipment-brothers/:sh_request_id(\\d+)/metadata/available` | Full ACL chain | `ctrl.getAvailableShipmentsDataForMD` | Available shipments for metadata sharing |
| PATCH | `/shipments/:shipment_id(\\d+)/contents` | `requireCollaborative`, ACL chain, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipment`, `loadFollowers` | `ctrl.updateContents` | Update cargo contents on a shipment |
| POST | `/shipments/slotify` | — | `ctrl.createSlotifyShipment` | Create shipment from slot booking |
| POST | `/shipments/:shipment_id(\\d+)/contact` | `requireVisibilityAccount`, ACL chain, `loadAllowedShipment` | `ctrl.sendContact` | Send contact message (Visibility Account only) |
| GET | `/shipments/:shipment_id(\\d+)/parcels/:parcel_id(\\d+)/tracking` | ACL chain, `loadAllowedShipment`, `_load_parcel` | `ctrl.loadShipmentParcelTracking` | Parcel-level tracking points |
| GET | `/shipments/:shipment_id(\\d+)/parcels-temperatures` | ACL chain, `loadAllowedShipment` | `ctrl.loadShipmentParcelsTemperatures` | Temperature data per parcel |
| PATCH | `/shipments/:shipment_id(\\d+)/name` | `requireCollaborative`, ACL chain, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipment` | `ctrl.updateName` | Rename a shipment |
| PATCH | `/shipments/:shipment_id(\\d+)/entity-name` | `requireCollaborative`, ACL chain, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipment` | `ctrl.updateEntityName` | Update entity name |
| POST | `/shipments/:id(\\d+)/integrations/:integration_name` | ACL chain, `loadAllowedShipment` | `ctrl.sendDataToIntegration` | Trigger integration push (e.g. WMS) |
| GET | `/dock-shipments` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.loadShipmentsForDock` | Dock/board view shipments |
| GET | `/shipments/metadata-requests` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.listShipmentsMetadataRequests` | List metadata fill requests |
| GET | `/shipments/attachment-requests` | `loadAllowedShippersForCarrierUser`, `loadAllowedLocations` | `ctrl.listShipmentsAttachmentRequests` | List document upload requests |
| GET | `/shipments/:shipment_id(\\d+)/driver-transport` | ACL chain, `putValueToAcl(SPECTATOR_CAN_MANAGE_TRUCK_DRIVER_INFO_KEY)`, `loadAllowedShipment` | `ctrl.loadShipmentDriverTransportInfo` | Load truck driver info |
| PATCH | `/shipments/:shipment_id(\\d+)/driver-transport` | ACL chain, `putValueToAcl(SPECTATOR_CAN_MANAGE_TRUCK_DRIVER_INFO_KEY)`, `loadAllowedShipment` | `ctrl.updateShipmentDriverTransportInfo` | Update truck driver info |
| GET | `/shipments/:shipment_id(\\d+)/linked` | `requireShipper`, ACL chain, `loadAllowedShipment` | `ctrl.loadLinkedSh` | Load linked shipment requests |

---

### 3.2 Shipment Requests API (`shipment_requests.js`)

| Method | Path | Key Middleware | Controller fn | Purpose |
|--------|------|----------------|---------------|---------|
| GET | `/shipment-requests` | `requireShipper`, `loadAllowedShipperDivisionsForShipperUser` | `ctrl.list` | List shipment requests (Shipper only) |
| POST | `/shipment-requests` | `requireShipperOrShipperByCarrier`, `loadAllowedShipperByCarrier`, divisions ACL, `loadAllowedShipmentRequest`, `loadAccountIdsForSharedOrders` | `ctrl.create` | Create shipment request |
| GET | `/shipment-requests/check` | `requireShipperOrShipperByCarrier` | `ctrl.check` | Check request validity |
| GET | `/shipment-requests-excel` | `requireShipper`, `loadAllowedShipperDivisionsForShipperUser` | `ctrl.shipmentRequestsExcel` | Export to Excel (Shipper only) |
| GET | `/shipment-requests/validation-settings` | `requireShipperOrShipperByCarrier` | `ctrl.getValidationSettings` | Load validation rules |
| GET | `/shipment-requests/pre-shipments` | `requireShipper`, divisions ACL, `extendAddressForMatchMiddleware` | `ctrl.listPreShipments` | List pre-shipments (Shipper only) |
| PATCH | `/shipment-requests/multiple` | `requireShipper`, `checkStatusAllowedToUpdate`, ACL chain | `ctrl.updateMultiple` | Bulk update requests |
| POST | `/shipment-requests/transit-via` | `requireShipper`, divisions ACL, `loadAllowedAddress`, `loadAllowedLocations`, `loadAllowedShipmentRequests` | `ctrl.transitShipmentRequest` | Add transit stop |
| GET | `/shipment-requests/metadata-requests` | `requireShipper`, divisions ACL | `ctrl.listShipmentRequestsMetadataRequests` | Metadata fill requests |
| GET | `/shipment-requests/attachment-requests` | `requireShipper`, divisions ACL | `ctrl.listShipmentRequestsAttachmentRequests` | Attachment upload requests |
| GET | `/shipment-requests/bookers` | `requireShipper` | `ctrl.getShipmentBookers` | List bookers for filter dropdown |
| GET | `/shipment-requests/:id(\\d+)` | `requireShipper`, divisions ACL | `ctrl.show` | Load single request |
| PATCH | `/shipment-requests/:id(\\d+)` | `requireShipper`, divisions ACL, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipmentRequest` | `ctrl.update` | Update request |
| DELETE | `/shipment-requests/:id(\\d+)` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.delete` | Delete request |
| GET | `/shipment-requests/:sh_request_id(\\d+)/quote-requests` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.list_quote_requests` | List quote requests for SR |
| GET | `/shipment-requests-count` | `requireShipper`, divisions ACL | `ctrl.count` | Count of requests |
| PATCH | `/shipment-request/:sh_request_id(\\d+)/contents` | `requireShipper`, divisions ACL, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipmentRequest`, `allowUpdateShipmentRequestContents`, `loadFollowers` | `ctrl.updateContents` | Update cargo contents |
| PATCH | `/shipment-request/:sh_request_id(\\d+)/entity-name` | `requireCollaborative`, divisions ACL, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipmentRequest` | `ctrl.updateEntityName` | Update entity name |
| PATCH | `/shipment-requests/:sh_request_id(\\d+)/name` | `requireCollaborative`, divisions ACL, `putValueToAcl(CAN_EDIT_BOOKING_KEY)`, `loadAllowedShipmentRequest` | `ctrl.updateName` | Rename request |
| PATCH | `/shipment-requests/:sh_request_id(\\d+)/internal-note` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.updateInternalNote` | Update internal note |
| DELETE | `/shipment-requests/:sh_request_id(\\d+)/lines` | divisions ACL, `loadAllowedShipmentRequest`, `loadAccountIdsForSharedOrders`, `loadAllowedGalaxyAccounts` | `ctrl.deleteLines` | Remove order lines |
| POST | `/shipment-requests/:sh_request_id(\\d+)/lines` | divisions ACL, `loadAllowedShipmentRequest`, `loadAccountIdsForSharedOrders`, `loadAllowedGalaxyAccounts` | `ctrl.attachLines` | Attach order lines |
| POST | `/shipment-requests/:sh_request_id(\\d+)/emails` | divisions ACL, `putValueToAcl(CAN_SHARE_SHIPMENT_TRACKING_KEY)`, `loadAllowedShipmentRequest` | `ctrl.createEmail` | Share tracking via email |
| PATCH | `/shipment-requests/:sh_request_id(\\d+)/lines` | divisions ACL, `loadAllowedShipmentRequest`, `loadAccountIdsForSharedOrders` | `ctrl.reAssignLines` | Reassign order lines |
| GET | `/shipment-requests/:sh_request_id(\\d+)/spectators` | divisions ACL, `loadAllowedShipmentRequest` | `ctrl.getShipmentRequestSpectators` | List spectators |
| POST | `/shipment-requests/:sh_request_id(\\d+)/spectators` | `requireShipper`, divisions ACL, `putValueToAcl(CAN_SHARE_SHIPMENT_TRACKING_KEY)`, `loadAllowedShipmentRequest` | `ctrl.processShipmentRequestSpectators` | Add/update spectators (Shipper only) |
| PATCH | `/shipment-requests/:sh_request_id(\\d+)/dates` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.updateDates` | Update departure/arrival dates |
| POST | `/shipment-requests/:sh_request_id(\\d+)/split` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.splitShipmentRequest` | Split request into multiple |
| PATCH | `/shipment-requests/:sh_request_id(\\d+)/insurance` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest`, `loadFollowers` | `ctrl.updateInsurance` | Update insurance data |
| GET | `/shipment-requests/:sh_request_id(\\d+)/repeat` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.loadRepeatData` | Load data for repeat booking |
| GET | `/shipment-requests/:sh_request_id(\\d+)/linked` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequest` | `ctrl.loadLinkedSr` | Load linked shipment requests |
| GET | `/shipment-requests/repeat-bulk` | `requireShipper`, divisions ACL, `loadAllowedShipmentRequests` | `ctrl.loadRepeatDataBulk` | Bulk repeat data |

---

## 4. Status System

### 4.1 Shipment statuses

| Status value | i18n key (shipper/carrier title) | Group | Meaning |
|---|---|---|---|
| `planned` | `shipment_status.planned` | `shipment_status_group.planned` | Shipment created, not yet picked up |
| `expected_pick_up` | `shipment_status.expected_pick_up` | `shipment_status_group.planned` | Departure tracking point confirmed / departure date known |
| `slot_confirmed` | `shipment_status.confirmed_slot` | `shipment_status_group.planned` | A slot booking has been confirmed |
| `in_transit_estimate` | `shipment_status.in_transit_estimate` | `shipment_status_group.in_transit` | In transit, based on estimated tracking |
| `in_transit` | `shipment_status.in_transit` | `shipment_status_group.in_transit` | Departure confirmed, awaiting delivery |
| `expected_delivery` | `shipment_status.expected_delivery` | `shipment_status_group.in_transit` | Arrival tracking point expected |
| `delivered_estimate` | `shipment_status.delivered_estimate` | Shipper: `shipment_status_group.delivered` / Carrier: (empty — hidden from carrier filter) | Delivered based on estimation, not confirmed by carrier |
| `delivered` | `shipment_status.delivered` | `shipment_status_group.delivered` | Arrival confirmed |
| `canceled` | `shipment_status.cancelled` | `shipment_status_group.cancelled` | Shipment canceled |

**Note:** `delivered_estimate` has an empty `carrierGroup`, which means it is filtered out of the carrier's status dropdown (`getCarrierStatuses` filters on `carrierTitle && carrierGroup`). Carriers do not see this status as a filter option.

### 4.2 Status groups

| Group key | Contains statuses | Meaning |
|---|---|---|
| `shipment_status_group.planned` | `planned`, `expected_pick_up`, `slot_confirmed` | Shipment scheduled but not yet moving |
| `shipment_status_group.in_transit` | `in_transit_estimate`, `in_transit`, `expected_delivery` | Shipment currently moving |
| `shipment_status_group.delivered` | `delivered_estimate` (shipper), `delivered` | Shipment completed |
| `shipment_status_group.cancelled` | `canceled` | Shipment terminated |

### 4.3 POD (Proof of Delivery) statuses

| Status value | i18n key | CSS class | Meaning |
|---|---|---|---|
| `pending` | `shipment_pod_status.pending` | `gray` | POD not yet requested (hidden from Shipper filter — `getPodStatuses` excludes `pending` for shippers) |
| `expected` | `shipment_pod_status.expected` | `blue-light` | POD has been requested from carrier |
| `loaded` | `shipment_pod_status.loaded` | `green-light` | Carrier has uploaded POD document |
| `approved` | `shipment_pod_status.approved` | `green` | Shipper has approved the POD |
| `declined` | `shipment_pod_status.declined` | `red` | Shipper has declined the POD |

### 4.4 Status-driven UI indicators (list table cell CSS)

The status cell class is set as `l-table__td--{{shipment.statusClass}}` (dynamic CSS suffix) and `l-table__td--{{shipment.podStatus.statusClass}}` on the POD page. Status colors and display text come from the computed `trackingStatus` object on each shipment.

---

## 5. Inter-page Navigation Map

```
/shipments  (all shipments)
  │
  ├── Row click → /shipments/{id}  (view shipment by id)
  │       │
  │       ├── Tab: Tracking (default)
  │       │       ├── "Add" link → /shipments/{id}/track  (modal overlay: new-tracking-point)
  │       │       ├── Tracking point "Replan/Confirm/Update" → edit-tracking-point modal (inline, not URL change)
  │       │       ├── "Open Claim" button → confirmation dialog inline → creates claim
  │       │       ├── "See Opened Claim" → navigates to 'view claims by shipment id' state
  │       │       ├── "Request a proof of delivery" → request-proof-of-delivery modal
  │       │       ├── "Parcel Details" → parcel-details modal
  │       │       ├── "Cancel Shipment" / "Re-activate" → activate-reactivate-modal
  │       │       ├── "Cancel slot" → cancel-slot-booking modal
  │       │       ├── "Share shipment tracking" → pre-shipment-followers inline popup
  │       │       └── "Send data to WMS" → POST /integrations/wms
  │       │
  │       └── Tab: Transport Requests (Shipper only)
  │               └── tab-transport-requests component
  │
  ├── "Add" button (ctrl.canBook) → /shipments/add  (all shipments.add modal)
  │
  ├── Slot booking tooltip "Click here" → opens slot booking modal (external component)
  │
  └── Page toggle (ctrl.canBook) → switch between list views
        ├── → /shipments  (tracking list)
        ├── → /shipments/board  (board shipments)
        └── → /air-sea-shipments  (air sea shipments)

/shipments/board  (board shipments)
  │
  ├── Requires: permissionsControl.accessAllowBoardShipments()
  └── Page toggle → /shipments or /air-sea-shipments

/pod-requests  (pod requests)
  │
  ├── Row click → openModalViewAttachments(shipment)  (inline modal, does NOT navigate)
  └── Document icon → ctrl.openShipment($event, shipment) → navigates to /shipments/{id}

/air-sea-shipments  (air sea shipments)
  │
  ├── Row click → /shipments/{id}
  ├── Container ID cell click → container-id-modal (inline, same page)
  └── Transit details cell click → transit details modal (inline, same page)
```

**Smart-list entry points** (bypass user-settings redirect on the list page):
- `/shipments?isNotConfirmed=true` — shows unconfirmed shipments list
- `/shipments?tpIncident=true` — shows shipments with tracking point incidents; adds Incidents column
- `/shipments?isTpDelayed=true` — shows delayed shipments
- `/shipments?withoutPod=true` — shows shipments without POD

**Detail page tab parameter:**
- `/shipments/{id}?tab=transport-requests` — opens the transport requests tab directly (loads `includeTransportRequests: true` for Shipper users)

---

## 6. Key Discoveries & Edge Cases

### 6.1 Three separate list templates share one controller
`ShipmentsCtrl` powers three different routes: `all shipments` (index.html), `pod requests` (pod-requests.html), and `air sea shipments` (air-sea-shipment.html). The `scope` param (`SCOPE_TRACKING`, `SCOPE_POD_REQUESTS`, `SCOPE_AIR_SEA_SHIPMENTS`) is injected via state params and changes which API filters and UI features are active. Documentation of any one list page must acknowledge this shared-controller pattern.

### 6.2 Board page is a completely different architecture
`board-list.html` renders a `slotify-shipments-board-list` web component — there is no standard data table. It has its own controller (`BoardListCtrl`), its own filter service (`BoardListFilter`), and different resolve data (only carriers and shipment modes, no shippers/tags/etc.). It is access-gated by `permissionsControl.accessAllowBoardShipments()` which is separate from the general tracking permission.

### 6.3 Air/sea page has unique columns not present in the standard list
The air-sea template adds: Container ID column (with inline edit modal), Transit details column (ETD port → carrier avatar → ETA port), ETD and ETA date columns with their own sort keys, and POL/POD late-detection dropdowns (Shipper only). The `bl_id` field label changes between "BL ID" and "AWB ID" depending on mode (constants `BL_ID`/`AWB_ID`).

### 6.4 POD requests page clicks do NOT navigate to the detail page
Row click on pod-requests.html calls `ctrl.openModalViewAttachments(shipment)` — an inline attachment viewer — not a route transition. The document icon (`-is-documents`) calls `ctrl.openShipment` which does navigate. This is a significant behavioral difference from all other list pages.

### 6.5 `delivered_estimate` is invisible to carriers
The `delivered_estimate` status has an empty `carrierGroup`, so it is filtered out of `getCarrierStatuses()`. Carriers will never see this status in their filter dropdown, though shipments in this state may still appear in their list.

### 6.6 `pending` POD status is invisible to shippers in the filter
`getPodStatuses()` excludes `POD_STATUS_PENDING` for shippers (`name !== POD_STATUS_PENDING`). Pending shipments still appear in the list; they just cannot be filtered by this status.

### 6.7 Milkrun (grouped) tracking points have a separate confirmation flow
`edit-tracking-point.html` has a distinct step `UPDATE_MILKRUN` that shows a table of shipments sharing the tracking point, with individual checkboxes and "Modify" links. The modal then proceeds through content update and notify-users steps. This is triggered when `ctrl.isMilkrun` is true.

### 6.8 Smart-list params bypass user-settings redirect
When any of `isNotConfirmed`, `tpIncident`, `isTpDelayed`, `withoutPod` is truthy in `$stateParams`, the `UserSettings.resolveRoute` call is skipped. This means these smart-list URLs always show the tracking list regardless of the user's saved preference (board vs. list).

### 6.9 Transport Requests tab loads additional data conditionally
On `view shipment by id`, when `tab === 'transport-requests'` AND the user is a Shipper, the resolve adds `includeTransportRequests: true` to the shipment load call. Carriers do not get this tab at all (hidden by `!ctrl.isCarrier`).

### 6.10 Detail page has a kiosk / mini-app mode
When accessed via a token URL (`ctrl.isMiniApp`), `view.html` shows a branded header with the account logo, title, subtitle, and a login button. All other functionality is still present underneath. This is for unauthenticated/limited tracking share links.

### 6.11 Multiple ACL permission constants are wired into route middleware
- `CAN_CANCEL_SHIPMENT_KEY` — controls PUT /shipments (cancel/reactivate)
- `CAN_EDIT_BOOKING_KEY` — controls content updates, rename, entity-name updates
- `CAN_SHARE_SHIPMENT_TRACKING_KEY` — controls spectator management and tracking email sharing
- `SPECTATOR_CAN_MANAGE_TRUCK_DRIVER_INFO_KEY` — controls truck driver info CRUD

These are passed via `util.putValueToAcl(...)` and enforced within the ACL middleware, not at the controller level.

### 6.12 Site shipments vs. regular shipments
There is a parallel `/site-shipments` endpoint family (list, status CRUD, Excel export) that all require `requireShipper`. This is the dock/site management view, distinct from the tracking list. It is not directly connected to a dedicated frontend route in the examined router — it likely feeds the `board-list` or a separate dock management area.

### 6.13 New Shipment modal has a blank template in the route
The `all shipments.add` state declares `template: ' '` (a single space). The actual modal HTML is served from a separate template (`views/new.html`) loaded by `NewShipmentCtrl`. The UI-router child state just provides a hook point; the controller handles the modal rendering.

### 6.14 Edit tracking point state has no template defined in the route
`all shipments.edit tracking point` has no `template` property in the state config (the template line is commented out). The controller `EditTrackingPointCtrl` presumably opens the modal programmatically via a service, not via a template bound to the state.

### 6.15 Subcontract feature visible only to Carrier with subcontracting permission
The `ctrl.canSubcontract` flag (detail page) gates a banner that lets the carrier send a PDF transport order to a sub-carrier by email and receive a copy. Subcontract data is stored as `ctrl.shipment.subcontract` and shows the subcontractor email, cost, and comment when set.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.00_domain-map`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631668869 · **repo:** `tms/shipments/00_domain-map.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

