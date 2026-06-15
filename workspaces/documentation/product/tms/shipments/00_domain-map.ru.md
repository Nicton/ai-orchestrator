---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632324194
source_type: confluence
---
# TMS Shipments — Карта домена (RU)

> Сгенерировано: 2026-06-10  
> Оригинал: [00_domain-map.md](./00_domain-map.md)  
> Источники: router.js, index.js, все view-шаблоны, файлы backend route, constants.js, statuses.js

---

## 1. Страницы и маршруты

### 1.1 Таблица страниц

| Название страницы | URL | Angular state | Controller | Шаблон | Permission |
|------------------|-----|---------------|------------|--------|-----------|
| Список перевозок | `/shipments` | `all shipments` | `ShipmentsCtrl` | `views/index.html` | `permissionsControl.accessTracking()` |
| Детали перевозки | `/shipments/{id}` | `view shipment by id` | `ShipmentCtrl` | `views/view.html` | `permissionsControl.accessTracking()` |
| Новая перевозка (модал) | `/shipments/add` | `all shipments.add` | `NewShipmentCtrl` | `views/new.html` | наследует родителя |
| Добавить Tracking Point | `/shipments/:id/track` | `all shipments.add tracking point` | `NewTrackingPointCtrl` | `views/new-tracking-point.html` | наследует |
| Редактировать Tracking Point | `/shipments/:id/track/:tp_id` | `all shipments.edit tracking point` | `EditTrackingPointModalCtrl` | `views/edit-tracking-point.html` | наследует |
| Доска (Kanban) | `/shipments/board` | `board shipments` | `BoardListCtrl` | `views/board-list.html` | `accessAllowBoardShipments()` |
| POD Запросы | `/pod-requests` | `pod requests` | `ShipmentsCtrl` | `views/pod-requests.html` | `accessPodRequests()` |
| Авиа/морские | `/air-sea-shipments` | `air sea shipments` | `ShipmentsCtrl` | `views/air-sea-shipment.html` | `accessAirSeaShipments()` |

**Модальные оверлеи** (рендерятся в `ui-view="modal"`, без смены URL):

| Модал | Controller | Шаблон |
|-------|------------|--------|
| Отменить / Реактивировать | `ActivateReactivateModal` | `views/activate-reactivate-modal.html` |
| Отменить бронирование слота | `CancelSlotBookingCtrl` | `views/cancel-slot-booking.html` |
| ID контейнера / BL ID | `ContainerIdModal` | `views/container-id-modal.html` |
| Запрос POD | `RequestProofOfDeliveryCtrl` | `views/request-proof-of-delivery.html` |
| Обновить ворота (Dock Door) | `UpdateDockDoorCtrl` | `views/update-dock-door.html` |
| Детали посылки | `ParcelDetailsCtrl` | `views/parcel-details.html` |

---

### 1.2 Описания страниц

#### Список перевозок (`/shipments`)

Главный список трекинга. Показывает все перевозки доступные текущему пользователю. Поддерживает пагинацию, фильтрацию (режим, статус, адрес, дата, перевозчик/грузоотправитель, теги, юр. лица, отсутствующие метаданные/документы, инциденты, поиск, история, "to be booked") и сортировку по дате отправки и прибытия.

**Смарт-параметры URL** (обходят редирект из UserSettings):
- `?isNotConfirmed=true` — не подтверждённые перевозки
- `?tpIncident=true` — перевозки с инцидентами tracking point
- `?isTpDelayed=true` — задержанные перевозки
- `?withoutPod=true` — перевозки без POD

---

#### Детали перевозки (`/shipments/{id}`)

Детальный просмотр одной перевозки. Вкладки управляются через `ctrl.tab`.

**Вкладка Tracking (по умолчанию):** таймлайн tracking points, действия, чат, метаданные/вложения.

**Вкладка Transport Requests** (`?tab=transport-requests`, только Shipper): компонент `tab-transport-requests`.

---

#### Новая перевозка (`/shipments/add`)

