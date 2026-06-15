---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633012323
source_type: confluence
---
# Заказы (Orders)

Orders — единицы спроса (demand). Компания создаёт заказы (закупки, продажи), которые затем превращаются в заявки на перевозку. Это необязательная часть флоу — некоторые аккаунты создают перевозки напрямую без Orders.

## Кто использует

- **Shipper** — создаёт и управляет заказами, связывает их с перевозками
- **Admin** — полный доступ
- Не используется Carrier'ами

## Место в потоке

```
Order создан (из ERP/SAP или вручную)
    ↓
Order Lines = строки (SKU, количество)
    ↓
Из Order создаётся ShipmentRequest
    ↓
Shipment выполняется
    ↓
Order.status обновляется (delivered)
```

---

## Страницы

| URL | Описание |
|-----|---------|
| `/orders` | Список всех заказов |
| `/orders/add` | Создать новый заказ |
| `/orders/{id}` | Детали заказа |
| `/orders/{id}/edit` | Редактировать |
| `/lines` | Все строки заказов |
| `/orders/{id}/lines/{product_id}` | Детали строки |

---

## Список заказов `/orders`

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Номер заказа | Уникальный ID |
| Статус | open / in_progress / fulfilled / cancelled |
| Дата создания | Когда создан |
| Поставщик / Покупатель | Контрагент |
| Строк | Количество Order Lines |
| Связанных перевозок | Количество Shipment'ов |
| Даты | Требуемые даты доставки |

### Действия

| Действие | Что происходит |
|----------|---------------|
| Создать заявку из заказа | ShipmentRequest создаётся с данными Order | 
| Редактировать | Изменить поля заказа |
| Отменить | `Order.status = cancelled` |
| Экспорт | Excel выгрузка |

---

## Детали заказа `/orders/{id}`

### Табы

| Таб | Содержимое |
|-----|-----------|
| **Order Lines** | Список строк: товар, кол-во, вес, объём |
| **Shipments** | Связанные Shipment'ы для этого Order |

### Order Lines (строки заказа)

| Поле | Описание |
|------|---------|
| Product / SKU | Товар из каталога (`/products`) |
| Quantity | Количество единиц |
| Weight | Вес строки |
| Volume | Объём |
| Status | pending / shipped / delivered |

---

## Интеграция с SAP

Если у Shipper'а настроена SAP интеграция — Orders синхронизируются автоматически:
- SAP → Shiptify: создание Orders через `app/services/integration/sap/`
- Shiptify → SAP: обновление статуса при `Shipment.status = delivered`

---

## Мутации

### Создать Order → ShipmentRequest

**Внутренние:**
- `ShipmentRequest` создаётся с `order_id`
- `ShipmentRequestOrderLine[]` — строки привязываются
- `Order.status` → `in_progress`

**Внешние:**
- Email `mailShipmentRequestCreatedToCarrier`
- SAP sync (если настроено)

---

## Backend

- Сервис: `app/services/orders.js`
- Модели: `app/models/order.js`, `app/models/order_line.js`
- Frontend: `workspaces/frontend/public/app/orders/`

---

## 🔗 Граф-метаданные
- **id:** `tms.orders`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633012323 · **repo:** `tms/orders/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

