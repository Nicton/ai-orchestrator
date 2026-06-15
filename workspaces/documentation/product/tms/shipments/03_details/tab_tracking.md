---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553554
source_type: confluence
---
# Вкладка Tracking — Детальная документация

> Источники: `shipments/controllers/view.js` · `shipments/views/view.html`  
> Вкладка: `TAB_NAME_TRACKING = 'tracking'` (дефолтная)

---

## Что показывается

Основная вкладка. Содержит всю операционную информацию по перевозке:
1. Кнопки действий (header actions)
2. Карточка перевозки (Shipment Card)
3. Tracking Points (таймлайн)
4. Субподряд виджет (Carrier only)
5. Чат панель
6. Вложения / Документы

---

## 1. Кнопки действий (Action Buttons)

| Кнопка | Условие | Действие |
|--------|---------|---------|
| **Поделиться трекингом** | `ctrl.showShareShipmentTracking` | Открывает popup добавления Spectator по email |
| **Запросить POD** | `ctrl.showRequestPODButton` | Открывает `request-proof-of-delivery` модал |
| **Детали посылки** | `ctrl.showParcelButtons` (Road/Express/Groupage + `parcels.length > 0`) | Открывает `parcel-details` модал |
| **Контакт** | `ctrl.isVisibilityAccount` | Открывает `modal-contact` (только для Visibility Account) |
| **Водитель** | `ctrl.allowManageTruckDriver` | Открывает `TruckDriverInfoModal` |
| **WMS** | `ctrl.showWMSButton` (интеграция Reflex активна) | POST `/shipments/:id/integrations/reflex` |
| **Открыть претензию** | `ctrl.isShipper && !isSharedSpectator && ctrl.hasAccessToClaims && (!claims.length \|\| claim.status === 'canceled')` | Создаёт Claim |
| **Посмотреть претензию** | `ctrl.canViewClaim` | Переход в Claims |
| **Отменить** / **Реактивировать** | `ctrl.isSelfAdmin && ctrl.canCancelShipment` | Открывает `activate-reactivate-modal` |
| **Отменить слот** | `ctrl.isSelfAdmin && ctrl.canCancelShipment && ctrl.showCancelSlotButton` | Открывает `cancel-slot-booking` модал |

**Marine Traffic ссылка:**
```javascript
this.isShowMarineTrafficLink = this.marineTrafficExternalLink.link && this.externalContainerId;
```
Показывается для Sea/Air перевозок с активной интеграцией Marine Traffic и заполненным `external_container_id`.

**WMS кнопка:**
```javascript
this.showWMSButton = this.activeIntegrations.some(item => item.name === INTEGRATION_TYPE_REFLEX);
```

---

## 2. Карточка перевозки (Shipment Card)

Отображается внутри вкладки. Содержит:

| Блок | Поля | Источник |
|------|------|---------|
| **Маршрут** | `address_from_lines`, `address_dest_lines` | `shAddress.address_lines4()` |
| **Даты** | `date_departure`, `date_arrival` | `preShipment` → `shipment` |
| **Груз** | `contents[]`, `cargoTotalInfo` | `ShipmentContents.buildTotalInfo()` |
| **Режим** | `shipment.human_modes` | `shipment.shipment_mode.name` |
| **Направление** | `from_to_summary` | city→city или country→country |
| **Tracking code** | `shipment.tracking_code` | — |
| **Температура** | `shipment.temperatureInfo` | `calcTemperatureInfo()` |
| **Длительность** | вычислена | `calcShipmentDuration()` |

**Followers блок:**
```javascript
ctrl.connectedPartnersNames = preShipmentFollowers.concat(connectedPartners).join(', ');
ctrl.connectedPartnersBlockText = 'This shipment tracking is shared with :partnersNames';
```
Текст: "This shipment tracking is shared with [имена]" — показывается Shipper/Carrier.  
Для Spectator: "This shipment tracking is shared by [имя shipper]".

---

## 3. Tracking Points (Таймлайн)

### Данные

| Источник | Поле | Описание |
|---------|------|---------|
| `dataTrackPoints` | resolve | Загружается ДО рендера страницы |
| `ctrl.showTrackingPoints` | `accessSeeTrackingPoints(spectator)` | Видимость для Spectator |
| `ctrl.allowManageTrackingPoints` | `accessManageTrackingPoints(booker, spectator)` | Кнопки действий на TP |

### Типы Tracking Points

| Тип | Константа | Описание |
|-----|---------|---------|
| Departure | `TP_TYPE_DEPARTURE` | Отправка груза |
| Arrival | `TP_TYPE_ARRIVAL` | Прибытие груза |
| Intermediate | — | Промежуточная точка |
| Site status | — | Статус в доке/складе |

### Действия на Tracking Point

| Кнопка | Условие | Открывает |
|--------|---------|---------|
| **Confirm** | TP ещё не подтверждён | `EditTrackingPointModalCtrl` (MODE_CONFIRM) |
| **Replan** | TP создан, не завершён | `EditTrackingPointModalCtrl` (MODE_REPLAN) |
| **Update comment** | Любой TP | `EditTrackingPointModalCtrl` (MODE_NOTIFY) |
| **+ Add** | `ctrl.allowManageTrackingPoints` | Переход `/shipments/:id/track` |