Дочерний state с пустым шаблоном (` `). Открывает модал `NewShipmentCtrl` — упрощённая форма для прямого создания Shipment (без CSW). Поля: перевозчик, tracking code, дата, адрес From, адрес To, режим, стоимость, вес.

> **Важно:** это НЕ CSW wizard. CSW — это `s-requests/dirrectives/new-s-request/`.

---

### 1.3 Resolve-зависимости (предзагрузка данных)

| Ключ | Сервис | Назначение |
|------|--------|-----------|
| `route` | `UserSettings` | Редирект на предпочтительный sub-view |
| `permissions` | `permissionsControl` | Проверка доступа к маршруту |
| `dataLocationsUserDefault` | `Locations` | Начальные данные фильтра локации |
| `dataShippers` | `Shippers` | Данные для dropdown (byShipments: true) |
| `dataExternalAccounts` | `ConnectedAccounts` | Фильтр внешних grузоотправителей |
| `dataShipmentModes` | `ShipmentModes` | Данные для переключателя режимов |
| `dataTags` | `Tags` | Теги для фильтра (scope=tracking) |
| `dataBookers` | `ShipmentRequests` | Фильтр букеров; `[]` для Carrier |
| `dataAccountingEntities` | `AccountingEntities` | Фильтр юр. лиц |
| `dataMetadataPrototypes` | `MetadataPrototypes` | Фильтр отсутствующих метаданных |
| `dataAccountAttachmentTypes` | `AccountAttachmentTypes` | Фильтр отсутствующих документов |
| `dataDictTransitCompanies` | `DictTransitCompanies` | Фильтр транзитных компаний |
| `dataAccountIncidents` | `AccountIncidents` | Загружается только при `tpIncident` |
| `dataShipment` | `Shipments` | Детальная страница: загрузка перевозки |
| `dataTrackPoints` | `TrackingPoints` | Детальная: пропускается без доступа |
| `dataSpectators` | `ConnectedAccounts` | Детальная: подключённые наблюдатели |
| `dataCarriers` | `Carriers` | Только для страницы Board |

---

## 2. Матрица видимости по ролям

### 2.1 Роли в системе

| Роль | Выражение | Описание |
|------|----------|---------|
| Shipper | `ctrl.isShipper` / `Global.isShipper()` | Компания-грузоотправитель |
| Carrier | `ctrl.isCarrier` / `Global.isCarrier()` | Транспортная компания |
| Visibility account | `ctrl.isVisibilityAccount` | Наблюдатель только для чтения |
| Spectator | `shipment.isSpectator` | Аккаунт с доступом к конкретной перевозке |
| Self Admin | `ctrl.isSelfAdmin` | Администратор своей организации |
| Mini-app | `ctrl.isMiniApp` | Режим киоска, токен-авторизация |

### 2.2 Матрица видимости

| UI элемент | Shipper | Carrier | Visibility | Условие |
|-----------|---------|---------|-----------|---------|
| Фильтр "All Carriers" | ✅ | ❌ | — | `ng-if="ctrl.isShipper"` |
| Фильтр "All Shippers" | ❌ | ✅ | — | `ng-if="ctrl.isCarrier"` |
| Фильтр "All Bookers" | ✅ | ❌ | — | `ng-if="ctrl.isShipper"` |
| Кнопка Экспорт | ✅ | ✅ (не в истории) | — | `ng-if="ctrl.isShipper \|\| (ctrl.isCarrier && !ctrl.search.history)"` |
| Подтвердить отправку | ✅ | ✅ | ❌ | `ng-if="!shipment.rtd && !ctrl.isVisibilityAccount"` |
| Подтвердить доставку | ✅ | ✅ | ❌ | `ng-if="!shipment.rta && !ctrl.isVisibilityAccount"` |
| Вкладка Transport Requests | ✅ | ❌ | — | `ng-if="!ctrl.isCarrier"` |
| Кнопка "Открыть претензию" | ✅ | ❌ | ❌ | `ng-if="ctrl.isShipper && !ctrl.isVisibilityAccount && ctrl.hasAccessToClaims && ..."` |
| Кнопка Контакт | ❌ | ❌ | ✅ | `ng-if="ctrl.isVisibilityAccount"` |
| Компонент Водители | ❌ | ✅ | ❌ | `ng-if="ctrl.isCarrier && !ctrl.isVisibilityAccount"` |
| Субподряд виджет | ❌ | ✅ | — | `ng-if="ctrl.canSubcontract"` |
| Отменить / Реактивировать | SelfAdmin | SelfAdmin | — | `ng-if="ctrl.isSelfAdmin && ctrl.canCancelShipment"` |
| Панель чата | условно | условно | — | `ng-if="ctrl.allowManageChat"` |
| Зона загрузки вложений | условно | условно | — | `ng-if="ctrl.allowManageAttachments"` |
| Доска Kanban | условно | условно | — | `accessAllowBoardShipments()` |
| Значок наблюдателя | — | — | ✅ | `ng-if="shipment.isSpectator"` |

