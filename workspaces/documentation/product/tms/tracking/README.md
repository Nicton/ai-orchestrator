---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029336
source_type: confluence
---
# Трекинг (Tracking)

Трекинг — отслеживание местоположения и статуса груза в реальном времени. Реализуется через Tracking Points (точки маршрута), которые Carrier подтверждает по мере выполнения перевозки.

## Кто использует

- **Carrier** — обновляет статусы (подтверждает точки трекинга)
- **Shipper** — следит за статусом своего груза
- **Driver** — мобильное приложение (Driver App) для обновления с телефона
- **Spectator** — наблюдатель, только просмотр

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_tracking-points.md](01_tracking-points.md) | Что такое Tracking Points, их жизненный цикл, действия |

---

## Место в потоке

```
Shipment создан (status: planned)
        ↓
Carrier подтверждает pick-up TrackingPoint
        ↓
Shipment.status = in_transit
        ↓
Carrier подтверждает arrival TrackingPoint
        ↓
Shipment.status = delivered
        ↓
Shipper подтверждает POD → Invoicing
```

---

## Внешние трекинговые платформы

Помимо ручного обновления, трекинг может обновляться автоматически через:

| Платформа | Описание | Код |
|-----------|---------|-----|
| P44 (Project44) | Агрегатор трекинга, 27+ перевозчиков | `app/services/integration/p44/` |
| Shippeo | Трекинг в реальном времени (GPS) | `app/services/integration/shippeo/` |
| AfterShip | Мультиперевозчик нотификации | `app/services/integration/aftership/` |
| Marine Traffic | Морской транспорт | `app/services/integration/marine-traffic/` |
| Calvacom | Телематика (GPS трекер на транспорте) | `app/services/integration/calvacom/` |

---

## Публичный трекинг

Shipper может сгенерировать публичную ссылку на трекинг для клиента (без логина):
- URL: `/public-tracking/{token}`
- Настройки: `/public-tracking-setting`
- Показывает: статус, трекинг-точки, ETA

---

## Backend

- Создание точек: `app/services/shipments.js` → `createTrackingPoint()`
- Пересчёт статуса: `app/services/shipments.js` → `calculateShipmentStatus()`
- Напоминания: `app/services/shipments.js` → `remindTracking()`
- Cron-трекинг: `app/cron/` — группа "Трекинг" (опрос внешних систем)
- Driver App: `workspaces/mini-apps/frontend/driver-app/`

---

## 🔗 Граф-метаданные
- **id:** `tms.tracking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632029336 · **repo:** `tms/tracking/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

