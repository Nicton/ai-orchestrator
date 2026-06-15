---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631472165
source_type: confluence
---
# Transport Requests (Транспортные запросы)

Transport Requests — запросы на организацию транспортировки, создаваемые внешними системами или партнёрами. В отличие от ShipmentRequest (создаётся Shipper'ом через UI), Transport Request может приходить по API или от внешних систем и требует обработки оператором.

## Кто использует

- **Shipper** — получает Transport Requests от клиентов / через Public API
- **Operator / Логист** — обрабатывает запросы, превращает в ShipmentRequest
- **External Requester** — внешний участник (клиент) без полного доступа к системе

## Место в потоке

```
Внешний клиент / система
    ↓
Transport Request создаётся (через API или /external-requester)
    ↓
Shipper/Operator получает уведомление
    ↓
Оператор обрабатывает запрос → создаёт ShipmentRequest
    ↓
Стандартный флоу: SR/QR → Shipment
```

---

## Страницы

| URL | Описание |
|-----|---------|
| `/transport-requests` | Список Transport Requests |
| `/transport-requests/{id}` | Детали одного запроса |
| `/transport-request-groups` | Группы запросов |
| `/receive-requests` | Входящие запросы (для получателей) |
| `/external-requester` | Форма для внешнего клиента (без авторизации) |

---

## Список Transport Requests

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| ID запроса | Уникальный номер |
| Статус | pending / accepted / rejected / converted |
| Откуда / Куда | Маршрут |
| Даты | Требуемые |
| Тип груза | Описание |
| Источник | UI / API / External Form |
| Создан | Кем и когда |

### Фильтры

- Статус
- Период создания
- Источник (внешний / внутренний)
- Маршрут (локация)

---

## Детали Transport Request

### Что видит пользователь

| Блок | Данные |
|------|--------|
| Маршрут | Откуда, куда |
| Груз | Тип, вес, объём, особые требования |
| Даты | Когда нужно |
| Контакт | Кто запросил |
| История | Переписка, комментарии |
| Связанный SR | (если уже создан) |

### Действия

| Действие | Что происходит |
|----------|---------------|
| Принять + создать SR | Создаётся ShipmentRequest с данными из TR |
| Отклонить | `TransportRequest.status = rejected` → уведомление запросившему |
| Запросить уточнение | Email/сообщение запросившему |
| Группировать | Объединить несколько TR в одну перевозку |

---

## External Requester

**URL:** `/external-requester`

Форма без авторизации для внешних клиентов (покупатели, поставщики). Клиент заполняет:
- Откуда / Куда
- Тип груза, вес
- Требуемые даты
- Контактные данные

После отправки → Transport Request создаётся в системе Shipper'а.

---

## Мутации

**Создание TR:**
- `TransportRequest` создаётся
- Email `mailNewTransportRequestToShipper` → уведомление оператору

**Принять TR → создать SR:**
- `ShipmentRequest` создаётся с данными из TR
- `TransportRequest.status = converted`
- `TransportRequest.shipment_request_id` привязывается

---

## Backend

- Модель: `app/models/transport_request.js`
- Frontend: `workspaces/frontend/public/app/transportRequests/`, `workspaces/mini-apps/frontend/transport-requests/`

---

## 🔗 Граф-метаданные
- **id:** `tms.transport-requests`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631472165 · **repo:** `tms/transport-requests/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

