---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375063
source_type: confluence
---
# Cost Segments & External Costs — статьи затрат

> Сверено с кодом 2026-06-13 | `models/cost_segments.js`, `external_costs.js`, `sub_rate_settings.js`, services, routes, frontend `cost-segments`, `external-costs`

## Зачем (бизнес-контекст)

Стоимость перевозки — не одно число: фрахт, топливный сбор, страховка, обработка. Чтобы корректно считать, выставлять и сверять, затраты нужно структурировать. **Cost Segment** — статья затрат (с API-кодом и правилом распределения dispatch_scope), связанная с price detail рейтшита и инвойсингом. **External Costs** — дополнительные затраты на заявку сверх базовой ставки. Без этого нельзя ни построить рейтшит с разбивкой, ни распределить консолидированную стоимость по SR.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Статья затрат | `cost_segments.js` | account, price_detail_id, **api_code** (уникальный), **dispatch_scope** (cargo_units/surface/weight/chargeable_weight/weight_fallback/transport_request_number/unique_entities), default/active_modes, incoterms |
| Внешний затрат | `external_costs.js` | shipper, sh_request, type_id, initial_cost, cost, валюты, comment |
| Dispatch/Grouping scopes | `sub_rate_settings.js` | DispatchScopes + GroupingScopes (BOOKING/LEG/TR/TRG) |
| Справочник типов | `dict_external_cost_types.js`, `account_external_cost_types.js` | типы внешних затрат |

`dispatch_scope` — то самое правило, по которому консолидированная стоимость распределяется по SR (см. [retro-consolidation](../features/retro-consolidation.md)).

## Где найти и настроить (UI)

| Что | Роут | Право |
|-----|------|-------|
| Cost Segments | `/cost-segments` | `cost_segm` |
| External Costs | директивы на SR (форма/попап) | `ext_costs` |
| Типы внешних затрат | `/dicts` (account-external-cost-types) | — |

API: `GET/POST/PATCH/DELETE /cost-segments` (+`/api-code` валидация), `/external-costs/:sh_request_id` (+`/total`, `/types`, PUT replace).

## Сценарии

1. **Разбивка ставки**: cost segments (Freight, Fuel, Handling) с dispatch_scope=weight → рейтшит и инвойс структурированы по статьям.
2. **Доп. затрата на заявку**: добавить external cost (type=Insurance, сумма) → попадает в расчёт стоимости SR.
3. **Распределение консолидации**: dispatch_scope сегмента определяет, как mutualized cost делится по SR в ретро-консолидации.

---

## 🔗 Граф-метаданные
- **id:** `tms.invoicing.cost-segments`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629375063 · **repo:** `tms/invoicing/cost-segments.md`
- **code_refs:** `backend/app/models/{cost_segments,external_costs,sub_rate_settings,dict_external_cost_types}.js`, `services/{cost-segments,external_costs}.js`, `routes/api/{cost_segments,external_costs}.js`, `frontend/public/app/{cost-segments,external-costs}`
- **modules:** TMS, Invoicing, Rate Sheets
- **references:** `tms.features.retro-consolidation`, `tms.rate-sheets`, `tms.invoicing`
- **requirements:** REQ-INV-022 (Cost Segments)
