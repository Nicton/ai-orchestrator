---
title: Roles and Permissions
source_type: confluence
confluence_url: https://shiptify.atlassian.net/wiki/search?text=Roles%20and%20Permissions&spaces=SEC
status: approved
---

# Roles and Permissions

This is the authoritative reference for user roles and their permissions in the platform.

## Roles

- **Admin** — full access. Manages users, roles, billing rules, and system configuration.
  Can view all data and the admin console.
- **Manager** — operational access. Can create and edit shipments, view billing, and run
  reports, but cannot manage users or change system configuration.
- **Operator** — day-to-day execution. Can create and update shipments and bookings, and
  view tracking. Cannot edit billing rules or run financial reports.
- **Viewer** — read-only. Can view shipments, tracking, and reports. No write access.
- **Client** — external. Can view only their own shipments and submit support requests.

## Permission matrix

| Capability | Admin | Manager | Operator | Viewer | Client |
|---|---|---|---|---|---|
| Manage users & roles | ✅ | – | – | – | – |
| Edit billing rules | ✅ | – | – | – | – |
| Create/edit shipments | ✅ | ✅ | ✅ | – | – |
| View billing & financial reports | ✅ | ✅ | – | – | – |
| View tracking | ✅ | ✅ | ✅ | ✅ | own only |
| Submit support request | ✅ | ✅ | ✅ | ✅ | ✅ |

## Rules

- Roles are assigned per user and are mutually inclusive only through the Admin role.
- Permission checks are enforced server-side on every API call, not only in the UI.
- A user with no explicit role defaults to **Viewer**.
- Elevated actions (billing edits, user management) require a second factor at login.

## Related

- Billing rule editing requires the `Edit billing rules` permission — see Carrier Billing Rules.
- Permission changes are audited and visible in the admin history.
