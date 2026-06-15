---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422615
source_type: confluence
---
# Страница: Список перевозок

```
Тип:      List Page
URL:      /shipments
Модель:   Shipment
Frontend: workspaces/frontend/public/app/shipments/
Backend:  GET /api/shipments → app/services/shipments.js → getShipmentsList()
```

---

## Предусловия

Для того чтобы страница показала данные, в системе должно существовать:

```
Авторизованный пользователь
  └── User.account (Shipper или Carrier)
      └── Shipment записи, доступные этому account_id
          └── Shipment создан из ShipmentRequest (status: confirmed)
              └── ShipmentRequest создан через CSW wizard
                  ├── Locations (pick-up + delivery)
                  └── Carrier (партнёр аккаунта)
```

**Пустое состояние:** Если Shipment'ов нет — страница показывает заглушку "Нет перевозок" + кнопку создания.

---

## Источники данных

| Поле на странице | Модель | Поле в БД | API параметры |
|-----------------|--------|-----------|--------------|
| Название | `Shipment` | `name` | включён по умолчанию |
| Режим (Road/Air/Sea) | `ShipmentMode` | `shipment_mode_id` | `include: [ShipmentMode]` |
| Статус | `Shipment` | `status` | рассчитывается через `calculateShipmentStatus()` |
| Перевозчик | `Carrier` | `carrier_id` | `include: [Carrier]` |
| Shipper | `Shipper` | `shipper_id` | `include: [Shipper]` |
| Локация отправки | `Location` | via `ShipmentRequest.from_location_id` | `include: [Location as from]` |
| Локация доставки | `Location` | via `ShipmentRequest.dest_location_id` | `include: [Location as dest]` |
| Дата отправки | `Shipment` | `start_date` | включён по умолчанию |
| Дата доставки | `Shipment` | `end_date` | включён по умолчанию |
| Документы | `ShipmentAttachment[]` | count | `include: [ShipmentAttachment]` |
| Теги | `Tag[]` | via `ShipmentTag` | `include: [Tag]` |
| Трекинг-код | `Shipment` | `tracking_code` | включён по умолчанию |
| Ворота (dock door) | `DockDoor` | via Slot | `include: [Slot, DockDoor]` |

**API endpoint:** `GET /api/shipments`
**Пагинация:** `limit=20&offset=N`

---

## Фильтры и их параметры

| Фильтр UI | Query параметр | Тип | Влияет на SQL |
|-----------|---------------|-----|--------------|
| Режим | `mode[]` | string[] | `WHERE shipment_mode_id IN (...)` |
| Статус | `status[]` | string[] | `WHERE status IN (...)` |
| Перевозчик | `carrier_id[]` | number[] | `WHERE carrier_id IN (...)` |
| Shipper | `shipper_id[]` | number[] | `WHERE shipper_id IN (...)` |
| Дата отправки | `departureDate.from/to` | date | `WHERE start_date BETWEEN` |
| Дата доставки | `arrivalDate.from/to` | date | `WHERE end_date BETWEEN` |
| Теги | `tag_list[]` | number[] | JOIN ShipmentTag |
| История | `history=true` | boolean | снимает фильтр по status |
| К бронированию | `toBeBooked=true` | boolean | специальный scope |
| Magic search | `q` | string | LIKE на name, tracking_code |

---

## Действия и что происходит

| Действие | HTTP | Endpoint | Что меняется |
|----------|------|---------|-------------|
| Клик по строке | GET | — | Навигация на `/shipments/{id}` (нет запроса) |
| Быстрое подтв. departure | POST | `/api/shipments/{id}/tracking-points/{tp_id}/confirm` | `TrackingPoint.status = confirmed`, пересчёт Shipment.status |
| Быстрое подтв. arrival | POST | `/api/shipments/{id}/tracking-points/{tp_id}/confirm` | аналогично |
| Экспорт Excel | POST | `/api/jobs/excel` → Kue | создаётся job `shipmentsExcel` |
| Создать → CSW | GET | — | Навигация на `/shipment-requests/new` |

---

## Изоляция данных (ACL)

```javascript
// app/services/shipments.js → findShipments()

// Shipper видит только свои перевозки:
WHERE shipper_id IN (user.account.shipper.divisions)

// Carrier видит только свои перевозки:
WHERE carrier_id IN (user.account.carrier.divisions)

// Spectator видит только расшаренные:
WHERE id IN (shared_shipment_ids)

// Admin: без ограничений
```

---

## Навигация

**Входящие пути (как попасть на эту страницу):**
- Главное меню → "Shipments"
- `/dashboard` → клик "See all"
- Любой email-уведомление → ссылка "Go to shipments"
- Прямой URL

**Исходящие переходы (куда можно уйти):**
- Клик по строке → `/shipments/{id}`
- Кнопка "Create" → `/shipment-requests/new`
- Режим Board → `/shipments/board`
- Меню → `/slots`, `/invoicing`, etc.

---

## Варианты этой же страницы (related views)

| Страница | URL | Отличие от основной |
|---------|-----|---------------------|
| Доска | `/shipments/board` | Kanban вместо таблицы |
| POD-запросы | `/pod-requests` | Только `pod_status = pending/expected` |
| Авиа/Морские | `/air-sea-shipments` | Только mode = air / sea |
| Отменённые | `/shipments-cancelled` | Только `status = canceled` |
| По сайту | `/site-shipments` | Привязан к конкретной Location |

---

## Что сломается при изменении

| Изменение | Что затронет |
|-----------|-------------|
| Добавить колонку в таблицу | Frontend: компонент таблицы `shipments-list/`, Backend: добавить в `include` в `getShipmentsList()` |
| Изменить значения `status` | Фильтр статусов (frontend enums), `calculateShipmentStatus()`, email условия в Worker |
| Изменить ACL логику | `findShipments()` — шипперы потеряют/получат лишние данные |
| Изменить пагинацию | `limit/offset` → проверить frontend компонент пагинации |
| Убрать поле `tracking_code` | Колонка пропадёт + сломается Magic search |

---

## Код

```
Frontend:
  workspaces/frontend/public/app/shipments/
  └── shipments-list/         ← компонент таблицы
  └── shipments-filter/       ← компоненты фильтров
  └── shipments.router.js     ← роутинг

Backend:
  app/controllers/api/shipments.js  ← HTTP handler
  app/services/shipments.js         ← getShipmentsList(), countShipments()
  app/routes/shipments.js           ← GET /api/shipments

Worker (Excel export):
  worker/tasks/excel.js             ← задача shipmentsExcel
```

---

## 🔗 Граф-метаданные
- **id:** `tms.technical-view.pages.shipments-list`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632422615 · **repo:** `tms/technical-view/pages/shipments-list.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

