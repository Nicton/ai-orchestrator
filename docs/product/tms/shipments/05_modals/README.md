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

**Файл:** `activate-reactitate-modal.js` (опечатка в имени файла), `activate-reactivate-modal.html`

### Условие открытия

Открывается программно. Режим (отмена или реактивация) определяется по полю `shipment.canceler_id`:

| Значение `canceler_id` | Режим | Заголовок |
|---|---|---|
| Задано (не null) | Реактивация | "Re-active canceled Shipment" |
| Не задано (null) | Отмена | "Cancel Shipment" |

Флаг `ctrl.isReactivate = !!shipment.canceler_id` управляет всей логикой переключения.

### Структура (2-шаговый wizard)

| Шаг | Константа | Содержимое |
|---|---|---|
| 1 | `MANAGE_COMMENT` (1) | Ввод причины и комментария |
| 2 | `MODIFY_FOLLOWERS` (2) | Выбор подписчиков для уведомления |

### Поля формы

**Шаг 1 — причина и комментарий:**

| Поле | Тип | ng-model | Условие отображения | Обязательность |
|---|---|---|---|---|
| Reason (текст + typeahead) | text input | `ctrl.reason` | `predefinedReasonValues` пустой **или** `reasonData.is_custom_value === true`, и не реактивация | Зависит от `rightsManagementByScope.reason_required` |
| Reason (выпадающий список) | dropdown | `ctrl.predefinedReasonValues` | Есть предзаданные значения, `!reasonData.is_custom_value`, не реактивация | Зависит от `rightsManagementByScope.reason_required` |
| Comment | textarea | `ctrl.cancelComment` | Всегда | Зависит от `rightsManagementByScope.comments_required` |

Placeholder поля Comment переключается: "Please detail the reason for re-active" (реактивация) / "Please detail the reason for cancellation" (отмена).

**Шаг 2 — подписчики:**

Компонент `metadata-followers-component` с параметрами: `address-from`, `address-dest`, `partner`, `company`, список выбранных и потенциальных подписчиков.

### Валидация (`ctrl.valid()`)

- Реактивация: всегда валидна (валидация не выполняется).
- Отмена: если `reason_required` — требуется reason; если `comments_required` — требуется comment.
- Кнопка "Next" заблокирована, пока форма невалидна.

### API-вызовы

| Условие | Метод | Эндпоинт / параметры |
|---|---|---|
| `shipmentRequest.is_inttra_shipping === true` | `PUT` | `SeaSchedule.update({ id, status: SR_STATUS_CANCELED, comment })` |
| Обычный shipment — отмена | `PUT` | `Shipments.update({ id, followers, event: 'sh-status-canceled', canceler_id: user.id, comment, reason })` |
| Обычный shipment — реактивация | `PUT` | `Shipments.update({ id, followers, event: 'sh-status-reactivated', canceler_id: null, comment, reason })` |

### Результат

| Результат | Действие |
|---|---|
| Успех | `$uibModalInstance.dismiss(true)` |

### Ограничения по ролям

- `isShipper` из `Global.isShipper()` — переключает отображение `company` и `partner` в компоненте подписчиков.
- `rightsManagementByScope` (инжектируется как `dataRightsManagementByScope`) — управляет обязательностью полей reason и comment.

---

## 2. Cancel Slot Booking

**Файл:** `cancel-slot-booking.js`

### Условие открытия

Открывается из внешнего контекста. Принимает resolve-параметры:

| Параметр | Тип | Описание |
|---|---|---|
| `dataShipmentId` | number | ID отправления |
| `dataShipmentMode` | string | Режим отправления (SEA / ROAD / AIR и т.д.) |
| `dataUtilityMetadata` | array | Массив метаданных; из него извлекается email заявителя (тип `'requester'`) |
| `dataUserEmail` | string | Fallback-email текущего пользователя |

### Поля формы

