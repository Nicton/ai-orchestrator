---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308338
source_type: confluence
---
# DOCK — Спорные вопросы и пробелы

Вопросы для уточнения у команды. Источники: видео Part 2 + Part 4, slides 2025-2026, тест-кейсы, код.

> **Обновление 2026-06-11:** сверка с кодом (`backend/app/models`, `services/slots|slotify|locations`, `controllers/api`, frontend slotify). ✅ — закрыто по коду, ⚠️ — частично, ❓ — остаётся.

---

## 1. Master Location

| # | Вопрос | Ответ |
|---|--------|-------|
| 1.1 ✅ | Кто делает ML? | Флаг **`is_master`** в модели Location (`location.js:83-87`); non-master локации ссылаются через `master_id`. Выставляется на серверной стороне (services/locations) — у пользователя UI-переключателя нет, фактически через Admin/BO. |
| 1.2 ⚠️ | Сколько ML у аккаунта? | **UNIQUE-констрейнта нет** — БД не запрещает несколько; логика `findMasterLocationForShipper` предполагает одну. «Один ML» — конвенция, не ограничение. |
| 1.3 ✅ | Visible by the Community | Поле **`is_visible`** (location.js:107). Публичный поиск (`getPublicLocations`) фильтрует **только is_master=true** локации — работает и для carrier-локаций, если они master. |
| 1.4 ✅ | ML settings vs Zone settings | **location_settings** (уровень ML/адреса): slot_naming, is_supplier_control_to_book, carrier_update_cargo_block, has_slotify_access. **location_zones** (зона): capacity (time_per_slot, rounded_to, duration, interval), cargo (per_hour, stacked_per_hour), available, cargo_groups, pre_advice, priority. |

---

## 2. Slotify — Алгоритм слотов

| # | Вопрос | Ответ |
|---|--------|-------|
| 2.1 ✅ | Fixed Time Per Slot | **Добавляется к каждому слоту**: `calculatedDuration = cargoDuration + fixedTimePerSlot` (`services/slotify/duration.js:57,97`). 2 слота = 2 × fixed time. |
| 2.2 ❓ | Number of Docks | В алгоритме доступности **использование «number of docks» не найдено** — есть только `dock_door_id` на слоте без логики параллелизма. Либо считается на фронте, либо концепт из слайдов не реализован. Уточнить у команды DOCK. |
| 2.3 ✅ | Floor vs Stacked | Формула: `quantity/per_hour + stackedQuantity/stacked_per_hour`, итог × 60 минут (`duration.js:82-85`). При 0 on-floor работает только stacked-слагаемое — краевого бага нет. |
| 2.4 ✅ | Slot Interval 15 мин | **Дефолт, не хардкод**: `DEFAULT_SLOT_INTERVAL = 15`, переопределяется `zone.capacity.interval` (`services/slotify.js:66`). |
| 2.5 ⚠️ | Два слота на одно время при docks>1 | Явной проверки, разрешающей/запрещающей, **не найдено** — связано с 2.2. Пересечения на одной двери не блокируются (см. 6.2). |

---

## 3. Reception vs Expedition

| # | Вопрос | Статус |
|---|--------|--------|
| 3.1 ✅ | Зона Reception И Expedition — общее расписание? | **Подтверждено Product (2026-06-12): расписание общее** — одна зона, один календарь, направления различаются фильтром/типом слота. |
| 3.2 ❓ | Deliver/Pickup — чья точка зрения? | Терминологический вопрос Product — код не отвечает. |
| 3.3 ❓ | Стандарт терминологии | Вопрос Product/доки — нужен глоссарий-стандарт (Pickup/Delivery vs Reception/Expedition vs Arrival/Departure). |

---

## 4. Slotify Booking Flow

