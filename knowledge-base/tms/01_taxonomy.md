# TMS taxonomy (derived from MA-2026-05-25 test cases)

This taxonomy is built by clustering recurring test-case titles/phrases (e.g., *CSW*, *Booking*, *SR/QR*, *Tracking*, *PML/Master Location*, *Spectators*).

## 1. Identity & access (TMS personas)
- Login as **shipper** / **carrier** / **multi-account**
- Switching active account within multi-account

## 2. Shipment / booking creation (pre-shipment)
### 2.1 Create Shipment Wizard (CSW)
- Creating a **Shipment Request** (SR)
- Creating a **Quote Request** (QR)
- Creating **Draft** bookings
- Creating **Ready-to-book** (RTB) bookings
- Date handling inside CSW (pick-up/delivery date pickers)
- Spectators selection during creation (spectators dropdowns)

### 2.2 Slot booking
- Slot booking flow from shipper side (multi-step modal)
- Selecting date/time slot, confirming slot booking

## 3. Quote management & award
- Requesting quotes to one/multiple carriers
- Auto-quote flows (enter prices → save quote → award)
- “Waiting quote” state behaviors (e.g., date behavior on booking details)

## 4. Booking confirmation & tendering
- Direct booking vs request-a-quote branching
- Auto-confirm SR/QR resulting in a created shipment
- Carrier selection step during booking (shipper side)

## 5. Shipment lifecycle & status model
Evidence of distinct operational states in tests:
- Draft
- Ready to book (RTB)
- Waiting quote
- Booked
- Cancel / cancellation outcomes (appears in abbreviations)

## 6. Execution planning & replanning
- Replan of tracking points (e.g., loading tracking point datepicker)
- Planning references in exports (tracking/planning export)

## 7. Tracking & visibility
### 7.1 Tracking list & tracking tab
- Tracking list access from shipper/carrier/spectator sides
- Tooltip behavior in tracking list

### 7.2 Milestones, ETA & updates
- ETA timing after auto-confirm
- Update location and date
- (Implied) milestone lists (ML) and/or transport plan (TP)

### 7.3 Public tracking
- Public Tracking page

## 8. Collaboration on shipments (execution context)
### 8.1 Spectators / followers
- Assign spectators at pre-shipment level
- Select spectators from dropdown
- Spectator followers block
- Shared shipments lifecycle when spectator connection is deleted/restored
- Spectator access rules for related shipments (e.g., “brothers” / multi-containers)

### 8.2 Metadata & attachments (shipment-level)
- Share metadata / request metadata
- Missing spectator followers in metadata / attachments (permission propagation)

### 8.3 Chat (shipment collaboration)
- Tests indicate chat participants/followers should include spectators in some contexts

## 9. Documents & proof
- POD referenced (proof-of-delivery)
- PDF exports referenced

## 10. Master data supporting TMS execution
### 10.1 Locations / Master Location (PML)
- Public Master Location user
- Create / update / delete location
- Country/LOCODE references (location standardization)

### 10.2 Equipment / shipment characteristics (inferred)
- FTL/LTL/FCL referenced (transport mode/service characteristics)
- Weight units (KG)

---

## Notes / assumptions
- Some abbreviations (e.g., **ML**, **TP**, **PSH**, **BK**) appear frequently but are not explicitly defined in the test-case text; expansions are marked as inferred/unknown in the glossary.
- Although some tests touch collaboration (spectators, chat, metadata), they are included **only where clearly shipment-execution related**.
