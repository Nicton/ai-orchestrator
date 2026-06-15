---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/630390843
source_type: confluence
---
# Control Tower — Башня управления

![Dock Manager Dashboard](../../../screenshots/dashboard/main-dashboard.png)
*Главная страница для Dock Manager — Last Slot, Inbound/Outbound, Updates*

Control Tower — это главная страница приложения (home page) с интерактивной картой и боковой панелью событий. Даёт моментальный overview всех активных перевозок в реальном времени.

## Кто использует

- **Shipper** — мониторинг всех активных перевозок на карте
- **Admin** — полный вид всех перевозок в системе

Carrier не видит Control Tower — у него своя главная страница.

## Что видит пользователь

```
┌──────────────────────────────────────────────────────┐
│  LEFT SIDEBAR              │  MAP                    │
│                            │                         │
│  [Time period: Today/7d]   │  🗺️ Интерактивная карта │
│  [Mode: ALL/LTL/FTL...]    │  с точками перевозок   │
│  [All types ▼]             │                         │
│                            │  Каждая точка = один   │
│  INCIDENTS (если есть)     │  активный Shipment      │
│  ⚠️ 3 delayed shipments    │                         │
│                            │  Hover → детали        │
│  EVENTS TIMELINE           │  Click → детальная     │
│  14:20 — Delivered         │  страница Shipment      │
│  13:45 — Pick-up confirmed │                         │
│  13:10 — New booking       │                         │
│  ...                       │                         │
└──────────────────────────────────────────────────────┘
```

## Элементы

### Левая панель (Sidebar)

| Элемент | Описание |
|---------|---------|
| **Time period selector** | Сегодня / 7 дней / 30 дней / Произвольный диапазон |
| **Mode selector** | Все / LTL / FTL / Sea / Air / Milkrun |
| **All types dropdown** | Фильтр: Departure / Arrival |
| **Incidents block** | Блок с задержками и проблемными перевозками (если есть) |
| **Events timeline** | Хронологический список всех событий за период |

### Карта (Map)

- Каждая активная перевозка — точка на карте
- Цвет точки = статус (зелёный = доставлено, оранжевый = в пути, красный = задержка)
- Hover на точку — popup с основными данными (название, маршрут, статус)
- Клик на точку — переход на `/shipments/{id}`

### Incidents Block

Отображается только если есть проблемные перевозки:
- Задержки pick-up
- Задержки доставки
- Инциденты, отмеченные перевозчиком
- Клик → список инцидентов с фильтрацией

## Навигация

- **Control Tower** — это `/` (главная страница)
- Клик по точке на карте → `/shipments/{id}` (детали перевозки)
- Клик по событию в timeline → `/shipments/{id}`

## Тест-кейсы

20 кейсов в сьюте "Control Tower Page":
- TC-3831: Home page (проверка что CT открывается по умолчанию)
- TC-3832: Left sidebar (расположение и элементы)
- TC-3833: Map (расположение карты)
- TC-3834: Sidebar elements (все элементы присутствуют)
- TC-3835: Time period selector (фильтрация по периоду)
- TC-3836: Mode selector (фильтрация по режиму)
- TC-3837: All types dropdown
- TC-3838: Incidents block (отображение при наличии инцидентов)

## Бэкенд

- Frontend: `workspaces/frontend/public/app/controlTower/` (AngularJS)
- Backend API: `GET /api/v1/control-tower/events`
- WebSocket: real-time обновления событий
- Elasticsearch: агрегация событий по временным диапазонам

---

## 🔗 Граф-метаданные
- **id:** `tms.control-tower`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 630390843 · **repo:** `tms/control-tower/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

