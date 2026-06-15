---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629080090
source_type: confluence
---
# Customs Invoices — таможенные декларации

> Сверено с кодом 2026-06-13 | `models/customs_invoices*.js`, `services/customs/*`, routes `customs_invoices.js`, frontend `customs-invoices*`

## Зачем (бизнес-контекст)

Международная отправка не пройдёт границу без таможенной декларации товаров: что везём, сколько стоит, HS-код, страна происхождения, причина (продажа/образец/возврат). Ручное заполнение десятков строк — медленно и ошибочно. Модуль Customs даёт структурированную **customs invoice** со строками товаров, доп. сборами, **массовой загрузкой из CSV** и автозаполнением через AI Reader (Textract+Gemini). Шаблоны строк (customs-invoice-lines) переиспользуют типовые товары.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Декларация | `customs_invoices.js` | number, date, **type** (import/export/both), **reason_type** (Permanent/Sample/Gift/Return…), currency, weight_unit (kg/lbs), status (pending→assigned), is_goods_services_tax |
| Строка товара | `customs_invoices_lines.js` | description, quantity, unit_price, gross/net_weight, **export/import_hs_code**, manufacturer_country, is_preferential_origin, part/serial_number |
| Доп. сборы | additional_charges | type (Freight/Insurance/Vat/Handling…), amount |
| Загрузка CSV | `customs_invoices_uploads.js` | file_name, status (new→validated→started→success/partial/error), s3_key, chunks |
| Связь с отправкой | `pre_shipments_customs.js` | pre_shipment_id ↔ customs_invoice_id |

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Список деклараций | `/customs-invoices` (CustomsInvoicesCtrl) |
| Детальная декларация | `/customs-invoices/:id` |
| Шаблоны строк товаров | `/customs-invoice-lines` (+ add/edit) |
| Импорт CSV | `POST /customs-invoices/upload-csv` (+ s3Policy) |
| Авто из документа | AI Reader (тип `cu_invoice`) — см. ai/features/ai-reader |

## Сценарии

1. **Экспорт с декларацией**: создать customs invoice (type=export) → добавить строки (HS-коды) → привязать к отправке.
2. **Массовая загрузка**: выгрузить товары из ERP в CSV → upload → построчная валидация, ошибки в отчёте.
3. **Авто-распознавание**: загрузить PDF инвойса в AI Reader → строки заполняются автоматически (Gemini-парсинг).

---

## 🔗 Граф-метаданные
- **id:** `tms.customs`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629080090 · **repo:** `tms/customs/README.md`
- **code_refs:** `backend/app/models/{customs_invoices,customs_invoices_lines,customs_invoices_uploads,pre_shipments_customs}.js`, `services/customs/*`, `customs-invoices-upload`, `routes/api/customs_invoices.js`, `frontend/public/app/{customs-invoices,customs-invoice-lines}`
- **modules:** TMS, AI (AI Reader)
- **references:** `ai.ai-reader`, `tms.shipments`, `tms.parcels`
- **requirements:** нет — реализовано без требований (связь с REQ-OCR-AI Reader)
