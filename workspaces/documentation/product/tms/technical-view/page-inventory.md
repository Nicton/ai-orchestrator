---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631931061
source_type: confluence
---
# Инвентарь страниц TMS

Все страницы основного приложения, сгруппированные по типу.

---

## List Pages (Страницы-списки)

Показывают коллекцию объектов с фильтрами, сортировкой, пагинацией.

| Страница | URL | Главная модель | Кол-во фильтров |
|---------|-----|----------------|----------------|
| Все перевозки | `/shipments` | `Shipment` | 12+ |
| Доска перевозок | `/shipments/board` | `Shipment` | 4 |
| POD запросы | `/pod-requests` | `Shipment` (pod filter) | 8 |
| Авиа/морские | `/air-sea-shipments` | `Shipment` (mode filter) | 8 |
| Заявки | `/shipment-requests` | `ShipmentRequest` | 8 |
| Все слоты | `/slots` | `Slot` | 6 |
| Текущие слоты | `/ongoing-slots` | `Slot` | 4 |
| История слотов | `/slots/history` | `Slot` | 4 |
| Заказы | `/orders` | `Order` | 6 |
| Строки заказов | `/lines` | `OrderLine` | 4 |
| Инвойсинг | `/invoicing` | `InvoicingRequest` | 5 |
| Pre-Invoice | `/pre-invoices` | `PreInvoice` | 4 |
| Инвойсы | `/invoices` | `Invoice` | 4 |
| Котировки | `/quote-requests` | `QuoteRequest` | 5 |
| Rate Sheets | `/rate-sheets` | `RateSheet` | 3 |
| Локации | `/locations` | `Location` | 5 |
| Партнёры | `/partners` | `Partner` | 3 |
| Пользователи | `/users` | `User` | 4 |
| Водители | `/drivers` | `Driver` | 3 |
| Продукты | `/products` | `Product` | 3 |
| Контракты | `/contracts` | `Contract` | 3 |
| Претензии | `/claims` | `Claim` | 5 |
| Шаблоны перевозок | `/shipment-templates` | `ShipmentTemplate` | 3 |
| Перевозки в пути (visits) | `/visits` | `Visit` | 4 |
| Таможенные инвойсы | `/customs-invoices` | `CustomsInvoice` | 3 |
| Транспортные запросы | `/transport-requests` | `TransportRequest` | 5 |

---

## Detail Pages (Страницы деталей)

Показывают один объект, обычно с табами.

| Страница | URL | Главная модель | Табы |
|---------|-----|----------------|------|
| **Детали перевозки** | `/shipments/{id}` | `Shipment` | Tracking, Booking, Logistic, Invoicing, Orders, Transport Requests, Claim |
| Детали заявки | `/shipment-requests/{id}` | `ShipmentRequest` | — |
| Детали слота | `/slots/{id}` | `Slot` | — |
| Детали локации | `/locations/{id}` | `Location` | General, Management, Partners, Settings, Customer, Statuses, Zones, Slot, Slot Validation, Constraints, Calendar, Data Fields, Display |
| Детали заказа | `/orders/{id}` | `Order` | Lines, Shipments |
| Детали Rate Sheet | `/rate-sheets/{id}` | `RateSheet` | Rules, Leadtime, Settings, Fuel Surcharge |
| Детали партнёра | `/partners/{id}` | `Partner` | — |
| Детали инвойса | `/invoices/{id}` | `Invoice` | — |
| Детали контракта | `/contracts/{id}` | `Contract` | — |
| Детали претензии | `/claims/{id}` | `Claim` | — |

---

## Wizard Pages (Многошаговые формы)

Создание объектов через пошаговый wizard.

| Страница | URL | Что создаётся | Шагов |
|---------|-----|--------------|-------|
| **CSW — Create Shipment Workflow** | `/shipment-requests/new` | `ShipmentRequest` + (→ Shipment) | 8 |
| Add Location | `/locations/add` | `Location` | 1 форма |
| Add Order | `/orders/add` | `Order` | 1 форма |
| Add Contract | `/contracts/add` | `Contract` | 1 форма |
| Add Shipment Template | `/shipment-templates/add` | `ShipmentTemplate` | 1 форма |

---

## Modal Pages (Модальные окна)

Открываются поверх основной страницы.

| Модал | Родительская страница | Что делает |
|-------|----------------------|-----------|
| Add Tracking Point | `/shipments/{id}` | Добавить TP |
| Edit Tracking Point | `/shipments/{id}` | Изменить TP |
| Confirm Tracking Point | `/shipments/{id}` | Подтвердить TP |
| Book Slot | `/shipments/{id}` или `/slots` | Забронировать слот |
| Share Shipment | `/shipments/{id}` | Сгенерировать публичную ссылку |
| Request POD | `/shipments/{id}` | Запросить Proof of Delivery |
| Upload Document | везде | Загрузить документ |
| Create Claim | `/shipments/{id}` | Создать претензию |
| Duplicate SR | `/shipment-requests/{id}` | Скопировать заявку |

---

## Dashboard / Analytics Pages

| Страница | URL | Что показывает |
|---------|-----|---------------|
| Главный дашборд | `/dashboard` | KPI сводка |
| Трекинг дашборд | `/dashboard/tracking` | Проблемные перевозки |
| Инвойсинг дашборд | `/dashboard/invoicing` | Финансовые KPI |
| Дашборд CO2 | `/dashboard/co2` | Углеродный след |
| Мониторинг | `/dashboard/monitoring` | Системные метрики |
| Мультивизион | `/multivision` | Агрегированный вид |

---

## Calendar / Board Pages

| Страница | URL | Что показывает |
|---------|-----|---------------|
| Slotify (week) | `/slotify/week` | Слоты по воротам на неделю |
| Slotify (board) | `/slotify/board` | Kanban слотов |
| Shipments Board | `/shipments/board` | Kanban перевозок |
| SR Board | `/shipment-requests/board` | Kanban заявок |
| Map | `/map` | Геокарта перевозок |
| Sea Schedule | `/sea-schedule` | Расписание морских рейсов |

---

## Settings / Config Pages

Конфигурационные страницы, обычно меняются редко.

| Страница | URL |
|---------|-----|
| Rights Management | `/rights-management` |
| Webhooks | `/webhooks` |
| Public Tracking Settings | `/public-tracking-setting` |
| Account Settings | `/account-settings` |
| Auth Management | `/auth-management` |
| Self-Admin (Carriers, Users) | `/self-admin-*` |
| Galaxy Configuration | `/galaxy/*` |

---

## Справочники (Dictionary Pages)

Страницы управления небольшими справочными таблицами.

`/tags`, `/teams`, `/cargo-types`, `/attachment-types`, `/metadata-prototypes`,
`/account-specificities`, `/account-currencies`, `/account-payment-terms`,
`/cost-centers`, `/profit-centers`, `/accounting-entities`, `/vat-rates`,
`/dangerous-goods-descriptions`, `/message-types`, `/account-incidents`,
`/account-claim-types`, `/external-costs-types`

---

## 🔗 Граф-метаданные
- **id:** `tms.technical-view.page-inventory`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631931061 · **repo:** `tms/technical-view/page-inventory.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