| # | Вопрос | Ответ |
|---|--------|-------|
| 4.1 ✅ | Supplier/Customer — ACL? | **Только отображение** (+ Department сохраняется на уровне DOMAIN при первом создании). В ACL/фильтрации не участвует. |
| 4.2 ✅ | Кто активирует pending? | Уточнение: pending — статус **слота**, не аккаунта. `buildNewSlotStatus()`: если у зоны `is_slot_validation=true` и партнёр не в whitelist → `pending_validation`; валидирует оператор вручную (APPROVED/DECLINED). |
| 4.4 ✅ | Email есть, аккаунт inactive? | **Ответ Product (2026-06-12): такое возможно — это дополнительная настройка доступа** (inactive-аккаунт может бронировать через Slotify как внешний пользователь, если так настроено). Кейс для QA-чеклиста Slotify. |

---

## 5. Planning Page

| # | Вопрос | Ответ |
|---|--------|-------|
| 5.1 ⚠️ | Board/Day/Week для Carrier? | Явной проверки типа аккаунта в коде вьюх **нет** — фильтры одинаковые (`planning-slots/board.js`). Разделение, если есть, — на уровне доступа к странице. |
| 5.2 ✅ | Drag-and-drop Dock Door — где? | Отдельный **Assignment View** `/slotify/load/YYYY-MM-DD`: сетка X=время (30 мин), Y=Dock Doors, снапинг. Перепланирование времени из этого вида невозможно — только назначение двери. |
| 5.3 ✅ | 100% занятость | **Жёсткого блока нет** — проверяются только доступность зоны, праздники, рабочие часы. Переполнение не запрещается кодом. |
| 5.4 ✅ | Персистентность фильтров | **Да, localStorage**: `SlotifyLoadFilter.store()/.restore()`, также BoardFilter, ScheduleSlotsFilter, WeakFilter (`slotify/services/filters.js:108-130`). |

---

## 6. Dock Door Assignment

| # | Вопрос | Ответ |
|---|--------|-------|
| 6.1 ✅ | Перенос на другую дверь? | **Можно**: `updateSlot()` принимает `dock_door_id` (`services/slots/index.js:1211`) — переназначение двери без перепланирования времени. |
| 6.2 ✅ | Overlapping — ошибка или допустимо? | **Допустимое состояние**: валидации пересечений на одной двери нет; в Assignment View только оранжевый индикатор. Исправление — на усмотрение оператора. |
| 6.3 ✅ | Specificities (ADR, Temperature, Bulk) — enforcement? | **Только informational**: словаря специфик в БД нет, модель `LocationZoneDockDoor` минимальна (id, location_zone_id, name≤10, status). Tag chips из слайдов — дизайн, enforcement не реализован. |
| 6.4 ✅ | Feature flag? | Флага нет — view встроен в стандартный Load module, доступен операторам с правами на Planning. |

---

## 7. Statuses (Slotify/Dock)

| # | Вопрос | Ответ |
|---|--------|-------|
| 7.1 ✅ | Полный список статусов слота | **17 внутренних** (`models/slots.js:237`): new, driver_called, on_site, at_dock, loading, loaded, unloading, unloaded, admin_cleared_arrival, admin_cleared_departure, left_dock, left_site, refused, no_show, canceled, pending_validation, declined, approved. **10 публичных** (PublicStatuses): planned, ongoing, delivered, loaded, refused, no_show, cancelled, pending_validation, declined, approved — с маппингом PublicStatusesToStatuses (slots.js:276). |
| 7.2 ✅ | Статус → TP | Каждому статусу соответствует tracking point: slot_tracking_points / visit_tracking_points.Types (external_parking, driver_cleared_arrival/departure, permitted_entry, in_site, permitted_exit, left_site, refused, no_show, slot_added, canceled — `visit_tracking_points.js:67-79`). |
| 7.3 ✅ | No-Show — кто ставит? | **Вручную оператором** через обычный статус-апдейт; авто-cron не найден. No-Show относится к GROUP_ANOMALY (вместе с REFUSED/CANCELED — `site_shipment_statuses/index.js:503-508`); email триггерится сменой статуса. |
| 7.4 ✅ | Late Cancellation threshold | **В коде нет** (`late_cancel` — 0 совпадений) — «Late cancellation %» из тест-кейсов либо считается в BI/статистике, либо не реализован. |