---

## 3. API эндпоинты

### 3.1 Shipments API

> Базовый префикс: `/api/v1`

| Метод | Путь | Назначение |
|-------|------|-----------|
| GET | `/shipments` | Список перевозок с фильтрами |
| POST | `/shipments` | Создать перевозку напрямую (только Shipper) |
| GET | `/shipments/:id` | Загрузить одну перевозку |
| PUT | `/shipments/:id` | Обновить (отмена, реактивация и др.) |
| PATCH | `/shipments` | Массовое обновление |
| PATCH | `/shipments/:id/driver` | Назначить водителя |
| GET | `/shipments/:id/spectators` | Список наблюдателей |
| POST | `/shipments/:id/request-pod` | Запрос POD от перевозчика |
| GET | `/shipments-excel` | Экспорт в Excel |
| POST | `/shipments-cmr/:id` | Генерация CMR-документа |
| PATCH | `/shipments/:id/contents` | Обновить содержимое груза |
| PATCH | `/shipments/:id/name` | Переименовать перевозку |
| GET | `/shipments/:id/driver-transport` | Загрузить данные водителя |
| PATCH | `/shipments/:id/driver-transport` | Обновить данные водителя |
| POST | `/shipments/:id/integrations/:name` | Запустить интеграцию (WMS и др.) |

### 3.2 Shipment Requests API

| Метод | Путь | Назначение |
|-------|------|-----------|
| GET | `/shipment-requests` | Список заявок (только Shipper) |
| POST | `/shipment-requests` | **Создать заявку через CSW** |
| GET | `/shipment-requests/:id` | Загрузить заявку |
| PATCH | `/shipment-requests/:id` | Обновить заявку |
| DELETE | `/shipment-requests/:id` | Удалить заявку |
| PATCH | `/shipment-requests/multiple` | Массовое обновление |
| PATCH | `/shipment-requests/:id/dates` | Обновить даты |
| POST | `/shipment-requests/:id/split` | Разделить заявку |
| GET | `/shipment-requests/:id/repeat` | Данные для повтора |
| POST | `/shipment-requests/:id/emails` | Поделиться трекингом по email |

---

## 4. Система статусов

### 4.1 Статусы перевозок (Shipment)

| Статус | Группа | Описание |
|--------|--------|---------|
| `planned` | Планируется | Создана, не отправлена |
| `expected_pick_up` | Планируется | Ожидается забор |
| `slot_confirmed` | Планируется | Слот подтверждён |
| `in_transit_estimate` | В пути | В пути (оценочно) |
| `in_transit` | В пути | Отправка подтверждена |
| `expected_delivery` | В пути | Ожидается доставка |
| `delivered_estimate` | Доставлено | Доставлено (оценочно); **скрыт от Carrier** |
| `delivered` | Доставлено | Доставка подтверждена |
| `canceled` | Отменено | Перевозка отменена |

### 4.2 Статусы POD

