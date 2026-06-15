---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631898260
source_type: confluence
---
# Заявки (Shipment Requests)

Заявка — это отправная точка любой перевозки. Shipper описывает, что, откуда, куда и когда нужно перевезти. Из заявки создаётся Shipment (когда перевозчик принят).

Два типа заявок:
- **SR (Shipment Request)** — один перевозчик, прямое бронирование
- **QR (Quote Request)** — несколько перевозчиков, запрос котировок

## Кто использует

- **Shipper** — создаёт заявки через CSW wizard или через API
- **Carrier** — получает уведомление, подтверждает или отклоняет заявку
- **Admin** — полный доступ

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_shipment-request.md](01_shipment-request.md) | Shipment Request: прямое бронирование |
| [02_quote-request.md](02_quote-request.md) | Quote Request: запрос котировок у нескольких перевозчиков |

---

## Место в потоке

```
CSW Wizard (создание)
      ↓
ShipmentRequest
  ├── SR → Carrier подтверждает → Shipment
  └── QR → Котировки → Shipper выбирает → Shipment

[Домен: Отправки] ← результат
```

---

## Статусы ShipmentRequest

| Статус | Описание |
|--------|---------|
| `draft` | Wizard не завершён |
| `rtb` | Ready-to-Book: все поля заполнены |
| `pending` | Отправлена перевозчику, ожидает ответа |
| `confirmed` | Подтверждена, Shipment создан |
| `cancelled` | Отменена |

---

## Backend

- Сервис: `app/services/shipment_requests.js`
- Создание: `createShipmentRequestByInput()`
- Обновление: `updateShipmentRequestByInput()`
- Уведомления: `notifyShipmentCreated()`, `notifyFollowersOnContentChange()`
- Frontend: `workspaces/frontend/public/app/shipmentRequests/`

---

## 🔗 Граф-метаданные
- **id:** `tms.requests`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631898260 · **repo:** `tms/requests/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