| Поле | Модель | Редактируется | Описание |
|---|---|---|---|
| Requester email | `this.requesterEmail` | Нет (отображается) | Берётся из `dataUtilityMetadata` (type === 'requester'), fallback — `dataUserEmail` |
| Comment | `this.comment` | Да | Свободный текст, инициализируется пустой строкой `''` |

### API-вызов

`PUT /shipments/:id`

```
Shipments.update({
  id: dataShipmentId,
  event: 'sh-status-canceled',
  canceler_id: user.id,
  comment
}).$promise
```

### Результат

| Результат | Действие |
|---|---|
| Успех | `$uibModalInstance.close(true)` |
| Ошибка | `notifier.logError('Cancel slot booking failed')` |
| Закрытие вручную | `$uibModalInstance.close(false)` |

### Ограничения по ролям

`user.id` для поля `canceler_id` получается через `Global.user()`. Явных проверок роли в файле нет.

---

## 3. Container ID / BL ID

**Файл:** `container-id-modal.js`

### Условие открытия

Открывается программно. Принимает `dataShipment` (объект отправления).

### Поля формы

| Поле | Модель | Источник начального значения | Условие отображения |
|---|---|---|---|
| Container ID | `this.containerId` | `dataShipment.external_container_id` | Всегда |
| BL ID / AWB ID | `this.blID` | `dataShipment.bl_id` | Только если `this.isShowBlId === true` (режим AIR или SEA) |

Логика `isShowBlId`:

| Режим отправления | `isShowBlId` | Placeholder |
|---|---|---|
| `MODE_ID_AIR` | true | "AWB ID" |
| `MODE_ID_SEA` | true | "BL ID" |
| Остальные | false | — |

### API-вызов

`PATCH /shipments/:id`

```
Shipments.update({
  id,
  external_container_id: containerId,
  bl_id: blID
}).$promise
```

### Результат

| Результат | Действие |
|---|---|
| Успех | `$uibModalInstance.close()` + `routerReload()` (перезагрузка state) |
| Ошибка | `console.error('Error saving container ID:', error)` |
| Закрытие вручную | `$uibModalInstance.close()` |

### Ограничения по ролям

Явных проверок ролей в файле нет.

---

## 4. Request Proof of Delivery

**Файл:** `request-proof-of-delivery.js`, `request-proof-of-delivery.html`

### Условие открытия

Открывается программно. Принимает `dataShipment`.

### Панели (двухэкранный режим)

| Панель | Условие | Содержимое |
|---|---|---|
| Панель 1 — форма | `!ctrl.confirmed` | Поле Comment, кнопки Submit / Cancel |
| Панель 2 — подтверждение | `ctrl.confirmed` | Имя и ID отправления, иконка-галочка, сообщение "The proof of delivery has been requested" |

После успешной отправки модальное окно остаётся открытым, переходя на панель 2.

### Поля формы

| Поле | Тип | Модель | Валидация |
|---|---|---|---|
| Comment | textarea (elastic, 5 строк) | `this.comment` | Не обязательно; явной валидации нет |

### API-вызов

`POST /shipments/:id/request-pod`

```
Shipments.requestProofOfDelivery({
  shipment_id,
  comment
}).$promise
```

### Результат

| Результат | Действие |
|---|---|
| Успех | `this.confirmed = true` (переход на панель 2, окно не закрывается) |
| Ошибка | `notifier.logError('Request proof of delivery failed')` |
| Закрытие (кнопка Cancel или X) | `$uibModalInstance.close(false)` |

### Ограничения по ролям

Явных проверок ролей в файле нет.

---

## 5. Update Dock Door

**Файл:** `update-dock-door.js`

### Условие открытия

Открывается программно. Принимает resolve-параметры:

