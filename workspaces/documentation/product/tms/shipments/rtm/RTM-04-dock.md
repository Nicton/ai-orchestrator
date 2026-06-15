---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632717378
source_type: confluence
---
# RTM-04: Dock + Slotify — Требования → Документация
## 46 требований | Источник: 12_checklist-dock.md

---

## Dock Door

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-001 | Новый экран Dock Door: временная сетка + drag&drop | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-002 | Карточки слотов на экране Dock Door: цвет, статус, стопка | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-003 | Фильтрация по зонам на экране Dock Door | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-004 | Словарь специфик ворот (ADR, Temperature, Bulk) | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-005 | Привязка специфик к конкретным воротам | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |

## Visit / Carrier на слоте

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-006 | Visit Carrier — отдельное поле от Booking Carrier | [slots/README.md](../../slots/README.md) §Visit | 🔶 упомянуто |
| REQ-DOCK-007 | Поиск и создание перевозчика (NOTIFY=NO) | [slots/README.md](../../slots/README.md) §Перевозчик | 🔶 упомянуто |
| REQ-DOCK-008 | Поиск перевозчика по email (NOTIFY=YES) | [slots/README.md](../../slots/README.md) §Перевозчик | 🔶 упомянуто |
| REQ-DOCK-009 | Перевозчик в листинге Visit/Slot | [slots/README.md](../../slots/README.md) §Листинг | 🔶 упомянуто |
| REQ-DOCK-010 | Tracking Points для Visit и Slot (статусы) | [slots/README.md](../../slots/README.md) §Статусы | ✅ |
| REQ-DOCK-026 | Группировка Visits по перевозчику | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |

## Навигация Dock

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-011 | Раздел HISTORY: Visits + Slots подменю | [slots/README.md](../../slots/README.md) §Навигация | 🔶 упомянуто |
| REQ-DOCK-012 | Фильтры и сортировка для Daily User | [slots/01_list.md](../../slots/01_list.md) | ✅ |

## Модал обновления статуса

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-013 | Редизайн модала обновления статуса | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |
| REQ-DOCK-014 | Обработка опоздания при обновлении статуса | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |
| REQ-DOCK-015 | Номер ворот на экране обновления | ❌ нет | ❌ |
| REQ-DOCK-027 | Маркировка статуса Slot Delivery через модал | ❌ нет | ❌ |
| REQ-DOCK-028 | Уведомление водителя о переносе (Prevent Delay) | ❌ нет | ❌ |

## Dock Orders

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-016 | Листинг Dock Orders: Inbound / Outbound | [slots/README.md](../../slots/README.md) §DockOrders | 🔶 упомянуто |
| REQ-DOCK-017 | Фильтрация и поиск в листинге DO | [slots/README.md](../../slots/README.md) §Фильтры | 🔶 упомянуто |
| REQ-DOCK-018 | Детали и действия по DO в листинге | [slots/README.md](../../slots/README.md) §Действия | 🔶 упомянуто |
| REQ-DOCK-019 | Автоматическое закрытие DO по сроку | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-024 | CSV и API структура Dock Order V2 | ❌ нет | ❌ |
| REQ-DOCK-025 | UI упаковочного листа для нескольких заказов | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |

## Multi Order / Multi Customer

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOCK-020 | Мульти-заказ, мульти-клиент на одном слоте | [slots/README.md](../../slots/README.md) §MultiOrder | 🔶 упомянуто |
| REQ-DOCK-021 | Структура Partner DB: SELLER/BUYER/BOOKER | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-DOCK-022 | Видимость DO для партнёров | [slots/README.md](../../slots/README.md) §Видимость | 🔶 упомянуто |
| REQ-DOCK-023 | Референсы SELLER/BUYER/BOOKER REF | ❌ нет | ❌ |

## Slotify UI 3.0 / 3.1

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-SLOTIFY-001 | Редизайн шапки Slotify 3.0 | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §3.0 | ✅ |
| REQ-SLOTIFY-002 | Сводная панель данных при заполнении формы | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | ✅ |
| REQ-SLOTIFY-003 | Разделение шага 1 на 1.1 и 1.2 (UI 3.1) | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §3.1 | ✅ |
| REQ-SLOTIFY-004 | Форма CARRIER на шаге 1.1 | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §Carrier | ✅ |
| REQ-SLOTIFY-005 | Форма Supplier/Customer: поле Department | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §Supplier | ✅ |
| REQ-SLOTIFY-006 | Packing List в Slotify — общий режим | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §PackingList | ✅ |
| REQ-SLOTIFY-007 | Данные водителя и грузовика в форме | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) §Водитель | ✅ |
| REQ-SLOTIFY-014 | Логотип зоны при выборе зоны | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |
| REQ-SLOTIFY-015 | Инструкции вместо карты на последнем шаге | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |
| REQ-SLOTIFY-018 | Manual Mode при обновлении статуса | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |

## SlotBook — выбор перевозчика

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-SLOTIFY-008 | Выбор из списка carrier contacts | [slots/slotbook-carrier-selection.md](../../slots/slotbook-carrier-selection.md) | ✅ |
| REQ-SLOTIFY-009 | Light Carrier Creation при ненайденном email | [slots/slotbook-carrier-selection.md](../../slots/slotbook-carrier-selection.md) §Light | ✅ |
| REQ-SLOTIFY-010 | Валидация целевого перевозчика | [slots/slotbook-carrier-selection.md](../../slots/slotbook-carrier-selection.md) §Валидация | ✅ |
| REQ-SLOTIFY-017 | Видимость DO для Shipper в SlotBook | [slots/slotbook-carrier-selection.md](../../slots/slotbook-carrier-selection.md) | 🔶 упомянуто |

## Dynamic Slot Naming

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-SLOTIFY-011 | Динамическое именование слотов (SlotBook) | [slots/dynamic-slot-naming.md](../../slots/dynamic-slot-naming.md) | ✅ |
| REQ-SLOTIFY-016 | То же для DOCK-аккаунтов | [slots/dynamic-slot-naming.md](../../slots/dynamic-slot-naming.md) | ✅ |
| REQ-SLOTIFY-012 | Обновление статуса с временем опоздания | [slots/slotify-ui-3.md](../../slots/slotify-ui-3.md) | 🔶 упомянуто |
| REQ-SLOTIFY-013 | Фильтрация и поиск по слотам | [slots/01_list.md](../../slots/01_list.md) | 🔶 упомянуто |

---

## Итог Dock + Slotify

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 12 | 26% |
| 🔶 Частично | 28 | 61% |
| ❌ Нет | 6 | 13% |
| **Всего** | **46** | |

**Вывод:** Slotify UI хорошо задокументирован. Dock Door (specificities, экран drag&drop) и API Dock Orders — только упомянуты в README. Нужно расширить `slots/README.md` детальными секциями.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-04-dock`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632717378 · **repo:** `tms/shipments/rtm/RTM-04-dock.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

