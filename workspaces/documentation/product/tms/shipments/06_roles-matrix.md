---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631963747
source_type: confluence
---
# Матрица ролей и прав доступа — Shipments

> Источники: `frontend/app/common/permissions/` · `backend/app/middlewares/acl.js`

---

## 1. Роли в системе

| Роль | Определение (Frontend) | Backend middleware |
|------|----------------------|-------------------|
| **Shipper** | `Global.isShipper()` | `requireShipper` |
| **Carrier** | `Global.isCarrier()` | `requireCarrier` |
| **Visibility Account** | `!Global.accessTmsSpectatorProducts && !Global.accessDockLightProducts` | — |
| **Spectator** | `shipment.isSpectator` (конкретная перевозка) | `loadAllowedShipment` |
| **Self Admin** | `Global.isSelfAdmin()` | `requireSelfAdmin` |
| **Super User** | `Global.isSuperUser()` | `requireSuperUser` |
| **Booker** | `shipment.booker.account_id === user.account_id` | ACL key check |
| **Mini-App** | `StorageProvider.getMiniApp()` | `requireMiniApp` |

---

## 2. ACL Permission Keys

| ACL Key | Что контролирует | Default для Booker |
|---------|-----------------|-------------------|
| `CAN_CANCEL_SHIPMENT_KEY` | Отмена/реактивация Shipment | ❌ НЕТ |
| `CAN_EDIT_BOOKING_KEY` | Редактирование содержимого, переименование | ❌ НЕТ |
| `CAN_SHARE_SHIPMENT_TRACKING_KEY` | Управление Spectators, email sharing | ❌ НЕТ |
| `SPECTATOR_CAN_MANAGE_TRUCK_DRIVER_INFO_KEY` | CRUD данных водителя | ❌ НЕТ |

---

## 3. Полная матрица доступа

### 3.1 Навигация и просмотр

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Список /shipments | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Детальная страница | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Board /shipments/board | условно | условно | ❌ | ❌ | условно | ✅ |
| Air/Sea /air-sea-shipments | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| POD Requests /pod-requests | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.2 Создание и редактирование

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| CSW Wizard (создать SR) | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Редактировать booking | ✅ | ❌ | ❌ | ❌ | `CAN_EDIT_BOOKING_KEY` | ✅ |
| Auto-confirm | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Confirm (Carrier side) | ❌ | ✅ | ❌ | ❌ | ❌ | — |
| Decline (Carrier side) | ❌ | ✅ | ❌ | ❌ | ❌ | — |
| Request Quotes | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

### 3.3 Отмена и реактивация

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Отменить Shipment | SelfAdmin only | SelfAdmin only | ❌ | ❌ | `CAN_CANCEL_SHIPMENT_KEY` | ✅ |
| Реактивировать | SelfAdmin only | SelfAdmin only | ❌ | ❌ | `CAN_CANCEL_SHIPMENT_KEY` | ✅ |
| Отменить слот | SelfAdmin only | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.4 Tracking Points

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Видеть TP | ✅ | ✅ | ✅ | `accessSeeTrackingPoints` | ✅ | ✅ |
| Добавить TP | `allowManageTP` | `allowManageTP` | ❌ | ❌ | ✅ | ✅ |
| Confirm TP | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Replan TP | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Confirm departure (list) | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Confirm arrival (list) | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

### 3.5 Коммуникации и документы

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Чат (читать/писать) | `allowManageChat` | `allowManageChat` | ❌ (locked) | ❌ | ✅ | ✅ |
| Загрузить вложение | `allowManageAttachments` | `allowManageAttachments` | ❌ | `accessSeeAttachments` | ✅ | ✅ |
| Поделиться трекингом | `CAN_SHARE_TRACKING_KEY` | ❌ | ❌ | ❌ | ❌ | ✅ |
| Запросить POD | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Метаданные popup | `accessManageMetadata` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Экспорт Excel | ✅ | только активные | — | — | ✅ | ✅ |

### 3.6 Финансы и Claims

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Invoicing вкладка | `allowManageInvoicing` | `allowManageInvoicing` | ❌ | ❌ | ❌ | ✅ |
| Открыть Claim | ✅ + `accessClaims` | ❌ | ❌ | ❌ | ❌ | ✅ |
| Видеть Claim | ✅ | ❌ | ❌ | ❌ | ❌ `(isBooker)` | ✅ |

### 3.7 Водитель и субподряд

| Функция | Shipper | Carrier | Visibility | Spectator | Booker | Self Admin |
|---------|---------|---------|-----------|-----------|--------|-----------|
| Назначить водителя | ❌ | ✅ | ❌ | ❌ | ❌ | — |
| Видеть данные водителя | ❌ | ✅ | ❌ | `SPECTATOR_TRUCK_DRIVER_KEY` | ❌ | ✅ |
| Субподряд виджет | ❌ | `canSubcontract` (ROAD only) | ❌ | ❌ | ❌ | — |

---

## 4. permissionsControl методы

| Метод | Что проверяет |
|-------|-------------|
| `accessTracking()` | Доступ к списку трекинга |
| `accessManageTrackingPoints(booker, spectator)` | Добавление/изменение TP |
| `accessManageChat(booker, spectator)` | Чат |
| `accessManageAttachments(booker, spectator)` | Вложения |
| `accessManageInvoicing(booker)` | Вкладка Invoicing |
| `accessCancelShipment(data)` | Отмена/реактивация |
| `accessManageShareShipmentTracking(booker)` | Share tracking |
| `accessManageTruckDriver(spectator)` | Данные водителя |
| `accessManagePODRequest(booker)` | Запрос POD |
| `accessManageMetadataRequests(booker, spectator)` | Метаданные |
| `accessSeeAttachments(spectator)` | Только просмотр вложений |
| `accessSeeTrackingPoints(spectator)` | Только просмотр TP |
| `accessClaims()` | Доступ к Claims |
| `accessAllowBoardShipments()` | Board view |

---

## 5. Граничные случаи

| Случай | Поведение |
|--------|---------|
| `isSharedSpectator + isShipper` | `showShareShipmentTracking = false`; текст "shared by" |
| Booker + canViewClaim | `canViewClaim = !isBooker && canViewClaim` (Booker не видит Claims) |
| Visibility Account | Чат и вложения — locked placeholder |
| Carrier + ROAD mode | `canSubcontract` доступен (если `Global.canSubcontract()`) |
| Mini-App | Показывается branded header с login кнопкой |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.06_roles-matrix`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631963747 · **repo:** `tms/shipments/06_roles-matrix.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

