---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225938
source_type: confluence
---
# Инвойсы и стоимость перевозки

## Что это

После завершения перевозки начинается финансовый флоу: Carrier указывает фактическую стоимость, Shipper сверяет с котировкой, финализирует и проводит оплату. Система хранит всю историю стоимостей и документов.

---

## Страница: Pre-Invoice (предварительный счёт)

**URL:** `/pre-invoices` / `/pre-invoices/{id}`
**Frontend:** `workspaces/frontend/public/app/preInvoices/`

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Перевозка | Связанный Shipment |
| Перевозчик | Кто выставляет |
| Сумма | Предварительная стоимость |
| Статус | Pending / Verified / Disputed / Accepted |
| Документ | Прикреплённый PDF счёта |
| Дата выставления | Когда создан |

### Действия

| Действие | Кто может | Что происходит |
|----------|-----------|---------------|
| Создать pre-invoice | Carrier | Заполняет сумму + загружает PDF |
| Верифицировать | Shipper | `PreInvoice.status = verified` |
| Оспорить (dispute) | Shipper | `PreInvoice.status = disputed` + комментарий |
| Утвердить | Shipper/Finance | Переходит к Invoice |

---

## Страница: Invoice (финальный счёт)

**URL:** `/invoices` / `/invoices/{id}`
**Frontend:** `workspaces/frontend/public/app/invoices/`

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Номер инвойса | Уникальный ID |
| Перевозка | Связанный Shipment |
| Сумма | Финальная стоимость |
| Статус | Draft / Sent / Paid / Cancelled |
| Детализация | Cost segments: фрахт, таможня, страховка |
| Документ | PDF инвойса |

---

## Cost Segments — детализация стоимости

**URL:** `/cost-segments`

Каждая стоимость перевозки состоит из строк (сегментов):

| Тип сегмента | Пример |
|-------------|--------|
| Freight | Основная стоимость перевозки |
| Fuel surcharge | Топливная надбавка |
| Insurance | Страховка груза |
| ADR / Dangerous goods | Надбавка за опасный груз |
| Customs | Таможенные сборы |
| Special services | Дополнительные услуги |

---

## Инвойсинг по табу на странице Shipment

На странице `/shipments/{id}` → таб **Invoicing** показывает:

| Блок | Описание |
|------|---------|
| Котировочная цена | Согласованная при бронировании |
| Pre-invoice | Предварительный счёт от Carrier |
| Invoice | Финальный счёт |
| Cost segments | Полная детализация |
| Разница | Delta между котировкой и финальным счётом |

---

## Мутации

### Создание Pre-Invoice (Carrier)

**Внутренние:**
- `PreInvoice` создаётся
- `PreInvoice.shipment_id` привязывается

**Внешние:**
- Email `mailPreInvoiceToShipper` → уведомление shipper'у

### Утверждение Invoice (Shipper)

**Внутренние:**
- `Invoice.status` → `accepted`
- `Shipment.invoicing_status` обновляется

**Внешние:**
- Email `mailInvoiceAccepted` → Carrier
- SAP интеграция (если настроена): `app/services/integration/sap/` → синхронизация в ERP

---

## Курсы валют

Система автоматически обновляет курсы валют:
- Cron: `app/cron/` → группа "Курсы валют"
- Поддерживаемые валюты: настраиваются через `/account-currencies`

---

## Backend

- Frontend: `workspaces/frontend/public/app/invoicing/`, `/preInvoices/`, `/invoices/`
- Cron инвойсов: `app/cron/` → группа "Инвойсы"
- SAP интеграция: `app/services/integration/sap/`
- Документы: `app/services/attachments/` + AWS S3

---

## 🔗 Граф-метаданные
- **id:** `tms.invoicing.01_invoices`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632225938 · **repo:** `tms/invoicing/01_invoices.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

