---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632488053
source_type: confluence
---
# Shipments List — API Reference

## GET /api/v1/shipments

The main endpoint powering the shipments list page. Returns a paginated, filtered array of shipment objects.

### Middleware Chain

In the order declared in `routes/api/shipments.js`:

| Order | Middleware | What It Does |
|---|---|---|
| 1 | `acl.loadAllowedShippersForCarrierUser` | For Carrier accounts: loads the list of shipper IDs the carrier has access to into `req.acl.shipper_ids`. For Shipper accounts: no-op. |
| 2 | `acl.loadAllowedLocations` | Loads the list of address IDs the current user has access to via location-based ACL into `req.acl.locationIds`. Used to surface shipments at locations the user manages even across company boundaries. |
| 3 | `address.extendAddressForMatchMiddleware` | Parses address-related filter params from the query string (country, city, zipcode, logistic zone) and enriches `req.query` for downstream query building. |
| 4 | `ctrl.list` | Controller function: calls `getShipmentsList(db, currentUser, query, acl)`, sets `X-Total-Count` header, sends result rows. |

---

### Query Parameters

All filter parameters (except `limit`, `offset`, `sortKey`, `sortDir`, `history`, `toBeBooked`, `tracking`, `isPodRequests`, `isAirSeaShipments`) are passed as a serialized JSON string in the `filters` parameter.

#### Top-Level Parameters

| Name | Type | Required | Allowed Values | Backend Behavior |
|---|---|---|---|---|
| `tracking` | boolean | No | `true` | When `true`, enables spectator-locked locations check for users with `roles_list.includes('spectator') && user.lock` |
| `limit` | integer | No | 1–100 (enforced; if > 100 and `increaseLimit` not set, clamped to 100) | Sets Sequelize `query.limit`. Default: `10`. If `'none'`, pagination is disabled (used by Board page) |
| `offset` | integer | No | ≥ 0 | Sets Sequelize `query.offset`. Default: `0` |
| `sortKey` | string | No | `arrivalDate`, `departureDate`, `transitArrivalDate`, `transitDepartureDate`, `arrivalLocation`, `departureLocation`, `id` | Sets ORDER BY clause. Mapped in `getSortingQuery()` to Sequelize literals |
| `sortDir` | string | No | `asc`, `desc` | Sort direction. Invalid values are ignored; default is `ASC` |
| `last_deliveries` | boolean | No | `true` or `''` | When truthy: restricts to shipments with dates in last 30 days (`LAST_DELIVERIES_QUERY`). When falsy: full history returned |
| `toBeBooked` | boolean | No | `true` or `''` | When truthy: only returns shipments where `address_from.is_master = true AND is_full_day_departure = true` OR `address_dest.is_master = true AND is_full_day_arrival = true` |
| `isPodRequests` | boolean | No | `true` | Activates POD mode: adds `pod_status` attribute, applies POD status filter, restricts to `eta <= end of today`, `canceler_id IS NULL` |
| `isAirSeaShipments` | boolean | No | `true` | Activates Air/Sea mode: joins `ShipmentTransitDetail` and exposes transit detail filter fields |
| `isDeparturesNotConfirmed` | boolean | No | `true` | EXISTS subquery: tracking point of type DEPARTURE with `real_date IS NULL` |
| `isDeliveriesNotConfirmed` | boolean | No | `true` | EXISTS subquery: tracking point of type ARRIVAL with `real_date IS NULL` |
| `isTpIncident` | any truthy | No | truthy string/boolean | EXISTS subquery: tracking point where `incident IS NOT NULL` (or specific `incident_id` if `filters.incidents` set) |
| `isTpDelayed` | any truthy | No | truthy string/boolean | EXISTS subquery: tracking point where `planned_date < real_date` |
| `withoutPod` | any truthy | No | truthy string/boolean | LEFT JOIN `Attachment` (filtered to `config.attachments.smartListDefaultTypes`); WHERE attachment IS NULL |
| `shipmentIds` | array | No | Array of integer IDs | Hard-restricts `WHERE id IN (...)`. Used for contextual filters (metadata request, freight unit, serial code) |
| `freightUnitId` | integer | No | integer | Joins `ShipmentContent` where `freight_unit_id = N` (required join) |
| `serialCodeId` | integer | No | integer | Joins `SerialShippingContainerCode` on `PreShipment` where `id = N` (required join) |
| `isPickUpGrouping` | boolean | No | `true` | Enables milkrun pick-up grouping mode — restricts to `available_for_grouping = true` and shipments with no tracking real_date |
| `isMilkrun` | boolean | No | `true` | Enables milkrun-specific query additions via `addMilkrunPartToQuery()` |

