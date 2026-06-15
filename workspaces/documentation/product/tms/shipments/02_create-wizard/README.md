---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632651874
source_type: confluence
---
# CSW — Мастер создания заявки на перевозку

> Источники: `s-requests/dirrectives/new-s-request/`, `helper/csw.js`, `app/services/shipment_requests.js`  
> Связанные страницы: [Domain Map](../00_domain-map.md) · [Стейт-машина](../04_state-machine.md)

---

## Что такое CSW

**CSW (Create Shipment Wizard)** — модальный мастер создания заявки на перевозку. Открывается из кнопки **+ BOOK** в левом сайдбаре приложения.

Результат работы CSW — создание объекта **ShipmentRequest** (заявка) в БД, который затем переходит в **Shipment** (перевозка) после подтверждения перевозчиком.

---

## Архитектура

```
Sidebar кнопка "+ BOOK"
        ↓
NewShipmentRequestCtrl  [s-requests/controllers/new.js]
        ↓  $uibModal.open()
NewShipmentRequestModalCtrl  [dirrectives/new-s-request/controllers/index.js]
        ↓  template: views/index.html
┌────────────────────────────────────────────┐
│  1. Basics     (name, mode, entities, tags) │
│  2. Cargo      (типы груза, спецификации)   │
│  3. Pre-ships  (адреса, даты, зоны)         │
│  4. Booking    (перевозчик, цена, тип)      │
│  5. Attachments (вложения)                  │
└────────────────────────────────────────────┘
        ↓  POST /api/v1/shipment-requests
  ShipmentRequest создан в БД
```

**Modal resolve** — данные загружаются ДО открытия модала:

| Ключ | Сервис | Назначение |
|------|--------|-----------|
| `dataShippers` | `Shippers` | Список шипперов |
| `dataShipmentModes` | `ShipmentModes` | Режимы перевозки |
| `dataCarriers` | `Carriers` | Активные перевозчики (include: users) |
| `dataShipperCarriers` | `ShipperCarriers` | Связки shipper↔carrier |
| `dataContentTypes` | `ShipmentContentTypes` | Типы содержимого |
| `dataSpecificities` | `ShipmentSpecificities` | Особые условия |
| `dataPriceDetails` | `ShipperPriceDetails` | Детали цен |
| `dataAccountingEntities` | `AccountingEntities` | Юридические лица |
| `dataAllowedSpectators` | `ConnectedAccounts` | Наблюдатели |
| `dataValidationSettings` | `ShipmentRequests` | Правила валидации |
| `dataPopularLocations` | `Locations` | Популярные адреса |
| `dataTags` | `Tags` | Теги (scope: booking) |
| `dataAttachments` | `Attachments` | Вложения (при edit/repeat) |
| `dataShipmentRequest` | `ShipmentRequests` | Существующая заявка (edit) |

---

## Режимы открытия

Wizard открывается в разных режимах в зависимости от `$stateParams`:

| Режим | Параметр | Что происходит |
|-------|---------|----------------|
| **Новая заявка** | нет `id` | Пустая форма |
| **Редактирование** | `id=123` | Форма заполнена данными SR |
| **Повтор (Repeat)** | `id=123, repeatAction=true` | Копия SR без дат |
| **Вперёд (Forward)** | `id=123, forwardAction=true` | Новая заявка от точки доставки |
| **Назад (Reverse)** | `id=123, reverseAction=true` | Заявка в обратном направлении |
| **Шаблон** | `isShipmentTemplate=true` | Создание/редактирование шаблона |
| **Групповой шаблон** | `isGroupTemplate=true` | Шаблон для routines |

---

## Два типа бронирования (Wizard Mode)

```javascript
// helper/csw.js
const WIZARD_MODE_DIRECT_BOOKING = 'db';  // Прямое бронирование
const WIZARD_MODE_REQUEST_QUOTES = 'rq';  // Запрос котировок
```

| Режим | Кнопка | Результат |
|-------|--------|---------|
| `db` — Direct Booking | **SEND BOOKING** | SR с одним перевозчиком → Shipment после confirm |
| `rq` — Request Quotes | **REQUEST N QUOTES** | SR с N перевозчиками → QuoteRequest → выбор котировки |

---

## Разделы документации

| Шаг | Файл | Что покрывает |
|-----|------|--------------|
| 1. Basics | [step-01_basics.md](step-01_basics.md) | Название, режим, юр. лица, теги |
| 2. Cargo | [step-02_cargo.md](step-02_cargo.md) | Типы груза, вес/объём, особые условия |
| 3. Pre-shipment | [step-03_pre-shipment.md](step-03_pre-shipment.md) | Адреса, даты, зоны, инкотермы |
| 4. Booking | [step-04_booking.md](step-04_booking.md) | Перевозчик, цена, тип заявки |
| API | [api.md](api.md) | POST /shipment-requests полный разбор |

---

## Жизненный цикл после создания

```
CSW submit()
    ↓
POST /api/v1/shipment-requests
    ↓
ShipmentRequest создан (status: new)
    ├── Direct Booking → SR ждёт confirm от carrier
    └── Request Quotes → QuoteRequest для каждого carrier
                              ↓
                    Carrier присылает QuoteResponse
                              ↓
                    Shipper выбирает котировку → Confirm
                              ↓
                         ShipmentRequest → Shipment
```

---

## Сверено с кодом (2026-06-11) — отображение перевозчика (REQ-BOOK-017..019)

Шаги мастера (`frontend/public/app/constants/csw.js`, VALIDATE_PROGRESS): **1 Basics → 2 Cargo → 3 Origin → 4 Destination → 5 Booking-модал**.

Выбор перевозчика — в **booking-модале после шага 4** (`csw.directive.js:152-164`, nextStep → isOpenBookingModal). Отображается: **логотип** (`carrier.logo_url`), **рейтинг** (`carrier.rating`), **цена из rate sheet** (price_detail). Промежуточных шагов между packing list и booking нет.

REQ-BOOK-020..022 (reason codes переноса/отмены) — см. [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md).

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632651874 · **repo:** `tms/shipments/02_create-wizard/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

