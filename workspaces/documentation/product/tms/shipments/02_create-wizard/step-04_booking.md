---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632193173
source_type: confluence
---
# CSW Шаг 4 — Booking (Выбор перевозчика и отправка)

> Источники: `new-s-request/controllers/booking.js` · `new-s-request/views/booking.html`  
> Компонент: `new-shipment-request-booking-component`

---

## Что показывается

Вторая основная секция CSW. Открывается после заполнения Pre-shipment.  
Содержит выбор перевозчика(ов), цену и кнопки действий.

---

## Режимы отправки

| Режим | Константа | Кнопка | Описание |
|-------|----------|--------|---------|
| Direct Booking | `WIZARD_MODE_DIRECT_BOOKING = 'db'` | **SEND BOOKING** | 1 перевозчик, ждём confirm |
| Request Quotes | `WIZARD_MODE_REQUEST_QUOTES = 'rq'` | **REQUEST N QUOTES** | N перевозчиков, выбираем котировку |

**Определение режима:**

```javascript
// booking.js
const isDirectBooking = (!shipmentRequest.isRunTemplate && shipmentRequest.can_do_booking)
    || !!shipmentRequest.pre_awarded;
```

---

## Список перевозчиков

### Источники данных

| Resolve | Сервис | Назначение |
|---------|--------|-----------|
| `dataCarriers` | `Carriers` | Все активные перевозчики (include: users) |
| `dataShipperCarriers` | `ShipperCarriers` | Связки shipper↔carrier для текущего shipper |
| `dataAllowedCarrierServices` | `Shippers` | Доступные сервисы перевозчиков |
| `dataAccountCarrierGroups` | `AccountCarrierGroups` | Группы перевозчиков |

### Логика фильтрации перевозчиков

```javascript
// helper/csw.js
const getShipperCarriers = (shipperCarriers, modes, ...) => {
    // Фильтр по режиму (mode)
    // Фильтр по активности (is_active)
    // Фильтр по galaxy (если используется)
    // Сортировка по предпочтительности
}
```

### Поля выбранного перевозчика

| Поле модели | Значение |
|-------------|---------|
| `shipmentRequest.carrier_division` | Объект `{ id, carrier_id, name }` |
| `shipmentRequest.carrier_division_id` | ID division перевозчика |
| `carrier_id` | ID аккаунта перевозчика |

---

## Цена (Price Details)

| Поле | Значение |
|------|---------|
| Данные | `dataPriceDetails` — `ShipperPriceDetails` |
| Поле модели | `shipmentRequest.price_details[]` |
| Валюта | `dataAccountCurrencies` / `$scope.currencies` |

**Структура price detail:**

```javascript
{
  price_detail_id: integer,  // FK → price_details
  value: decimal,            // Сумма
  currency_id: integer,      // FK → currencies
  currency: { iso_code, symbol }
}
```

### Авто-подстановка Rate Sheet

Если у shipper настроены Rate Sheets для данного перевозчика:

```javascript
// helper/rateSheet.js
buildQueryForRateSheet(preShipments, carriers, modes)
```

- При выборе перевозчика → запрос к API для подбора Rate Sheet
- Если Rate Sheet найден → цена подставляется автоматически
- `$scope.rates` — загруженные rate sheets

---

## Transport Plan

| Поле | Значение |
|------|---------|
| `ctrl.transportPlan` | Планируемый транспорт (если SR создаётся из Transport Plan) |
| Тип | `TRANSPORT_PLAN_PREFERRED_TYPE` или `TRANSPORT_PLAN_QUOTE_TYPE` |

---

## Followers (Уведомления)

```javascript
// booking.js
$scope.showFollowersPopup = true;
$scope.showFollowersButton = !angular.copy($scope.hideFollowersButton);
```

Кнопка "Followers" открывает popup выбора людей, которые получат уведомление об отправке заявки.

**Данные:** `dataAllowedSpectators` — список connected accounts.

---

## Кнопки действий (Bottom section)

`new-shipment-request-bottom-section-component` (`controllers/bottom-section.js`):

| Кнопка | Условие показа | Действие |
|--------|---------------|---------|
| **SEND BOOKING** | `wizardMode === 'db'` | `ctrl.book()` → POST /shipment-requests |
| **REQUEST N QUOTES** | `wizardMode === 'rq'` | `ctrl.book()` → POST /shipment-requests + QuoteRequests |
| **SAVE AS DRAFT** | Всегда | `ctrl.saveDraft()` → POST с `status: 'draft'` |
| **SAVE AS READY TO BOOK** | Всегда | `ctrl.saveRTB()` → POST с `status: 'ready_to_book'` |

### Submit flow

```javascript
// index.js → ctrl.book()
1. Валидация (validateProgress все шаги)
2. buildPreShipments() — сборка payload
3. Если IMPERIAL → конвертация единиц
4. POST /api/v1/shipment-requests
5. На success:
   - Direct Booking: routerGo('view shipment request by id', { id })
   - Request Quotes: routerGo('all shipment requests')
```

---

## Carrier Services (Сервисы перевозчиков)

Для отдельных перевозчиков (например Air/Sea) доступны sub-services:

| Поле | Значение |
|------|---------|
| `$scope.carrierServices` | `dataAllowedCarrierServices` |
| `$scope.carrierServiceData` | Выбранный сервис |
| Показывается | После выбора перевозчика с доступными services |

---

## HPR (Heppner) — специальный режим

Если `useHprScope = true` — активируется Heppner booking flow:

```javascript
// helper/csw.js
const getHprModesSettings = (allowedAccountModes) => [
    { title: 'Quote',   wizardMode: WIZARD_MODE_REQUEST_QUOTES, ... },
    { title: 'Ship',    wizardMode: WIZARD_MODE_DIRECT_BOOKING, ... },
    { title: 'Collect', wizardMode: WIZARD_MODE_DIRECT_BOOKING, ... },
]
```

---

## Inviting Carrier (приглашение нового перевозчика)

```javascript
// rights-management/contants.js
CSW_CARRIER_INVITE
```

Если у пользователя есть права `CSW_CARRIER_INVITE` — в booking section появляется возможность пригласить нового перевозчика по email.

---

## Backend поля (отправляемые при submit)

| Поле payload | DB поле | Значение |
|-------------|---------|---------|
| `carrier_division_id` | `carrier_division_id` | ID division перевозчика |
| `carrier_id` | `carrier_id` | ID carrier аккаунта |
| `reply_before` | `reply_before` | Дедлайн ответа на котировку |
| `price_details[]` | `shipment_request_price_details` | Детальные цены |
| `status` | `status` | `new` / `draft` / `ready_to_book` |
| `booking_source` | `booking_source` | `booking_manual` / `booking_repeat` / etc. |
| `pre_awarded` | `pre_awarded` | Для Pre-Awarded flow |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard.step-04_booking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632193173 · **repo:** `tms/shipments/02_create-wizard/step-04_booking.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

