---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632750178
source_type: confluence
---
# Создание перевозки — CSW Wizard

## Что это

CSW (Create Shipment Workflow) — пошаговый мастер создания заявки на перевозку. Shipper заполняет 8 секций, в конце выбирает перевозчика и подтверждает бронирование. Из заполненных данных создаётся `ShipmentRequest` и затем `Shipment`.

## Кто использует

- **Shipper** — основной пользователь, заполняет все поля
- **Admin** — может создавать от имени shipper'а

**URL:** `/shipment-requests/new` → `/new-wizard/:modeId`
**Frontend:** `workspaces/frontend/public/app/shipmentRequests/`

---

## Шаги Wizard

### Шаг 1: Basics (Основное)

| Поле | Описание | Обязательно |
|------|---------|------------|
| Name | Название перевозки (видно в списке) | Нет (генерируется) |
| Mode | Тип перевозки: Road / Air / Sea / Express / Groupage | Да |
| Shipper | Грузоотправитель (если мультиаккаунт) | Да |
| Entity | Юридическое лицо (Accounting Entity) | Нет |
| Tags | Теги для фильтрации | Нет |
| Group Template | Шаблон для milkrun/повторяющихся | Нет |

---

### Шаг 2: Cargo (Груз)

| Поле | Описание |
|------|---------|
| Content type | Тип содержимого (пакеты, паллеты, контейнер) |
| Dimensions | Длина × Ширина × Высота |
| Weight | Вес (кг) |
| Total volume / Total weight | Переключатели суммарных значений |
| Dangerous goods | Описание опасного груза (ADR) |
| Specificities | Особые требования (температура, хрупкое) |
| Cargo groups | Группировка груза |

---

### Шаг 3: Location & Incoterms (Откуда / Куда)

| Поле | Описание |
|------|---------|
| Pick-up location | Адрес отправки (из списка локаций или ввод вручную) |
| Delivery location | Адрес доставки |
| Incoterm | Условие поставки (EXW, DAP, DDP и др.) |
| Instructions | Специальные инструкции для локации |

**Важно:** Локации берутся из справочника `Location` или вводятся вручную (если разрешено для аккаунта).

---

### Шаг 4: Pre-Shipment (Предотправка)

| Поле | Описание |
|------|---------|
| Pre-shipments | Промежуточные точки маршрута (для Milkrun) |
| Location followers | Пользователи, которые получают уведомления по локации |

Для Milkrun: второй pre-shipment должен совпадать по локации или дате с предыдущим.

---

### Шаг 5: Lead Times (Даты)

| Поле | Описание |
|------|---------|
| Pick-up date / time (from / to) | Окно забора груза |
| Arrival date / time (from / to) | Окно доставки |
| Reply before | Срок ответа перевозчика на котировку |

---

### Шаг 6: Pricing (Стоимость)

| Поле | Описание |
|------|---------|
| Total volume / weight | Сводные значения |
| Linear meters | Линейные метры (для Road) |
| Currency | Валюта |
| Price details | Детализация стоимости (для групп-шаблонов) |

---

### Шаг 7: Booking (Бронирование)

Два режима:

**SR (Shipment Request) — один перевозчик:**
- Выбор перевозчика из списка партнёров
- Прямое бронирование (auto-confirm) или "Request to carrier"

**QR (Quote Request) — несколько перевозчиков:**
- Выбор нескольких перевозчиков
- Отправка запроса котировок
- Перевозчики отвечают ценой, shipper выбирает лучшую

---

### Шаг 8: Bottom Section (Финал)

| Поле | Описание |
|------|---------|
| Notes / Comments | Дополнительные комментарии |
| Metadata | Кастомные поля |
| Attachments | Прикладные документы (CMR, инвойс) |

---

## Мутации (что создаётся в системе)

### Внутренние (БД)

```
При отправке wizard:
  → ShipmentRequest (запись с данными формы)
  → ShipmentContent[] (груз)
  → Если SR: ShipmentRequest.status = 'pending' → уведомление перевозчику
  → Если QR: QuoteRequest создаётся, статус = 'pending_quotes'
  → Follower records (для подписчиков уведомлений)
```

**При подтверждении перевозчиком (SR) или выборе котировки (QR):**
```
  → Shipment создаётся из ShipmentRequest
  → TrackingPoint[] создаются (pick-up + delivery)
  → ShipmentRequest.status = 'confirmed'
```

### Внешние (интеграции)

- **Email:** задача `mailNewShipmentRequestToCarrier` → письмо перевозчику
- **Email:** задача `mailShipmentRequestCreatedToShipper` → подтверждение shipper'у
- **Carrier API** (если интеграция активна): автоматическое бронирование через `app/services/integration/[carrier]/service.js`
- **Webhook:** событие `shipmentCreated` → клиентские системы

---

## Переходы после создания

- **Успех (SR):** → `/shipment-requests/{id}` (страница заявки)
- **Успех (QR):** → `/shipment-requests/{id}` → ждать котировки → `/shipments/{id}` после выбора
- **Отмена:** → `/shipment-requests` (список заявок)

---

## Связанный код

- Frontend wizard: `workspaces/frontend/public/app/shipmentRequests/new-s-request/`
- Backend создание SR: `app/services/shipment_requests.js` → `createShipmentRequestByInput()`
- Backend создание Shipment: `app/services/shipments.js` → `createShipment()`
- Worker email: `worker/tasks/notify_by_email.js`

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.01_create-shipment-wizard`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632750178 · **repo:** `tms/shipments/01_create-shipment-wizard.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

