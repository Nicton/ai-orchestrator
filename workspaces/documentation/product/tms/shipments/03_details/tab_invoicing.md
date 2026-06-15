---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632651891
source_type: confluence
---
# Вкладка Invoicing — Детальная документация

> Источники: `shipments/controllers/view.js` · `s-requests/controllers/view.js`  
> Вкладка: `TAB_NAME_INVOICING = 'invoicing'`

---

## Когда доступна

| Страница | Условие |
|---------|---------|
| SR (`/shipment-requests/:id`) | После подтверждения + у ShipmentRequest есть связанный Shipment |
| SH (`/shipments/:id`) | Всегда, если `allowManageInvoicing` |

```javascript
// entity-tabs/directive.js
if (tabName === TAB_NAME_INVOICING && ctrl.shipment_request.status !== 'confirmed') {
    // вкладка disabled
}
```

---

## Что показывается

### 1. Cost Segments (Детализация стоимости)

Список ценовых сегментов (`price_details`):

| Поле | Тип | Описание |
|------|-----|---------|
| `price_detail_id` | INTEGER | FK → price_details словарь |
| `price_detail.name` | STRING | Название сегмента (Freight, Fuel, etc.) |
| `value` | DECIMAL | Сумма |
| `currency.symbol` | STRING | Символ валюты |
| `currency.iso_code` | STRING | Код валюты |

**Итого:** `calcShipmentTotalCost(price_details)` — суммирует все segments.

---

### 2. Статус инвойсинга

Инвойсинговый статус хранится в `shipment.invoicing_status`:

| Статус | Описание |
|--------|---------|
| `not_priced` | Стоимость не указана |
| `waiting_for_invoice` | Стоимость указана, Pre-Invoice не создан |
| `gap_analysis_ongoing` | Расхождение с Rate Sheet |
| `blocked` | Shipper отклонил обновление цены |
| `checked` | Shipper назначил cost center |
| `invoiced` | Подтверждено Shipper |
| `closed` | FREEZE нажат → экспорт в SAP |

---

### 3. Assign / Unassign

| Действие | Кнопка | Условие |
|---------|--------|---------|
| Assign to month | **ASSIGN** | `allowManageInvoicing && status === 'waiting_for_invoice'` |
| Unassign | **UNASSIGN** | Инвойс уже назначен |

При Assign — выбирается месяц, вводится номер инвойса.

---

### 4. Pre-Invoice / Invoice workflow

```
Cost Segments добавлены (Carrier или Shipper)
        ↓
status: waiting_for_invoice
        ↓
Shipper создаёт Pre-Invoice
        ↓
Gap Analysis (сравнение с Rate Sheet)
        ↓
Shipper подтверждает → status: invoiced
        ↓
Shipper FREEZE → status: closed → экспорт SAP
```

---

### 5. Доступность редактирования

| Роль | Может редактировать |
|------|-------------------|
| Shipper | Да, если `allowManageInvoicing` |
| Carrier | Только запрашивать изменения (dispute) |
| Visibility Account | Нет |
| Spectator | Нет |

---

### 6. Rate Sheet применение

Если у заявки был применён Rate Sheet:

| Элемент | Значение |
|---------|---------|
| `applied_rate_sheet` | Название применённого RS |
| `rate_sheet_price` | Авто-вычисленная цена |
| Разница | `gap = actual - rate_sheet_price` |

---

## API вызовы

| Действие | Метод | Эндпоинт |
|---------|-------|---------|
| Обновить цены | PATCH | `/api/v1/shipment-requests/:id` + `{ price_details }` |
| Assign to month | PUT | `/api/v1/shipments/:id` + `{ invoicing_month, invoice_number }` |
| Freeze | PUT | `/api/v1/shipments/:id` + `{ invoicing_status: 'closed' }` |

---

## Backend DB поля

| Таблица | Поле | Тип | Описание |
|---------|------|-----|---------|
| `shipments` | `invoicing_status` | ENUM | Текущий статус |
| `shipments` | `invoicing_month` | DATE | Назначенный месяц |
| `shipments` | `invoice_number` | STRING | Номер инвойса |
| `shipment_request_price_details` | `value` | DECIMAL | Сумма сегмента |
| `shipment_request_price_details` | `price_detail_id` | INTEGER | FK → словарь |
| `shipment_request_price_details` | `currency_id` | INTEGER | FK → currencies |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.03_details.tab_invoicing`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632651891 · **repo:** `tms/shipments/03_details/tab_invoicing.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