#### Filters Object

Passed as `filters[value]` (JSON string) and `filters[relation]` (optional). The frontend sends this as:

```
filters[value]=[{"field_name":"mode","rule":"is","value":["road"]},...] 
filters[relation]=and|or
```

The backend parses via `convertInputFilters(input)`. Each element:
```json
{ "field_name": "string", "rule": "is|is_not|excludes|is_on_before", "value": "any" }
```

| Filter Field Name | Value Type | Backend SQL Action |
|---|---|---|
| `mode` | array of mode name strings (`"road"`, `"air"`, `"sea"`, `"groupage"`, `"express"`) | Maps names to integer IDs via `MODES_TO_ID`, then `WHERE shipment_mode_id IN (...)` |
| `status` | array of status strings | Complex compound query per status value; see `buildQueryStatuses()` |
| `carrier_id` | array of integer IDs | `WHERE carrier_id IN (...)` (Shipper accounts only via `injectFilterByAccountTypes`) |
| `shipper_id` | array of integer IDs | `WHERE shipper_id IN (...)` intersected with `acl.shipper_ids` (Carrier accounts only) |
| `externalShipperIds` | array of integer IDs | `WHERE shipper_id IN (...)` after cross-checking against `allowedPartnerAccounts` |
| `bookerIds` | array of integer user IDs | `shipment_request.user_id IN (...)` via join condition on `ShipmentRequest` include |
| `tag_list` | array of tag IDs (or `"none"` for no-tag) | Joins `ShipmentTag` and `ShipmentRequestTag`; supports IS/IS_NOT rules with complex $or/$and |
| `accounting_entity_id` | array of entity IDs (or `"none"`) | Checks `shipment_request.accounting_entity_id` OR `pre_shipment.accounting_entity_id`; `subQuery = false` required |
| `arrivalIds` | array of address IDs | `WHERE dest_address_id IN (...)` |
| `departureIds` | array of address IDs | `WHERE from_address_id IN (...)` |
| `arrivalCountries` | array of country strings | `WHERE address_dest.country IN (...)` (via `buildAddressIncludeWhere`) |
| `departureCountries` | array of country strings | `WHERE address_from.country IN (...)` |
| `arrivalZipcodes` | array of zipcode strings | `WHERE address_dest.zipcode IN (...)` |
| `departureZipcodes` | array of zipcode strings | `WHERE address_from.zipcode IN (...)` |
| `arrivalLogzones` | array of logistic zone strings | `WHERE address_dest.logistic_zone IN (...)` |
| `departureLogzones` | array of logistic zone strings | `WHERE address_from.logistic_zone IN (...)` |
| `etdLocodes` | array of LOCODE strings | Handled by `addTransitDetailsPartToQuery()` (Air/Sea only) |
| `etaLocodes` | array of LOCODE strings | Handled by `addTransitDetailsPartToQuery()` (Air/Sea only) |
| `etdCountries` | array of country strings | Handled by `addTransitDetailsPartToQuery()` (Air/Sea only) |
| `etaCountries` | array of country strings | Handled by `addTransitDetailsPartToQuery()` (Air/Sea only) |
| `departureDate` | `{ from, to }` date object | `COALESCE(rtd, etd)` between from/to (if both); `>= from` if only from |
| `arrivalDate` | `{ from, to }` date object | `COALESCE(rta, eta)` conditions |
| `creationDate` | `{ from, to }` date object | `WHERE created_at BETWEEN ...` |
| `etdDate` | `{ from, to }` date object | Transit detail ETD (Air/Sea only) |
| `etaDate` | `{ from, to }` date object | Transit detail ETA (Air/Sea only) |
| `magic_search` | string | Multi-field `ILIKE '%value%'` across: `name`, `tracking_code`, `container_name`, `external_container_id`, `bl_id`, `address_from.name/address_1/city/country`, `address_dest.name/address_1/city/country`, `id`, `sh_request_id` |
| `missingMetadata` | array of prototype IDs | EXISTS subquery on `metadata_requests` where `status = 'new'` and `prototype_id IN (...)` |
| `missingDocuments` | array of attachment type IDs | EXISTS subquery on `attachment_requests` where `status = 'new'` and `type_id IN (...)` |
| `arrivalLateDetections` | array of key strings | Not found in source — needs verification |
| `departureLateDetections` | array of key strings | Not found in source — needs verification |
| `incidents` | array of incident IDs | Used when `isTpIncident` is also set — EXISTS subquery with `t.incident_id IN (...)` |
| `transitCompaniesIds` | array of company IDs | Handled by `addTransitDetailsPartToQuery()` (Air/Sea only) |
| `shipment_ids` | array of integer IDs | `WHERE id IN (...)` via filters object |