---

## 4. Modal: Edit Tracking Point (7 шагов)

> Источник: `shipments/controllers/edit-tracking-point.js`

### Режимы модала

| Режим | Константа | Описание |
|-------|---------|---------|
| Подтвердить | `MODE_CONFIRM = 1` | Confirm departure/arrival |
| Перепланировать | `MODE_REPLAN = 2` | Replan date/time |
| Уведомить | `MODE_NOTIFY = 3` | Update comment + notify |

### Шаги (Steps) в MODE_CONFIRM

| Шаг | Константа | Что показывается | Следующий шаг |
|-----|---------|-----------------|--------------|
| 1 | `DELAY_DIALOG = 1` | Выбор типа задержки (On time / Late / Very late) | DELAY_CALENDAR |
| 2 | `DELAY_CALENDAR = 2` | Выбор новой даты/времени | CONTENT_ACTION или POINT_UPDATE |
| 3 | `CONTENT_ACTION = 3` | Выбор действия с грузом (update / keep) | CONTENT_UPDATE или POINT_UPDATE |
| 4 | `CONTENT_UPDATE = 4` | Редактирование грузовых данных | UPDATE_MILKRUN или POINT_UPDATE |
| 5 | `POINT_UPDATE = 5` | Детали tracking point (location, comment) | NOTIFY_USERS |
| 6 | `NOTIFY_USERS = 6` | Выбор получателей уведомлений | — (submit) |
| 7 | `UPDATE_MILKRUN = 7` | Milkrun: выбор siblings перевозок | CONTENT_ACTION |

**Особенность Milkrun:**
```javascript
// При isMilkrun = true — шаг переходит через UPDATE_MILKRUN
[CONTENT_UPDATE]: UPDATE_MILKRUN,
[UPDATE_MILKRUN]: CONTENT_ACTION,
```

### Шаги в MODE_REPLAN

Начинается с `POINT_UPDATE` (шаг 5) → `NOTIFY_USERS` (шаг 6).

### API вызовы при submit

```
PUT /api/v1/tracking-points/:id
{
  confirmed_at: datetime,
  date_from: date,
  date_to: date,
  time_from: time,
  time_to: time,
  comment: string,
  cause_id: integer,
  contents: [...],
  notify_followers: [user_id, ...]
}
```

---

## 5. Субподряд (Subcontract)

| Условие | `ctrl.canSubcontract` = `isCarrier && Global.canSubcontract() && mode === ROAD && !isSharedSpectator` |
|---|---|
| Шаблон | `common/subcontract/views/subcontract-modal.html` |

Позволяет Carrier отправить PDF транспортного заказа субподрядчику.

Данные субподряда: `ctrl.shipment.subcontract` — содержит email субподрядчика, стоимость, комментарий.

---

## 6. Чат (Chat Panel)

| Показывается | `ctrl.allowManageChat` = `permissionsControl.accessManageChat(booker, spectator)` |
|---|---|
| Locked-заглушка | `!ctrl.allowManageChat` → "Chats are visible by [shipperName]" |

### Вкладки чата

| Вкладка | Константа | Описание |
|---------|---------|---------|
| Messages | `CHAT_TAB_NAME_MESSAGES` | Сообщения участников |
| My Team | `CHAT_TAB_NAME_TEAMMATES` | Коллеги в рамках аккаунта |
| Partners | `CHAT_TAB_NAME_PARTNERS` | Подключённые партнёры |
| Logs | `CHAT_TAB_NAME_LOGS` | Системные события (readonly) |

---

## 7. Вложения (Attachments)

| Показывается | `ctrl.showAttachments` |
|---|---|
| Редактирование | `ctrl.allowManageAttachments` |
| Locked-заглушка | `!allowManageAttachments` → "Documents are visible by [shipperName]" |

### Options объект

```javascript
this.attachmentOptions = {
    hideChangeAccess: !this.allowManageAttachments,
    isDeleteEvent: this.allowManageAttachments,
    hideDelete: !this.allowManageAttachments,
    disableAccessSelection: !this.allowManageAttachments,
    hideTabs: !this.allowManageAttachments,
};
```

---

## 8. Integration Alerts

| Тип | Условие | Отображение |
|-----|---------|------------|
| Ошибка интеграции | `activeIntegrationErrors.length > 0` | Красный banner с сообщением |
| Инфо интеграции | `activeIntegrationInfo.length > 0` | Синий banner с временной меткой |
| WMS кнопка | `showWMSButton` | Кнопка "Send data to WMS" |

```javascript
// view.js
this.activeIntegrations = dataShipment.active_integrations || [];
this.activeIntegrationErrors = this.activeIntegrations
    .map(i => ({ name, messages: i.messages.filter(not_info) }))
    .filter(i => messages.length);
```

---

## 9. Drivers (только Carrier)

```javascript
// ng-if="ctrl.isCarrier && !ctrl.isVisibilityAccount"
```

Компонент для управления водителями. Carrier назначает водителя через форму с телефоном — водителю приходит SMS со ссылкой на Driver App.

API: `PATCH /api/v1/shipments/:id/driver`
</content>
</invoke>

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.03_details.tab_tracking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632553554 · **repo:** `tms/shipments/03_details/tab_tracking.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

