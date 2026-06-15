---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631799842
source_type: confluence
---
# Техническая документация — Dock модуль

## Ключевые модели данных

### Slot (`app/models/slots.js`)

Центральная сущность модуля. Одна запись = одно временное окно для одной операции на складе.

**Таблица:** `slots`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer | PK |
| `status` | Enum | Текущий статус (default: `new`) |
| `name` | String | Сгенерированное имя |
| `manual_name_1` / `manual_name_2` | String | Динамические имена строк |
| `is_names_updated_manually` | Boolean | Имена обновлены вручную |
| `direction` | Enum | `arrival` / `departure` |
| `address_id` | FK | PML (addresses) |
| `zone_id` | FK | location_zones |
| `dock_door_id` | FK | location_zone_dock_doors |
| `visit_id` | FK | visits |
| `min_date` / `max_date` | Date | Диапазон допустимых дат |
| `time` | DateTime | Плановое время |
| `real_date` | DateTime | Фактическое время операции |
| `confirmation_date` / `confirmation_time` | DateTime | Время подтверждения |
| `duration` | Integer | Длительность в минутах |
| `comment` | Text | Комментарий |
| `is_special_comment` | Boolean | Специальный комментарий |
| `booker_account_id` | FK | Аккаунт, создавший слот |
| `booker_email` | String | Email создателя |
| `booking_source` | Enum | Источник бронирования (22 значения) |
| `recurring_slot_id` | FK | recurring_slots |
| `milkrun_group_id` | FK | Milkrun-группа |
| `contents_dimensions` | JSONB | Размеры содержимого |
| `additional_info` | JSONB | Дополнительная информация |
| `is_last_minute_cancellation` | Boolean | Отмена в последний момент |
| `is_data_missed` | Boolean | Отсутствующие данные |

Поддерживает мягкое удаление (paranoid).

### Статусы слотов

**Внутренние статусы (полная цепочка):**

```
new
  → driver_called
    → on_site
      → at_dock
        → loading / unloading
          → loaded / unloaded
            → admin_cleared_arrival / admin_cleared_departure
              → left_dock
                → left_site

Терминальные (параллельные):
  → refused
  → no_show
  → canceled
  → pending_validation  (требует одобрения оператора)
  → declined            (отклонён оператором)
  → approved
```

**Маппинг в публичные статусы:**

| Внутренние статусы | Публичный статус |
|-------------------|------------------|
| `new`, `driver_called` | `planned` |
| `on_site`, `at_dock`, `loading`, `unloading` | `ongoing` |
| `loaded`, `unloaded`, `left_dock`, `left_site`, `admin_cleared_*` | `delivered` / `loaded` |
| `refused` | `refused` |
| `no_show` | `no_show` |
| `canceled` | `cancelled` |
| `pending_validation` | `pending_validation` |
| `declined` | `declined` |
| `approved` | `approved` |

### LocationZone (`app/models/location_zone.js`)

Зона внутри PML. Содержит все настройки алгоритма бронирования.

Ключевые поля: `location_id`, `name`, `token`, `capacity` (JSON), `cargo` (JSON), `available` (JSONB), `is_reception`, `is_expedition`, `is_slot_validation`.

### LocationZoneDockDoor (`app/models/location_zones_dock_door.js`)

Физические ворота в зоне. Поля: `location_zone_id`, `name` (max 10), `status`.

### SlotTrackingPoint (`app/models/slot_tracking_points.js`)

Аудит-трейл каждого перехода статуса слота.

Поля: `slot_id`, `type` (=статус), `user_id`, `date`, `is_active`. Default scope: `is_active=true`.

### SlotContent (`app/models/slot_contents.js`)

Линии груза внутри слота.

Ключевые поля: `slot_id`, `type_id` → `dict_sh_request_content_types`, `quantity`, `length`, `width`, `height`, `weight`, `is_dangerous`, `is_stacked`, `is_controlled_temperature`, `unit`.

### RecurringSlot (`app/models/recurring_slots.js`)

Шаблон для периодических бронирований.

Поля: `direction`, `zone_id`, `dock_door_id`, `days` (JSONB), `time`, `from_date`, `to_date`, `default_workload`, `capacity_type` (increment/consume), `definition_type` (max_linear_meter/zones_workload/packing_list).

## Ключевые API эндпоинты

### Slots (`app/routes/api/slots.js`, prefix `/api/v1`)

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/slots` | loadAllowedLocations | Список слотов с фильтрами |
| `GET` | `/validation-slots` | accessSlotValidation | Слоты на валидации |
| `GET` | `/slots/planning-slots` | requireShipper | Planning-вид |
| `GET` | `/slots/load-day` | requireShipper | Нагрузка на день |
| `GET` | `/dock-slots` | loadAllowedLocations | Слоты для dock-вида |
| `GET` | `/slots/:id` | ACL layers | Получить слот |
| `PATCH` | `/slots/:id` | loadOwnPmlSlot | Обновить слот |
| `PATCH` | `/slots/:id/replan` | loadAllowedLocations | Перенести слот |
| `PATCH` | `/slots/:id/cancel` | loadAllowedLocations | Отменить слот |
| `POST` | `/slots/:id/status` | requireShipper | Установить статус |
| `POST` | `/slots/:id/statuses` | requireShipper | Установить несколько статусов |
| `PUT` | `/validation-slots/:id/:status` | accessSlotValidation | Approve/Decline |
| `POST` | `/slots/recurring-slot` | requireShipper | Создать recurring slot |
| `DELETE` | `/slots/:slot_id/recurring-slot/:id/next` | requireShipper | Удалить все будущие recurring |
| `GET` | `/slots/export-excel` | requireShipper | Excel-экспорт |

### Slotify / Location Zones (`app/routes/api/slotify.js`)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/location_zones` | Создать зону |
| `GET/PATCH/DELETE` | `/location_zones/:id` | CRUD зоны |
| `GET/PATCH` | `/location_zones/:id/settings` | Расписание зоны |
| `GET/POST/PATCH/DELETE` | `/location_zones/:id/date_custom_settings` | Переопределения дат |
| `GET/POST` | `/location_zones/:id/dock_doors` | Список/создание ворот |
| `PATCH` | `/location_zones/:id/dock_doors/:dock_door_id` | Обновить ворота |
| `GET` | `/locations/:id/capacity` | Нагрузка на день |

