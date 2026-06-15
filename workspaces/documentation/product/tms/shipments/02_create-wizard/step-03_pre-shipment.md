---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633045074
source_type: confluence
---
# CSW Шаг 3 — Pre-shipment (Адреса и даты)

> Источники: `new-s-request/controllers/pre-shipment.js` · `new-s-request/views/pre-shipment.html`  
> Компонент: `new-shipment-request-pre-shipment-component`  
> Helper: `helper/preShipments.js`

---

## Что такое Pre-shipment

**Pre-shipment** — единица маршрута внутри CSW. Одна заявка может содержать несколько pre-shipments (для Milkrun — несколько точек пикапа/доставки).

```
ShipmentRequest
  └── pre_shipments[]
        ├── pre-shipment 1: Алматы → Москва
        └── pre-shipment 2: Москва → Берлин  (для Milkrun)
```

---

## Progress validation

```javascript
const validateProgress = {
  cargo:       { name: 'Cargo',       isValid: false },
  origin:      { name: 'Origin',      isValid: false },
  destination: { name: 'Destination', isValid: false },
  incoterms:   { name: 'Incoterms',   isValid: false },
};
```

---

## Поля адресов

### Адрес отправки (Origin / From)

| Атрибут | Значение |
|---------|---------|
| Поле модели | `preShipment.address_from` или `preShipment.from_address_id` |
| Тип | Typeahead (поиск + история) |
| Обязательное | ДА |
| Helper | `ADDRESS_FROM`, `DEPARTURE` из `helper/location.js` |

### Адрес доставки (Destination / To)

| Атрибут | Значение |
|---------|---------|
| Поле модели | `preShipment.address_dest` или `preShipment.dest_address_id` |
| Тип | Typeahead |
| Обязательное | ДА |
| Helper | `ADDRESS_DEST`, `ARRIVAL` из `helper/location.js` |

**Структура адреса:**

```javascript
{
  id: integer,                  // FK → addresses (если существующий)
  name: string,                 // Название
  city: string,
  country_code: string,         // ISO 2
  zip: string,
  address: string,              // Строка адреса
  logistic_zone: string,        // Логистическая зона
  lat: decimal,
  lng: decimal,
  zone: { id, name }            // Зона склада (для Master Location)
}
```

---

## Поля дат

| Frontend поле | DB поле SR | Описание |
|---------------|-----------|---------|
| `preShipment.departure_date_from` | `shipping_date_from` | Дата отправки от |
| `preShipment.departure_date_to` | `shipping_date_to` | Дата отправки до |
| `preShipment.arrival_date_from` | `arrival_date_from` | Дата прибытия от |
| `preShipment.arrival_date_to` | `arrival_date_to` | Дата прибытия до |
| `preShipment.departure_time_from` | `shipping_time_from` | Время отправки от |
| `preShipment.departure_time_to` | `shipping_time_to` | Время отправки до |
| `preShipment.arrival_time_from` | `arrival_time_from` | Время прибытия от |
| `preShipment.arrival_time_to` | `arrival_time_to` | Время прибытия до |

**Date Lock** (`date_lock: JSONB`) — блокировка отдельных полей дат. Если поле заблокировано — оно отображается как readonly.

---

## Зоны (для Master Location)

Если выбранный адрес является **Master Location** (PML):

1. Появляется dropdown выбора зоны (`location_zone_id`)
2. Загружаются доступные слоты (`dataLocationPreBookedSlots`)
3. Отображается временная сетка слотов

```javascript
// helper/preShipments.js
asyncLoadPreShipmentZones(preShipments, locationResource)
```

| Поле | Значение |
|------|---------|
| `preShipment.departure_dock_door_id` | ID ворот (Dock Door) для departure |
| `preShipment.arrival_dock_door_id` | ID ворот для arrival |
| `preShipment.zone` | Выбранная зона склада |

---

## Инкотермы (Incoterms)

| Показывается | Если у аккаунта `has_incoterms = true` |
|---|---|
| Поле | `preShipment.incoterm_id` |
| Направление | `incoterm_type`: `FROM` или `TO` |
| Компонент | `new-shipment-request-incoterm-component` |
| Helper | `INCOTERM_TYPES` из `helper/incoterm.js` |

**Инкотерм на уровне локации** — можно задать инкотерм отдельно для адреса отправки и адреса доставки через `location-point-incoterm-popup.html`.

---

## Таможенные данные (Customs)

| Показывается | `checkShowCustomsField(preShipment, mode)` — для Sea/Air |
|---|---|
| Поля | `customs_declared_value`, `customs_currency_id` |
| Проверка | `preShipment.hasInitCustoms = !!customs_declared_value && !!customs_currency_id` |

---

## Followers (Наблюдатели за локацией)

```javascript
// helper/preShipments.js
asyncLoadLocationFollowers(preShipments, locationResource)
buildPreShipmentFollowers(preShipment, allowedSpectatorsData)
```

Когда выбирается адрес — загружаются associated followers (люди, подписанные на этот адрес). Они добавляются в список уведомлений.

---

## Добавление Pre-shipment (Milkrun)

Кнопка **"Add another delivery/picking point"** добавляет новый pre-shipment в массив:

```javascript
// index.js
ctrl.shipmentRequest.pre_shipments.push(newPreShipment)
```

**Условие Milkrun:** второй pre-shipment имеет тот же pick-up location (или delivery) и дату → автоматически создаётся Milkrun.

---

## buildAddress() — ключевая функция сборки

```javascript
const buildAddress = (preSh, prefix, type, address) => ({
  address_id: (address || {}).id,
  entityOrder: preSh.order,
  location_zone_dock_door_id: preSh[`${type}_dock_door_id`],
  address: isObjectEmpty(address) ? null : address,
  date_from: preSh[`${prefix}_date_from`],
  date_to:   preSh[`${prefix}_date_to`],
  time_from: preSh[`${prefix}_time_from`],
  time_to:   preSh[`${prefix}_time_to`],
});
```

Возвращает объект для отправки в API. `prefix` = `'departure'` или `'arrival'`.

---

## Backend DB поля (PreShipment)

| Поле | Тип | Описание |
|------|-----|---------|
| `from_address_id` | INTEGER | FK → addresses |
| `dest_address_id` | INTEGER | FK → addresses |
| `shipping_date_from/to` | DATE | Окно отправки |
| `arrival_date_from/to` | DATE | Окно доставки |
| `shipping_time_from/to` | TIME | Время отправки |
| `arrival_time_from/to` | TIME | Время прибытия |
| `incoterm_id` | INTEGER | FK → incoterms |
| `customs_declared_value` | DECIMAL | Таможенная стоимость |
| `customs_currency_id` | INTEGER | FK → currencies |
| `location_zone_id` | INTEGER | FK → location_zones |
| `departure_dock_door_id` | INTEGER | FK → dock_doors |
| `arrival_dock_door_id` | INTEGER | FK → dock_doors |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard.step-03_pre-shipment`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633045074 · **repo:** `tms/shipments/02_create-wizard/step-03_pre-shipment.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