| Параметр | Описание |
|---|---|
| `dataTrackingPoint` | Объект tracking point (содержит `id`, `shipment_id`, `isMilkrun`) |
| `dataDockDoorId` | Текущий ID дока-двери (для предвыбора) |
| `dataDockDoors` | Массив доступных доков-дверей |
| `setup` | Конфиг-объект; ключ `noSend` отключает API-вызов |

### Поля формы

| Поле | Модель | Описание |
|---|---|---|
| Dock Door | `this.selectedDockDoorId` | Список доков-дверей, отсортированных по имени alphanumerically. Нажатие на уже выбранный — снимает выбор (null) |

### API-вызов

`PATCH /tracking-points/:id`

```
TrackingPoints.update({
  id,
  shipment_id,
  dock_door_id,
  [isMilkrun: true]  // только если dataTrackingPoint.isMilkrun
}).$promise
```

Если `setup.noSend === true`: модальное окно закрывается немедленно, передавая `data` без API-вызова (используется в milkrun/родительских оркестрационных потоках).

### Результат

| Результат | Действие |
|---|---|
| Успех (с API) | `$uibModalInstance.close(data)` |
| noSend режим | `$uibModalInstance.close(data)` без API-вызова |
| Ошибка | `notifier.logError('Dock door update failed')` |
| Закрытие вручную | `$uibModalInstance.close(false)` |

### Ограничения по ролям

Явных проверок ролей нет. Флаг `setup.noSend` позволяет вызывающей стороне обойти API-вызов.

---

## 6. Parcel Details

**Файл:** `parcel-details.js`

### Условие открытия

Открывается программно. Принимает:

| Параметр | Описание |
|---|---|
| `dataShipment` | Объект отправления, содержащий массив `parcels` |
| `dataParcelTemperatures` | Данные о температурных режимах посылок |

### Поведение (режим просмотра, без формы сохранения)

При инициализации:
1. Список посылок строится из `dataShipment.parcels`; каждая посылка обогащается полями `visible = true` и температурой (вычисляется через `calcTemperatureInfo()` с использованием `dataParcelTemperatures`).
2. Автоматически выбирается первая посылка: `this.selectParcel(this.parcels[0])`.

### Поля / взаимодействия

| Элемент | Модель | Описание |
|---|---|---|
| Поиск | `this.search` | Фильтрует список посылок по `internal_ref` через debounced-regex в `applyFilter()` |
| Список посылок | — | При клике вызывает `selectParcel(parcel)`, помечает посылку как `selected` |

### API-вызов при выборе посылки

`GET /shipments/:id/parcels/:parcel_id/tracking`

```
Shipments.loadShipmentParcelTracking({
  parcel_id,
  shipment_id
}).$promise
```

После получения ответа:
- Вычисляется `lastConfirmedTrackPointPosition` — максимальный `position` среди tracking points с заполненным `real_date`.
- Данные форматируются и сортируются через `TrackingFormatter`.

### Результат

| Результат | Действие |
|---|---|
| Закрытие | `$uibModalInstance.close(false)` |

### Ограничения по ролям

Явных проверок ролей в файле нет.

---

## 7. Add Tracking Point

**Файл:** `add-tracking-point.js` (экспортирует `NewTrackingPointCtrl` + `NewTrackingPointModalCtrl`)

### Условие открытия

`NewTrackingPointCtrl` открывает модальное окно с параметрами:
- `size: 'width-400'`
- `backdrop: 'static'`, `keyboard: false`
- Resolve: `shipment_id` из `$stateParams`, `dataTrackingPoints` из `TrackingPoints.query({ shipment_id })`

### Поля формы

**Основные поля:**

