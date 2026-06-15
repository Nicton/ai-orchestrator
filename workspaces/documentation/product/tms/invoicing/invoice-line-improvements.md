---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632094884
source_type: confluence
---
# Улучшения модуля инвойсинга (Jan 2026)

Набор улучшений для модуля Invoicing: Magic Filters на строках инвойса, расширенные фильтры, цветовая кодировка дат, унификация Assign/Unassign.

> Источник: слайд `2026 01 - Invoice _ Improvement`

---

## 1. Magic Filters на Invoice Lines

Magic Filter добавляется на уровне строк инвойса (Invoice Line) — сохранение избранных наборов фильтров для массового выбора строк и создания pre-invoices пакетом.

Аналог Magic Filters уже используется в других частях TMS.

---

## 2. Новые фильтры Invoice Lines

| Фильтр | Варианты |
|--------|---------|
| **Booking period** | Current Month / Last Month / Custom Range |
| **Initial Pick-up period** | Current Month / Last Month / Next Month / Custom Range |
| **Actual Pick-up period** | Current Month / Last Month / Next Month / Custom Range |
| **Initial Delivery period** | Current Month / Last Month / Next Month / Custom Range |
| **Actual Delivery period** | Current Month / Last Month / Next Month / Custom Range |
| **POD** | Loaded / Missing / BOTH (default: BOTH) |
| **TAG** | Фильтрация по тегам (Jira: TMS-2297) |
| **Select All** | Выбрать все строки (Jira: TMS-2362) |

**Причина POD фильтра:** подтверждение доставки (POD) обычно требуется перед выставлением счёта.

---

## 3. Колонка "DATE" (переименование)

Текущее название "Pick-up date" заменяется на **"DATE"** с тултипом:
> "Pick-up date to Delivery date"

**Цветовая кодировка:**
- 🩶 **Серый** = начальная / плановая дата
- 🔵 **Синий** = фактическая дата

---

## 4. Унификация Pre-Invoice и Invoice

| Функция | Pre-Invoice (было) | Invoice (было) | После |
|---------|-------------------|----------------|-------|
| ASSIGN строк | — | ✅ | ✅ в обоих |
| UNASSIGN строк | — | ✅ | ✅ в обоих |
| Фильтр DATE | — | — | ✅ в обоих |
| Фильтр POD | — | — | ✅ в обоих |
| Фильтр priced/unpriced | — | — | ✅ в обоих |

Текущий Assign/Unassign фильтрует только по PENDING и CARRIER — расширяется до DATE, POD, priced/not-priced.

---

## Существующее поведение (сохраняется)

Mass select с критерием даты без фильтра по перевозчику → создаётся несколько pre-invoices (по одному на перевозчика) — это корректное поведение.

---

## 🔗 Граф-метаданные
- **id:** `tms.invoicing.invoice-line-improvements`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632094884 · **repo:** `tms/invoicing/invoice-line-improvements.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

