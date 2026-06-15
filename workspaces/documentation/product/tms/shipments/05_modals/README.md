---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631111817
source_type: confluence
---
# Shipments — Модальные окна

Раздел описывает все 8 модальных окон, используемых в разделе Shipments TMS-приложения. Каждое модальное окно реализовано на AngularJS (UI Bootstrap `$uibModal`).

---

## Содержание

1. [Cancel / Re-activate Shipment](#1-cancel--re-activate-shipment)
2. [Cancel Slot Booking](#2-cancel-slot-booking)
3. [Container ID / BL ID](#3-container-id--bl-id)
4. [Request Proof of Delivery](#4-request-proof-of-delivery)
5. [Update Dock Door](#5-update-dock-door)
6. [Parcel Details](#6-parcel-details)
7. [Add Tracking Point](#7-add-tracking-point)
8. [Edit Tracking Point](#8-edit-tracking-point)

---

## 1. Cancel / Re-activate Shipment

**Файл:** `controllers/activate-reactivate-modal.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | `ctrl.isSelfAdmin && ctrl.canCancelShipment` — footer вкладки Tracking |
| Controller | `ActivateReactivateModal` |
| API | `PUT /api/v1/shipments/:id` |

### Поля

| Поле | Тип | Описание |
|------|-----|---------|
| `cancelComment` | TEXTAREA | Причина отмены (опционально) |

### Логика

| Состояние | Кнопка | Payload |
|-----------|--------|---------|
| `shipment.canceler_id` = null | "Cancel Shipment" | `{ status: 'canceled', cancel_comment }` |
| `shipment.canceler_id` != null | "Re-activate canceled Shipment" | `{ status: 'new' }` |

---

## 2. Cancel Slot Booking

**Файл:** `controllers/cancel-slot-booking.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | `ctrl.isSelfAdmin && ctrl.canCancelShipment && ctrl.showCancelSlotButton` |
| Controller | `CancelSlotBookingCtrl` |

Отменяет слот на складе без отмены самой перевозки. Уведомляет PML-владельца.

---

## 3. Container ID / BL ID

**Файл:** `controllers/container-id-modal.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | `/air-sea-shipments` — клик по Container ID ячейке |
| Controller | `ContainerIdModal` |
| API | `PATCH /api/v1/shipments/:id` |

### Поля

| Поле | Условие | DB поле |
|------|---------|---------|
| `external_container_id` | Всегда (Sea) | `shipments.external_container_id` |
| `bl_id` / `awb_id` | `isShowBlId`: Sea=BL, Air=AWB | `shipments.bl_id` |

---

## 4. Request Proof of Delivery

**Файл:** `controllers/request-proof-of-delivery.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | `ctrl.showRequestPODButton` (только Shipper) |
| Controller | `RequestProofOfDeliveryCtrl` |
| API | `POST /api/v1/shipments/:id/request-pod` |

После отправки: POD статус → `expected`, Carrier получает email с запросом загрузить POD документ.

---

## 5. Update Dock Door

**Файл:** `controllers/update-dock-door.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | Planning view — Dock Door Assignment |
| Controller | `UpdateDockDoorCtrl` |
| API | `PATCH /api/v1/shipments/:id` |

### Поля

| Поле | Тип | Описание |
|------|-----|---------|
| `dock_door_id` | DROPDOWN | Конкретные ворота склада |
| `location_zone_id` | DROPDOWN | Зона мастер-локейшена |

---

## 6. Parcel Details

**Файл:** `controllers/parcel-details.js`

| Атрибут | Значение |
|---------|---------|
| Открывается | `ctrl.showParcelButtons` — `isAllowedParcelModes && parcels.length > 0` |
| Режимы | ROAD / EXPRESS / GROUPAGE |

### API

| Эндпоинт | Назначение |
|---------|-----------|
| `GET /shipments/:id/parcels/:parcel_id/tracking` | Tracking events посылки |
| `GET /shipments/:id/parcels-temperatures` | Температурные данные |

---

## 7. Add Tracking Point

**Файл:** `controllers/add-tracking-point.js` · `views/new-tracking-point.html`

| Атрибут | Значение |
|---------|---------|
| URL | `/shipments/:id/track` (child state) |
| Controller | `NewTrackingPointCtrl` |
| API | `POST /api/v1/tracking-points` |

### Поля формы

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|---------|
| `point_type` | DROPDOWN | ДА | departure / arrival / intermediate |
| `location` | TYPEAHEAD | ДА | Адрес из адресной книги |
| `date_from` | DATE | ДА | Начало окна |
| `date_to` | DATE | НЕТ | Конец окна |
| `time_from / time_to` | TIME | НЕТ | Временной диапазон |
| `comment` | TEXTAREA | НЕТ | Комментарий |
| `cause_id` | DROPDOWN | НЕТ | Причина (из словаря) |

---

## 8. Edit Tracking Point

**Файл:** `controllers/edit-tracking-point.js` · `views/edit-tracking-point.html`

| Атрибут | Значение |
|---------|---------|
| Controller | `EditTrackingPointModalCtrl` |
| API | `PUT /api/v1/tracking-points/:id` |

### 3 режима

| Режим | Константа | Открывается |
|-------|---------|------------|
| Confirm | `MODE_CONFIRM = 1` | Кнопка "Confirm" на TP |
| Replan | `MODE_REPLAN = 2` | Кнопка "Replan" |
| Notify | `MODE_NOTIFY = 3` | "Update comment" |

### 7 шагов (MODE_CONFIRM)

| # | Константа | Экран | Следующий |
|---|---------|-------|---------|
| 1 | `DELAY_DIALOG` | Тип задержки | DELAY_CALENDAR |
| 2 | `DELAY_CALENDAR` | Дата и время | CONTENT_ACTION |
| 3 | `CONTENT_ACTION` | Действие с грузом | CONTENT_UPDATE |
| 4 | `CONTENT_UPDATE` | Редактирование cargo | UPDATE_MILKRUN |
| 5 | `POINT_UPDATE` | Детали TP | NOTIFY_USERS |
| 6 | `NOTIFY_USERS` | Получатели уведомлений | submit |
| 7 | `UPDATE_MILKRUN` | Milkrun: список SH с чекбоксами | CONTENT_ACTION |

**Milkrun:** при `isMilkrun=true` шаги CONTENT_UPDATE → UPDATE_MILKRUN → CONTENT_ACTION перед финальным submit.

### Request Body

```json
{
  "confirmed_at": "2026-06-15T09:00:00Z",
  "date_from": "2026-06-15",
  "time_from": "09:00:00",
  "comment": "...",
  "cause_id": 5,
  "contents": [],
  "notify_followers": [1, 2],
  "milkrun_shipment_ids": [101, 102],
  "incident_id": null
}
```

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.05_modals`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631111817 · **repo:** `tms/shipments/05_modals/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

