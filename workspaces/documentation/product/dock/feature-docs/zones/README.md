---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930962
source_type: confluence
---
# Zones — зоны площадки

> Сверено с кодом 2026-06-12 | `models/location_zone.js`, `location_zones_dock_door.js`, `services/location_zones.js`

## Откуда сущность и зачем

Физический склад неоднороден: рампа для фур, зона температурного режима, мелкая приёмка. **Зона** — логическая единица планирования с собственными правилами: своё расписание, вместимость, типы груза, валидация. **Dock door** — физическая дверь внутри зоны (D1, D2…), на которую назначается конкретная машина. Разделение осознанно: бронируют «в зону» (правила), ставят «к двери» (физика) — двери можно перераспределять в день X без перебронирования.

## Поля зоны

| Поле | Назначение |
|------|-----------|
| `name`, `prefix`, `token` | Имя; префикс для нумерации; token — публичная ссылка Slotify этой зоны |
| `is_reception` / `is_expedition` | Направления зоны (могут быть оба — расписание общее, подтверждено Product 2026-06-12) |
| `capacity`, `cargo`, `cargo_groups` | Вместимость и типы груза — см. [Slots Core](../slots-core/README.md) |
| `available`, `settings.pre_advice` | Окна и lead time — см. [PML Settings](../pml-settings/README.md) |
| `is_slot_validation` | Валидация чужих броней — см. [Slot Validation](../slot-validation/README.md) |
| `priority {order, count}` | Какую зону Slotify предлагает первой и сколько слотов берёт в этом приоритете |

Двери: `location_zone_dock_doors` (name ≤10 симв., status active/inactive/deactivated). Деактивация двери не трогает зону — брони продолжаются, назначать можно на оставшиеся двери.

## Управление

CRUD зон — Location Settings (оператор PML); создание двери — там же. Активация направления = включение is_reception/is_expedition.

> 📸 TODO: добавить скриншоты каждой зоны с прод-стенда (настройки, расписание, доски) — оставлены плейсхолдеры в разделах.

## Где найти и как настроить (UI)

**Путь:** Slotify → **Location Settings** (`/locations/{id}`) → переключатель зоны (`/settings/{zoneId}`). Вкладки настройки зоны (роуты из `slotify/router.js`):

| Вкладка | URL | Что настраивается |
|---------|-----|-------------------|
| General | `/general` | Имя, направления (Reception/Expedition), prefix |
| Slot | `/slot/{zoneId}` | Capacity: duration, time_per_slot, rounded_to, interval, cargo-типы и per_hour |
| Constraints | `/constraints/{zoneId}` | Окна бронирования, lead time, окна реплана/отмены (replan/cancel cutoff) |
| Slot validation | `/slot-validation/{zoneId}` | Включение валидации + whitelist партнёров |
| Calendar | `/calendar/{zoneId}` | Расписание по дням недели + **изменение часов на конкретную дату** |
| Partners | `/partners` | Партнёры локации |
| Statuses | `/site-statuses` | Активация статусов и привязка tracking points |

**Создать зону:** Location Settings → добавить зону → задать direction и capacity. **Создать dock door:** в настройках зоны → секция dock doors → имя (≤10 симв.).

## Сценарии

1. **Запуск новой рампы**: создать зону → General (Reception) → Slot (cargo-типы склада + per_hour) → Calendar (часы смены) → опубликовать ссылку Slotify.
2. **Температурная зона со строгим контролем**: + Slot validation ON + whitelist проверенных поставщиков → чужие брони уходят на одобрение.
3. **Сокращённый день (инвентаризация)**: Calendar → override часов на дату → базовое расписание не меняется.

> 📸 TODO: скриншоты каждой вкладки со стенда (нужен доступ к тестовому PML).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.zones`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631930962 · **repo:** `dock/feature-docs/zones/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

