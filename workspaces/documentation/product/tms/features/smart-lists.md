---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629309459
source_type: confluence
---
# Smart Lists — умные пресеты списков

> Сверено с кодом 2026-06-13 | `services/profile.js:93-116`, `shipments/router.js:14,23-32`, `filters.js`

## Зачем (бизнес-контекст)

Оператор каждое утро ищет одно и то же: «неподтверждённые», «с инцидентом», «задержанные», «без POD». Настраивать фильтры заново — потеря времени. **Smart List** — готовый пресет-ссылка с зашитыми условиями (URL-параметры), один клик из меню. Отличие от [Magic Filters](magic-filters.md): Magic Filter — пользовательский сохранённый набор любых фильтров; Smart List — системный преднастроенный срез с особыми серверными параметрами (smart-фильтрация, не выражаемая обычными фильтрами).

## Как устроено (код)

URL-параметры на `/shipments` (валидируются `profile.js`, smartListsParams): **`isNotConfirmed`** (обходит UserSettings), **`tpIncident`** (+колонка Incidents), **`isTpDelayed`**, **`withoutPod`**. Типы пресетов (SHOW_PAGE_TYPES): ORDERS_BOOKING, SHIPMENT_DEPARTURES/DELIVERIES/DELAYED/INCIDENT/WITHOUT_POD, MISSING_METADATA/ATTACHMENT, REPLANNING_TRACKING_POINTS, CANCEL_SHIPMENTS. Хранятся в настройках пользователя (show_page); при активном smart-параметре грузится только listing-view.

## Где найти и настроить (UI)

Пункты меню/быстрые ссылки на странице перевозок (`/shipments?isNotConfirmed` и т.п.). Набор доступных пресетов — в настройках пользователя (show_page). Серверная фильтрация — `shipments/query.js`.

## Сценарии

1. **«Что подтвердить»**: smart list isNotConfirmed → только неподтверждённые, минуя личные настройки фильтров.
2. **«Где инциденты»**: tpIncident → список + колонка Incidents.
3. **«Без POD»**: withoutPod → доставленные без подтверждения — кандидаты на дозапрос документа.

---

## 🔗 Граф-метаданные
- **id:** `tms.smart-lists`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629309459 · **repo:** `tms/features/smart-lists.md`
- **code_refs:** `backend/app/services/profile.js:93-116`, `shipments/query.js`, `frontend/public/app/shipments/router.js`, `smart-lists`
- **modules:** TMS
- **references:** `tms.features.magic-filters`, `tms.shipments`
- **requirements:** REQ-SH-014..017 (smart-list фильтры)