---

## 8. Recurring Slots

| # | Вопрос | Ответ |
|---|--------|-------|
| 8.1 ✅ | Уровень создания | **Зона**: модель `recurring_slots` — zone_id, dock_door_id, days (JSONB), time, from_date/to_date, private_carrier_id, location_customer_id, default_workload, max_linear_meter, is_grouping. |
| 8.2 ❓ | Обновление при смене расписания зоны | Автопересоздания не найдено (hooks/cron отсутствуют) — поведение при конфликте расписаний не определено кодом. |
| 8.3 ✅ | Через Slotify? | **Нет** — в slotify-контроллере recurring-роутов нет; только основное приложение (webhook-событие CREATE_RECURRING_SLOT существует). |

---

## 9. Carrier Book & Slot

| # | Вопрос | Ответ |
|---|--------|-------|
| 9.1 ✅ | Требует Shipment? | По коду связь необязательна, **но Product (2026-06-12): carrier НЕ должен бронировать без shipment, если не включены соответствующие настройки в админке** — поведение управляется настройками доступа, дефолт = запрещено. |
| 9.2 ❓ | Терминология Supplier/Customer/Carrier | Вопрос стандарта — см. 3.3. |
| 9.3 ⚠️ | Уведомление Shipper'у | Отдельного email «carrier забронировал» не найдено; уведомления по SLOT входят в общую систему (in-app/digest BOOKING/TRACKING/SLOT — см. `tms/notifications/README.md`), плюс webhook-события Visit/Slot для интеграций. |

---

## 10. Интеграции с Dock

| # | Вопрос | Ответ |
|---|--------|-------|
| 10.1 ✅ | Peripass — к чему привязан? | **К address_id** (конфиг per-address: baseUrl, apiKey, tenant — `peripass/impl.js:74-89`), с учётом dock_door_id при наличии. |
| 10.2 ✅ | P44/Shippeo ↔ Dock статусы | Прямой связи **нет** — их TP идут в трекинг shipments (поле tag), со статусами визитов DOCK не синхронизируются. |

---

## Итого (после сверки 2026-06-11)

| Секция | Вопросов | ✅ | ⚠️ | ❓ |
|--------|----------|----|----|----|
| Master Location | 4 | 3 | 1 | 0 |
| Алгоритм слотов | 5 | 3 | 1 | 1 |
| Reception/Expedition | 3 | 0 | 1 | 2 |
| Booking Flow | 3 | 2 | 1 | 0 |
| Planning | 4 | 3 | 1 | 0 |
| Dock Door Assignment | 4 | 4 | 0 | 0 |
| Statuses | 4 | 4 | 0 | 0 |
| Recurring | 3 | 2 | 0 | 1 |
| Book & Slot | 3 | 0 | 2 | 1 |
| Интеграции | 2 | 2 | 0 | 0 |
| **Всего** | **35** | **23** | **7** | **5** |

**Оставшиеся ❓ (Product/команда DOCK):** 2.2 Number of Docks (не найден в коде — реализован ли?), 3.2-3.3 стандарт терминологии, 8.2 поведение recurring при смене расписания, 9.2 нейминг.

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-06-10 | Первая версия — 35 вопросов. |
| 2026-06-11 | Сверка с кодом. Закрыто 23, частично 7, осталось 5. Ключевое: 17+10 статусов слота с маппингом; specificities ворот — informational (enforcement нет); overlapping не блокируется; фильтры в localStorage; interval 15 — дефолт (zone.capacity.interval); recurring — уровень зоны, не через Slotify; Late Cancellation в коде нет. |

---

## 🔗 Граф-метаданные
- **id:** `dock.open-questions`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631308338 · **repo:** `dock/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