| Поле | Тип | Модель | Описание | Обязательность |
|---|---|---|---|---|
| Tracking point type | dropdown с поиском | `ctrl.points` | Список кодов точек, исключая уже используемые не-external точки. Лейбл: `"КОД — переведённое имя"` | Да — `errors.point` если не выбрано |
| Location | typeahead text input | `ctrl.viewLocationValue` | Показывается если адрес не выбран. Поиск: `Locations.search({ q, google: true })`, минимум 3 символа. При выборе — открывает sub-modal `LocationModals` для детализации адреса. После выбора — отображает форматированный адрес с кнопкой удаления (X) | Да — `errors.location` если не выбрано |
| Date / Time | datetimerangepicker | `ctrl.location.dateFrom` | Диапазон: от planned departure date (или текущего момента) до +1 год. Timezone из `Global.user().time_zone` | Да — `errors.locationDate` если не задано |
| Comment | textarea | `ctrl.point.comment` | Свободный текст | Нет |

**Секция Details (раскрываемая, `toggleDetails()`):**

Ленивая загрузка при первом раскрытии:

| Загружаемые данные | Сервис |
|---|---|
| Типы содержимого | `ShipmentContentTypes.query()` |
| Специфики аккаунта | `AccountSpecificities.query()` |
| Специфики отправления | `ShipmentSpecificities.query()` (фильтр по active для аккаунта) |
| Типы продуктов | `AccountProductTypes.query()` |
| Бухгалтерские сущности | `AccountingEntities.query()` |
| Причины | `AccountCauses.query()` + `Causes.query()` (перекрёстная фильтрация) |

Поля в секции Details:

| Поле | Обязательность |
|---|---|
| Cause (выпадающий список) | Да — `errors.cause` если не выбрано |
| Contents (тип, специфика, тип продукта, freight unit, accounting entity на единицу содержимого) | Нет |

### Валидация (`ctrl.validate()`)

Проверяет: выбрана точка, задана локация, задана дата. Если `showDetails === true` — также проверяется наличие cause. При ошибках формируется объект `errors`.

### API-вызов

`POST /tracking-points`

```
(new TrackingPoints(data)).$save()
```

Состав payload:

| Поле | Условие включения |
|---|---|
| `shipment_id`, `code`, `type`, `comment`, `planned_date`, `address_id` | Всегда |
| `contents` (массив: `type_id`, `spec_id`, `product_type_id`, `freight_unit_id`, `freight_unit_customer_key`) | Только если `showDetails` |
| `is_total_volume`, `is_total_weight`, `total_volume`, `total_weight`, `total_linear_meters` | Только если `showDetails` |
| `cause` | Только если `showDetails` |

### Результат

| Результат | Действие |
|---|---|
| Успех | `$uibModalInstance.close()` + `$rootScope.$emit('tracking-point-created')` + `routerGo('all shipments', null, { reload: true })` |
| Ошибка | `console.error(...)` + `$uibModalInstance.dismiss(err)` |

### Ограничения по ролям

Явных проверок ролей нет. Коды уже используемых не-external tracking points исключаются из списка выбора, чтобы предотвратить дублирование типов.

---

## 8. Edit Tracking Point

**Файл:** `edit-tracking-point.js`

### Условие открытия

Открывается программно при нажатии на существующую tracking point. Получает объект tracking point и контекст отправления.

### Режимы модального окна

Модальное окно поддерживает 3 режима работы:

| Режим | Константа | Описание |
|---|---|---|
| Подтверждение | `CONFIRM` | Подтверждение прохождения точки (указание реальной даты) |
| Перепланирование | `REPLAN` | Изменение запланированной даты точки |
| Уведомление | `NOTIFY` | Уведомление подписчиков без изменения данных |

### Шаги wizard (7 шагов)

| Шаг | Константа | Описание |
|---|---|---|
| 1 | `DELAY_DIALOG` | Диалог задержки — отображается если текущая дата позже запланированной; пользователь выбирает, подтвердить задержку или нет |
| 2 | `CALENDAR` | Выбор даты/времени — ввод реальной или новой запланированной даты |
| 3 | `CONTENT_ACTION` | Выбор действия с содержимым — что делать с грузом (принять полностью, частично, отклонить) |
| 4 | `CONTENT_UPDATE` | Обновление данных о содержимом — ввод фактических данных по единицам груза |
| 5 | `POINT_UPDATE` | Обновление данных точки — дополнительные поля (температура, повреждения, dock door) |
| 6 | `NOTIFY_USERS` | Выбор подписчиков для уведомления |
| 7 | `UPDATE_MILKRUN` | Обновление milkrun — применяется только для точек типа milkrun |

