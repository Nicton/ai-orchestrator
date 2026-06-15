---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815701
source_type: confluence
---
# RTM-07: General Batch 2 — Multi Container / Sea / Docs / STY
## 58 требований | Источник: 15_checklist-tms-general-batch2.md

---

## Multi Container (REQ-MC)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-MC-001 | Условие создания: FCL/FTL + Qty > 1 | ❌ нет | ❌ |
| REQ-MC-002 | Именование контейнеров при подтверждении | ❌ нет | ❌ |
| REQ-MC-003 | Экран бронирования: список контейнеров | ❌ нет | ❌ |
| REQ-MC-004 | Управление метаданными для нескольких контейнеров | ❌ нет | ❌ |
| REQ-MC-005 | Загрузка документов на несколько контейнеров | ❌ нет | ❌ |
| REQ-MC-006 | Tracking: обновление TP для нескольких контейнеров | ❌ нет | ❌ |
| REQ-MC-007 | Инвойсинг мульти-контейнерных бронирований | ❌ нет | ❌ |
| REQ-MC-008 | Отмена отдельных контейнеров | ❌ нет | ❌ |

## Sea Freight Ship Data (REQ-SEA)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-SEA-001 | Структура SeaLeg: поля, BL, данные судна | ❌ нет | ❌ |
| REQ-SEA-002 | Справочник морских перевозчиков | ❌ нет | ❌ |
| REQ-SEA-003 | Add Ship Info: форма, поля, + transhipment | ❌ нет | ❌ |
| REQ-SEA-004 | Обновление данных судна для группы контейнеров | ❌ нет | ❌ |
| REQ-SEA-005 | Отображение SeaLeg в UI | ❌ нет | ❌ |
| REQ-SEA-006 | Документы Sea Freight + MC: Same Ship | ❌ нет | ❌ |

## Documents Workflow (REQ-DOC)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DOC-001 | Настройка уведомлений о документах (workflow) | [grouping/README.md](../../grouping/README.md) §Документы | 🔶 упомянуто |
| REQ-DOC-002 | Типы документов в workflow | [grouping/README.md](../../grouping/README.md) §ТипыДок | 🔶 упомянуто |
| REQ-DOC-003 | Условия триггера workflow (owner/API/manual/all) | ❌ нет | ❌ |
| REQ-DOC-004 | Действия: Added / Removed / Visibility changed | ❌ нет | ❌ |
| REQ-DOC-005 | Географический периметр уведомлений | ❌ нет | ❌ |
| REQ-DOC-006 | Канал доставки: in-app / email / оба | [notifications/README.md](../../notifications/README.md) | 🔶 упомянуто |
| REQ-DOC-007 | Список workflow и управление ими | ❌ нет | ❌ |
| REQ-DOC-008 | Выбор аккаунтов для workflow | ❌ нет | ❌ |
| REQ-DOC-009 | Уровни доступа: Private/Limited/Public/Specific | [grouping/README.md](../../grouping/README.md) §Доступ | ✅ |
| REQ-DOC-010 | Передача документов по типу группировки | [grouping/README.md](../../grouping/README.md) §Передача | ✅ |
| REQ-DOC-011 | Уведомления при загрузке в группе (тег с кол-вом) | [grouping/README.md](../../grouping/README.md) §Уведомления | 🔶 упомянуто |

## STY 3.0 — двусторонние аккаунты (REQ-STY)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-STY-001 | Двусторонняя модель: Carrier + Shipper одновременно | [buy-sell/README.md](../../buy-sell/README.md) §STY | 🔶 частично |
| REQ-STY-002 | Новый объект QR (Transport Request) | [buy-sell/README.md](../../buy-sell/README.md) §TR | 🔶 частично |
| REQ-STY-003 | Жизненный цикл TR: статусы Pending/Assigned/Cancelled | [buy-sell/buysell-v3-qr-to-tr.md](../../buy-sell/buysell-v3-qr-to-tr.md) §Статусы | 🔶 частично |
| REQ-STY-004 | Дублирование чатов при создании SH из QR | ❌ нет | ❌ |
| REQ-STY-005 | Навигация BUY / SALES | [buy-sell/README.md](../../buy-sell/README.md) §Навигация | ✅ |
| REQ-STY-006 | Настройки MD и документов по умолчанию | ❌ нет | ❌ |
| REQ-STY-007 | Spectators в контексте BK и QR | [06_roles-matrix.md](../06_roles-matrix.md) §Spectator | 🔶 частично |
| REQ-STY-008 | Управление уведомлениями пользователя (BUY/SALES) | [notifications/README.md](../../notifications/README.md) | 🔶 упомянуто |

## Expected Orders (REQ-EO)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-EO-001 | Структура EO: поля, UID, статусы | ❌ нет | ❌ |
| REQ-EO-002 | Создание EO через API | ❌ нет | ❌ |
| REQ-EO-003 | Статусы EO: Open/Closed/Cancelled/Ongoing | ❌ нет | ❌ |
| REQ-EO-004 | Связь EO с DO/SDO | ❌ нет | ❌ |

---

## Итог General Batch 2

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 3 | 5% |
| 🔶 Частично | 13 | 22% |
| ❌ Нет | 42 | 73% |
| **Всего** | **58** | |

**Критические пробелы:**
- Multi Container (8 REQ) — нет ни слова → нужен `features/multi-container.md`
- Sea Freight Ship Data (6 REQ) — нет ни слова → нужен `features/sea-freight-ship-data.md`
- Expected Orders (4 REQ) — нет ни слова → нужен `features/expected-orders.md`
- Documents Workflow (8 REQ частично) — только уровни доступа описаны → расширить `grouping/README.md`
- STY 3.0 чаты/уведомления (2 REQ) — нет → добавить в `buy-sell/README.md`

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-07-general-batch2`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632815701 · **repo:** `tms/shipments/rtm/RTM-07-general-batch2.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