| Статус | CSS класс | Описание |
|--------|----------|---------|
| `pending` | `gray` | Не запрошен; **скрыт от Shipper в фильтре** |
| `expected` | `blue-light` | Запрошен у перевозчика |
| `loaded` | `green-light` | Загружен перевозчиком |
| `approved` | `green` | Одобрен Shipper |
| `declined` | `red` | Отклонён Shipper |

---

## 5. Карта навигации

```
/shipments
  │
  ├── Клик строки → /shipments/{id}
  │       ├── Вкладка Tracking (по умолчанию)
  │       │     ├── "Добавить TP" → /shipments/{id}/track
  │       │     ├── Replan/Confirm/Update TP → edit-tracking-point модал
  │       │     ├── "Открыть претензию" → создание Claim
  │       │     ├── "Запросить POD" → request-proof-of-delivery модал
  │       │     ├── "Отменить" / "Реактивировать" → activate-reactivate модал
  │       │     └── "Поделиться трекингом" → pre-shipment-followers попап
  │       └── Вкладка Transport Requests (только Shipper)
  │
  ├── Кнопка "Добавить" → /shipments/add (упрощённый модал)
  └── Переключатель вида → /shipments / /shipments/board / /air-sea-shipments

/shipments/board  (требует accessAllowBoardShipments())
/pod-requests     (клик строки → модал просмотра вложений, НЕ навигация)
/air-sea-shipments (Container ID модал inline на той же странице)
```

---

## 6. Ключевые особенности и граничные случаи

### 6.1 Три страницы — один Controller
`ShipmentsCtrl` обслуживает три маршрута: список трекинга, POD-запросы и авиа/морские. Параметр `scope` (`SCOPE_TRACKING`, `SCOPE_POD_REQUESTS`, `SCOPE_AIR_SEA_SHIPMENTS`) определяет поведение.

### 6.2 Страница Board — другая архитектура
`board-list.html` рендерит компонент `slotify-shipments-board-list`. Отдельный controller, отдельный filter-сервис, другие resolve-зависимости.

### 6.3 POD Requests — клик НЕ переходит на детальную страницу
На `pod-requests.html` клик по строке открывает `openModalViewAttachments()` — встроенный просмотрщик вложений. Только иконка документа (`-is-documents`) навигирует к `/shipments/{id}`.

### 6.4 `delivered_estimate` невидим для Carrier
Пустой `carrierGroup` отфильтровывает этот статус из `getCarrierStatuses()`.

### 6.5 `pending` POD невидим Shipper в фильтре
`getPodStatuses()` исключает `POD_STATUS_PENDING` для Shipper.

### 6.6 Milkrun tracking points — отдельный flow
`edit-tracking-point.html` показывает шаг `UPDATE_MILKRUN` с таблицей связанных перевозок и чекбоксами при `ctrl.isMilkrun`.

### 6.7 Smart-list обходит UserSettings
При наличии `isNotConfirmed`, `tpIncident`, `isTpDelayed` или `withoutPod` в `$stateParams` — вызов `UserSettings.resolveRoute` пропускается.

### 6.8 Transport Requests вкладка загружает данные условно
`includeTransportRequests: true` добавляется только когда `tab === 'transport-requests'` И пользователь — Shipper.

### 6.9 Детальная страница — режим киоска
При `ctrl.isMiniApp` показывается брендированная шапка с логотипом и кнопкой входа. Весь остальной функционал доступен.

### 6.10 ACL константы в middleware

| Константа | Контролирует |
|-----------|-------------|
| `CAN_CANCEL_SHIPMENT_KEY` | PUT /shipments (отмена/реактивация) |
| `CAN_EDIT_BOOKING_KEY` | Обновление содержимого, переименование |
| `CAN_SHARE_SHIPMENT_TRACKING_KEY` | Управление наблюдателями и email-sharing |
| `SPECTATOR_CAN_MANAGE_TRUCK_DRIVER_INFO_KEY` | CRUD данных водителя |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.00_domain-map-ru`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632324194 · **repo:** `tms/shipments/00_domain-map.ru.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

