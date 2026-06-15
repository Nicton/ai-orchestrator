---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632291442
source_type: confluence
---
# CSW Шаг 2 — Cargo (Груз)

> Источники: `new-s-request/controllers/cargo.js` · `new-s-request/views/cargo.html`  
> Компонент: `new-shipment-request-cargo-component`

---

## Что показывается

Секция описания груза. Отображается всегда после Basics. Включает:

1. Тип груза (Content Type) с количеством и размерами
2. Особые условия (Specificities)
3. Типы продуктов (Product Types) — если настроены
4. Опасные грузы (Dangerous Goods) — если включены
5. Вкладки Contents (только на уровне SR, если `show-contents-tab="false"` — скрыта)

---

## Поля

### Тип груза (Content Type)

| Атрибут | Значение |
|---------|---------|
| Данные | `dataContentTypes` — `ShipmentContentTypes` |
| Поле модели | `preShipment.contents[]` |
| Уровень | Pre-shipment (каждое отправление отдельно) |
| Обязательное | ДА (минимум 1 единица груза) |

**Структура объекта contents:**

```javascript
{
  content_type_id: integer,      // FK → content_types
  content_type: { id, name },    // Resolved объект
  quantity: integer,             // Количество
  weight: decimal,               // Вес (кг или lbs)
  volume: decimal,               // Объём (м³ или ft³)
  length: decimal,               // Длина
  width: decimal,                // Ширина
  height: decimal,               // Высота
  linear_meters: decimal,        // Погонные метры
  stackable: boolean,            // Возможна укладка
  is_floor: boolean,             // На полу
  total_weight: decimal,         // Авто-вычисляемый
  total_volume: decimal,         // Авто-вычисляемый
  specificity_ids: integer[],    // Особые условия
  product_type_id: integer,      // Тип продукта
  dangerous_goods_description_id: integer, // Опасный груз
}
```

---

### Система измерений (Measurement System)

| Атрибут | Значение |
|---------|---------|
| Поле | `shipmentRequest.measurement_system` |
| Значения | `'metric'` (кг/м³) или `'imperial'` (lbs/ft³) |
| Дефолт | Определяется аккаунтом |

При смене системы — все числовые поля пересчитываются через `MeasurementSystem` из `@shiptify/package-calculation`.

**Конвертация при отправке:**

```javascript
// helper/shipmentRequest.js
convertEntitiesWithContentsInImperial()
convertEntityWithContentsInImperial()
```

Если `measurement_system === IMPERIAL` — данные конвертируются перед отправкой на сервер.

---

### Особые условия (Specificities)

| Атрибут | Значение |
|---------|---------|
| Данные | `dataSpecificities` + `dataAccountSpecificities` |
| Поле | `content.specificity_ids[]` |
| Тип | Multi-select checkbox |

Specificities — теги/флаги для груза: хрупкий, требует контроля температуры, опасный, и т.д.

---

### Типы продуктов (Product Types)

| Атрибут | Значение |
|---------|---------|
| Данные | `dataAccountProductTypes` (isAll: true) |
| Поле | `content.product_type_id` |
| Показывается | Если аккаунт настроил product types |

---

### Опасные грузы (Dangerous Goods)

| Атрибут | Значение |
|---------|---------|
| Данные | `dataAccountDangerousGoodsDescriptions` |
| Поле | `content.dangerous_goods_description_id` |
| Показывается | Если у аккаунта включены DGD |

Дополнительные поля при DGD:
- UN number
- Класс опасности
- Группа упаковки
- Масса нетто

---

## Итоги груза (Summary)

В нижней части секции автоматически вычисляются:

| Поле | Вычисление |
|------|-----------|
| `total_weight` | Сумма `weight * quantity` по всем items |
| `total_volume` | Сумма `volume * quantity` по всем items |
| `total_linear_meters` | Сумма `linear_meters` |
| Chargeable weight | Рассчитывается через `@shiptify/package-calculation` |

---

## Validation Progress

```javascript
validateProgress.cargo = { name: 'Cargo', isValid: false }
```

Cargo считается валидным если:
- Минимум 1 content type выбран
- У каждого content type указано quantity > 0
- Если обязательны specificities — заполнены

---

## Backend поля

| Frontend поле | DB таблица | Поле |
|---------------|-----------|------|
| `content.content_type_id` | `shipment_request_contents` | `content_type_id` |
| `content.quantity` | `shipment_request_contents` | `quantity` |
| `content.weight` | `shipment_request_contents` | `weight` |
| `content.volume` | `shipment_request_contents` | `volume` |
| `content.stackable` | `shipment_request_contents` | `stackable` |
| SR level: `measurement_system` | `shipment_requests` | `measurement_system` |

---

## Связанные API

- `GET /api/v1/shipment-content-types` — список типов груза
- `GET /api/v1/account-specificities` — специфики аккаунта
- `GET /api/v1/account-product-types?isAll=true` — типы продуктов
- `GET /api/v1/account-dangerous-goods-descriptions` — DGD аккаунта

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard.step-02_cargo`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632291442 · **repo:** `tms/shipments/02_create-wizard/step-02_cargo.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

