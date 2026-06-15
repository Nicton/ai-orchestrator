---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633045009
source_type: confluence
---
# Repeat Request — Дублирование Transport Request

Функция **Repeat REQUEST** позволяет создать новый TR на основе существующего — аналог существующей функции REPEAT для Bookings.

> Источник: слайд `2026 01 - BUY & SELL _ repeat`

---

## Где доступно

- Только в **Buy & Sell (TBS)** аккаунтах
- На уровне TR (Transport Request), не Booking

---

## Действия

| Действие | Описание |
|---------|---------|
| **REPEAT** | Создаёт копию TR с теми же данными |
| **REVERSE** | Создаёт TR с обратным маршрутом (если реализовано) |
| **FORWARD** | Создаёт TR с переносом на следующий отрезок (если реализовано) |

Для не-pending TRs: кнопка REPEAT отображается в тулбаре/меню TR.

---

## Linked Request (связанные запросы)

При дублировании создаётся связь parent-child:
- **Источник TR** = parent
- **Копия TR** = child

Раздел "Linked Requests" отображается в детальном виде TR (аналог "Linked Bookings" для Bookings).

---

## Известная проблема с pending TRs

При выборе нескольких TR мультиселект-тулбар перекрывает кнопки действий.

**Исправление:** при выборе ровно 1 pending TR — показывать кнопки действий: BOOK, GROUP, COPY.

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell.repeat-request`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633045009 · **repo:** `tms/buy-sell/repeat-request.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

