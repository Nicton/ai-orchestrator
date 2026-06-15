---
title: Carrier Billing Rules
source_type: confluence
confluence_url: https://shiptify.atlassian.net/wiki/search?text=Carrier%20Billing%20Rules&spaces=BILL
---

# Carrier Billing Rules

Billing rules determine how each shipment is priced based on carrier type, lane, weight
break, and accessorials.

## Rule resolution order

1. Contract-specific override (customer + carrier).
2. Carrier-type tariff (the most common path).
3. Default fallback tariff (flagged as a billing risk; alerts the finance team).

## Editing rules

Rules are managed in the Billing Admin UI and versioned. Each change requires a second
approver from Finance. Changes take effect at the next billing cycle, not immediately.

## Related

- A change in carrier types almost always requires a matching billing rule. See the
  TMS carrier-type onboarding checklist.
- Disputes are tracked in Jira project BILL.
