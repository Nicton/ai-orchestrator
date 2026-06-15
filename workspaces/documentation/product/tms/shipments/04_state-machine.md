---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631341192
source_type: confluence
---
# Shipments — State Machine

> Generated: 2026-06-08  
> Sources: shipment.js model, shipments.js service, update_shipments_statuses.js cron, tracking.js service, statuses.js (frontend), constants.js (frontend)

---

## 1. Status Values

There are two distinct "status" concepts on every shipment:

- **`status`** — DB-persisted field set by cron and tracking point confirmation. Represents "what actually happened."
- **`calculateShipmentStatusString`** — computed display status calculated at read-time from `status`, date fields, and `booking_source`. This is what the UI renders.

### 1a. DB Status Values (`Shipment.Statuses`)

Defined in `app/models/shipment.js`:

| Status (DB value) | Constant | Notes |
|---|---|---|
| `new` | `NEW` | Backend-only; not in frontend statusList. Created by import. |
| `planned` | `PLANNED` | Not yet departed (etd in future or no rtd). |
| `in_transit` | `IN_TRANSIT` | Departure tracking point confirmed (rtd set). |
| `delivered` | `DELIVERED` | Arrival TP confirmed (rta set) or eta passed (cron). |
| `canceled` | `CANCELED` | Represented by `canceler_id IS NOT NULL` — see edge case 8.1. |

Note: `statuses_matrix = {}` — no machine-enforced transitions in the model.

### 1b. Display / Computed Status Values

Produced by `calculateShipmentStatusString()` (backend) and `calculateShipmentStatus()` (frontend). **Never written by cron.**

| Display Status | i18n Key | Group | Carrier group |
|---|---|---|---|
| `planned` | `shipment_status.planned` | `shipment_status_group.planned` | same |
| `expected_pick_up` | `shipment_status.expected_pick_up` | `shipment_status_group.planned` | same |
| `slot_confirmed` | `shipment_status.confirmed_slot` | `shipment_status_group.planned` | same |
| `in_transit_estimate` | `shipment_status.in_transit_estimate` | `shipment_status_group.in_transit` | same |
| `in_transit` | `shipment_status.in_transit` | `shipment_status_group.in_transit` | same |
| `expected_delivery` | `shipment_status.expected_delivery` | `shipment_status_group.in_transit` | same |
| `delivered_estimate` | `shipment_status.delivered_estimate` | `shipment_status_group.delivered` | **empty — hidden from carriers** |
| `delivered` | `shipment_status.delivered` | `shipment_status_group.delivered` | same |
| `canceled` | `shipment_status.cancelled` | `shipment_status_group.cancelled` | same |

### 1c. POD Status CSS classes (frontend `statuses.js`)

| POD Status | CSS class |
|---|---|
| `pending` | `gray` |
| `expected` | `blue-light` |
| `loaded` | `green-light` |
| `approved` | `green` |
| `declined` | `red` |

---

## 2. State Transition Diagram

```
                 ┌──────────────────────────────────────────────────┐
                 │         CANCEL (any status)                       │
                 ▼                                                    │
[created] ──► planned ──────────────────────────────────────────► canceled
               │                (cron: etd >= now && !rtd)            ▲
               │                                                      │
               │  [departure TP confirmed: rtd set]                   │
               ▼                                                      │
            in_transit ──────────────────────────────────────────────►│
               │                                                      │
               │  [arrival TP confirmed: rta set]                     │
               │  [or: cron detects now > eta && eta >= etd]          │
               ▼                                                      │
            delivered ──────────────────────────────────────────────►  │
                                                                       │
          canceled ──► [reactivate] ──► planned/in_transit (re-calc)   │

── DISPLAY OVERLAYS (computed at read-time, never stored) ────────────────

canceler_id IS NOT NULL                              ──► canceled (priority 1)
is_pick_up_expected && !rtd && etd < now             ──► expected_pick_up
is_delivery_expected && !rta && eta < now            ──► expected_delivery
booking_source=slotbook + status in {planned,in_transit} ──► slot_confirmed
status=in_transit && !rtd && eta < now && !slotbook  ──► in_transit_estimate
status=delivered && !rta && eta < now                ──► delivered_estimate
```

---

## 3. Transition Rules

### [any] → `canceled`

