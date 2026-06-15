---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632226003
source_type: confluence
---
# Страница: Детали перевозки

```
Тип:      Detail Page (tabbed)
URL:      /shipments/{id}
Модель:   Shipment (+ связанные)
Frontend: workspaces/frontend/public/app/shipments/view/
Backend:  GET /api/shipments/{id} → loadExtendedShipmentInfo()
```

---

## Предусловия

```
Shipment с этим id существует:
  └── Создан из ShipmentRequest (status: confirmed)
      ├── Carrier подтвердил (SR) или Shipper выбрал котировку (QR)
      └── ShipmentRequest создан через CSW wizard

Пользователь имеет доступ:
  ├── Shipper: ShipperACL включает этот Shipment
  ├── Carrier: Shipment.carrier_id совпадает с аккаунтом
  ├── Admin: полный доступ
  └── Spectator: Shipment расшарен с ним

TrackingPoints (минимум 2):
  └── Создаются АВТОМАТИЧЕСКИ при создании Shipment
      ├── departure (pick-up)
      └── arrival (delivery)
```

---

## Загрузка данных страницы

**Один основной запрос:** `GET /api/shipments/{id}?expand=full`

Функция: `loadExtendedShipmentInfo(id, user)`

Что загружается:
```javascript
Shipment.findOne({
  where: { id },
  include: [
    { model: Carrier },
    { model: Shipper },
    { model: ShipperDivision },
    { model: CarrierDivision },
    { model: ShipmentRequest, include: [QuoteRequest, Location(from), Location(dest)] },
    { model: TrackingPoint, include: [Location] },
    { model: ShipmentContent },
    { model: ShipmentAttachment },
    { model: Tag },
    { model: Slot, include: [DockDoor] },
    { model: Order },
  ]
})
```

---

## Табы и их содержимое

### Таб 1: Tracking (по умолчанию)

**Что показывает:**

| Элемент | Источник | Модель |
|---------|---------|--------|
| Список TrackingPoints | AUTO при создании Shipment | `TrackingPoint[]` |
| Тип точки | `departure` / `arrival` / `transit` | `TrackingPoint.type` |
| Плановая дата | Из SR / QR | `TrackingPoint.planned_date` |
| Фактическая дата | После подтверждения | `TrackingPoint.real_date` |
| Статус точки | not_confirmed / confirmed / delayed | `TrackingPoint.status` |
| Статус Shipment | Пересчитывается | `calculateShipmentStatus()` |
| Активные интеграции | DHL, P44, Shippeo… | `Shipment.active_integrations` |
| Subcontract данные | Только Carrier, только Road | `Shipment.subcontract` |

**Действия на Tracking tab:**

| Кнопка | HTTP | Endpoint | Что меняется в БД |
|--------|------|---------|------------------|
| Подтвердить TP | PATCH | `/api/tracking-points/{id}/confirm` | `TP.status=confirmed`, `TP.real_date=now` |
| Добавить TP | POST | `/api/shipments/{id}/tracking-points` | Новый `TrackingPoint` |
| Перепланировать | PATCH | `/api/tracking-points/{id}` | `TP.planned_date` меняется |
| Запросить инфо | POST | `/api/notifications/remind` | Email задача `mailTrackingRemind` |
| Отменить перевозку | DELETE/PATCH | `/api/shipments/{id}/cancel` | `Shipment.status=canceled` + интеграции |
| Запросить POD | POST | `/api/shipments/{id}/pod-request` | `Shipment.pod_status=expected` |
| Share tracking | POST | `/api/shipments/{id}/share` | Создаёт публичный token |

---

### Таб 2: Booking

**Что показывает:**

| Элемент | Источник |
|---------|---------|
| Данные перевозчика | `Carrier` (name, logo, contacts) |
| Параметры SR/QR | `ShipmentRequest` (cargo, locations, dates) |
| Принятая котировка | `Quote` (если QR) |
| Активные услуги | `ShipmentRequest.services[]` |

---

### Таб 3: Logistic

**Что показывает:**

