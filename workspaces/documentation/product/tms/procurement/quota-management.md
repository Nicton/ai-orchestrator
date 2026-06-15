---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631996513
source_type: confluence
---
# Quota Management — Управление квотами

Новый модуль для распределения объёмов перевозок между перевозчиками по заданным правилам.

> Источник: слайд `2026 03 - QUOTA MANAGEMENT`

> ⚠️ **СТАТУС ПО КОДУ (2026-06-11): модуль НЕ реализован** — ни моделей, ни контроллеров, ни UI. Документ — спецификация будущей фичи (детали аудита: tms/features/quota-management.md, tms/OPEN-QUESTIONS.md).

---

## Активация

1. BO → Buyers → Functions → включить Quota Management
2. Admin Panel → Advanced General → настройка квот

---

## Структура квоты

Квота определяется по **режиму транспортировки + маршрут** (from logzone → to logzone).

### 6 настраиваемых секций:

| Секция | Описание |
|--------|---------|
| **Carrier Allocation** | Процентное распределение между перевозчиками |
| **Booking Types** | Типы заявок, к которым применяется квота |
| **Calculation Basis** | База расчёта (количество, объём, вес) |
| **Frequency** | Период расчёта (недельный, месячный) |
| **Date Basis** | Дата, по которой считается использование |
| **Exception Management** | Действия при превышении квоты |

---

## Пример распределения

```
Маршрут: FR-IDF → DE-BAY (Road, LTL)

Carrier A: 40%
Carrier B: 35%
Carrier C: 25%
```

---

## Пороговое значение и действия

**90% использования квоты** = триггер предупреждения.

При превышении квоты:
| Опция | Действие |
|-------|---------|
| **Block** | Перевозчик блокируется в RFQ |
| **Warn** | Предупреждение для Shipper |
| **Auto-push to Spot Market** | Автоматический переход на споткотировки |

---

## Влияние на RFQ

- Перевозчики сортируются по использованию квоты в RFQ-экране
- Новые колонки/тултипы с квотой
- Чекбокс исключения перевозчиков с превышенной квотой

---

## 🔗 Граф-метаданные
- **id:** `tms.procurement.quota-management`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631996513 · **repo:** `tms/procurement/quota-management.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

