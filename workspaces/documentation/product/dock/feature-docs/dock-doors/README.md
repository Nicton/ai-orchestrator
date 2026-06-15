---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632094755
source_type: confluence
---
# Dock Doors — Ворота склада

Dock Doors — это физические ворота или рампы склада, к которым привязываются слоты. Каждые ворота принадлежат конкретной зоне (LocationZone) и могут иметь характеристики (Specificities), определяющие типы грузов, с которыми они работают.

## Модель данных

**Таблица:** `location_zone_dock_doors`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer | PK |
| `location_zone_id` | FK | Принадлежит зоне |
| `name` | String (max 10) | Например: "DR 1", "Gate A", "Ворота 3" |
| `status` | Enum | `active` / `inactive` / `deactivated` |

Поддерживает мягкое удаление (paranoid): деактивированные ворота не показываются при бронировании, но история слотов сохраняется.

## Dock Door Specificities — Характеристики ворот

Новый справочник для описания специфических возможностей конкретных ворот.

**Расположение в BO:** `BO > Dico > Dock-specificities`

### Поля справочника

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer | PK |
| `name` | String | Название (с i18n ключом) |

### Предустановленные значения

| Значение | Описание |
|---------|----------|
| **ADR** | Опасные грузы (Dangerous Goods) |
| **Side loading** | Боковая загрузка |
| **Temperature controlled** | Температурный контроль |
| **Bulk** | Навалочный груз |

### Настройка (конфигурация)

**My Settings → карточка "Dock Door Specificities":**
- Видима только для **Dock-аккаунтов**
- Скрыта для TMS-аккаунтов
- Компонент Metadata Prototypes: левая панель = Disabled, правая = Active

Характеристики привязываются к конкретным воротам через теговые чипы в настройках Dock Door.

## Dock Door Assignment View — Вид назначения ворот

Специализированный экран для управления назначением слотов на ворота через drag-and-drop.

**URL:** `app.blu.shiptify.com/slotify/load/YYYY-MM-DD`

### Интерфейс

```
Временная ось →  08:00   09:00   10:00   11:00   12:00
                 ────────────────────────────────────────
Ворота DR 1    │         [Carrier A: 09:00-11:00]
Ворота DR 2    │  [B]            [Carrier C: 10:30-12:00]
Ворота DR 3    │  [D: 08:00-09:30][E: 09:00-11:00] ← OVERLAP (оранжевый)
               │
[Unassigned Tray ▼] (5 не назначено)
  DO-001: 09:00-11:00 (2h) / 4 паллеты
  DO-002: 13:00-14:30 (1.5h) / 2 паллеты
  ...
```

### Цветовая кодировка

| Цвет | Состояние |
|------|----------|
| Белый | Planned (запланирован) |
| Светло-голубой | Ongoing (в процессе) |
| Светло-зелёный | Closed (завершён) |
| **Оранжевый** | Overlapping — конфликт двух слотов на одних воротах |

### Правила взаимодействия

| Правило | Описание |
|---------|----------|
| Снаппинг | Слот привязывается к своему плановому времени при перетаскивании |
| Перепланирование | **Невозможно** из этого вида — только назначение ворот |
| Аномальные статусы | Слоты с нетипичными статусами **скрыты** из вида |

### Unassigned Tray

Панель внизу экрана с не назначенными слотами:
- Счётчик: "N не назначено"
- Формат каждого слота: `"09:00 - 11:00 (2h)"` + количество паллет

## Атомарное обновление Dock Door

При назначении или смене ворот сервис `app/services/dock_door.js` → `updateDockDoorByInput()` атомарно обновляет поле `location_zone_dock_door_id` сразу в нескольких таблицах:

```
PATCH /api/v1/slots/:id (dock_door_id)
    ↓
updateDockDoorByInput()
    ├── trackings (dock_door_id)
    ├── shipment_request_addresses (dock_door_id)
    ├── shipments (from_dock_door_id / dest_dock_door_id)
    └── shipment_requests (dock_door_id)
```

Это гарантирует консистентность данных по всей цепочке: трекинг, адреса, отправки и заявки всегда содержат актуальные ворота.

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/v1/location_zones/:id/dock_doors` | Список ворот зоны |
| `POST` | `/api/v1/location_zones/:id/dock_doors` | Создать ворота |
| `PATCH` | `/api/v1/location_zones/:id/dock_doors/:dock_door_id` | Обновить ворота (name, status) |
| `GET` | `/api/v1/dock-slots` | Слоты для dock-вида (по локации/дате) |

## Связанные страницы

- [Master Location / Zones](../master-location/README.md) — зоны, которым принадлежат ворота
- [Planning](../planning/README.md) — основной вид для управления слотами на воротах
- [Dock Status Update](../planning/README.md#dock-status-update-modal) — модал обновления статуса через ворота

---

## Сверено с кодом (2026-06-11) — Dock Door Specificities (REQ-DOCK-003)

Словаря специфик (ADR/Temperature/Side loading/Bulk) в БД **нет**: модель `LocationZoneDockDoor` минимальна — id, location_zone_id, name (≤10 симв.), status (`models/location_zones_dock_door.js`). Tag chips из слайдов 2026-05 — **informational-дизайн без enforcement**; принудительное сопоставление специфик визита и ворот не реализовано. BO-управление спецификами отсутствует → при появлении требования это новая разработка.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.dock-doors`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632094755 · **repo:** `dock/feature-docs/dock-doors/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