| Элемент | Источник |
|---------|---------|
| Metadata поля | `ShipmentMetadata[]` (кастомные поля аккаунта) |
| Документы | `ShipmentAttachment[]` |
| Статус каждого документа | missing / uploaded / approved |
| Запросы документов | `AttachmentRequest[]` |

**Действия:**
- Upload document → `POST /api/shipments/{id}/attachments` → S3 upload → `ShipmentAttachment` создаётся
- Request document → `POST /api/attachment-requests` → email Carrier `mailAttachmentRequest`

---

### Таб 4: Invoicing

**Что показывает:**

| Элемент | Источник |
|---------|---------|
| Котировочная цена | `Quote.price` (из QR) или `ShipmentRequest.price` |
| Pre-Invoice | `PreInvoice` |
| Invoice | `Invoice` |
| Cost Segments | `CostSegment[]` |
| Delta | рассчитывается: invoice - quoted |

---

### Таб 5: Orders (если есть)

**Что показывает:** `Order[]`, связанные с этим Shipment.

Загружается: `Shipment.orders` через `include: [Order]`

---

### Таб 6: Claims (если есть)

**Что показывает:** `Claim[]`, связанные с этим Shipment.

**Действие "Create Claim":** → открывает modal → `POST /api/claims` → `Claim` создаётся

---

## Правая панель

| Элемент | Источник |
|---------|---------|
| Чат / Discussion | WebSocket → `workspaces/microservices/msg-ws/` |
| Metadata форма | `ShipmentMetadata[]` (коллапсируемые секции) |
| Drag-and-drop зона | Загружает в `ShipmentAttachment` через S3 |

---

## Навигация

**Входящие пути (откуда можно попасть):**

| Источник | Как |
|---------|-----|
| `/shipments` | Клик по строке |
| `/dashboard` виджет | Клик на перевозку |
| `/dashboard/tracking` | Клик на проблемную |
| `/shipment-requests/{id}` | Кнопка "→ Shipment" |
| `/pod-requests` | Клик по строке |
| Email уведомление | Ссылка в письме |
| `/public-tracking/{token}` | Публичная ссылка (без auth) |

**Исходящие переходы:**

| Куда | Как |
|------|-----|
| `/shipments` | Кнопка "← Назад" |
| `/slots/{id}` | Клик на слот в Tracking |
| `/partners/{id}` | Клик на имя Carrier |
| `/orders/{id}` | Orders tab → клик |
| `/claims/{id}` | Claims tab → клик |
| `/shipments/{id}/track` | Добавить TP (modal) |

---

## Что сломается при изменении

| Изменение | Затронет |
|-----------|---------|
| Добавить таб | Frontend: `view.component.html` + router; Backend: новый include в `loadExtendedShipmentInfo()` |
| Изменить TrackingPoint статусы | Tracking tab UI, `calculateShipmentStatus()`, все email условия в Worker, Driver App |
| Убрать поле из Carrier include | Booking tab — пропадут данные; email шаблоны с Carrier данными |
| Изменить endpoint подтверждения TP | Driver App тоже использует этот endpoint |
| Изменить ACL проверку | Spectator'ы могут потерять/получить доступ |
| Убрать чат | Нужно также отключить `workspaces/microservices/msg-ws/` |

---

## Полный список API вызовов со страницы

```
GET  /api/shipments/{id}                       ← загрузка данных
PATCH /api/tracking-points/{id}/confirm        ← подтвердить TP
POST  /api/shipments/{id}/tracking-points      ← добавить TP
PATCH /api/tracking-points/{id}               ← редактировать TP
PATCH /api/shipments/{id}/cancel              ← отменить перевозку
POST  /api/shipments/{id}/pod-request         ← запросить POD
POST  /api/shipments/{id}/share               ← публичная ссылка
POST  /api/shipments/{id}/attachments         ← загрузить документ
POST  /api/attachment-requests                ← запросить документ
POST  /api/claims                             ← создать претензию
WS    wss://msg-ws/rooms/shipment_{id}        ← чат
```

---

## 🔗 Граф-метаданные
- **id:** `tms.technical-view.pages.shipment-detail`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632226003 · **repo:** `tms/technical-view/pages/shipment-detail.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

