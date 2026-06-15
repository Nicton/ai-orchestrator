---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632619090
source_type: confluence
---
# Список перевозок

## Что это

Главная рабочая страница TMS. Показывает все перевозки аккаунта с фильтрацией, сортировкой и быстрыми действиями. Shipper видит свои перевозки, Carrier — перевозки, которые он выполняет.

**URL:** `/shipments`
**Frontend:** `workspaces/frontend/public/app/shipments/`

---

## Варианты представления

| Представление | URL | Описание |
|--------------|-----|---------|
| Список (стандарт) | `/shipments` | Таблица всех перевозок |
| Доска (Kanban) | `/shipments/board` | Колонки по статусам, drag-and-drop к слотам |
| POD-запросы | `/pod-requests` | Только перевозки, ожидающие Proof of Delivery |
| Авиа/Морские | `/air-sea-shipments` | Фильтр по режиму Air / Sea |

---

## Что видит пользователь (колонки таблицы)

| Колонка | Описание | Модель |
|---------|---------|--------|
| Иконка режима | Road / Air / Sea / Express / Groupage | `Shipment.shipment_mode` |
| Название | Имя перевозки + внутреннее имя shipper'а | `Shipment.name` |
| ID + дата создания | Номер и когда создана | `Shipment.id`, `Shipment.created_at` |
| Трекинг-код | Код для отслеживания | `Shipment.tracking_code` |
| Документы | Иконка + счётчик, красная если не хватает | `ShipmentAttachment[]` |
| Теги | Цветные метки | `Tag[]` |
| Тип груза | Описание + индикаторы (опасный, температура) | `ShipmentContent.cargo_type` |
| Аватары | Перевозчик и Shipper | `Carrier.logo`, `Shipper.logo` |
| Откуда | Локация отправки + ворота | `Location.name`, `DockDoor.name` |
| Куда | Локация доставки + ворота | `Location.name`, `DockDoor.name` |
| Дата отправки | Плановая + кнопка быстрого подтверждения | `Shipment.start_date` |
| Дата прибытия | Плановая + кнопка быстрого подтверждения | `Shipment.end_date` |
| Статус | Текущий статус + прогресс-бар | `Shipment.status` |

**Индикатор spectator:** иконка глаза — если эта перевозка расшарена с вами как наблюдателем.

---

## Фильтры

| Фильтр | Описание |
|--------|---------|
| Режим | Road / Air / Sea / Express / Groupage (мультивыбор) |
| Статус | Сгруппированы: Planned / In Transit / Delivered / Cancelled |
| Перевозчик | Для Shipper-аккаунтов: выбор перевозчика |
| Shipper | Для Carrier-аккаунтов: выбор shipper'а |
| Кто забронировал | Пользователь, создавший заявку |
| Локация | Точка отправки или доставки |
| Период | Диапазон дат pick-up / delivery |
| Теги | Выбор тегов |
| Пропущенные метаданные | Фильтр по незаполненным полям |
| Пропущенные документы | Фильтр по отсутствующим документам |
| Инциденты | Только перевозки с инцидентами |
| История | Показывать завершённые (по умолчанию скрыты) |
| К бронированию | Только не подтверждённые |
| Magic search | Поиск по названию, ID, трекинг-коду |

---

## Действия на странице

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Клик по строке | Переход на `/shipments/{id}` | Все |
| Быстрое подтверждение даты отправки | Подтверждает departure tracking point | Carrier |
| Быстрое подтверждение даты прибытия | Подтверждает arrival tracking point | Carrier |
| Экспорт в Excel | Скачивание списка в `.xlsx` | Shipper, Admin |
| Создать новую | Переход в CSW wizard `/shipment-requests/new` | Shipper |

---

## Мутации (при действиях на этой странице)

### Быстрое подтверждение трекинга

**Внутренние:**
- `TrackingPoint.status` → `confirmed`
- `Shipment.status` пересчитывается через `calculateShipmentStatus()`

**Внешние:**
- Email задача `mailStatus` → уведомление shipper'у об обновлении статуса
- Webhook событие `shipmentStatusUpdated`

### Экспорт в Excel

**Внутренние:**
- Очередь Kue: задача `shipmentsExcel` → генерация файла
- Файл отдаётся через download URL

---

## Переходы

- Строка в таблице → `/shipments/{id}` (детали перевозки)
- Режим "Board" → `/shipments/board` (Kanban-доска)
- Кнопка "Создать" → `/shipment-requests/new` (CSW wizard)
- Фильтр "Слоты" в меню → `/slots` (список слотов)

---

## Backend

- Сервис: `app/services/shipments.js` → `getShipmentsList()`, `countShipments()`
- Контроллер: `app/controllers/api/shipments.js`
- Маршрут: `GET /api/shipments`
- Экспорт: `worker/tasks/excel.js` → задача `shipmentsExcel`

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_list`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632619090 · **repo:** `tms/shipments/02_list.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

