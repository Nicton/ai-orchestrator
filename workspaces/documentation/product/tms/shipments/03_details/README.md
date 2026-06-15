---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308451
source_type: confluence
---
# Детальная страница перевозки — Обзор

> Источники: `shipments/controllers/view.js` · `s-requests/controllers/view.js` · `tabs/index.js`  
> Маршруты: `/shipments/{id}` (Shipment) · `/shipment-requests/{id}` (ShipmentRequest)

---

## Архитектура

Детальная страница **одна из двух** — для перевозки (SH) или для заявки (SR):

| URL | Controller | Когда |
|-----|-----------|-------|
| `/shipments/{id}` | `ShipmentCtrl` | После подтверждения (SR→SH) |
| `/shipment-requests/{id}` | `ShipmentRequestCtrl` | До подтверждения |

Оба контроллера используют одни и те же табы (`tabs/index.js`), но с разными условиями видимости.

---

## Вкладки (Tabs)

### Конфигурация из `tabs/index.js`

| Константа | Значение | Заголовок | Иконка | Порядок |
|-----------|---------|-----------|--------|---------|
| `TAB_NAME_ORDERS` | `'orders'` | Orders | box | 1 |
| `TAB_NAME_TRANSPORT_REQUESTS` | `'transport-requests'` | Transport requests | arrows-out | 2 |
| `TAB_NAME_QUOTES` | `'quotes'` | **Booking** | concierge-bell | 3 |
| `TAB_NAME_TRACKING` | `'tracking'` | **Tracking** | location | 4 |
| `TAB_NAME_INVOICING` | `'invoicing'` | Invoicing | euro | 5 |
| `TAB_NAME_CLAIM` | `'claim'` | Claim | alert-triangle | 6 |

> **Важно:** вкладка `quotes` отображается с заголовком "Booking", не "Quotes".

### Дефолтная вкладка

```javascript
// view.js
active: $stateParams.tab || TAB_NAME_TRACKING
```

URL `?tab=transport-requests` открывает соответствующую вкладку напрямую.

### Логика disabled-вкладок

```javascript
// shipments/controllers/view.js
const disabledTabs = showOrdersTab ? [] : [TAB_NAME_ORDERS];
if (!ctrl.showSomeCondition) {
    disabledTabs.push(TAB_NAME_QUOTES, TAB_NAME_CLAIM, TAB_NAME_INVOICING);
}
ctrl.tab = { all: tabsSetup(disabledTabs), ... }
```

| Вкладка | Disabled если |
|---------|-------------|
| `orders` | Аккаунт без Orders функционала |
| `transport-requests` | Carrier (скрыта полностью) |
| `quotes` / `invoicing` / `claim` | Нет связанного Shipment |

---

## Шапка страницы (Header)

Компонент `requests-page-header-component`:

| Элемент | Источник | Условие |
|---------|---------|--------|
| Название заявки | `shipment_request.name` | Всегда |
| Код entity | `shipment_request.entity.code` | Если есть entity |
| Лого Shipper | `shipper.logo_url` | Всегда |
| Лого Carrier | `carrier.logo_url` | Всегда |
| Кнопка "Свернуть" | `ctrl.isCollapse` toggle | Всегда |
| Шаблонный баннер | `isShipmentTemplate` | Шаблоны |

---

## Права доступа на детальной странице

Вычисляются в `ctrl.init()` через `permissionsControl`:

| Флаг | Метод | Что контролирует |
|------|-------|-----------------|
| `allowManageTrackingPoints` | `accessManageTrackingPoints(booker, spectator)` | Добавление/изменение TP |
| `allowManageChat` | `accessManageChat(booker, spectator)` | Чат-панель |
| `allowManageAttachments` | `accessManageAttachments(booker, spectator)` | Загрузка вложений |
| `allowManageInvoicing` | `accessManageInvoicing(booker)` | Инвойсинг |
| `allowManageTruckDriver` | `accessManageTruckDriver(spectator)` | Данные водителя |
| `showMetadataPopup` | `accessManageMetadataRequests(booker, spectator)` | Метаданные popup |
| `showTrackingPoints` | `accessSeeTrackingPoints(spectator)` | Видимость TP для Spectator |
| `showAttachments` | `accessSeeAttachments(spectator)` | Видимость вложений для Spectator |

---

## Документация по вкладкам

| Вкладка | Документ |
|---------|---------|
| Tracking | [tab_tracking.md](tab_tracking.md) |
| Booking | [tab_booking.md](tab_booking.md) |
| Invoicing | [tab_invoicing.md](tab_invoicing.md) |
| Modals (TP edit, cancel...) | [../05_modals/](../05_modals/) |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.03_details`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631308451 · **repo:** `tms/shipments/03_details/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

