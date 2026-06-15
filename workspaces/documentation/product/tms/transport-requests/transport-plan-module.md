---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375047
source_type: confluence
---
# Transport Plan / Transport Requests / Groups

> Сверено с кодом 2026-06-13 | `models/transport_plans.js`, `transport_requests.js`, `transport_request_groups.js`, services `transportPlans/`, `transportRequests/`, routes, frontend `transport-plan`, `transport-requests`, `transport-request-groups`

## Зачем (бизнес-контекст)

В Buy&Sell и продвинутом TMS перевозку нельзя просто «отдать первому перевозчику» — есть правила: этот перевозчик берёт только лёгкое, тот — только опасные грузы, третий — только из определённой зоны. **Transport Plan** кодирует эти правила (ограничения по весу/объёму/размерам/инкотермам/DGD + режим букинга quote/direct/preferred). **Transport Request (TR)** — единица запроса перевозки в Buy&Sell. **TR Group** — пакет TR для совместной обработки (валидация, арбитраж, букинг). Без плана распределение заявок было бы ручным и ошибочным.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| План | `transport_plans.js` | name, mode_ids, carrier_ids, **booking_mode** (quote/direct_booking/preferred), min/max по weight/CW/volume/LM/cargo_number, unit-level лимиты, exclude_stacked, insured_value, include_dangerous_goods, available_for_galaxy | 
| Запрос (TR) | `transport_requests.js` | status (NEW/ACCEPTED/ASSIGNED/GROUPED/CANCELED/DECLINED), buyer/seller/requester_account, маршрут+даты, requested_price/purchased_cost (маржа), group_id, quote_data, QuoteStatuses (PENDING/SENT/ACCEPTED/DECLINED) |
| Группа TR | `transport_request_groups.js` | status (PENDING/ARBITRATION/VALIDATED/BOOKED), carrier, mode, shipper |
| Связи | transport_plan_{cargo_types,dgd,incoterms,specificities,entities} | критерии плана |

## Где найти и настроить (UI)

| Что | Роут | Право |
|-----|------|-------|
| Transport Plans | `/transport-plan` | `tr_plan_adv` |
| Transport Requests | вкладки в shipments / `transport-requests` | `tr_request` |
| TR Groups | `transport-request-groups` | — |

API: `GET/POST/PATCH/DELETE /transport-plans` (+duplicate), `/transport-requests` (+`PUT /:action/:id`: confirm/assign/group/ungroup, send-quote, prices, excel), `/transport-request-groups` (+`:id/assign-transport-requests`, `PUT /:id/:action`: validate/arbitrate/book). Детали полей constraints и зеркалирования — в [buy-sell/orders-transport-plan](../buy-sell/orders-transport-plan.md).

## Сценарии

1. **Правило для опасных грузов**: план с include_dangerous_goods + carrier_ids=[ADR-перевозчик] → DGD-заявки идут только ему.
2. **Лимит по весу**: план max_total_weight=24т → заявки тяжелее не назначаются этому перевозчику.
3. **Арбитраж группы**: собрать TR в группу → validate → arbitrate (если конфликт) → book.

---

## 🔗 Граф-метаданные
- **id:** `tms.transport-plan`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629375047 · **repo:** `tms/transport-requests/transport-plan-module.md`
- **code_refs:** `backend/app/models/{transport_plans,transport_requests,transport_request_groups}.js`, `services/{transportPlans,transportRequests,transportRequestGroups}`, `routes/api/{transport_plan,transport_requests,transport_request_groups}.js`, `frontend/public/app/{transport-plan,transport-requests,transport-request-groups}`
- **modules:** TMS, Buy&Sell
- **references:** `tms.buy-sell.orders-transport-plan`, `tms.carriers`, `tms.features.quote-strategy`
- **requirements:** REQ-TP-001..010, REQ-BS-005..008 (Buy&Sell)
