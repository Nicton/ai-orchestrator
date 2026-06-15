---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029302
source_type: confluence
---
# QR — Quote Request (запрос котировок)

## Что это

QR — запрос цены у нескольких перевозчиков одновременно. Shipper рассылает запрос, перевозчики отвечают ценой, shipper выбирает лучшую котировку. После выбора создаётся Shipment с выбранным перевозчиком.

Используется когда:
- Не определён конкретный перевозчик
- Нужно сравнить цены
- Действует тендерная модель

**URL:** `/shipment-requests` (тот же список, что SR, с фильтром по типу)
**Frontend:** `workspaces/frontend/public/app/shipmentRequests/`

---

## Поток QR

```
Shipper создаёт QR (CSW wizard, выбирает ≥2 перевозчиков)
          ↓
QuoteRequest создаётся, статус: pending_quotes
          ↓
Все перевозчики получают email с запросом котировки
          ↓
Carrier A отвечает: 1200€   ← Quote создаётся
Carrier B отвечает: 980€    ← Quote создаётся
Carrier C не отвечает       ← timeout
          ↓
Shipper видит все котировки, сравнивает
          ↓
Shipper выбирает Carrier B (980€)
          ↓
Shipment создаётся с Carrier B
Carrier A + C получают уведомление об отклонении
```

---

## Страница QR

### Что видит пользователь

**Список котировок** (после получения ответов от перевозчиков):

| Колонка | Описание |
|---------|---------|
| Перевозчик | Название + лого |
| Цена | Предложенная стоимость + валюта |
| Срок доставки | Предложенный lead time |
| Условия | Дополнительные условия от перевозчика |
| Статус | Pending / Received / Accepted / Declined |
| Действие | Кнопка "Принять" |

### Deadline ответа

`reply_before` — дата, до которой принимаются котировки. После дедлайна QR закрывается.

---

## Действия

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Принять котировку | Выбирает winner, создаёт Shipment | Shipper |
| Отклонить котировку вручную | Перевозчик получает уведомление | Shipper |
| Продлить deadline | Изменяет `reply_before` | Shipper |
| Отменить QR | `status = cancelled`, все перевозчики уведомлены | Shipper |
| Напомнить перевозчику | Email-напоминание о котировке | Shipper |

---

## Что делает Carrier (со своей стороны)

Carrier получает email с параметрами груза и маршрута. Его действия:

| Действие | Результат |
|----------|---------|
| Ответить с ценой | Quote создаётся, Shipper уведомлён |
| Отклонить | Quote отклонена, Shipper видит отказ |
| Не ответить до deadline | Автоматически закрывается |

---

## Мутации (при выборе котировки)

### Внутренние (БД)

```
QuoteRequest.winner_quote_id = выбранный Quote.id
QuoteRequest.status = 'accepted'
Shipment создаётся:
  - Shipment.carrier_id = winner.carrier_id
  - Shipment.status = 'planned'
  - TrackingPoint[] создаются
Другие Quote → status = 'declined'
```

### Внешние (интеграции)

- **Email** `mailQrToCarrier` → рассылка запроса котировок всем перевозчикам
- **Email** `mailQuoteReceived` → уведомление Shipper'у о новой котировке
- **Email** `mailQrAccepted` → победившему перевозчику
- **Email** `mailQrDeclined` → проигравшим перевозчикам
- **Carrier API** (если интеграция): автоматическое бронирование с победителем
- **Webhook** `shipmentCreated`

---

## Переходы

- Выбор котировки → `/shipments/{id}` (новый Shipment)
- Отмена QR → список `/shipment-requests` со статусом `cancelled`

---

## Backend

- `app/services/shipment_requests.js` → `createShipmentRequestByInput()` (с QR-флагом)
- `app/models/quote_request.js` — модель QR
- `app/models/quote.js` — котировка от одного перевозчика
- Выбор котировки → `createShipment()`
- Worker: `worker/tasks/notify_by_email.js` — все QR email-уведомления

---

## 🔗 Граф-метаданные
- **id:** `tms.requests.02_quote-request`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632029302 · **repo:** `tms/requests/02_quote-request.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

