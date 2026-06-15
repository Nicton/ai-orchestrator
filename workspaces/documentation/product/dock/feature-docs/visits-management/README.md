---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631898179
source_type: confluence
---
# Visits — Управление визитами и обновление статусов

> Источник требований: REQ-DOCK-011..015, REQ-DOCK-026..028 | Слайды: 2023 11 DOCK Filters and Menu, 2024 05 Slot Status update UI, 2023 11 DOCK assign Carrier

---

## Концепция Visit

**Visit** — сущность верхнего уровня, представляющая физическое прибытие транспортного средства на склад. Один Visit может содержать несколько **Slots** (ворот/операций). Tracking Points (TP) записываются как на уровне Visit, так и на уровне Slot.

---

## Меню History (REQ-DOCK-011)

Для аккаунтов DOCK добавлен раздел навигации **HISTORY** с двумя подменю:

| Подменю | Описание |
|---------|----------|
| `HISTORY / VISITS` | История визитов (перенесена из текущей страницы VISITS) |
| `HISTORY / SLOTS` | История слотов (перенесена из текущей страницы SLOTS) |

Раздел HISTORY доступен **только для DOCK-аккаунтов**.

---

## Фильтры ежедневных пользователей (REQ-DOCK-012)

### Сортировка

| Параметр | Порядок |
|----------|---------|
| Дата IN | По возрастанию / убыванию |
| Дата OUT | По возрастанию / убыванию |

### Фильтры

| Фильтр | Опции |
|--------|-------|
| Дата | Today, Yesterday, Tomorrow, Last/Next 3/7 days, кастомный диапазон |
| Аккаунт | WH Customer name (включая «Not assigned») |
| Теги | Список тегов (включая «Not assigned») |
| Перевозчик | Из RCD (Referential Carrier Database) |
| Статус | Множественный выбор, с группировкой |

### Визуальные алерты

| Условие | Цвет |
|---------|------|
| Статус PENDING + дата < NOW − 2ч | 🔴 Красный |
| Статус PENDING + дата < NOW | 🟡 Жёлтый |

Все фильтры сохраняются **на уровне пользователя** (персистентность между сессиями).

---

## Модал обновления статуса слота — Редизайн (REQ-DOCK-013)

### Новый дизайн интерфейса

| Элемент | Старый | Новый |
|---------|--------|-------|
| Статусы | Список | Большие кнопки с пиктограммами |
| Аномальные статусы | Смешаны с обычными | Отдельная группа с горизонтальным разделителем |
| MANUAL MODE | Обычная кнопка | Оформлена как «продвинутая функция» (малозаметно) |
| Подтверждение | Накладывается сверху | Заменяет предыдущий модал |
| Кнопка CONFIRM | Стандартная | Полная ширина |
| Кнопка BACK | — | Маленькая серая |
| Кнопка CLOSE (×) | Есть | ❌ Убрана |

### Дополнительные поля (финальный шаг)

- Поле комментария
- Прикрепление файлов
- Инциденты добавляются к последнему статусу в списке

### Связь с пакинг-листом

После заполнения TP `(UN)LOADED` → автоматически открывается модал обновления пакинг-листа.

---

## Обработка опоздания (REQ-DOCK-014)

| Условие | Поведение |
|---------|-----------|
| Разница план/факт > размер слота | Показывать «X мин опоздания» |
| Ввод будущей даты/времени | ❌ Запрещён |
| Экран «Multiple Date» | Появляется ДО экрана ON TIME / LATE |
| Multiple Date + статус CLOSED | ✅ Поддерживается |
| «Бесполезный экран» при ONGOING | ❌ Убран |

---

## Номер ворот на экране обновления статуса (REQ-DOCK-015)

| Правило | Описание |
|---------|----------|
| Форма кнопок | Квадратные, большой шрифт |
| Названия < 4 символов | Особо крупный шрифт |
| Подтверждение | Клик на кнопку ворот = подтверждение (кнопка UPDATE убрана) |

---

## Группировка Visits по перевозчику (REQ-DOCK-026)

Система позволяет группировать несколько визитов одного перевозчика:

### Критерии группировки

| Критерий | Описание |
|----------|----------|
| Перевозчик | Одинаковый carrier |
| Водитель | Одинаковый driver |
| Временные критерии | Близкое время прибытия/убытия |

### Управление статусами

| Действие | Эффект |
|----------|--------|
| Изменение статуса через экран Visit | Каскадно влияет на статусы всех Slots |
| Изменение статуса через экран Slot | Влияет на статус родительского Visit |

### Навигация

- Экран Visit → просмотр всех Slots этого визита
- Из Slot → возврат к Visit

### Фильтрация

Поддерживается фильтр по **тегу (TAG)** на уровне Visit.

---

## Уведомление водителя о переносе визита (REQ-DOCK-028)

### Функция Prevent Delay

Позволяет предупреждать задержки и перепланировать прибытие:

| Элемент | Описание |
|---------|----------|
| Доступ | В листинге Visit при наведении — количество слотов и их статусы |
| Интервалы | Слоты на следующие 24 часа; шаг 30 минут от планового времени |
| Действие | Пользователь выбирает новый час → перепланирует TP PICKUP/ARRIVAL |

### Роль DRIVER

