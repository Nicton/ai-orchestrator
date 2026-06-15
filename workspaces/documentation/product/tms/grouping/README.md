---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632160404
source_type: confluence
---
# Grouping — Группировка перевозок

Grouping — функция объединения нескольких перевозок в одну физическую поездку (рейс). Используется для Milkrun-маршрутов и оптимизации загрузки транспорта.

## Кто использует

- **Carrier** — объединяет несколько Shipment в один рейс на странице Grouping
- **Shipper** — видит, что его перевозка сгруппирована (через статус "Grouped")

Функция доступна только если включена опция `[Show Milkrun]` в настройках аккаунта (Admin меню).

## Страницы

| URL | Описание |
|-----|---------|
| `/grouping` | Главная страница группировки |
| Sidebar → Grouping tab | Переход в раздел группировки |

## Что видит пользователь

```
Страница /grouping:

[D+0] [D+1] [D+2] [D+3] [D+4] [D+5]  ← Дата отправки

[All Statuses ▼]  ← Фильтр: available / not available / grouped

Список Shipment:
┌──────────────────────────────────────────────────────────┐
│ ☐  Shipment A  Paris → Lyon     12:00  🟢 Available     │
│ ☐  Shipment B  Paris → Lyon     13:00  🟢 Available     │
│ ☐  Shipment C  Marseille → Lyon  11:00  ⚫ Not available │
│ ✓  Shipment D  Paris → Lyon     12:00  🔵 Grouped       │
└──────────────────────────────────────────────────────────┘
        ↓ Выбираем Shipment A и B и нажимаем GROUP
                
        [SET NOT AVAILABLE] [GROUP SELECTED]
```

## Статусы в Grouping

| Статус | Значение |
|--------|---------|
| **Available** | Перевозка может быть добавлена в группу |
| **Not available** | Carrier пометил как недоступную для группировки |
| **Grouped** | Перевозка уже в группе |

## Действия

| Действие | Что происходит | Условие |
|----------|---------------|---------|
| Выбрать Shipment (checkbox) | Отмечает перевозку для группировки | Статус: Available |
| [SET NOT AVAILABLE] | Меняет статус → Not Available | Любой Available |
| [GROUP SELECTED] | Объединяет выбранные в группу | Минимум 2 Available выбраны |
| Клик по Color Tag | Показывает детали группы (время, маршрут) | Статус: Grouped |

## Pick-up Grouping

Отдельная функция для объединения перевозок с одной точкой забора:

- **Group departure**: несколько Shipment с одним и тем же адресом pick-up объединяются
- **Assigning to group**: добавить новый Shipment к существующей группе забора

## Навигация

- Sidebar → Grouping tab → `/grouping`
- Клик на сгруппированный Shipment → `/shipments/{id}` (с тегом "Grouped")

## Мутации

**Группировка:**
- `Shipment.grouping_status` → `grouped`
- `ShipmentGroup` создаётся (или используется существующий)
- Carrier получает единое уведомление по всем Shipment в группе

**Пометка "Not Available":**
- `Shipment.grouping_status` → `not_available`

## Тест-кейсы

| Группа | Кейсов |
|--------|--------|
| Grouping (основные) | 57 |
| Grouping > Confirm grouped TP | 15 |
| Pick-up grouping | 11 |
| Pick-up grouping > Group departure | 6 |
| Pick-up grouping > Assigning to group | 6 |

## Бэкенд

- Модели: `app/models/shipment_group.js`
- Frontend: `workspaces/frontend/public/app/grouping/`

---

## Grouping 2.0 — Типы группировки (REQ-GRP-005)

Grouping 2.0 вводит строгую классификацию типов группировки:

