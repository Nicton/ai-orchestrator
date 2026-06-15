---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375095
source_type: confluence
---
# Billing Accounts / MRR Lines — биллинг клиентов

> Сверено с кодом 2026-06-13 | BO `models/BillingAccount*.js`, `routes/api/billing_accounts.js`, client billingAccounts/billingMrrLines

## Зачем (бизнес-контекст)

Shiptify зарабатывает на подписке (MRR) и разовых сделках (spot). Чтобы выставлять счета и считать выручку, нужен биллинг-аккаунт с правилами тарификации по типам услуг (TM/DOCK/OPTION/PARCEL/TRACK/BUY_SELL), частотой инвойсинга, НДС. MRR-линии фиксируют регулярный доход и его динамику (upgrade/downgrade/churn) — основа финансовой аналитики и связки с Sales.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Billing account | `BillingAccount.js` | galaxy_id, monthly_fee/min, max_shipments, invoicing_frequency/day, vat, payment_term, is_active |
| MRR-линия | `BillingAccountMrrLines.js` | **type** (TM/DOCK/OPTION/PARCEL/TRACK/BUY_SELL), date_from/to, total_price, **status** (CHURN/DOWNGRADE/UPGRADE), main_mrr_line_id (иерархия) |
| Правила по типу | `BillingAccountMrrRule{Tms,Docks,Option,Parcels,Tracks,BuySell}.js` | mode, count_shipments, price |
| Spot | `BillingAccountSpots.js` | name, total_price, date — разовый платёж |

Связь с Sales — через `galaxy_id` (нет прямого FK).

## Где найти (UI Back-Office)

| Что | Роут |
|-----|------|
| Billing accounts | `/billing-accounts`, `/billing-accounts/:id` |
| MRR lines | `/billing-mrr-lines` |

API: `/billing-accounts` (+contacts/mrr-line/spot), `/billing-accounts/:id/mrr-line/:id/status` (CHURN/UPGRADE/DOWNGRADE).

## Сценарии

1. **Подписка клиента**: billing account + MRR-линия type=TM с правилами (mode×count×price) → регулярный инвойсинг.
2. **Upgrade**: новая MRR-линия со status=UPGRADE, ссылка на main_mrr_line_id → история роста.
3. **Разовая сделка**: spot (name+price+date) вне регулярного MRR.

---

## 🔗 Граф-метаданные
- **id:** `back-office.billing-accounts`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629375095 · **repo:** `back-office/billing-accounts/billing-module.md`
- **code_refs:** `back-office/server/models/{BillingAccount,BillingAccountMrrLines,BillingAccountSpots,BillingAccountMrrRuleTms}.js`, `routes/api/billing_accounts.js`, `client/containers/{billingAccounts,billingAccount,billingMrrLines}.tsx`
- **modules:** Back-Office, Galaxy
- **references:** `back-office.sales-accounts`, `tms.galaxy`
- **requirements:** нет — реализовано без требований
