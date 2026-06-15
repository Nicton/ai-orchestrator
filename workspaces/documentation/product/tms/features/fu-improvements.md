---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631341142
source_type: confluence
---
# FU Improvements — Улучшения Freight Units

Новые возможности в Freight Units: метрики стоимости, dispatch ratios, улучшенный API.

> Источник: слайд `2026 05 - FU IMPROVEMENT`

---

## Новая колонка Metrics в FU listing

Каждая строка FU теперь показывает:
- **Line 1:** сумма dispatched cost (диспетчированная стоимость)
- **Line 2:** сумма dispatched CO2

**Ограничение:** суммы не вычисляются если хотя бы один leg имеет NULL dispatch value.

---

## 5 типов dispatch ratio

| Тип | Описание |
|-----|---------|
| **Gross weight** | По весу брутто |
| **Chargeable weight** | По тарифному весу |
| **Volume** | По объёму |
| **Linear meters** | По погонным метрам |
| **Cargo count** | По количеству мест |

---

## API (новый объект)

Новый объект в ответе: `theoretical_dispatch`

```json
{
  "theoretical_dispatch": {
    // 10 подполей, охватывающих все комбинации dispatch keys
  }
}
```

---

## Новое поле API

```json
POST /freight-units
{
  "FU_accounting_entity": "DROP"  // опциональное поле
}
```

---

## Hover-карточка локации

При наведении на локацию в FU — показывается полный адрес:
- Name
- address1/2/3
- Country, City, ZIP
- Пиктограмма типа локации
- Карточки контактов

---

## 🔗 Граф-метаданные
- **id:** `tms.features.fu-improvements`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631341142 · **repo:** `tms/features/fu-improvements.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