| Тип | Перевозчиков | SH | Pick-up | Delivery |
|-----|-------------|-----|---------|---------|
| **Grouped Departure** | 1 | N | 1 точка | 1 точка |
| **Grouped Delivery** | 1 | N | 1 точка | N точек |
| **Grouped Shipments** | 1 | N | N точек | 1 точка |
| **Milkrun** | 1 | N | N точек | N точек |
| **Mono Shipment** | 1 | 1 | 1 точка | 1 точка |
| **Multi Container** | 1 | N | 1 точка | 1 точка |

Multi Container отличается от Grouped Departure: контейнеры привязаны к одному бронированию, а не к нескольким SH.

---

## Создание группы из одного SH (REQ-GRP-001)

- Кнопки **GROUP DEPARTURE** и **GROUP ARRIVAL** доступны даже при выборе одного SH
- Grouping ID генерируется при создании группы из 1 SH
- Опция создания манифеста доступна и при группировке из 1 SH

---

## Добавление к существующей группе (REQ-GRP-002)

Если часть выбранных SH уже сгруппирована — открывается модал с вариантами:

| Вариант | Поведение |
|---------|----------|
| Создать новую группу | Генерируется новый Grouping ID |
| Добавить к существующей | Используется тот же Grouping ID |
| Создать новый Milkrun | Отдельный маршрут |
| Добавить к существующему Milkrun | Тот же Milkrun ID |

Предыдущий шаг «освобождения» (FREE) перед повторной группировкой больше **не требуется**.

---

## FREE — освобождение SH из группы (REQ-GRP-003)

| Сценарий | Поведение |
|----------|----------|
| FREE 1 SH из группы из 2 | Оставшийся SH **сохраняет** Grouping ID и Manifest ID |
| Удалить Grouping ID у оставшегося | Выбрать оба SH → применить FREE |
| FREE 1 из группы из 3 | Оставшиеся 2 сохраняют Grouping ID и Manifest ID |

История событий (audit log) фиксирует операцию FREE с указанием пользователя и временной метки.

---

## Grouping ID без манифеста (REQ-GRP-004)

Grouping ID виден в карточке SH и в листинге **независимо от того, активирован ли манифест**.

- Клик на «SEE THE N SHIPMENTS» → листинг фильтруется по Grouping ID
- Активный фильтр Grouping ID отображается в шапке листинга с кнопкой сброса
- В Planning View: модальное окно группы содержит Grouping ID и ссылку на список SH
- Поле Grouping ID индексировано и доступно для поиска/фильтрации

---

## Документы в сгруппированных перевозках (REQ-GRP-006..008)

### Варианты распространения документа

При загрузке документа на один SH из группы доступны варианты:

| Вариант | Применимость |
|---------|-------------|
| This shipment | Только текущий SH |
| All shipments | Все SH в группе |
| Selection | Выбранные SH из группы |
| Same Ship | MC / Sea Freight — контейнеры на одном судне |
| Same Destination | Grouped Delivery — SH с одинаковым пунктом назначения |
| Same Pick-up | Grouped Shipments — SH с одинаковой точкой погрузки |

### Уровни доступа к документам (REQ-GRP-007)

| Уровень | Кто видит |
|---------|----------|
| **Private** | Только загрузивший аккаунт |
| **Limited** | Только Shipper и Carrier |
| **Public** | Все аккаунты с доступом к SH (включая PML, Spectator); новые участники, добавленные позже, также получают доступ автоматически |
| **Specific** | Выбранные вручную участники (Carrier, Shipper, Pick-up site, Delivery site, Spectator) |

### Уведомления о документах (REQ-GRP-008)

- Уведомления отправляются **только** аккаунтам, которым документ был предоставлен
- Вместо полного списка пользователей — числовой тег (например, `12`)
- Наведение на тег → список предоставленных аккаунтов и уведомлённых пользователей
- Тег показывает уровень: private / limited / specific (public — без тега)
- Перевозчик может настроить фильтр по конкретным клиентам в своём профиле

---

## 🔗 Граф-метаданные
- **id:** `tms.grouping`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632160404 · **repo:** `tms/grouping/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

