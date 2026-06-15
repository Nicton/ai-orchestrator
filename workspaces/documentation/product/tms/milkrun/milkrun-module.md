---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375014
source_type: confluence
---
# Milkrun — мультистоповые маршруты

> Сверено с кодом 2026-06-13 | `services/milkrun/*`, `models/milkrun_group*.js`, routes `milkrun.js`, frontend `milkrun`

## Зачем (бизнес-контекст)

Возить полупустые машины между парами точек дорого. Milkrun («молочный развоз») — один рейс с **несколькими остановками**: забрать груз у трёх поставщиков и привезти на склад, или развезти по пяти точкам с одной загрузки. Модуль группирует отправки в маршрут, задаёт порядок остановок и выдаёт перевозчику единый манифест. Экономия — на консолидации; контроль — на порядке и единой ответственности водителя за рейс.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Группа-маршрут | `milkrun_group.js` | account, name, carrier, is_single_shipper, is_required_order, manifest_id, grouping_id |
| Отправка в группе | `milkrun_group_shipment.js` | shipment/pre_shipment_id, **position** (порядок в маршруте) |
| Остановка | `milkrun_group_location.js` | address_id, **type** (ARRIVAL/DEPARTURE), tag_color |

Сервис: createGroup, addShipmentsToGroup, assignLocationsToGroup (автоназначение точек по отправкам), **freeShipmentsFromMilkrunGroups** (вернуть отправки в свободное состояние — вызывается в т.ч. при отмене из SAP), getMilkrunBrothers (отправки одного рейса), getDownloadManifest.

## Где найти и настроить (UI)

| Что | Роут | Контроллер |
|-----|------|-----------|
| Список маршрутов | `/milkrun` | MilkrunListCtrl |
| Группировка по забору | `/pick-up-grouping` | PickUpGroupingListCtrl |
| Группировка по слотам | `/slots-grouping` | SlotsGroupingListCtrl |
| Создать/добавить | модалы CreateMilkrun/CreateGroup | — |

API: `GET/POST/PATCH/DELETE /milkrun`, `/milkrun/:id/assign-shipments`, `/milkrun/:id/send-updates` (серийные коды перевозчику), `/milkrun/download-manifest`, `/milkrun/brothers/:shipment_id`.

## Сценарии

1. **Сбор у поставщиков**: создать milkrun group → добавить 3 отправки забора → задать порядок остановок → перевозчик получает манифест маршрута.
2. **Развоз с одной загрузки**: группа с одной DEPARTURE и N ARRIVAL остановок.
3. **Разгруппировать**: freeShipmentsFromMilkrunGroups → отправки выходят из маршрута (напр. при отмене заказа из SAP). Связь с DOCK: группировка влияет на слоты — см. [grouping-2.0](../features/grouping-2.0.md).

---

## 🔗 Граф-метаданные
- **id:** `tms.milkrun`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629375014 · **repo:** `tms/milkrun/milkrun-module.md`
- **code_refs:** `backend/app/services/milkrun/index.js`, `helper.js`, `query.js`, `models/{milkrun_group,milkrun_group_shipment,milkrun_group_location}.js`, `routes/api/milkrun.js`, `frontend/public/app/milkrun`
- **modules:** TMS, DOCK (slots grouping)
- **references:** `tms.features.grouping-2.0`, `tms.shipments`, `dock.slots-core`
- **requirements:** REQ-GRP-001..008 (Grouping — смежно); milkrun — реализовано без отдельных требований
