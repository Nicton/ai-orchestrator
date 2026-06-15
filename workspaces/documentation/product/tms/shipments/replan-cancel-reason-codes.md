---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553603
source_type: confluence
---
# Reason Codes — Причины отмены и переноса

Функция **Reason Code** позволяет фиксировать структурированные причины при отмене Shipment или переносе (replan) Tracking Point. Настраивается на уровне аккаунта.

> Источник: слайд `2026 01 - Replan reason code & cancel (emma)`

---

## Где применяется

1. **Отмена Shipment** — при нажатии "Cancel shipment"
2. **Перенос Tracking Point** — после выбора новой даты/времени, перед экраном уведомления

---

## Настройки (уровень аккаунта)

Для каждого флоу (отмена / перенос) настраиваются независимо:

| Параметр | Значения |
|---------|---------|
| Поле "Причина" | Mandatory / Optional / Do not request |
| Поле "Комментарий" (free text) | Mandatory / Optional |
| Список значений причин | Настраиваемый список |

**Логика списка причин:**
- Нет значений → свободный ввод
- Есть значения + use custom value ВЫКЛЮЧЕН → только из списка
- Есть значения + use custom value ВКЛЮЧЁН → из списка или свободный ввод

**Default при миграции:** DO NOT REQUEST (нет изменений в текущем поведении).

---

## Что хранится в БД

### При отмене:
- User id / name
- Account id / name
- SH ID / SR ID
- Дата и время отмены
- Название причины
- Свободный комментарий

### При переносе:
- User id / name / account / role (carrier/shipper/other, включая API-пользователей)
- SH ID / SR ID
- Tracking point STY код + название
- Начальная дата/время
- Новая дата/время
- Счётчик переносов для данного TP
- Общий счётчик на уровне SH

---

## Smartlists и экспорт

Два новых Smartlist с экспортом:
1. Shipments с отменой (причина + комментарий)
2. Перенесённые Tracking Points (причина + детали)

---

## API

Новые опциональные поля в маршрутах:
- Cancel route: причина отмены + комментарий
- Replan route: причина переноса + комментарий

Правила mandatory/optional **НЕ применяются через API** (чтобы не сломать существующие интеграции).

---

## Чат

Причина и комментарий добавляются в чат-лог и видны всем участникам с доступом к чату (Carrier + Shipper).

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.replan-cancel-reason-codes`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632553603 · **repo:** `tms/shipments/replan-cancel-reason-codes.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

