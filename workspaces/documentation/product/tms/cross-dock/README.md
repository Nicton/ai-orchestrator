---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571594
source_type: confluence
---
# Cross-Dock — кроссдок-консолидация

> Сверено с кодом 2026-06-13 | `services/crossdock.js`, `models/shipment_content_crossdocks.js`, controller `crossdock.js`, frontend `cross-dock`

## Зачем (бизнес-контекст)

На крупном складе (master location) груз приходит одними отправками, а уезжает другими: контейнер разбирается, содержимое перекомпонуется и отправляется дальше разным получателям. Это кроссдок. Модуль даёт оператору увидеть **пришедшее содержимое**, переназначить его в новые заявки и при необходимости разбить (split). Без него перекомпоновка велась бы вне системы, теряя трассируемость «что во что переехало».

## Как устроено (код)

- **ShipmentContentCrossdock** (`shipment_content_crossdocks.js`): shipment_content_id (исходное содержимое) → sh_request_id + shipment_id (новая заявка/отправка после кроссдока), is_closed.
- **Статусы содержимого** (вычисляемые в `crossdock.js`): EXPECTED (есть ETA, нет RTA, не назначено) → READY (есть RTA, не назначено) → ASSIGNED (привязано к активной SR) → CLOSED (is_closed).
- Сервис: getContents (по master location/статусу/датам/получателям), assignContentToShRequest, assignCrossdockContents (bulk), splitCrossdockContents, closeContents, crossdockDestinations.

## Где найти и настроить (UI)

Frontend `cross-dock` → экран кроссдока на master location: фильтры по статусу/дате/получателю, действия Assign / Split / Close. API `/crossdock/contents`, `/crossdock/destinations`, `/crossdock/contents/{assign,split,close}`.

## Сценарии

1. **Разбор контейнера**: пришедший контейнер → его содержимое в статусе READY → оператор назначает части в новые исходящие заявки (ASSIGNED).
2. **Частичное переназначение**: split содержимого по количеству → разные части едут разным получателям.
3. **Закрытие операции**: после отгрузки → close → содержимое уходит из активного кроссдок-листа.

---

## 🔗 Граф-метаданные
- **id:** `tms.cross-dock`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629571594 · **repo:** `tms/cross-dock/README.md`
- **code_refs:** `backend/app/services/crossdock.js`, `models/shipment_content_crossdocks.js`, `controllers/api/crossdock.js`, `frontend/public/app/cross-dock`
- **modules:** TMS, DOCK (master location), Freight Units
- **references:** `tms.freight-units`, `dock.pml-settings`, `tms.shipments`
- **requirements:** нет — реализовано без требований