---

### Response Shape

- **Header**: `X-Total-Count: N` — total number of matching records (for pagination)
- **Body**: JSON array of shipment objects

Each shipment object includes (selected key fields):
```json
{
  "id": 12345,
  "name": "SH-2026-001",
  "tracking_code": "ABC123",
  "status": "in_transit",
  "etd": "2026-06-01T08:00:00Z",
  "eta": "2026-06-03T16:00:00Z",
  "rtd": "2026-06-01T08:30:00Z",
  "rta": null,
  "canceler_id": null,
  "from_address_id": 100,
  "dest_address_id": 200,
  "sh_request_id": 9000,
  "quote_request_id": 8000,
  "pre_shipment_id": 7000,
  "shipper_id": 50,
  "carrier_id": 60,
  "shipment_mode_id": 1,
  "is_multicontainer": false,
  "container_name": null,
  "bl_id": null,
  "external_container_id": null,
  "pod_status": "pending",
  "is_full_day_departure": false,
  "is_full_day_arrival": false,
  "available_for_grouping": true,
  "shipment_mode": { "id": 1, "name": "road", "icon": "-is-truck" },
  "address_from": { "id": 100, "name": "Paris Warehouse", "city": "Paris", "country": "France", ... },
  "address_dest": { "id": 200, "name": "Berlin Hub", "city": "Berlin", "country": "Germany", ... },
  "shipper": { "id": 50, "name": "Acme Corp", "logo_img": "..." },
  "carrier": { "id": 60, "name": "Fast Transport", "logo_img": "..." },
  "shipment_request": {
    "id": 9000,
    "name": "Booking 2026-001",
    "accounting_entity_id": null,
    "booking_source": "manual",
    "shipper_internal_name": null,
    "comment": null
  },
  "pre_shipment": { "transport_request_id": null },
  "contents": [...],
  "claims": [...],
  "incoterms": [...],
  "milkrun_group_data": null,
  "slots": [],
  "isNotOwn": false,
  "isShared": false,
  "accountName": null
}
```

The frontend then passes each row through `formatterShipment()` which computes derived display fields: `from`, `dest`, `startDateStr`, `endDateStr`, `trackingStatus`, `statusClass`, `description`, `tooltip`, etc.

---

### Role-Based Query Scoping

Access control is the core of the query. All queries must match at least one of the following `$or` conditions:

**For Shipper accounts:**
- `shipper_id = currentAccount.shipper_id` — own shipments
- OR `from_address_id IN (acl.locationIds)` — shipments departing from managed locations
- OR `dest_address_id IN (acl.locationIds)` — shipments arriving at managed locations
- OR Booker condition: shipments where the account is the `booker_account_id` on the booking
- OR Spectator condition: `pre_shipment_id IN (SELECT pre_shipment_id FROM sh_request_spectators WHERE account_id = N AND is_active = true)`

**For Carrier accounts:**
- `carrier_id = currentAccount.carrier_id AND shipper_id IN (acl.shipper_ids)` — own shipments for allowed shippers
- OR `from_address_id IN (acl.locationIds)` — shipments at carrier-managed locations
- OR `dest_address_id IN (acl.locationIds)` — shipments at carrier-managed locations
- OR Booker and Spectator conditions (same as above)

**For Spectator accounts with `lock = true`:**
Additionally filtered by `user_default_locations` — the spectator only sees shipments at their pre-configured locations.

---

## GET /api/v1/shipments-info

Returns aggregate count information. Used by the navigation header to display shipment counts (e.g. for status badges).

### Middleware Chain