- **Trigger**: `PUT /api/v1/shipments/:id` with `{ canceler_id: <userId>, event: "sh-status-canceled" }`
- **Who**: Any auth user with access; `CANCELLATION_MANAGEMENT` rights checked in frontend modal
- **Conditions**: `shipment.canceler_id` must be null — throws `BadRequestError('shipment already cancel')` if already canceled
- **Code path**: `controllers/api/shipments.js → update()` → `services/shipments.js → updateShipmentByInput()` with `SH_CANCELED_EVENT`
- **DB change**: `canceler_id = userId`, `cancellation_data = { comment, reason, date }`. **`status` field is NOT changed.**
- **Side effects**:
  1. `cancelShipmentRequestById(sh_request_id)` — cancels associated request
  2. `cancelShipmentSlotsVisits()` → `cancelEmptySlots()` — cancels slot bookings
  3. `processUpdateTransportRequestSeller()` with `DE_ASSIGN`
  4. `freeShipmentsFromMilkrunGroups()`
  5. Email: `notifyShipmentCanceled()` — always
  6. Email: `notifySlotBookingCanceled()` — conditional (not sent if canceler = carrier who booked)
  7. Chat post: `MsgPost.Types.ACTION` with `cancellationData`
  8. Integrations (fire-and-forget, failures suppressed): Heppner, P44, UPS, Brinks, FedEx, Teliae, webhook, SAP

**Request body**:
```json
{
  "canceler_id": 123,
  "event": "sh-status-canceled",
  "comment": "optional",
  "reason": "optional",
  "is_last_minute_cancellation": false
}
```

---

### `canceled` → `planned` / `in_transit` (reactivate)

- **Trigger**: `PUT /api/v1/shipments/:id` with `{ canceler_id: null, event: "sh-status-reactivated" }`
- **Code path**: `services/shipments.js → updateShipmentByInput()` detects `notificationEvent === "sh-status-reactivated"` → `reactivateShipmentRequestSlotsVisits()`
- **DB change**: `canceler_id = null`, `cancellation_data = null`. `status` field NOT reset — recalculated from dates on next read.
- **Side effects**: `reactivateSlotsWithVisits()`, chat post, `webhookReactivateShipment()`

---

### `planned` → `in_transit`

- **Trigger**: Departure tracking point confirmed — `real_date` set on `Tracking` record with `type = 'departure'`
- **Who**: Carrier (typically)
- **Code path**: `services/tracking.js → updateTrackingPoint()` → `updateShipmentDepartureTime()` → sets `shipment.rtd` → `calculateStatus()` returns `'in_transit'`
- **Side effects**: `etd` updated, `ShipmentEventsBus.emit(PickUp)`, `confirmTrackingPoint()`, chat, notifications, integrations: webhook/SAP/Dimotrans/Terrial/P44/Ecotransit

---

### `in_transit` → `delivered`

**Trigger A — TP confirmation** (with `rta`):
- `real_date` set on arrival `Tracking` record or highest-position TP
- Code: `services/tracking.js → updateShipmentArrivalTime()` → `rta` set → status `'delivered'`
- Side effects: `ShipmentEventsBus.emit(Deliver)`, Kafka `emitShipmentDelivered`, `processDeliveryOrder()`, chat, notifications, webhook/SAP

**Trigger B — Cron (silent, no `rta`)**:
- Cron detects `now > eta && eta >= etd`
- Code: `cron/update_shipments_statuses.js → Shipment.update({ status: 'delivered' })`
- Side effects: **none** — only writes `status`. No emails, no events, no webhooks.

---

## 4. Tracking Point Types and Effect on Status

Primary model: `db.Tracking` (table: `tracking`). `db.TrackingPoint` (table: `tracking_points`) is legacy — does NOT drive status transitions.

| Tracking type | DB value | Effect when `real_date` set |
|---|---|---|
| `DEPARTURE` | `'departure'` | `updateShipmentDepartureTime()` → `rtd` set → `'in_transit'` |
| `ARRIVAL` | `'arrival'` | `updateShipmentArrivalTime()` → `rta` set → `'delivered'` |
| max-position TP | any | Same as ARRIVAL when no higher TP exists |
| `PICKUP` (code=`DEPARTURE_STY_CODE`) | `'pickup'` | Emits `ShipmentEvents.PickUp` bus event |
| `DELIVERY` (code=`ARRIVAL_STY_CODE`) | – | Emits `ShipmentEvents.Deliver` + Kafka `emitShipmentDelivered` |
| `CARGO_READY`, `CUSTOMS`, `BOARDING` etc. | various | Informational — no status change |

---

## 5. Cancel / Reactivate Flow

### Cancel

