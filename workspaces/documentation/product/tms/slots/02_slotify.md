---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631046263
source_type: confluence
---
# Slotify — управление слотами (календарный вид)

## Что это

Slotify — специализированный интерфейс для операторов склада и dock-менеджеров. Показывает слоты в виде календаря (по неделям) или доски. Позволяет визуально управлять нагрузкой на ворота.

Отдельный mini-app: `workspaces/mini-apps/frontend/slotify/`

**URL:** `/slotify/week` (или `/slotify/board`)

---

## Представления Slotify

| Вид | URL | Описание |
|-----|-----|---------|
| Week view | `/slotify/week` | Недельный календарь слотов по воротам |
| Board view | `/slotify/board` | Kanban-доска |
| Load Day | `/slotify/load-day` | Нагрузка на конкретный день |
| Shipments Board | `/slotify/shipments-board` | Доска Shipment'ов без слотов |
| Shipments Week | `/slotify/shipments-week` | Неделя с Shipment'ами |

---

## Week View — что видит пользователь

**По горизонтали:** дни недели (Пн–Вс)
**По вертикали:** временные слоты (например, 8:00–8:30, 8:30–9:00...)
**Ячейки:** слоты, распределённые по воротам

| Элемент | Описание |
|---------|---------|
| Ячейка слота | Carrier + тип груза + статус + иконки |
| Цвет ячейки | Зелёный = confirmed, Жёлтый = pending, Серый = cancelled |
| Вертикальная колонка | Один dock door (ворота) |
| Нагрузка дня | Индикатор % заполненности |

---

## Действия в Slotify

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Клик по ячейке | Открывает детали слота | Operator |
| Drag-and-drop | Перемещает слот на другое время / ворота | Operator |
| Добавить слот | Создаёт новый слот в выбранное время | Operator |
| Подтвердить из calendar | `Slot.status = confirmed` | Operator |
| Экспорт дня | Скачивает список слотов на день | Operator |

---

## Slotbook (отдельный раздел)

Slotbook — вариант Slotify для carrier-аккаунтов. Carrier видит свои слоты у разных shipper'ов.

| URL | Описание |
|-----|---------|
| `/slotbook-ongoing-slots` | Текущие слоты |
| `/slotbook-history-slots` | История |
| `/slotbook-to-be-booked-slots` | Без слота |

---

## Мутации (drag-and-drop)

**Внутренние:**
- `Slot.start_time` / `Slot.end_time` обновляются
- `Slot.dock_door_id` меняется (если переставили в другую колонку)

**Внешние:**
- Email `mailSlotRescheduledToCarrier` → уведомление об изменении
- Webhook `slotUpdated`

---

## Backend

- Сервис: `app/services/slots/index.js`
- Mini-app frontend: `workspaces/mini-apps/frontend/slotify/`
- Основной frontend (список): `workspaces/frontend/public/app/slots/`

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.02_slotify`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631046263 · **repo:** `tms/slots/02_slotify.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

