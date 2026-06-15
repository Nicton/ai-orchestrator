---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815684
source_type: confluence
---
# Packing List API — Управление упаковочным листом

> Источник требований: REQ-BOOK-023..028 | Слайды: 2024 09 - Update Packing List (TMS), 2025 03 - CW display TR vs SR

---

## Обзор

Shiptify предоставляет три API-метода для управления упаковочным листом отправки (`/shipments/contents`), а также логику расчёта Chargeable Weight (CW) на уровне Transport Request (TR) и Shipment Request (SR).

| Метод | Эндпоинт | Действие |
|-------|----------|---------|
| **PUT** | `/shipments/contents` | Полная замена packing list |
| **POST** | `/shipments/contents` | Добавление новой позиции |
| **PATCH** | `/shipments/contents/{id}` | Обновление конкретной позиции |

---

## PUT /shipments/contents — REQ-BOOK-023

Полностью заменяет текущий packing list переданными данными.

**Поведение после PUT:**
- Пересчитывается **Volume** (если переданы габариты), Weight, Linear Meters, Chargeable Weight
- Если размерные данные **не переданы** — Volume и LM очищаются (старые значения не сохраняются)
- **TOTAL** по всем позициям пересчитывается синхронно

**Логирование в чате:**
```
X обновил упаковочный лист, предыдущий список был: [предыдущее содержимое]
```

**Дополнительно:**
- Работает на уровнях: `ACCOUNT`, `GALAXY-SHIPMENT`, `CARRIER-GALAXY`
- Обновление триггерит **соответствующий webhook**

---

## POST /shipments/contents — REQ-BOOK-024

Добавляет новую позицию к существующему packing list.

**Поведение после POST:**
- Пересчитываются Volume, Weight, LM, CW с учётом **всех** позиций
- TOTAL обновляется
- Добавление логируется в чате
- POST триггерит webhook

**Поддержка опасных грузов:**
```json
{
  "dangerous_goods": {
    "un_code": "UN1234",
    "class_of_danger": "3",
    ...
  }
}
```

---

## PATCH /shipments/contents/{id} — REQ-BOOK-025

Обновляет конкретную позицию packing list по её `content_id`.

**Поведение после PATCH:**
- Пересчитывается CW для изменённой позиции и TOTAL
- Если у позиции нет размеров после PATCH → CW очищается или пересчитывается только на основе weight
- API корректно возвращает `content_id` для каждой позиции (включая позиции с `quantity > 1`)
- Изменения логируются в чате с указанием **старых и новых значений**

> **Ограничение:** PATCH недоступен для full truck позиций, где весовая система не поддерживает его применение.

---

## Обновление packing list при подтверждении TP — REQ-BOOK-026

При подтверждении tracking point (pickup / delivery) пользователь может обновить фактический packing list.

**API-структура подтверждения с обновлением груза:**
```json
{
  "tracking_point": { "sty_code": "STY0001", "date": "2025-01-15T10:00:00Z" },
  "contents": [
    { "description": "Boxes", "quantity": 10, "weight_kg": 50.0 }
  ]
}
```

**Поведение:**
- При подтверждении **пикапа** — обновляется фактический packing list погрузки
- При подтверждении **доставки** — обновляется packing list выгрузки
- Volume пересчитывается из переданных габаритов (если они предоставлены)
- Обновление логируется в чате так же, как ручное изменение
- Доступно для ролей: **SHIPPER** и **GALAXY-CARRIER**

---

## CW на уровне TR vs SR — REQ-BOOK-027..028

### Расчёт CW для Transport Request (TR)

Для режима **Air** CW рассчитывается по формуле:
```
CW = max(GW, volume_cm3 / 6000)
```

Каждый TR сохраняет свой **индивидуальный CW** для диспетчеризации затрат.

### Консолидированный CW для Shipment Request (SR)

SR **не** отображает сумму CW по отдельным TR. SR отображает **консолидированный CW**:
```
SR_CW = max(сумма GW всех TR, сумма Volume всех TR / 6000)
```

> Тяжёлый и не объёмный груз компенсирует объёмный и лёгкий при консолидации — итоговый SR CW всегда `≤` сумме CW отдельных TR.

**Тултип в UI:**
- На поле `Total CW` показывается объяснение разницы между суммой TR CW и SR CW (Equalized CW)
- Ключ тултипа добавлен в систему переводов (Tolgee)

### Методы распределения затрат

Шиппер выбирает метод распределения затрат консолидированного SR по TR:

| Метод | Описание |
|-------|----------|
| **Gross Weight** | Пропорционально весу каждого TR |
| **Volume** | Пропорционально объёму каждого TR |
| **CW** | Пропорционально Chargeable Weight каждого TR |
| **Linear Meters** | Пропорционально линейным метрам |

- Изменение метода **не меняет SR CW** — только внутренние доли распределения
- Каждый TR сохраняет свой packing list для внутренней диспетчеризации

---

## Связанные документы

| Документ | Путь |
|----------|------|
| Типы бронирования | [booking-types.md](booking-types.md) |
| Flow Types | [flow-types.md](flow-types.md) |
| Buy & Sell — Transport Request | [../buy-sell/README.md](../buy-sell/README.md) |
| Freight Units | [../features/freight-units.md](../features/freight-units.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.packing-list-api`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632815684 · **repo:** `tms/shipments/packing-list-api.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

