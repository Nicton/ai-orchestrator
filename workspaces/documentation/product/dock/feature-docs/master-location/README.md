---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631111718
source_type: confluence
---
# Master Location (PML) — Физическая мастер-локация

Master Location (ML / PML — Physical Master Location) — это центральная сущность в Dock-модуле. Представляет собой реальный объект: склад, терминал, распределительный центр. Все зоны, ворота и слоты привязаны к ML.

## Иерархия структуры

```
Master Location (address / PML)
  └── LocationZone (зона внутри склада)
        ├── LocationZoneDockDoor (физические ворота)
        ├── LocationZoneDefaultSetting (недельное расписание: Пн-Вс)
        ├── LocationZoneDateSetting (переопределения на конкретную дату)
        ├── LocationZoneMetadataPrototype (обязательные поля метаданных)
        ├── LocationZoneAttachmentTypes (требуемые документы)
        ├── LocationZoneFollowers (подписчики зоны)
        └── LocationZoneWhitelistPartners (поставщики без pending_validation)
```

## LocationZone — Зона склада

Зона — это логическое подразделение внутри склада. У одного склада может быть несколько зон (например, зона Reception, зона Expedition, зона ADR).

**Ключевые поля таблицы `location_zones`:**

| Поле | Тип | Описание |
|------|-----|----------|
| `location_id` | FK | Привязка к PML (address) |
| `name` | String | Название зоны |
| `token` | String | Уникальный токен для Slotify-ссылки |
| `prefix` | String | Префикс для имён слотов |
| `internal_zone_id` | String | Внутренний идентификатор |
| `capacity` | TEXT/JSON | Настройки: `time_per_slot`, `interval`, `duration`, `docs` |
| `cargo` | TEXT/JSON | Пропускная способность по типам груза (единиц в час) |
| `cargo_groups` | JSONB | Группы типов груза |
| `available` | JSONB | Окно бронирования: from/to часы, rate, cancel window |
| `is_expedition` | Boolean | Зона для отправки (Expedition / Pickup) |
| `is_reception` | Boolean | Зона для приёма (Reception / Delivery) |
| `is_slot_validation` | Boolean | Включает flow pending_validation |
| `allow_outside_range` | Boolean | Разрешить бронирование вне диапазона |
| `allow_partial_deliveries` | Boolean | Разрешить частичные доставки |
| `allow_add_cargo_type` | Boolean | Разрешить добавлять нестандартные типы груза |
| `show_time_range` | Boolean | Показывать диапазон времени |
| `settings` | JSON | Например, `{ "pre_advice": 7 }` |
| `priority` | JSON | Приоритет зоны |

### Направления зоны

| Значение | Смысл | Также называется |
|----------|-------|------------------|
| `is_reception=true` | Прибытие в ML | Delivery / Arrival / Destination |
| `is_expedition=true` | Убытие из ML | Pickup / Departure / Origin |
| Оба = true | Двухрежимная зона | Reception + Expedition |

Зона может быть настроена только для одного направления или для обоих. В Slotify пользователь выбирает "Deliver TO" или "Pickup FROM" — система показывает только зоны подходящего направления.

## LocationZoneDockDoor — Физические ворота

**Таблица:** `location_zone_dock_doors`

| Поле | Тип | Описание |
|------|-----|----------|
| `location_zone_id` | FK | Принадлежит зоне |
| `name` | String (max 10) | Название (например, "DR 1", "Gate A") |
| `status` | Enum | `active` / `inactive` / `deactivated` |

Ворота поддерживают мягкое удаление (paranoid). Деактивированные ворота не показываются при бронировании, но история слотов сохраняется.

## Расписание зоны

### Недельное расписание (LocationZoneDefaultSetting)

По умолчанию создаётся при создании зоны (`createLocationZone()` в `app/services/slotify.js`):
- Пн–Пт: открыто с 05:00 до 20:00
- Сб–Вс: закрыто

### Переопределения на дату (LocationZoneDateSetting)

Позволяет изменить расписание на конкретный день:
- Полностью закрыть день (праздник)
- Изменить часы работы
- Добавить перерыв
- Деактивировать Reception или Expedition на день
- Сбросить к стандартному расписанию

**API:** `GET/POST/PATCH/DELETE /api/v1/location_zones/:id/date_custom_settings`

## Настройки ML Status Activations

Для каждого ML можно активировать кастомные статусы. Каждый статус соответствует Tracking Point (TP): при активации статуса на странице Planning создаётся соответствующий TP на Shipment.

**Настройка:** Settings → Master Location → Status Activations

## Whitelist Partners

Таблица `location_zone_whitelist_partners` содержит поставщиков, которые при бронировании через Slotify получают статус `new` (а не `pending_validation`).

**API:** `GET/POST/DELETE /api/v1/location_zone/:id/whitelist-partners`

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/v1/location_zones` | Создать зону |
| `GET` | `/api/v1/location_zones` | Список зон |
| `GET` | `/api/v1/location_zones/:id` | Получить зону |
| `PATCH` | `/api/v1/location_zones/:id` | Обновить зону |
| `DELETE` | `/api/v1/location_zones/:id` | Удалить зону |
| `GET/PATCH` | `/api/v1/location_zones/:id/settings` | Расписание зоны |
| `GET/POST/PATCH/DELETE` | `/api/v1/location_zones/:id/date_custom_settings` | Переопределения на дату |
| `GET/POST` | `/api/v1/location_zones/:id/dock_doors` | Список/создание ворот |
| `PATCH` | `/api/v1/location_zones/:id/dock_doors/:dock_door_id` | Обновить ворота |
| `GET` | `/api/v1/locations/:id/capacity` | Вид нагрузки на день |

## Связанные сервисы

- `app/services/slotify.js` — `createLocationZone()`, `updateLocationZoneByInput()`
- `app/services/dock_door.js` — `updateDockDoorByInput()` (атомарная запись dock_door во все связанные таблицы)

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.master-location`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631111718 · **repo:** `dock/feature-docs/master-location/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