### Milkrun-поток

Если tracking point является частью milkrun-маршрута, при обновлении дополнительно:
1. Открывается sub-modal `Update Dock Door` с флагом `setup.noSend = true` для сбора данных без API-вызова.
2. Данные dock door агрегируются вместе с данными основного запроса.
3. Все изменения отправляются единым запросом с включением поля `isMilkrun: true`.

### Поля формы (зависят от шага и режима)

**Шаг CALENDAR:**

| Поле | Режим | Описание |
|---|---|---|
| Real date / time | CONFIRM | Фактическая дата прохождения точки |
| New planned date / time | REPLAN | Новая запланированная дата |

**Шаг CONTENT_ACTION:**

| Поле | Описание |
|---|---|
| Action selector | Выбор действия: "Принять всё", "Принять частично", "Отклонить" |

**Шаг CONTENT_UPDATE:**

| Поле | Описание |
|---|---|
| Фактические данные груза | Количество, вес, объём, погонные метры по единицам содержимого |

**Шаг POINT_UPDATE:**

| Поле | Описание |
|---|---|
| Температурные данные | Фактическая температура (если применимо) |
| Повреждения | Отметка о повреждениях и комментарий |
| Dock door | Выбор дока-двери (открывает sub-modal Update Dock Door) |

**Шаг NOTIFY_USERS:**

| Поле | Описание |
|---|---|
| Подписчики | Компонент `metadata-followers-component` с выбором получателей уведомления |

### API-вызов

`PUT /tracking-points/:id`

```
TrackingPoints.update({
  id,
  shipment_id,
  real_date,          // режим CONFIRM
  planned_date,       // режим REPLAN
  followers,          // шаг NOTIFY_USERS
  dock_door_id,       // шаг POINT_UPDATE
  content_action,     // шаг CONTENT_ACTION
  contents,           // шаг CONTENT_UPDATE
  comment,
  [isMilkrun: true]   // milkrun-поток
}).$promise
```

### Результат

| Результат | Действие |
|---|---|
| Успех | `$uibModalInstance.close(updatedTrackingPoint)` |
| Ошибка | `notifier.logError(...)` |
| Закрытие вручную | `$uibModalInstance.dismiss()` |

### Ограничения по ролям

Видимость отдельных шагов и доступность действий зависит от прав пользователя (permissions), передаваемых через контекст отправления. Шаг `UPDATE_MILKRUN` отображается только для milkrun-точек.

---

## Сводная таблица

| # | Модальное окно | Файл | API-метод | Эндпоинт |
|---|---|---|---|---|
| 1 | Cancel / Re-activate | `activate-reactitate-modal.js` | PUT | `/shipments/:id` |
| 2 | Cancel Slot Booking | `cancel-slot-booking.js` | PUT | `/shipments/:id` |
| 3 | Container ID / BL ID | `container-id-modal.js` | PATCH | `/shipments/:id` |
| 4 | Request Proof of Delivery | `request-proof-of-delivery.js` | POST | `/shipments/:id/request-pod` |
| 5 | Update Dock Door | `update-dock-door.js` | PATCH | `/tracking-points/:id` |
| 6 | Parcel Details | `parcel-details.js` | GET | `/shipments/:id/parcels/:parcel_id/tracking` |
| 7 | Add Tracking Point | `add-tracking-point.js` | POST | `/tracking-points` |
| 8 | Edit Tracking Point | `edit-tracking-point.js` | PUT | `/tracking-points/:id` |
