---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631111834
source_type: confluence
---
# Dynamic Slot Naming — Динамическое именование слотов

Расширение существующего Dynamic Slot Naming (ранее только Dock) на Slotbook и аккаунты перевозчиков.

> Источник: слайд `2026 03 - Slotbook _ Dynamic Slot naming`

---

## Конфигурация

**My Settings → Slot naming**

- 2 направления: DELIVERY и PICK UP
- По 2 строки в каждом направлении

---

## Опция "Same as PML"

Новая опция: **"Same as PML"**
- По умолчанию для обоих направлений и обеих строк
- При выборе — слот использует конфигурацию именования PML (Platform/Logistics Manager)

---

## Доступные токены для строк

| Токен | Значение |
|-------|---------|
| Slot ID | ID слота |
| Visit ID | ID визита |
| Shipment Name | Название перевозки |
| Shipment ID | ID перевозки |
| Shipper Name | Имя грузоотправителя |
| Warehouse Customer Name | Имя клиента склада |
| Orders Reference | Ссылка на заказ |
| External reference (Dock-order) | Внешняя ссылка |
| Carrier Name | Имя перевозчика |
| **Same as PML** | Наследовать от PML |

---

## Правило scoping

- Конфигурация влияет **только на аккаунт, создающий слот**
- Перевозчик **всегда** видит: Shipper Name + Order Reference (независимо от настроек)

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.dynamic-slot-naming`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631111834 · **repo:** `tms/slots/dynamic-slot-naming.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