| Order | Middleware | What It Does |
|---|---|---|
| 1 | `acl.loadAllowedShipperDivisionsForShipperUser` | For Shipper: loads allowed shipper division IDs |
| 2 | `acl.loadAllowedShipperDivisionsForCarrierUser` | For Carrier: loads allowed shipper divisions |
| 3 | `acl.loadAllowedCarrierDivisionsForCarrierUser` | For Carrier: loads allowed carrier divisions |
| 4 | `acl.loadAllowedCarrierDivisionsForShipperUser` | For Shipper: loads allowed carrier divisions |
| 5 | `acl.loadAllowedShippersForCarrierUser` | For Carrier: populates `acl.shipper_ids` |
| 6 | `ctrl.shipmentsInfo` | Calls `shipmentsInfo(req)`, returns `{ shipmentsForCount: N }` |

### Response Shape

```json
{
  "shipmentsForCount": 42
}
```

### Notes

`shipmentsInfo(req)` is implemented in `serviceShipments` using `buildShipmentInfoQuery()` — a count-only variant of the main list query. The exact filter set applied mirrors the same filter logic but uses `db.Shipment.count()` instead of `findAndCountAll()`.

---

## GET /api/v1/shipments-excel

Generates and stores an Excel file with the current filtered shipment list in S3, returning pre-signed URLs for download.

### Middleware Chain

| Order | Middleware | What It Does |
|---|---|---|
| 1 | `acl.loadAllowedShippersForCarrierUser` | Populates `acl.shipper_ids` for Carrier accounts |
| 2 | `acl.loadAllowedLocations` | Populates `acl.locationIds` |
| 3 | `ctrl.shipmentsExcel` | Async: generates S3 URLs, runs `shipmentsExport()`, returns URL pair |

### Query Parameters

Accepts the same filter parameters as `GET /api/v1/shipments`. The frontend sends `query.limit = ctrl.total_items` (all records) plus all active filters.

### Response Shape

```json
{
  "url": "https://s3.example.com/tmp/STY - SH - 2026-06-08_abc123.xlsx?...",
  "headUrl": "https://s3.example.com/tmp/STY - SH - 2026-06-08_abc123.xlsx"
}
```

The frontend polls `S3.objectExists(res.headUrl)` (HEAD request) every 3 seconds until the file is available at S3, then redirects `window.location = res.url`.

### File Naming

`STY - SH - YYYY-MM-DD_<6-char-random-hex>.xlsx`

### Constraints

- Called only for Shipper accounts OR Carrier accounts not in history mode (frontend gate: `ctrl.isShipper || (ctrl.isCarrier && !ctrl.search.history)`)
- For the incident smart-list (`isTpIncident`), the export is delegated to `TrackingPoints.exportTrackingPointByShipmentsToExcel` → `GET /api/v1/tracking-points-excel` instead

---

## PATCH /api/v1/shipments (Bulk Update)

Used by the driver assignment modal to assign a driver to multiple shipments at once.

### Middleware Chain

No middleware — directly calls `ctrl.bulkUpdate`.

### Request Body

```json
{
  "shipment_ids": [123, 456, 789],
  "driver_id": 99
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `shipment_ids` | array of integers | Yes | List of shipment IDs to update |
| `driver_id` | integer | Yes | The driver user ID to assign |

### What Can Be Bulk Updated

Only driver assignment is exposed from the list page. The `bulkUpdate` action maps to `PATCH /api/v1/shipments` and in the controller delegates to the bulk update service logic.

### Response

Array of updated shipment objects (`isArray: true` in the Angular resource definition).

### After Success

Frontend calls `routerGo('all shipments', {}, { reload: true })` — navigates to the list and forces a full reload.

---

## PATCH /api/v1/shipments/:id/driver

Assigns a single driver to a single shipment.

### Middleware Chain

No middleware in route definition — directly `ctrl.assignDriver`.

### Request Body

```json
{
  "driver_id": 99
}
```

### Response

Updated shipment object (not array).

---

## Additional Related Endpoints (Not Primary List Endpoints)

These endpoints are referenced in the `Shipments` Angular service and may be called from related actions on the list page:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/shipments-labels/:id` | Generate shipment labels PDF (requires `auth.api.requireCollaborative`) |
| `GET` | `/api/v1/shipments-single-label/:id` | Single label PDF |
| `POST` | `/api/v1/shipments/:id/integrations/:integration_name` | Push shipment to an external integration |
| `GET` | `/api/v1/dock-shipments` | Dock-view shipments (site-level) |
| `GET` | `/api/v1/shipments/metadata-requests` | Shipments with pending metadata requests (paginated list with `X-Total-Count`) |
| `GET` | `/api/v1/shipments/attachment-requests` | Shipments with pending attachment requests |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_list.api`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632488053 · **repo:** `tms/shipments/01_list/api.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

