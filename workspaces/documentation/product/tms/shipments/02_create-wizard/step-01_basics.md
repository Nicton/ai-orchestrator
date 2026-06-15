---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632193156
source_type: confluence
---
# CSW Шаг 1 — Basics (Основные данные)

> Источники: `new-s-request/controllers/basics.js` · `new-s-request/views/basics.html`  
> Компонент: `new-shipment-request-basics-component`

---

## Что показывается

Первая секция CSW. Отображается всегда. Содержит:

1. Название заявки (обязательное)
2. Режим перевозки (mode switcher)
3. Юридическое лицо (entity) — если включено в аккаунте
4. Теги
5. Группа (Groups) — только для групповых шаблонов

---

## Поля

### Название заявки

| Атрибут | Значение |
|---------|---------|
| Поле модели | `shipmentRequest.name` |
| Обязательное | ДА |
| i18n-заголовок | `entityName` — зависит от контекста |

**Динамический заголовок поля:**

| Контекст | Заголовок |
|---------|---------|
| Обычная заявка | `Shipment name` |
| Шаблон (`isShipmentTemplate` или `isGroupTemplate`) | `Template name` |
| Transport Request CSW | `Transport request name` |

**Код-префикс** (`getEntityCode()`): если заявка новая (`!id`) и у неё есть entity с кодом — показывается перед названием. Формат: `[ENTITY_CODE] название`.

---

### Режим перевозки (Mode switcher)

| Атрибут | Значение |
|---------|---------|
| Поле модели | `shipmentRequest.modes[]` |
| Данные | `$scope.modes` — из resolve `dataShipmentModes` |
| Отображается | Только если `$scope.hasModeOptions` = `modes.length > 1` |

**Доступные режимы:**

| ID | Режим | Примечание |
|----|-------|-----------|
| 1 | ROAD | Автомобильный |
| 2 | AIR | Воздушный |
| 3 | SEA | Морской |
| 4 | GROUPAGE | Сборный |
| ... | ... | Настраивается в admin-app |

При смене режима вызывается `onModesChange()` — перестраиваются доступные перевозчики и validations.

---

### Юридическое лицо (Accounting Entity)

| Атрибут | Значение |
|---------|---------|
| Поле модели | `shipmentRequest.accounting_entity_id` |
| Данные | `$scope.entities` — из resolve `dataAccountingEntities` |
| Отображается | Зависит от `$scope.entityRules` |
| Обязательное | `$scope.isMandatoryEntity` = `account.is_mandatory_entities` |

**Логика видимости:**

```javascript
// basics.js
$scope.isLightView = !Global.accessTmsAdvancedProducts;
$scope.isShowEntityFilter = !$scope.isMandatoryEntity && !$scope.isLightView;
```

| Условие | Результат |
|---------|---------|
| `isMandatoryEntity = true` | Entity обязательна, показана как locked |
| `isLightView = true` (FreeTM) | Entity скрыта |
| Оба false | Показывается как опциональный dropdown |

**Особенность для Buy & Sell (TBS):** если `isTransportRequestCsw && Global.accessTmsBuySellProducts`, то `entities` фильтруются по `e.billing_data` — показываются только Billing Entities.

**Дефолтная entity:** при открытии новой заявки автоматически выбирается entity с `is_default = true` (если `!isRunTemplate && !isShipmentTemplate`).

---

### Теги

| Атрибут | Значение |
|---------|---------|
| Поле модели | `shipmentRequest.booking_tag.tag_id` |
| Данные | `dataTags` — теги с `scope: 'booking'` |
| Показывается | `$scope.showTagFilter = formattedTags.length` |

Теги отображаются как chip-список. Поиск скрыт если тегов < 10 (`hideSearch: formattedTags.length < 10`).

Каждый тег: `{ id, description, color, selected }`.

---

### Groups (только для групповых шаблонов)

| Показывается | `ctrl.showGroups` = `shipmentRequest.isGroupTemplate && shipmentRequest.modes.length` |
|---|---|
| Данные | `ctrl.shipmentGroups` = `dataShipmentGroups` |
| Поле | `ctrl.shipmentRequest.shGroup` |

При смене группы вызывается `ctrl.onGroupChange`.

### Day switcher (только для Weekly routines)

| Показывается | `ctrl.isGroupTemplateWeekly` |
|---|---|
| Поля | `ctrl.days` — объект дней недели |
| Действие | `ctrl.toggleDay(numberDay)` |
| Валидация | `ctrl.daysValidate` — ошибка если нет выбранных дней |

---

## Validation Progress

Basics влияет на `ctrl.validateProgress.basics`:

```javascript
// index.js
validateProgress: {
  basics: { name: 'Basics', isValid: false },
  // ...
}
```

Кнопки "Send Booking" / "Request Quotes" заблокированы пока `!validateProgress.basics.isValid`.

---

## Backend поля (ShipmentRequest model)

| Frontend поле | DB поле | Тип | Обязательное |
|---------------|---------|-----|-------------|
| `shipmentRequest.name` | `name` | STRING | ДА |
| `shipmentRequest.accounting_entity_id` | `accounting_entity_id` | INTEGER | Зависит от аккаунта |
| `shipmentRequest.booking_tag.tag_id` | через `ShipmentRequestTag` | INTEGER (FK) | НЕТ |
| `shipmentRequest.modes[].id` | `shipment_mode_id` + has_mode_* | INTEGER + BOOLEAN | ДА |

---

## Angular зависимости

```javascript
// basics.js
controller: ['$scope', 'Global', 'ShipmentRequests', '$filter', ...]
```

| Сервис | Назначение |
|--------|-----------|
| `Global` | `accessAccountingEntities`, `accessTmsAdvancedProducts`, `accessTmsBuySellProducts` |
| `ShipmentRequests` | Проверка дублей названий |
| `$filter('translate')` | i18n перевод |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.02_create-wizard.step-01_basics`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632193156 · **repo:** `tms/shipments/02_create-wizard/step-01_basics.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

