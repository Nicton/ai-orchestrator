---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632258626
source_type: confluence
---
# User Journeys — Сценарии использования Dock

Четыре основных сценария, покрывающих типичную работу в Dock-модуле.

---

## Journey 1: Shipper бронирует слот для входящей отправки

**Участники:** Shipper + Carrier + Operator  
**Когда используется:** Shipper уже создал Shipment и хочет зарезервировать время для его прибытия на свой склад.

```
[Shipper] Открывает Shipment в основном приложении
          ↓ SLOT BOOKING card в сайдбаре → "+ Book a slot"
          ↓ Открывается 6-шаговый визард

[Shipper] Шаг 1: выбирает тип (DELIVERY или PICKUP)
          ↓ Шаг 2: выбирает локацию (Master Location / PML)
          ↓ Шаг 3: выбирает зону (LocationZone)
          ↓ Шаг 4: выбирает перевозчика (Active Carrier dropdown)
          ↓ Шаг 5: выбирает дату и время из доступных слотов
          ↓ Шаг 6: подтверждение — вводит данные о грузе

[Система] Slot создаётся
          ↓ booking_source: SLOTBOOK_Shipper
          ↓ Slot.status = new (или pending_validation если зона требует)
          ↓ Carrier получает email-уведомление

[Operator] Видит новый слот в Planning (Board/Week)
           ↓ Проверяет параметры
           ↓ Назначает Dock Door (в Assignment view)

[Carrier]  Приезжает в забронированное время
           ↓ Operator меняет статус: new → driver_called → on_site → at_dock

[Operator] После операции: loaded/unloaded → left_dock → left_site
           ↓ SlotTrackingPoint записан для каждого шага
           ↓ Shipment.status обновляется
```

**Ключевые поля Slot:** `direction=arrival`, `booker_account_id`, `booking_source=SLOTBOOK_Shipper`

---

## Journey 2: Carrier бронирует слот через SlotBook

**Участники:** Carrier + Operator  
**Когда используется:** Carrier хочет сам зарезервировать окно для приезда на склад Shipper'а.

```
[Carrier] Открывает основное приложение
          ↓ Синяя кнопка "+ BOOK A SLOT"
          ↓ Открывается SlotBook визард (6 шагов)

[Carrier] Шаг 1: тип операции (DELIVERY / PICKUP)
          ↓ Шаг 2: выбор склада по названию или адресу
          ↓ Шаг 3: выбор зоны
          ↓ Шаг 4: данные о грузе (тип, количество, вес)
          ↓ Шаг 5: выбор даты/времени (алгоритм показывает доступные)
          ↓ Шаг 6: подтверждение

[Система] Slot.status = new
          ↓ booking_source: SLOTBOOK_Shipper или API_slots
          ↓ Shipper-оператор получает уведомление

[Operator] Видит слот в Planning → подтверждает или переносит

[Carrier]  Приезжает в забронированное время
           ↓ Дальше: аналогично Journey 1
```

**Slotbook-вид для Carrier:**

| URL | Что показывает |
|-----|---------------|
| `/slotbook-ongoing-slots` | Текущие и предстоящие слоты |
| `/slotbook-to-be-booked-slots` | Отправки без слота — нужно забронировать |
| `/slotbook-history-slots` | История завершённых |

---

## Journey 3: Внешний пользователь бронирует через Slotify

**Участники:** Поставщик / Экспедитор (без аккаунта Shiptify) + Operator  
**Когда используется:** Shipper предоставил ссылку на Slotify своим поставщикам для самостоятельного бронирования.

```
[Внешний пользователь] Открывает ссылку Slotify
                       (вида app.slotify.com/{zone_token})
                       ↓

[UI 3.0 / 3.1] Шаг 1.1: выбор DELIVER TO / PICKUP FROM
               ↓         + тип пользователя (Carrier / Supplier-Customer)
               Шаг 1.2: email + телефон (оба обязательны)
               ↓
               Шаг 2: данные о компании
               ↓ Department (если Supplier/Customer)
               ↓
               Шаг 3: данные о грузе (тип, количество, паллеты)
               ↓ Floor / Stacked расчёт
               ↓
               Шаг 4: выбор даты и времени
               ↓ Алгоритм вычисляет длительность слота
               ↓ Показывает только доступные окна
               ↓
               Шаг 5: данные водителя и транспорта (Metadata)
               ↓
               Шаг 6: подтверждение → показывает ИНСТРУКЦИИ + комментарий

[Система] Worker task: bookShipment
          ↓ bookSlotifyShipment():
          ↓   find/create carrier → create ShipmentRequest → QuoteRequest → confirm
          ↓   создаются Shipment + Slot атомарно
          ↓ booking_source: SLOTIFY_Supplier
          ↓ Peripass sync, Elasticsearch index, thread, Zapier webhook

[Operator] Видит новый слот в Planning
           ↓ Если зона is_slot_validation=true:
           ↓   Slot.status = pending_validation
           ↓   Оператор approves/declines на /validation-slots
           ↓ Иначе: Slot.status = new (сразу подтверждён)
```

**Валидация через whitelist:**  
`buildNewSlotStatus()` проверяет, входит ли supplier в `LocationZoneWhitelistPartners`. Если входит → статус `new`. Если нет → `pending_validation`.

---

## Journey 4: Оператор управляет воротами в течение дня

**Участники:** Operator  
**Когда используется:** Ежедневная работа на складе — распределение транспорта по воротам.

```
[Operator] Открывает Assignment View
           URL: /slotify/load/YYYY-MM-DD
           ↓
           Видит сетку:
           X-ось: время (30-минутные шаги)
           Y-ось: Dock Doors

           Внизу: Unassigned Tray (слоты без ворот)

[Operator] Перетаскивает слот из Tray на нужные ворота
           ↓ Снаппинг к плановому времени слота
           ↓ PATCH /api/v1/slots/:id (dock_door_id обновляется)
           ↓ updateDockDoorByInput() атомарно обновляет:
              - trackings
              - shipment_request_addresses
              - shipments (from_dock_door_id / dest_dock_door_id)
              - shipment_requests

[Operator] Видит конфликты (оранжевый = overlapping)
           ↓ Перераспределяет слоты

[Operator] Обновляет статусы в течение дня:
           new → driver_called → on_site → at_dock → loading/unloading
           ↓ Единый модал (Dock Status Update Modal):
           ↓   Pre-fills текущее время
           ↓   Dock Door field — только если не введён ранее
           ↓   "Driver called": 3 кнопки (Set later / Set anyway / Provide driver)
           ↓   LOADED/UNLOADED: сначала packing list modal, затем дата/время

[Система] SlotTrackingPoint создаётся для каждого перехода
          ↓ POST /api/v1/slots/:id/status
          ↓ Webhook + Peripass sync
```

**Цветовая кодировка в Assignment View:**

| Цвет | Статус |
|------|--------|
| Белый | Planned |
| Светло-голубой | Ongoing |
| Светло-зелёный | Closed |
| Оранжевый | Overlapping (конфликт на воротах) |

---

## 🔗 Граф-метаданные
- **id:** `dock.business-vision.02_user-journeys`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632258626 · **repo:** `dock/business-vision/02_user-journeys.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

