---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631963698
source_type: confluence
---
# DOCK — Управление воротами склада

Модуль Dock — это подсистема Shiptify для управления временными окнами на складах и терминалах (slot booking), планирования нагрузки на ворота и контроля прохода транспорта через Dock Doors.

## Что такое Dock

Dock позволяет:
- Резервировать временные окна (слоты) для погрузки/разгрузки
- Управлять зонами и воротами склада (Master Location → Zones → Dock Doors)
- Публиковать внешний портал бронирования для перевозчиков и поставщиков (Slotify)
- Контролировать в реальном времени поток транспорта через ворота
- Строить повторяющиеся (recurring) слоты для регулярных рейсов

## Кто использует

| Роль | Что делает |
|------|-----------|
| **Оператор / Dock Manager** | Подтверждает слоты, назначает ворота, управляет расписанием |
| **Shipper** | Бронирует слоты для входящих отправок, настраивает зоны |
| **Carrier** | Бронирует слоты через Slotify или Slotbook |
| **Внешний пользователь (Slotify)** | Поставщик / экспедитор, бронирует через публичный портал |
| **Admin** | Полный доступ к настройкам и данным |

## Основные модули

```
DOCK
├── Master Location          — склад / PML с зонами и воротами
├── Slotify                  — публичный портал бронирования
├── Planning                 — страница планирования (Board/Day/Week)
├── Dock Doors               — управление воротами и характеристиками
├── Slot Booking             — бронирование слотов из основного приложения
└── Cross-Dock               — управление транзитными грузами
```

## Быстрая навигация

| Раздел | Документ |
|--------|----------|
| Роли пользователей | [business-vision/01_user-types.md](business-vision/01_user-types.md) |
| Сценарии использования | [business-vision/02_user-journeys.md](business-vision/02_user-journeys.md) |
| Master Location | [feature-docs/master-location/README.md](feature-docs/master-location/README.md) |
| Slotify — обзор | [feature-docs/slotify/README.md](feature-docs/slotify/README.md) |
| Slotify — поток бронирования | [feature-docs/slotify/01_booking-flow.md](feature-docs/slotify/01_booking-flow.md) |
| Slotify — алгоритм слотов | [feature-docs/slotify/02_algorithm.md](feature-docs/slotify/02_algorithm.md) |
| Slotify — Airport screens | [feature-docs/slotify/03_airport-screens.md](feature-docs/slotify/03_airport-screens.md) |
| Страница Planning | [feature-docs/planning/README.md](feature-docs/planning/README.md) |
| Dock Doors | [feature-docs/dock-doors/README.md](feature-docs/dock-doors/README.md) |
| Slot Booking в приложении | [feature-docs/slot-booking/README.md](feature-docs/slot-booking/README.md) |
| Техническая документация | [technical-view/README.md](technical-view/README.md) |

## Место в экосистеме Shiptify

```
TMS (Shipment + QuoteRequest)
      ↓
  Shipment создан
      ↓
  Carrier / Shipper бронирует Slot
  (через Slotify, Slotbook или главное приложение)
      ↓
  Operator подтверждает в Planning
      ↓
  Carrier приезжает → статус на воротах (on_site → at_dock → loaded/unloaded)
      ↓
  Shipment.status обновляется
```

## Ключевые URL

| URL | Назначение |
|-----|------------|
| `app.blu.shiptify.com/slotify/week` | Недельный вид Planning |
| `app.blu.shiptify.com/slotify/load/YYYY-MM-DD` | Назначение ворот (Dock Door Assignment) |
| `app.slotify.com/{token}` | Публичный портал Slotify для внешних пользователей |
| `app.blu.shiptify.com/slotbook-ongoing-slots` | SlotBook — текущие слоты перевозчика |

---

## 🔗 Граф-метаданные
- **id:** `dock`
- **type:** overview · **domain:** DOCK · **status:** implemented
- **confluence:** 631963698 · **repo:** `dock/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

