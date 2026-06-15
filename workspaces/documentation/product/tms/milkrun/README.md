---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029285
source_type: confluence
---
# Milkrun

Milkrun — перевозка с несколькими точками забора или доставки на одном маршруте. Один Carrier едет по маршруту A→B→C→D, собирая или развозя грузы в каждой точке.

## Кто использует

- **Shipper** — создаёт Milkrun когда нужно объединить отправления
- **Carrier** — получает один маршрут с несколькими точками

## Два способа создания

### Способ 1: CSW Wizard (при создании заявки)

```
Shipper открывает CSW wizard
    ↓
Шаг "Pre-Shipment" → добавляет несколько pre-shipments
    ↓
Условие Milkrun:
  второй pre-shipment совпадает по pick-up ИЛИ delivery location
  И дате с предыдущим pre-shipment
    ↓
Система автоматически определяет как Milkrun
    ↓
ShipmentRequest создаётся с флагом is_milkrun = true
    ↓
Shipment'ы создаются связанными
```

**URL:** `/shipment-requests/new` → шаг "Pre-Shipment"

### Способ 2: Grouping Page (из существующих Shipment'ов)

```
Shipper открывает /pick-up-grouping или /slots-grouping
    ↓
Видит Shipment'ы, которые можно объединить (совпадающие локации/даты)
    ↓
Нажимает [MILKRUN]
    ↓
Create Milkrun Modal → выбирает Shipment'ы
    ↓
Milkrun создаётся как связка нескольких Shipment'ов
```

**URL:** `/pick-up-grouping`, `/slots-grouping`

---

## Страницы

| URL | Описание |
|-----|---------|
| `/milkruns` | Список всех Milkrun |
| `/pick-up-grouping` | Страница группировки для pick-up Milkrun |
| `/slots-grouping` | Страница группировки по слотам |

---

## Как это выглядит для Carrier

Carrier получает маршрут с несколькими TrackingPoints:

```
Маршрут:
  Pick-up в Локации A (8:00)
  ↓
  Pick-up в Локации B (10:00)
  ↓
  Delivery в Локации C (14:00)
  ↓
  Delivery в Локации D (16:00)

Carrier подтверждает каждую точку по очереди:
  TP1 confirmed → Shipment 1 in_transit
  TP2 confirmed → Shipment 2 in_transit
  TP3 confirmed → Shipment 1 delivered
  TP4 confirmed → Shipment 2 delivered
```

---

## Ключевое условие Milkrun

> Второй pre-shipment должен совпадать по **pick-up ИЛИ delivery location** и **дате** с предыдущим.

Пример правильного Milkrun:
- Pre-shipment 1: pick-up в Лионе, 15 июня
- Pre-shipment 2: pick-up в Лионе, 15 июня ← совпадают локация + дата ✅

---

## Отличие от обычной перевозки

| Характеристика | Обычная перевозка | Milkrun |
|---------------|------------------|---------|
| Точек pick-up | 1 | 2+ |
| Точек delivery | 1 | 2+ (или 1 общая) |
| Shipment'ов | 1 | 2+ (связанные) |
| TrackingPoints | 2 (departure + arrival) | 2+ на каждый Shipment |
| Carrier | 1 | 1 (едет весь маршрут) |

---

## Мутации

**Создание Milkrun через CSW:**
- `ShipmentRequest` с `is_milkrun = true`
- Несколько `Shipment` создаются с `milkrun_id` (связка)
- `TrackingPoint[]` создаются для каждого Shipment

**Создание через Grouping:**
- Существующие `Shipment[]` получают общий `milkrun_id`
- `ShipmentRequest` обновляются (если нужно)

---

## Backend

- Модели: `app/models/shipment.js` (поле `milkrun_id`), `app/models/shipment_request.js`
- Frontend: `workspaces/frontend/public/app/milkruns/`, `workspaces/frontend/public/app/pickUpGrouping/`

---

## 🔗 Граф-метаданные
- **id:** `tms.milkrun`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632029285 · **repo:** `tms/milkrun/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

