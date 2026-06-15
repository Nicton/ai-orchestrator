---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631504980
source_type: confluence
---
# Вкладка Booking — Детальная документация

> Источники: `s-requests/controllers/view.js` · `s-requests/views/view.html`  
> Вкладка: `TAB_NAME_QUOTES = 'quotes'` (отображается как "Booking")

---

## Когда доступна

Вкладка Booking показывается на **странице ShipmentRequest** (`/shipment-requests/{id}`):
- До подтверждения — полный функционал редактирования
- После Auto-Confirm — переход к Tracking вкладке

На **странице Shipment** (`/shipments/{id}`) эта вкладка называется "Booking" (тот же `TAB_NAME_QUOTES`) и показывает информацию о завершённом бронировании.

---

## Что показывается

### 1. Shipment Card (Карточка перевозки)

Компонент `requests-page-header-component` — верхняя секция с:

| Блок | Поля |
|------|------|
| Название | `shipmentRequest.name` + code prefix |
| Маршрут | `address_from` → `address_dest` |
| Даты | `shipping_date_from/to`, `arrival_date_from/to` |
| Режим | `shipmentRequest.modes[].icon` |
| Груз | `cargoTotalInfo` (вес, объём, погонные метры) |
| Статус | badge с `statusClass` |

---

### 2. Информация о перевозчике (Carrier block)

| Элемент | Условие | Источник |
|---------|---------|---------|
| Лого Carrier | Всегда (если есть carrier) | `carrier.logo_url` |
| Имя Carrier | Всегда | `carrier.name` |
| Reply before | `ctrl.answer_before_text` | `moment(reply_before).format('DD/MM/YYYY')` |
| Remaining time | `ctrl.remaining` | Относительно текущей даты |
| Auto-confirm кнопка | `!isSharedSpectator && canDoAutoConfirm()` | Подтверждение без участия Carrier |
| Confirm / Decline (Carrier side) | `ctrl.isCarrier` | Подтверждение/отклонение заявки |
| Send Transport Order | `ctrl.canSubcontract` | PDF отправка субподрядчику |

---

### 3. Цена (Price Details)

| Поле | Источник | Редактирование |
|------|---------|--------------|
| `price_details[]` | `quote_request.price_details` | Только если `can_modify` |
| `total_price` | `calculate_total_cost()` | Авто-вычисление |
| Валюта | `getCurrencySymbolFromEntity()` | — |

**Условие редактирования:**

```javascript
// view.js
this.can_modify = dataShipment.status === 'new' || dataShipment.status === 'declined';
```

---

### 4. Detailing (Duration, Cost)

```javascript
this.calculate_total_cost = () => {
    this.total_price = this.price_details...reduce(sum);
};
this.calculate_duration = () => {
    this.duration = calcShipmentDuration(from_date, to_date);
};
```

---

### 5. Кнопки действий

| Кнопка | Условие | Действие |
|--------|---------|---------|
| **Auto-Confirm** | `!isSharedSpectator && !pre_awarded && canDoAutoConfirm()` | PATCH `/shipment-requests/:id` → confirm → создаёт SH |
| **Confirm** (Carrier) | `ctrl.isCarrier && status === SR_STATUS_SENT_TO_CARRIER` | Подтверждение + переход в Tracking |
| **Decline** (Carrier) | `ctrl.isCarrier` | Отклонение |
| **Cancel** (Shipper) | `ctrl.isSelfAdmin` | Отмена заявки |
| **Edit booking** | `can_modify && !hideEditButton` | Открывает CSW в режиме edit |
| **Repeat** | SelfAdmin Shipper | `routerGo('all shipment requests', {id, repeatAction: true})` |
| **Forward** | SelfAdmin Shipper | `forwardAction: true` |
| **Reverse** | SelfAdmin Shipper | `reverseAction: true` |
| **Split** | SelfAdmin Shipper | Открывает `split-request-modal` |
| **Convert to booking** | pre_awarded mode | POST создание SR |

---

### 6. QR Quotes (Quote Request секция)

Если заявка через Quote Request — появляется список котировок:

| Элемент | Описание |
|---------|---------|
| Список котировок | `quote_requests[]` от каждого Carrier |
| Статус котировки | `QR_STATUS_AWARDED`, `pending`, `declined` |
| Кнопка Accept | Shipper выбирает котировку → Auto-confirm |
| Applied Rate Sheet | `buildAppliedRates(quote_request, rates)` |

---

### 7. Pre-shipments секция

На вкладке Booking отображается детальная карточка каждого pre-shipment:

| Блок | Поля |
|------|------|
| Адреса | `address_from`, `address_dest` с иконками |
| Даты | Departure + Arrival range |
| Зона | Если ML — название зоны |
| Инкотерм | Если настроен |
| Группа груза | `pre_shipment.contents[]` |
| Таможня | `customs_declared_value`, `customs_currency` |

---

### 8. Attachments (вкладка Booking)

На SR детальной странице вложения показываются в секции **"Booking" documents**:

| Тип | Отображение |
|-----|------------|
| `BOOKING_TRANSPORT_ORDER_TYPE` | Транспортный ордер (PDF) — с кнопкой скачать |
| Прочие | Обычный список |

**Событие обновления:**

```javascript
// s-requests/controllers/view.js
const BOOKING_TRANSPORT_ORDER_UPLOADED_EVENT = 'bookingTransportOrderUploaded';
$rootScope.$on(BOOKING_TRANSPORT_ORDER_UPLOADED_EVENT, loadTransportOrder);
```

---

### 9. Incoterms Display

| Показывается | `shipmentRequest.incoterm_id` не пустой |
|---|---|
| Поле | `preShipment.incoterm.code` |
| Tooltip | Описание инкотерма |
| Направление | `INCOTERM_TYPES.FROM` / `TO` |

---

## API вызовы с вкладки Booking

| Действие | Метод | Эндпоинт |
|---------|-------|---------|
| Auto-confirm (Shipper) | PATCH | `/api/v1/shipment-requests/:id` + `{ status: 'confirmed', carrier_id }` |
| Confirm (Carrier) | PATCH | `/api/v1/shipment-requests/:id` + `{ status: 'confirmed' }` |
| Decline (Carrier) | PATCH | `/api/v1/shipment-requests/:id` + `{ status: 'declined' }` |
| Cancel (Shipper) | DELETE | `/api/v1/shipment-requests/:id` |
| Update price | PATCH | `/api/v1/shipment-requests/:id` + `{ price_details: [...] }` |
| Update dates | PATCH | `/api/v1/shipment-requests/:id/dates` |
| Split | POST | `/api/v1/shipment-requests/:id/split` |

---

## Статусы SR на вкладке Booking

| Статус | Константа | Что показывается |
|--------|---------|-----------------|
| `new` | `SR_STATUS_NEW` | Кнопки: Auto-confirm, Edit, Cancel |
| `sent_to_carrier` | `SR_STATUS_SENT_TO_CARRIER` | Carrier: Confirm/Decline; Shipper: ждёт |
| `awarded` | `SR_STATUS_AWARDED` | Котировка принята, ждёт confirm |
| `confirmed` | — | → Redirect на Tracking tab |
| `declined` | `SR_STATUS_DECLINED` | Кнопки: Rebooking, Cancel |
| `canceled` | `SR_STATUS_CANCELED` | Только информация |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.03_details.tab_booking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631504980 · **repo:** `tms/shipments/03_details/tab_booking.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