| Aspect | Detail |
|---|---|
| **Who** | Any auth user with access |
| **Status restriction** | None — any status (including `delivered`) can be canceled |
| **Tracking points** | NOT modified |
| **Slots** | `cancelShipmentSlotsVisits()` — all associated slots canceled |
| **DB write** | `canceler_id = userId`, `cancellation_data`. `status` field untouched. |
| **Emails** | `notifyShipmentCanceled()` (always) + `notifySlotBookingCanceled()` (conditional) |
| **Integrations** | Heppner, P44, UPS, Brinks, FedEx, Teliae, webhook, SAP — fire-and-forget |

### Reactivate

| Aspect | Detail |
|---|---|
| **DB write** | `canceler_id = null`, `cancellation_data = null`. `status` NOT reset. |
| **Tracking points** | NOT modified |
| **Slots** | `reactivateShipmentRequestSlotsVisits()` → `reactivateSlotsWithVisits()` |
| **Side effects** | Chat post, `webhookReactivateShipment()` |

---

## 6. Cron: `updateShipmentStatuses`

**File**: `app/cron/update_shipments_statuses.js`  
**Schedule**: External (OS cron / K8s CronJob) — not defined in source  
**Batch size**: 1000 shipments per run  
**Query scope**: `status != 'delivered'` AND has `QuoteRequest`. **No `canceler_id IS NULL` filter.**

**`calculateStatus(shipment)` logic (cron only)**:

```
if (rta is set)                         → 'delivered'
if (eta && now > eta && eta >= etd)     → 'delivered'
if (etd && etd >= now && !rtd)          → 'planned'
if (etd && rtd)                         → 'in_transit'
fallback                                → 'in_transit'
```

**Side effects**: **None** — only writes `status` field.

---

## 7. POD Status State Machine

Field: `shipment.pod_status`, default: `'pending'`.

```
pending ──► loaded ──► approved
              │
              └──► declined
              ▲
         (new doc after declined)
```

| From | To | Trigger | Who |
|---|---|---|---|
| `pending` | `expected` (virtual) | Query with `isPodRequests=true` + `allow_pod_requests=true` | Shipper display only |
| `pending` | `loaded` | POD attachment uploaded | Any auth user |
| `loaded` | `approved` | Any attachment status → `approved` | Shipper |
| `loaded` | `declined` | ALL attachments → `declined` | Shipper |
| `approved`/`declined` | `loaded` | New attachment uploaded | – |
| any | `pending` | All attachments removed | – |

**`buildPodStatus()` logic** (`services/attachments/helpers.js`):
1. No documents → `'pending'`
2. Any `attachment_status = 'approved'` → `'approved'`
3. ALL documents `= 'declined'` → `'declined'`
4. Otherwise → `'loaded'`

---

## 8. Edge Cases & Non-Obvious Rules

**8.1** `status` field ≠ cancel state. Cancel is represented by `canceler_id IS NOT NULL`. The `status` field is never set to `'canceled'` by any cancel operation.

**8.2** Cron processes canceled shipments. No `canceler_id IS NULL` guard — a canceled shipment's `status` field gets overwritten by the cron. Invisible to users (display always shows `canceled`), but makes the raw `status` column unreliable for canceled records.

**8.3** Four display statuses never written to DB: `expected_pick_up`, `expected_delivery`, `slot_confirmed`, `in_transit_estimate`, `delivered_estimate`.

**8.4** Two `calculateStatus` functions with different behavior: cron version (`calculateStatus`) has no `canceler_id` check; display version (`calculateShipmentStatusString`) has full overlay logic including `canceler_id`, `is_pick_up_expected`, `booking_source`, etc.

**8.5** `in_transit_estimate` requires DB `status = 'in_transit'`. A `planned` shipment with past `eta` will NOT show `in_transit_estimate`.

**8.6** `delivered_estimate` sequence: cron writes `status = 'delivered'` (no `rta`) → display sees `delivered + !rta` → renders `delivered_estimate`.

**8.7** `slot_confirmed` only applies while `status` is `planned` or `in_transit`.

**8.8** Cancel does not clear `rtd` / `rta`. Reactivated shipments retain tracking dates.

**8.9** `is_pick_up_expected` / `is_delivery_expected` are one-way flags. Set via `remindTracking()`. No code path found to reset to `false`.

**8.10** Cancel integrations are fire-and-forget. `runCancelShipmentIntegrations()` failures are suppressed.

**8.11** `db.TrackingPoint` model is legacy. All status logic uses `db.Tracking`.

**8.12** `new` status has no UI representation. Falls through `calculateShipmentStatusString()` to `return status || ''`.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.04_state-machine`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631341192 · **repo:** `tms/shipments/04_state-machine.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

