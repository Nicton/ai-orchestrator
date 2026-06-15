---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815667
source_type: confluence
---
# Отправки (Shipments)

Центральный домен Shiptify TMS. Перевозка (Shipment) — это подтверждённая сделка между грузоотправителем и перевозчиком. Создаётся из заявки (SR или QR) и проходит через весь жизненный цикл — от бронирования до доставки и выставления счёта.

## Кто использует

- **Shipper** — создаёт заявки, следит за перевозками, управляет документами
- **Carrier** — подтверждает бронирования, обновляет статусы трекинга
- **Admin** — полный доступ, может управлять любыми перевозками
- **Spectator** — наблюдатель: видит перевозки, не может изменять

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_create-shipment-wizard.md](01_create-shipment-wizard.md) | Wizard создания перевозки (8 шагов) |
| [02_list.md](02_list.md) | Список перевозок: фильтры, колонки, действия |
| [03_details.md](03_details.md) | Страница перевозки: табы Tracking/Booking/Logistic/Invoicing |
| [04_state-machine.md](04_state-machine.md) | Все статусы и переходы между ними |

---

## Место в общем потоке

```
Shipper создаёт заявку (CSW wizard)
              ↓
     [Домен: Заявки]
     ShipmentRequest создана
              ↓
     ┌────────┴────────┐
     SR                QR
     (1 перевозчик)   (несколько)
     ↓                 ↓
     Подтверждение    Выбор котировки
              ↓
         Shipment ← ВЫ ЗДЕСЬ
              ↓
     [Домен: Трекинг] — обновление точек
              ↓
     [Домен: Слоты]   — резервирование ворот
              ↓
     [Домен: Инвойсинг] — выставление счёта
```

---

## Ключевые модели БД

| Модель | Файл | Описание |
|--------|------|---------|
| `Shipment` | `app/models/shipment.js` | Основная запись перевозки |
| `TrackingPoint` | `app/models/tracking_point.js` | Точка трекинга (pick-up, arrival) |
| `ShipmentContent` | `app/models/shipment_content.js` | Груз (вес, размеры) |
| `ShipmentAttachment` | `app/models/shipment_attachment.js` | Документы (CMR, инвойс) |
| `SlotShipment` | `app/models/slot_shipment.js` | Связь Shipment ↔ Slot |

---

## Backend service

`workspaces/backend/app/services/shipments.js` — основная бизнес-логика:
- `createShipment()` — создание
- `updateShipmentByInput()` — обновление полей
- `calculateShipmentStatus()` — пересчёт статуса
- `runCancelShipmentIntegrations()` — отмена через API перевозчика
- `sendShipmentDataToIntegration()` — отправка данных в интеграцию

Frontend: `workspaces/frontend/public/app/shipments/`

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632815667 · **repo:** `tms/shipments/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

