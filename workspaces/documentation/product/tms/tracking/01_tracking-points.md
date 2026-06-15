---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668886
source_type: confluence
---
# Tracking Points — точки трекинга

## Что это

Tracking Point (TP) — событие в жизни перевозки. Каждый Shipment имеет минимум 2 точки: pick-up (забор груза) и arrival (доставка). Между ними могут быть промежуточные точки (транзитные склады, таможня).

**Где видно:** таб "Tracking" на странице `/shipments/{id}`
**Frontend:** `workspaces/frontend/public/app/shipments/view/`

---

## Типы Tracking Points

| Тип | Описание |
|-----|---------|
| `departure` | Забор груза у shipper'а (pick-up) |
| `arrival` | Доставка к получателю |
| `transit` | Промежуточная точка (перегрузка, таможня) |
| `custom` | Любое произвольное событие |

---

## Жизненный цикл TrackingPoint

```
Shipment создан
    ↓
TrackingPoint создаётся автоматически:
  - departure (pick-up) — плановая дата из заявки
  - arrival (delivery) — плановая дата из заявки
    ↓
Статус: not_confirmed
    ↓
Carrier выполняет событие (приехал, загрузил)
    ↓
Carrier подтверждает точку (через UI или Driver App)
    ↓
Статус: confirmed
TrackingPoint.real_date = фактическая дата
    ↓
Shipment.status пересчитывается
```

**Если дата прошла, а точка не подтверждена:**
```
Статус: delayed → Shipper видит предупреждение
```

---

## Что видит пользователь на странице трекинга

| Элемент | Описание |
|---------|---------|
| Список точек | Иконка типа + Локация + Плановая дата + Статус |
| Плановая дата | Из заявки (может быть диапазон) |
| Фактическая дата | После подтверждения |
| ETA | Расчётное время прибытия (если интеграция) |
| Статус | Not Confirmed / Confirmed / Delayed / Incident |
| Иконки интеграции | Источник обновления (P44, Shippeo и др.) |

---

## Действия

| Действие | Что происходит | Кто может | URL |
|----------|---------------|-----------|-----|
| Подтвердить точку | `TP.status = confirmed`, пересчёт Shipment.status | Carrier | Кнопка на TP |
| Добавить точку | Создаёт новый TP | Carrier | `/shipments/{id}/track` |
| Редактировать точку | Изменяет дату/локацию | Carrier | `/shipments/{id}/track/{tp_id}` |
| Перепланировать | Меняет плановую дату (replan) | Carrier, Shipper | Кнопка на TP |
| Запросить информацию | Email перевозчику с запросом | Shipper | Кнопка на TP |
| Напомнить | Отправляет напоминание о просроченной TP | Shipper | `remindTracking()` |
| Отметить инцидент | `TP.status = incident` | Carrier, Shipper | Кнопка |
| Создать претензию (claim) | Открывает форму Claims | Shipper | Из TP с проблемой |

---

## Driver App — мобильное обновление

Водители обновляют трекинг через мобильное приложение:

| Экран | Действие |
|-------|---------|
| Shipment | Просмотр назначенного рейса |
| Tracking Point | Подтверждение pick-up / delivery |
| Tracking Point Prevent Delay | Уведомление о задержке |
| CMR Picture | Фото CMR-документа (доказательство доставки) |
| Confirmed View | Финальное подтверждение |

**Репозиторий:** `workspaces/mini-apps/frontend/driver-app/`
**Языки:** 17 языков (мультиязычный)

---

## Мутации (при подтверждении TrackingPoint)

### Внутренние (БД)

```
TrackingPoint.status = 'confirmed'
TrackingPoint.real_date = DateTime.now()
Shipment.status пересчитывается:
  - departure confirmed → in_transit
  - arrival confirmed → delivered
```

### Внешние (интеграции)

- **Email** `mailStatus` → shipper + все подписчики
- **Webhook** `shipmentStatusUpdated` → клиентские системы
- **P44 / Shippeo** → если активна интеграция, обновление отправляется в платформу
- **SAP / WMS** (если настроено) → обновление в ERP

---

## Автоматическое обновление трекинга (cron)

Cron-задачи опрашивают внешние системы каждые N минут:
- P44: опрос API Project44 → обновление TP автоматически
- Shippeo: websocket / polling → GPS обновления
- AfterShip: webhook-based → события от перевозчиков

Код: `app/cron/` → группа "Трекинг"

---

## Backend

- `app/services/shipments.js` → `createTrackingPoint()`, `calculateShipmentStatus()`, `remindTracking()`
- `app/models/tracking_point.js` — модель
- Интеграции: `app/services/integration/p44/`, `/shippeo/`, `/aftership/`
- Cron: `app/cron/tracking-*.js`

---

## 🔗 Граф-метаданные
- **id:** `tms.tracking.01_tracking-points`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631668886 · **repo:** `tms/tracking/01_tracking-points.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

