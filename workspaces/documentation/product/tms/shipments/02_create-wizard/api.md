---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881253
source_type: confluence
---
# CSW API — POST /shipment-requests

> Источник: `backend/app/routes/api/shipment_requests.js` · `backend/app/services/shipment_requests.js`  
> Предусловие: авторизованный Shipper-пользователь

---

## Эндпоинт создания

```
POST /api/v1/shipment-requests
```

**Middleware chain:**

```
requireShipperOrShipperByCarrier
loadAllowedShipperByCarrier
loadAllowedShipperDivisionsForShipperUser
loadAllowedCarrierDivisionsForShipperUser
loadAllowedShipmentRequest
loadAccountIdsForSharedOrders
→ ctrl.create
```

---

## Request Body

```json
{
  "name": "Shipment name",
  "shipper_id": 123,
  "shipper_division_id": 456,
  "carrier_id": 789,
  "carrier_division_id": 1011,
  "status": "new",
  "booking_source": "booking_manual",
  "measurement_system": "metric",
  "accounting_entity_id": 42,
  "reply_before": "2026-06-15T12:00:00Z",
  "pre_awarded": false,
  "booking_tag": { "tag_id": 7 },

  "pre_shipments": [
    {
      "order": 0,
      "from_address_id": 100,
      "dest_address_id": 200,
      "shipping_date_from": "2026-06-20",
      "shipping_date_to": "2026-06-20",
      "arrival_date_from": "2026-06-22",
      "arrival_date_to": "2026-06-22",
      "shipping_time_from": "09:00:00",
      "shipping_time_to": "17:00:00",
      "location_zone_id": null,
      "departure_dock_door_id": null,
      "incoterm_id": null,
      "customs_declared_value": null,

      "contents": [
        {
          "content_type_id": 5,
          "quantity": 3,
          "weight": 150.5,
          "volume": 0.8,
          "length": 120,
          "width": 80,
          "height": 80,
          "stackable": true,
          "specificity_ids": [1, 3]
        }
      ],

      "spectators": [{ "account_id": 321 }],
      "followers": [{ "user_id": 55 }]
    }
  ],

  "price_details": [
    {
      "price_detail_id": 1,
      "value": 450.00,
      "currency_id": 2
    }
  ],

  "shipment_mode_ids": [1],

  "spectators": [{ "account_id": 321 }],
  "tags": [{ "tag_id": 7 }],
  "attachments": [{ "id": 99 }]
}
```

---

## Ключевые поля payload

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|---------|
| `name` | STRING | ДА | Название заявки |
| `shipper_id` | INTEGER | ДА | ID аккаунта Shipper |
| `shipper_division_id` | INTEGER | ДА | ID division Shipper |
| `carrier_id` | INTEGER | Для Direct Booking | ID аккаунта Carrier |
| `carrier_division_id` | INTEGER | Для Direct Booking | ID division Carrier |
| `status` | ENUM | ДА | `new` / `draft` / `ready_to_book` |
| `booking_source` | STRING | НЕТ | Источник бронирования |
| `pre_shipments[]` | ARRAY | ДА | Маршруты (минимум 1) |
| `pre_shipments[].contents[]` | ARRAY | ДА | Груз |

---

## Статусы при создании

| Кнопка в CSW | `status` в payload | Состояние SR |
|-------------|-------------------|-------------|
| **SEND BOOKING** | `new` | Активная заявка, отправлена перевозчику |
| **REQUEST N QUOTES** | `new` | Создаются QuoteRequests для каждого carrier |
| **SAVE AS DRAFT** | `draft` | Черновик, не отправлен |
| **SAVE AS READY TO BOOK** | `ready_to_book` | Заполнен, ожидает отправки |

---

## Booking Sources

```javascript
// s-requests/services/shipment_requests_booking_source.js
const BOOKING_SOURCES = {
  bookingManual: 'booking_manual',        // Обычное создание через CSW
  bookingRepeat: 'booking_repeat',        // Повтор существующей заявки
  bookingTemplate: 'booking_template',    // Создание из шаблона
  bookingReverse: 'booking_reverse',      // Обратный маршрут
  bookingForward: 'booking_forward',      // Продолжение маршрута
}
```

Также: `BOOKING_PUBLIC_TEMPLATE = 'booking_public_template'` — создание через публичный токен.

---

## Response (успех)

```json
{
  "id": 5678,
  "name": "Shipment name",
  "status": "new",
  "shipper_id": 123,
  "carrier_id": 789,
  "tracking_code": "SH2026-5678",
  "created_at": "2026-06-10T14:30:00Z",
  "shipment_id": null,
  "pre_shipments": [...],
  "quote_requests": [...]
}
```

---

## После создания (сервис)

```javascript
// app/services/shipment_requests.js
async create(data, options) {
  // 1. Создать ShipmentRequest
  // 2. Создать PreShipments
  // 3. Создать Contents
  // 4. Если Direct Booking:
  //    - Уведомить Carrier (email/websocket)
  // 5. Если Request Quotes:
  //    - Создать QuoteRequest для каждого carrier
  //    - processShipmentRequestDraftDeleted (SAP integration cleanup)
  // 6. Обновить Elasticsearch
  // 7. Создать Tags (ShipmentRequestTag)
  // 8. Обработать Spectators
  // 9. Обработать Attachments (copy if repeat/forward)
  // 10. Создать Follower connections
  // 11. serviceWebhooks.processShipmentRequest (webhooks)
}
```

---

## Связанные эндпоинты (в CSW resolve)

| Эндпоинт | Когда загружается |
|---------|------------------|
| `GET /api/v1/carriers?onlyMain=true&include=users&onlyActive=true` | Всегда |
| `GET /api/v1/shipper-carriers?shipper_id=...` | Всегда |
| `GET /api/v1/shipment-content-types` | Всегда |
| `GET /api/v1/shipment-modes` | Всегда |
| `GET /api/v1/accounting-entities?onlyActive=true` | Всегда |
| `GET /api/v1/locations/popular` | Всегда |
| `GET /api/v1/tags?scope=booking&isActive=true` | Всегда |
| `GET /api/v1/shipment-requests/validation-settings` | Всегда |
| `GET /api/v1/shipment-requests/:id` | Edit / Repeat |
| `GET /api/v1/attachments?sh_request_id=:id` | Edit mode |
| `POST /api/v1/attachments/copy` | Repeat / Forward / Reverse |

---

## Ошибки API

| HTTP код | Ошибка | Причина |
|---------|--------|---------|
| 400 | `BadRequestError` | Невалидные данные (нет name, нет contents) |
| 403 | Forbidden | Нет прав Shipper или division access |
| 404 | `NotFoundError` | carrier_id или address не найдены |
| 422 | Validation error | Нарушение бизнес-правил (например DGD validation) |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard.api`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881253 · **repo:** `tms/shipments/02_create-wizard/api.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

