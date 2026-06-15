---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815717
source_type: confluence
---
# Список слотов

## Что это

Страница управления тайм-слотами. Показывает все запрошенные и подтверждённые слоты. Используется оператором склада для управления потоком грузов через ворота.

**URL:** `/slots`
**Frontend:** `workspaces/frontend/public/app/slots/`

---

## Варианты представления

| Представление | URL | Описание |
|--------------|-----|---------|
| Все слоты | `/slots` | Полный список |
| Текущие (Ongoing) | `/ongoing-slots` | Слоты сегодня и в ближайшее время |
| Ожидают данных | `/pending-data-slots` | Слоты без подтверждения данных |
| История | `/slots/history` | Завершённые слоты |
| К бронированию | `/to-be-booked-slots` | Shipment'ы без слота |
| Валидация | `/validation-slots` | Слоты, требующие проверки |

---

## Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Дата / Время | Временное окно слота |
| Локация | Склад / точка |
| Ворота | Конкретный dock door |
| Перевозчик | Кто занял слот |
| Статус | Pending / Confirmed / Done / Cancelled |
| Связанные перевозки | Список Shipment ID |
| Водитель | Если указан |
| Тип слота | Inbound / Outbound |

---

## Действия

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Подтвердить слот | `Slot.status = confirmed`, email Carrier | Operator, Admin |
| Отклонить / Предложить другое время | Carrier получает уведомление | Operator |
| Отменить слот | `Slot.status = cancelled` | Shipper, Operator, Admin |
| Забронировать слот для Shipment | Создаёт `SlotShipment` | Carrier, Shipper |
| Изменить ворота | Переназначает `DockDoor` | Operator |

---

## Мутации

### Подтверждение слота

**Внутренние:**
- `Slot.status` → `confirmed`
- `Shipment.status` → `slot_confirmed` (пересчёт через `calculateShipmentStatus()`)

**Внешние:**
- Email `mailSlotConfirmedToCarrier` → перевозчику
- Email `mailNewSlotToSpectator` → подписчикам

### Бронирование нового слота

**Внутренние:**
- `Slot` создаётся
- `SlotShipment` создаётся (связь)
- `Shipment` привязывается

**Внешние:**
- Email `mailSlotRequestedToOperator` → оператору склада
- Webhook `slotBooked`

---

## Переходы

- Клик по слоту → `/slots/{id}` (детали)
- Слот → Shipment → `/shipments/{id}`
- Slotify view → `/slotify/week` (календарь)

---

## Backend

- `app/services/slots/index.js` — создание, резервирование, конфликты
- `app/models/slot.js`, `app/models/slot_shipment.js`
- Worker: `worker/tasks/notify_by_email.js` → задачи `mailSlot*`

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.01_list`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632815717 · **repo:** `tms/slots/01_list.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

