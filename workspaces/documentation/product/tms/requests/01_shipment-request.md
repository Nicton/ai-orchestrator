---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633077827
source_type: confluence
---
# SR — Shipment Request (прямое бронирование)

## Что это

SR — заявка на перевозку одному конкретному перевозчику. Shipper выбирает перевозчика в CSW wizard, перевозчик получает уведомление и подтверждает или отклоняет. После подтверждения автоматически создаётся Shipment.

**URL списка:** `/shipment-requests`
**URL деталей:** `/shipment-requests/{id}`
**Frontend:** `workspaces/frontend/public/app/shipmentRequests/`

---

## Список заявок

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Иконка режима | Road / Air / Sea / Express / Groupage |
| Название | Имя заявки |
| Статус | Draft / RTB / Pending / Confirmed / Cancelled |
| Перевозчик | Название и лого |
| Откуда | Локация отправки |
| Куда | Локация доставки |
| Даты | Плановые даты pick-up и delivery |
| Количество котировок | Для QR: сколько ответов получено |

### Фильтры

| Фильтр | Описание |
|--------|---------|
| Режим | Road / Air / Sea / Express / Groupage |
| Статус | Draft / RTB / Pending / Confirmed / Cancelled |
| Перевозчик | Фильтр по перевозчику |
| Локация / Период | Откуда/куда + диапазон дат |
| Теги | По тегам |
| Accounting entities | По юридическому лицу |

---

## Страница деталей SR

### Что видит пользователь

**Левая часть — детали заявки:**
- Cargo: тип груза, вес, размеры, dangerous goods
- Locations: откуда и куда с адресами
- Dates: окно pick-up и delivery
- Conditions: incoterm, страховка, специальные условия
- Notes: комментарии, internal notes

**Правая часть — статус и действия:**
- Текущий статус заявки
- Перевозчик (с контактами)
- Активные услуги (страховка, ADR и др.)
- Список подписчиков (followers)

**Нижняя часть:**
- Чат / переписка
- Документы и вложения

---

## Действия

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Редактировать | Открывает форму редактирования | Shipper (пока `pending`) |
| Отменить | `ShipmentRequest.status = cancelled` | Shipper |
| Дублировать | Создаёт копию SR → CSW wizard заполнен | Shipper |
| Скачать как шаблон | Сохраняет как ShipmentTemplate | Shipper |
| Подтвердить (от имени перевозчика) | `status = confirmed` → Shipment | Admin |
| Добавить follower | Добавляет пользователя в подписчики | Shipper |
| Загрузить документ | Добавляет к заявке | Shipper, Carrier |

---

## Что делает Carrier (со своей стороны)

Carrier получает email с заявкой. Его действия:

| Действие | Результат |
|----------|---------|
| Подтвердить заявку | `status = confirmed` → Shipment создаётся |
| Отклонить | `status = cancelled` → Shipper получает уведомление |
| Запросить уточнение | Сообщение в чат |

---

## Мутации (SR → Shipment)

### Внутренние (БД)

При подтверждении перевозчиком:
```
ShipmentRequest.status = 'confirmed'
Shipment создаётся (createShipment()):
  - Shipment.carrier_id = выбранный carrier
  - Shipment.status = 'planned'
  - TrackingPoint[] создаются (pick-up + arrival)
```

### Внешние (интеграции)

- **Email** `mailShipmentRequestCreatedToCarrier` → уведомление перевозчику при создании SR
- **Email** `mailConfirmShipmentRequest` → подтверждение shipper'у
- **Carrier API** (если интеграция): автоматическое бронирование через `app/services/integration/[carrier]/service.js`
- **Webhook** `shipmentCreated` → клиентские системы

---

## Переходы

- Подтверждение → `/shipments/{id}` (страница созданного Shipment)
- Отмена → остаётся на `/shipment-requests/{id}` со статусом `cancelled`
- Дублировать → `/shipment-requests/new` (CSW wizard с заполненными данными)

---

## Backend

- `app/services/shipment_requests.js` → `createShipmentRequestByInput()`, `updateShipmentRequestByInput()`
- `app/services/shipments.js` → `createShipment()` (создаётся после подтверждения)
- Worker: `worker/tasks/notify_by_email.js` — все email-уведомления

---

## 🔗 Граф-метаданные
- **id:** `tms.requests.01_shipment-request`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633077827 · **repo:** `tms/requests/01_shipment-request.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