### Dock Orders (`app/routes/api/dock-orders.js`)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/dock-orders` | Список dock-заказов |
| `GET` | `/dock-orders/:id` | Детали заказа |
| `PATCH` | `/dock-orders/:id` | Обновить статус/поля |
| `GET` | `/dock-orders-excel` | Excel-экспорт |

### Slot-Dock-Orders (`app/routes/api/slot-dock-orders.js`)

| Метод | Путь | Описание |
|-------|------|----------|
| `PUT` | `/slot-dock-orders/slot/:slot_id` | Назначить/обновить dock-заказы слота |
| `GET` | `/slot-dock-orders/slot/:slot_id` | Dock-заказы слота |
| `GET` | `/slot-dock-orders` | Все SDO для партнёра |

## Ключевые сервисы

| Файл | Назначение |
|------|------------|
| `app/services/slots/create_update_slot.js` | Создание и обновление слотов, жизненный цикл |
| `app/services/slotify.js` | 5000+ строк — логика Slotify, алгоритм, зоны |
| `app/services/dock_door.js` | Атомарное обновление dock_door во всех таблицах |
| `app/services/crossdock.js` | Логика cross-docking |
| `app/services/slot-dock-orders/slot-dock-order-lines.js` | Связь слотов с WMS-заказами |

### Ключевые функции create_update_slot.js

| Функция | Что делает |
|---------|------------|
| `createSlots()` | Создаёт слоты по отправкам, транзакционно |
| `buildNewSlotStatus()` | `new` vs `pending_validation` через whitelist |
| `updateSlotStatus()` | Обновляет статус, создаёт TrackingPoint, Peripass+webhook |
| `cancelSlot()` | Отмена слота → SlotTrackingPoint CANCELED |
| `cancelEmptySlot()` | Отменяет слот только если все отправки отменены |
| `reactivateSlots()` | Возвращает CANCELED → NEW |
| `unassignDockOrders()` | При закрытии/отмене слота возвращает dock-заказы в PENDING |

## Worker Tasks

| Файл | Задача | Описание |
|------|--------|----------|
| `worker/tasks/slotify.js` | `bookShipment` | Полный flow бронирования через Slotify |
| `worker/tasks/slotify.js` | `cancelShipment` | Отмена с уведомлениями |
| `worker/tasks/slotify.js` | `provideMetadata` | Обновление данных водителя/транспорта |
| `worker/tasks/slots.js` | `processSlotsCsvFile` | Начальная обработка CSV-импорта |
| `worker/tasks/slots.js` | `processSlotsCsvChunk` | Обработка чанка строк CSV |
| `worker/tasks/slot_visit_delayed.js` | `delayedCreateSlotIndexAction` | Elasticsearch + Peripass после create |
| `worker/tasks/slot_visit_delayed.js` | `delayedUpdateSlotIndexAction` | Обновление ES-индекса |
| `worker/tasks/slot_visit_delayed.js` | `delayedStartSlotThreadAction` | Создание первого сообщения в треде слота |
| `worker/tasks/slot_visit_delayed.js` | `delayedNotifySlotBookedAction` | Email уведомление при бронировании |
| `worker/tasks/slot_visit_delayed.js` | `updateSlotsManualNamesAction` | Регенерация имён слотов |

## ER-схема (упрощённая)

```
Address (PML)
  └── LocationZone
        ├── LocationZoneDockDoor
        ├── LocationZoneDefaultSetting (недельное расписание)
        ├── LocationZoneDateSetting (переопределения дат)
        ├── LocationZoneMetadataPrototype
        └── LocationZoneWhitelistPartners

Slot
  ├── → address_id (PML)
  ├── → zone_id (LocationZone)
  ├── → dock_door_id (LocationZoneDockDoor)
  ├── → visit_id (Visit)
  ├── → recurring_slot_id (RecurringSlot)
  ├── SlotShipment (M:M ↔ Shipment)
  ├── SlotTrackingPoint (аудит статусов)
  ├── SlotContent (линии груза)
  ├── SlotParticipant (видимость по аккаунтам)
  ├── SlotSupplier (поставщики)
  ├── SlotInternalComment
  ├── SlotTag
  └── SlotOrder → OrderProduct → Order (WMS)
```

---

## 🔗 Граф-метаданные
- **id:** `dock.technical-view`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631799842 · **repo:** `dock/technical-view/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