Роль DRIVER — универсальный пользователь без необходимости управления идентификацией водителей отдельно.

---

## Модал обновления статуса доставки (REQ-DOCK-027)

Улучшения модала при обновлении статуса Slot Delivery:

| Изменение | Описание |
|-----------|----------|
| SH PACKING LIST | Переключатель обновления сохранён |
| LCL/LTL: Specificities | Поле убрано |
| LCL/LTL: ширина модала | Выровнена |
| LCL/LTL: Name & Weight | Поля удалены |
| CAUSES | Занимает всю ширину |
| COMMENT | Добавлено под CAUSES; необязательное (поле `cargo_update_comment`) |

---

## Tracking Points (TP) — Статусы Visit и Slot (REQ-DOCK-009, 010)

### Статусы Visit

```
Pending → On site → In site → Left site
                             ↘ Refused / No show
```

### Статусы Slot

```
Pending → Called → At dock → Loading/Unloading → Loaded/Unloaded
                                                ↘ Refused / No show
```

### API добавления TP

```
POST /api/v1/visits/:id/tracking-points
POST /api/v1/slots/:id/tracking-points
```

Обязательные поля: `datehour`, `action_type`  
Опциональные: `type`, `internal_type`, `note`

Дата/время TP корректируется вручную через UI.

---

## Связанные документы

| Документ | Путь |
|----------|------|
| Planning | [../planning/README.md](../planning/README.md) |
| Dock Doors | [../dock-doors/README.md](../dock-doors/README.md) |
| Dock Orders | [../dock-orders/README.md](../dock-orders/README.md) |

---

## Сверено с кодом (2026-06-11) — API Tracking Points визита (REQ-DOCK-009/010) и Manual Mode (REQ-SLOTIFY-018)

### API TP визита

`POST /api/v1/visits/:id/tracking-points` (и `/slots/:id/tracking-points`). Параметры: обязательные `datehour`, `action_type`; опциональные `type`, `internal_type`, `note`. Методы: create/update/delete (`controllers/api/visits.js`).

Типы TP (`models/visit_tracking_points.js:67-79`): external_parking, driver_cleared_arrival/departure, permitted_entry, in_site, permitted_exit, left_site, refused, no_show, slot_added, canceled. Поля записи: visit_id, type, user_id, date, is_active, comment.

### Manual Mode

Порог — поле **`manual_mode_after`** (INTEGER, на `addresses`/`locations`). Активация: `manual_mode + on_time + closed-статус` → единый модал bulk-обновления дат для всех статусов. Отдельного экрана нет — условная логика внутри Dock Status Update модала; статусы со спец-обработкой: driver_called (3 кнопки), loaded/unloaded (packing list + reconciliation).

### Статусы слота (справочно)

17 внутренних (`models/slots.js:237`): new, driver_called, on_site, at_dock, loading, loaded, unloading, unloaded, admin_cleared_arrival/departure, left_dock, left_site, refused, no_show, canceled, pending_validation, declined, approved → 10 публичных (planned, ongoing, delivered, loaded, refused, no_show, cancelled, pending_validation, declined, approved) через маппинг PublicStatusesToStatuses.

---

## Визит как сущность (сверено с кодом 2026-06-12)

> `models/visits.js`, `visit_purposes`, `visit_drivers`, `visit_transports`

**Зачем визит отделён от слота:** слот — это «окно операции на зоне», визит — «физическое присутствие машины на площадке». Одна машина может приехать под несколько слотов (1 визит : N слотов через `slots.visit_id`), а может приехать вообще без слота (сервис, инспекция, gate-only вход) — поэтому жизнь машины на территории трекается отдельной сущностью.

| Поле | Смысл |
|------|-------|
| `type` | LOGISTICS / MAINTENANCE / BUSINESS_VISITOR / OTHERS — не всякий визит про груз |
| `min_date / max_date` | Окно, когда машину ждут |
| `authorization_in_min/max`, `out_min/max` | Разрешённые окна въезда/выезда — основа для автоматических ворот (Peripass) |
| `carrier_id` | Перевозчик (nullable — частник/сервис) |
| Связанные 1:N | `visit_purposes` (цели: loading/unloading/maintenance/inspection), `visit_drivers` (ФИО, телефон, is_checked), `visit_transports` (номера тягача/прицепа, is_checked), `visit_internal_comments`, `visit_tracking_points` (история статусов) |

**Жизненный цикл:** PENDING → EXTERNAL_PARKING → (PERMITTED_ENTRY) → IN_SITE → DRIVER_CLEARED_ARRIVAL → … → DRIVER_CLEARED_DEPARTURE → (PERMITTED_EXIT) → LEFT_SITE; аномалии: REFUSED / NO_SHOW / CANCELED (закрытые — менять нельзя). Каждый переход = tracking point: из них собирается время на площадке (KPI простоя) и журнал для споров с перевозчиком.

**Кто влияет:** охрана/гейт (въезд-выезд, через Peripass — автоматически), оператор (статусы операций), бронирующий (данные водителя/ТС до визита — обязательность полей настраивается per-direction на локации). Отмена слота удаляет визит, только если в нём не осталось других слотов (`cancelEmptyVisits`).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.visits-management`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631898179 · **repo:** `dock/feature-docs/visits-management/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

