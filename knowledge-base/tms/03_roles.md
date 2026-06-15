# TMS user roles & capabilities (evidence from MA-2026-05-25 test cases)

This is a role list strictly derived from what the test titles/descriptions imply users can do.

## Shipper
**What the shipper can do (from tests):**
- Authenticate/login as shipper
- Create shipments/bookings via CSW:
  - Create **SR** (Shipment Request)
  - Create **QR** (Quote Request)
  - Save **Draft**
  - Save **Ready-to-book (RTB)**
- Perform **Direct booking** and select carrier(s)
- Request quotes from one or multiple carriers
- Use **Slot Booking** flow (book a slot by selecting date/time and confirming)
- Auto-confirm SR/QR flows that result in shipment creation
- View tracking list / tracking tab for shipments
- Export tracking/planning information (implied by “Export from tracking, planning”)
- Manage shipment-level collaboration inputs:
  - Assign/select **spectators** during booking creation
  - Share/request metadata (shipment-level)

## Carrier
**What the carrier can do (from tests):**
- Authenticate/login as carrier
- View booking details for shipments in various states (e.g., “Waiting quote”, “Booked”)
- Participate in quote flow:
  - Provide quote prices (auto-quote flow implies carrier-side quoting actions)
- Replan certain execution details (tests mention replanning datepicker “as carrier”)
- View shipment tracking and related details

## Multi-account user
A user identity that can access multiple accounts/tenants.

**What the multi-account user can do (from tests):**
- Authenticate/login as multi-account
- Switch between accounts (“Switching accounts in multi-account”)

## Spectator (shipment viewer / follower)
A role with constrained visibility into shipments, intended for stakeholders who should be able to follow execution without full shipper/carrier permissions.

**What the spectator can do (from tests):**
- Access shipments shared with them (“shared shipments on spectator side”)
- Open tracking tab and tracking list on spectator side
- See tooltips / read-only tracking UI elements

**Permission/visibility rules implied by tests:**
- Spectators are assignable at **pre-shipment** level (during booking creation)
- Spectator access can extend across related shipments (e.g., “multicontainers … access to brothers”)
- When a spectator connection is deleted, shared shipments/templates may be removed; when restored, they reactivate
- Spectators should appear as followers in shipment collaboration surfaces (chat, attachments, metadata) — multiple tests check for “missing spectator followers”
- Certain keys/fields may be hidden for spectators (e.g., “FU - keys are not displayed from spectators”)

## Public tracking user (anonymous/external)
**What a public user can do (from tests):**
- View **Public Tracking page** (read-only shipment tracking visibility)

## Public Master Location (PML) user
Role implied by: “Public Master Location (PML) user”.

**What this user can do (from tests):**
- Manage locations:
  - Create new location
  - Update existing location
  - Delete existing location

---

## Open questions
- Whether “PML user” is a dedicated persona or a permission set within shipper/admin accounts.
- Definitions for abbreviations **ML/TP/PSH/FU** could further refine role entitlements.
