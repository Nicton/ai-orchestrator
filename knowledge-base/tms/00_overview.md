# TMS scope extracted from MA-2026-05-25 test cases

This folder summarizes the **Transport Management System (TMS)**-related scope inferred from the mobile app test cases file:
`/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json`.

## What is considered “TMS” here
Only functionality directly connected to planning, booking, executing, tracking and managing transport shipments/loads was included, such as:

- Shipment/booking creation (wizard flows, drafts, ready-to-book)
- Quote requests / direct bookings / award flows
- Carrier interaction (carrier-side booking details, actions)
- Slot booking
- Planning & replanning tracking points
- Tracking (ETA, milestones, location/date updates, public tracking)
- Shipment collaboration features tied to execution (spectators/followers, metadata, attachments, chat references)
- TMS master data supporting execution (locations / “master location”)

Non-TMS generic app functionality (pure UI cosmetics, unrelated settings, etc.) is intentionally not modeled unless it is explicitly tied to transport execution.

## Outputs
- **01_taxonomy.md** – proposed TMS domain/module taxonomy derived from test titles
- **02_glossary.md** – abbreviations encountered in titles/descriptions (expanded when inferable)
- **03_roles.md** – user roles and capabilities evidenced by the test cases
