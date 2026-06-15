---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632619122
source_type: confluence
---
# Navigation Graph — Граф навигации

Как страницы связаны между собой. Стрелки показывают возможные переходы.

---

## Ядро системы (Core TMS Flow)

```
                    ┌─────────────────────┐
                    │      /dashboard      │  ← точка входа
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    /shipment-requests    /shipments        /slots
    (список заявок)      (список перев.)   (список слотов)
              │                │                │
              │                │                │
    ┌─────────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │ /shipment-     │  │/shipments/  │  │ /slots/{id}│
    │ requests/new   │  │   {id}      │  │            │
    │ (CSW wizard)   │  │             │  └────────────┘
    └─────────┬──────┘  │ Tabs:       │
              │         │ • Tracking  │
              │ создаёт │ • Booking   │
              └────────►│ • Logistic  │
                        │ • Invoicing │
                        │ • Orders    │
                        │ • Claims    │
                        └──────┬──────┘
                               │
               ┌───────────────┼────────────────┐
               ▼               ▼                ▼
          /slots/{id}    /orders/{id}     /claims/{id}
          (слот)         (заказ)          (претензия)
```

---

## Детальный граф: страница перевозки `/shipments/{id}`

### Откуда можно попасть (входящие)

| Источник | Способ |
|---------|--------|
| `/shipments` | Клик по строке в таблице |
| `/dashboard` | Клик на перевозку в виджете |
| `/dashboard/tracking` | Клик на проблемную перевозку |
| `/shipment-requests/{id}` | Кнопка "Перейти к Shipment" |
| Email-уведомление | Ссылка в письме (статус изменился) |
| `/pod-requests` | Клик по строке |
| `/air-sea-shipments` | Клик по строке |
| Public link | `/public-tracking/{token}` (без авторизации) |

### Куда можно перейти (исходящие)

| Переход | Действие | URL назначения |
|---------|---------|---------------|
| Назад к списку | Кнопка "← Назад" | `/shipments` |
| К слоту | Клик на слот в Tracking tab | `/slots/{id}` |
| К перевозчику | Клик на имя Carrier | `/partners/{id}` |
| К заказу | Orders tab → клик | `/orders/{id}` |
| К претензии | Claims tab → клик | `/claims/{id}` |
| Добавить TP | Кнопка "Add tracking point" | `/shipments/{id}/track` (modal) |
| Редактировать TP | Клик "Edit" на TP | `/shipments/{id}/track/{tp_id}` (modal) |
| Расшарить | "Share" → публичная ссылка | генерирует `/public-tracking/{token}` |

---

## Предусловия для страниц (Prerequisites)

### `/shipments` — список перевозок

```
Нужно:
  └── Пользователь авторизован
      └── User.account существует (ShipperACL или CarrierACL)

Данные появятся если:
  └── Существуют Shipment записи, доступные этому аккаунту
```

### `/shipments/{id}` — детали перевозки

```
Нужно:
  ├── Shipment с этим id существует
  │   └── Создан из ShipmentRequest (status: confirmed)
  │       ├── ShipmentRequest создан через CSW wizard
  │       │   ├── Locations (pick-up + delivery) настроены
  │       │   └── Carrier существует и связан с аккаунтом
  │       └── Carrier подтвердил ИЛИ auto-confirm
  └── Пользователь имеет доступ:
      ├── Shipper: входит в ShipperACL для этой перевозки
      ├── Carrier: это "его" перевозка (carrier_id совпадает)
      └── Admin: полный доступ

Трекинг tab появится если:
  └── TrackingPoints созданы (создаются автоматически с Shipment)

Invoicing tab будет активен если:
  └── Shipment.status = delivered (или ближе к концу)
```

### `/slots` — список слотов

```
Нужно:
  └── Пользователь авторизован

Данные появятся если:
  ├── Существуют Slot записи для этого аккаунта
  │   └── Созданы Carrier'ом или Shipper'ом
  └── Locations имеют настроенный Slot Configuration
      └── Location.slot_configuration существует
          └── DockDoor'ы настроены
```

### `/shipment-requests/new` — CSW Wizard

```
Нужно для работы wizard:
  ├── Locations настроены (pick-up и delivery)
  │   └── /locations → Add Location
  ├── Carrier добавлен как партнёр
  │   └── /partners → Add Partner
  └── Пользователь имеет роль 'api' или выше

Опционально (для полного функционала):
  ├── ShipmentTemplate (для быстрого заполнения)
  ├── Products/SKU (для выбора груза из каталога)
  └── Tags (для маркировки)
```

### `/slotify/week` — Slotify calendar

```
Нужно:
  ├── Location имеет slot_configuration
  ├── DockDoor'ы настроены у Location
  └── Пользователь имеет роль оператора склада

Данные появятся если:
  └── Существуют Slot записи для этой Location
```

---

## Пути к функции "Tracking" (сколько способов)

Разработчик должен знать: если сломается один путь — есть ли другой?

**Способы увидеть трекинг перевозки:**

| Путь | Кто может | Требует авторизации |
|------|-----------|-------------------|
| `/shipments` → клик → Tracking tab | Shipper, Carrier, Admin | Да |
| Email ссылка → `/shipments/{id}` | Shipper, Carrier | Да |
| `/dashboard/tracking` → клик | Shipper, Admin | Да |
| Публичная ссылка `/public-tracking/{token}` | Кто угодно | Нет |
| Driver App → Shipment экран | Driver | Да (Driver App auth) |

**Способы обновить трекинг (TrackingPoint confirm):**

| Путь | Кто | Код |
|------|-----|-----|
| Кнопка на TP в `/shipments/{id}` | Carrier | UI → API → `createTrackingPoint()` |
| Driver App → "Confirm delivery" | Driver | Mobile API |
| Быстрое подтверждение в `/shipments` (список) | Carrier | Inline action |
| P44 автоматически | Система | `app/cron/` → P44 polling |
| Shippeo GPS | Система | Webhook от Shippeo |
| Public API (внешняя система) | Внешний клиент | `workspaces/public-api` |

---

## Часто изменяемые зависимости (Impact Analysis)

Что сломается, если изменить модель `Shipment`:

| Изменение | Затронутые страницы | Затронутый код |
|-----------|-------------------|---------------|
| Добавить поле `Shipment.priority` | `/shipments` (список), `/shipments/{id}` (детали), CSW wizard | Frontend: 3+ компонента; Backend: `shipments.js`, миграция БД |
| Изменить `Shipment.status` (новый статус) | `/shipments` (фильтры), `/shipments/{id}` (таб Tracking), `/dashboard/tracking`, emails | Frontend: status filters; Backend: `calculateShipmentStatus()`; Worker: email условия |
| Изменить связь `Shipment → Carrier` | `/shipments/{id}` (Booking tab), `/partners/{id}`, email шаблоны | Backend: `loadExtendedShipmentInfo()`, все интеграции |
| Переименовать `TrackingPoint.status` | `/shipments/{id}` Tracking tab, Driver App, все email уведомления | Frontend + Driver App + Worker emails |

---

## 🔗 Граф-метаданные
- **id:** `tms.technical-view.navigation-graph`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632619122 · **repo:** `tms/technical-view/navigation-graph.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

