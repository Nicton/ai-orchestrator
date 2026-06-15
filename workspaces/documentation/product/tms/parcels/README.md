---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629243931
source_type: confluence
---
# Parcels — посылки (Express/Parcel режим)

> Сверено с кодом 2026-06-13 | `models/parcels.js`, `parcel_trackings.js`, `parcel_temperature_settings.js`, `services/parcels/tracking.js`

## Зачем (бизнес-контекст)

Грузовая отправка (shipment) и экспресс-посылка — разные миры: посылок много, они мелкие, у каждой свой трек-номер перевозчика (FedEx/UPS/DHL Express), и отслеживаются они индивидуально. **Parcel** — отдельная сущность внутри отправки (1 shipment : N parcels), со своими tracking points и трек-номером. Для фарма/пищёвки добавлен контроль температуры по каждой посылке. Без parcel-слоя нельзя корректно работать с экспресс-режимом и парсельными интеграциями.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Посылка | `parcels.js` | shipment_id (FK), internal_ref |
| Трекинг посылки | `parcel_trackings.js` | position, type, planned/real date+time, **external_key** (трек-номер перевозчика), is_external, code, live_replan_date, dock_door |
| Температура (настройка) | `parcel_temperature_settings.js` | min, max (°) на посылку |
| Температура (лог) | parcel_temperatures | temperature, recorded_at, device_id |

Сервис `parcels/tracking.js`: findParcel, prepareDataForParcelTracking. Парсели встроены в shipment-эндпоинты (отдельного frontend-модуля/контроллера нет — UI внутри отправки).

## Где найти и настроить (UI)

Встроено в карточку отправки (express/parcel-режим): список посылок с индивидуальными трек-номерами и статусами. Генерация ярлыков — через интеграции FedEx API / UPS (см. integrations). Температурные пороги — настройка на посылке.

## Сценарии

1. **Экспресс-отправка из N коробок**: одна отправка → N parcels, у каждой свой трек FedEx → клиент видит статус каждой коробки отдельно.
2. **Фарма с холодовой цепью**: задать min/max температуры на посылку → отклонения логируются (parcel_temperatures).
3. **Внешний трекинг**: external_key + is_external → события приходят от перевозчика и маппятся на parcel tracking points.

---

## 🔗 Граф-метаданные
- **id:** `tms.parcels`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629243931 · **repo:** `tms/parcels/README.md`
- **code_refs:** `backend/app/models/{parcels,parcel_trackings,parcel_temperature_settings}.js`, `services/parcels/tracking.js`
- **modules:** TMS, Integrations (FedEx/UPS labels), Tracking
- **references:** `tms.tracking`, `tms.shipments`, `integrations`
- **requirements:** нет — реализовано без требований
