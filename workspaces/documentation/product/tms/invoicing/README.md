---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632062116
source_type: confluence
---
# Инвойсинг (Invoicing)

Финансовая часть перевозки. После доставки груза Carrier выставляет счёт, Shipper верифицирует. Система поддерживает pre-invoice (предварительный счёт), invoice (финальный счёт), и cost segments (детализацию затрат).

## Кто использует

- **Carrier** — создаёт и загружает инвойсы
- **Shipper (Finance)** — верифицирует и утверждает счета
- **Admin** — управляет настройками инвойсинга

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_invoices.md](01_invoices.md) | Страницы инвойсинга: pre-invoice, invoice, cost segments |

---

## Место в потоке

```
Shipment.status = delivered
        ↓
Carrier создаёт Pre-Invoice
        ↓
Shipper верифицирует → Invoice
        ↓
Оплата (вне системы) / закрытие
```

---

## Ключевые модели

| Модель | Описание |
|--------|---------|
| `InvoicingRequest` | Запрос на инвойс |
| `PreInvoice` | Предварительный счёт от Carrier |
| `Invoice` | Финальный счёт |
| `CostSegment` | Строка затрат (фрахт, таможня, страховка и др.) |
| `ExternalCost` | Внешние затраты (добавляются вручную) |

---

## Страницы

| URL | Описание |
|-----|---------|
| `/invoicing` | Список запросов на инвойс |
| `/invoicing/{id}` | Детали одного запроса |
| `/pre-invoices` | Список pre-invoice |
| `/pre-invoices/{id}` | Детали pre-invoice |
| `/invoices` | Список финальных инвойсов |
| `/invoices/{id}` | Детали инвойса |
| `/invoicing-documents` | Документы инвойсинга |
| `/cost-segments` | Управление строками затрат |

---

## Backend

- Frontend: `workspaces/frontend/public/app/invoicing/`
- Сервисы: `app/services/` → файлы связанные с invoicing
- Cron: `app/cron/` → группа "Финансы" (запросы инвойсов, курсы валют)

---

## 🔗 Граф-метаданные
- **id:** `tms.invoicing`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632062116 · **repo:** `tms/invoicing/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

