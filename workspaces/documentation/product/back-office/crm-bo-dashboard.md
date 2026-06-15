---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/630390810
source_type: confluence
---
# CRM BO Dashboard — Дашборд мониторинга аккаунтов

Переработанный CRM Back-Office модуль: дашборд для мониторинга активности новых клиентов и проверки состояния инвойсинга.

> Источник: слайд `2026 01 - CRM BO`

---

## Цель

Дать back-office команде чёткий вид для мониторинга активности новых клиентов и проверки их invoicing health.

---

## Поведение при загрузке

**Изменение:** при открытии CRM BO модуля фильтр STAR (избранный) больше не выбирается по умолчанию. Данные загружаются только при клике пользователя.

---

## Требуемые метрики (D-30 lookback)

### SR Status Funnel:

| Метрика | Описание |
|---------|---------|
| Count SR (DRAFT или READY TO BOOK) | Начало воронки |
| Count SR (CANCELLED) | Отменённые |
| Count SR (ON QUOTE / BOOKED / DECLINED) | В процессе |
| Count SR (CONFIRMED) | Подтверждённые |

Период: **D-30** (последние 30 дней от текущей даты).

### SH / Shipment индикатор:
- Фокус на SR CONFIRMED
- Исключения: Milkrun и multi-container (там соотношение 1:1)
- Цель: понять — начинает ли TMS-аккаунт работать, застрял ли в процессе котировок, или реально работает

---

## Дополнительные метрики

| Метрика | Период |
|---------|--------|
| Count Users / Carriers / Partners | — |
| SR Confirmed, SH, SLOTS, RECURRING SLOTS | D-1 |
| Те же метрики | D-7, D-30, D-365, Year-to-Date |
| SR Funnel | D-30 |
| Ratio SH per SR Confirmed | — |

**Year-to-Date:** считается с 1 января по D-1.

---

## UI требования

- Кнопка **Navigate directly to Account** из CRM-вида
- Тултипы ко всем заголовкам столбцов (как рассчитывается метрика)
- i18n string keys: `bo.crm.xxx`
- Поле даты = **CREATION DATE** (подтвердить)
- Recurring Slots включить в дашборд

---

## Цветовое поле DATE:
- Серый = дата подтверждения создания
- Статус аккаунта vs данные: если статус DOCK но показываются SHIPMENT данные — это проблема (пример из слайда)

---

## 🔗 Граф-метаданные
- **id:** `back-office.crm-bo-dashboard`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 630390810 · **repo:** `back-office/crm-bo-dashboard.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

