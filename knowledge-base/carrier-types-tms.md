---
title: Adding a New Carrier Type in TMS
source_type: confluence
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TMS/pages/100101/Carrier+Types
---

# Adding a New Carrier Type in TMS

When a new carrier type is introduced in the TMS (Transport Management System), the
following systems are affected and must be updated in order:

1. **Carrier Master Service** — owns the canonical list of carrier types. A new type is
   added here first via the Carrier Type registry.
2. **Rating & Billing Engine** — billing rules are keyed by carrier type. A new type
   without a billing rule will fall back to the default tariff, which is almost always wrong.
3. **Booking API** — validates the carrier type on inbound booking requests. New types
   must be added to the allowed-values enum or bookings are rejected with `CARRIER_TYPE_UNKNOWN`.
4. **Tracking Integrations** — each carrier type maps to a tracking provider adapter. Missing
   adapters degrade gracefully to manual tracking.
5. **Reporting / Data Warehouse** — dimension tables must include the new type or reports
   will group it under "Unknown".

## Dependencies

- Carrier Master Service is the upstream source of truth.
- Billing and Booking both consume Carrier Master via the daily sync and the change-event topic.

## Risks

- Forgetting the billing rule is the most common production incident for new carrier types.
- Tracking adapter gaps are low-severity but visible to customers.
