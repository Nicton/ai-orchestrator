---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632979457
source_type: confluence
---
# CSV Uploads — массовый импорт слотов и заказов

> Сверено с кодом 2026-06-12 | `services/slots-csv/` (service.js, schema.js, fileValidator.js, chunkProcessor.js)

## Зачем (бизнес-контекст)

Склад, переходящий на Shiptify (или планирующий неделю вперёд в Excel, как привык), не должен вбивать сотни слотов и заказов руками. CSV-импорт — мост между привычным табличным планированием/легаси-WMS и системой: оператор выгружает план из своей таблицы и загружает одним файлом. Это ключевой инструмент **онбординга PML** и регулярного массового планирования.

## Что импортируется

**Slots CSV** — `POST /api/v1/slots-uploads/upload-csv`. Колонки: Visit ID, Carrier ID, Driver Name, Slot ID, Dock Door, Type (Inbound/Outbound), Order ID, Date, Hour, Qty, Zone ID, Duration.

Две схемы участников (`schema.js`):
- **v1 (классическая)**: Partner ID/Name + Customer ID/Name — склад работает «поставщик → клиент склада»;
- **v2 (multi-client)**: Buyer ID/Name + Seller ID/Name — согласовано с моделью multi-client dock orders (один склад обслуживает многих покупателей/продавцов).

**Order CSV** — заказы (dock orders) теми же механизмами загрузки; заказы затем связываются со слотами при назначении.

## Как обрабатывается (и почему так)

1. **Валидация заголовков** до обработки (`fileValidator.checkHeadersInvalid`): обязательные колонки (Visit ID, Slot ID, Type, Order ID, Date, Hour, Zone ID) + наличие partner- ИЛИ buyer/seller-набора. Падение сразу, а не на 500-й строке — оператор чинит файл один раз.
2. **Построчная обработка чанками** (`chunkProcessor.js`): ошибка строки не валит файл — пишется в `slots_upload_chunk_errors` с номером строки и причиной. Бизнес-причина: в плане на неделю 2 кривые строки не должны блокировать 198 правильных.
3. **Статусы загрузки**: `NEW → VALIDATED → STARTED → PARTIAL_SUCCESS / FAILED` — оператор видит прогресс и итог; PARTIAL_SUCCESS = «загружено всё, кроме строк из отчёта об ошибках».

## Кто использует

Оператор/админ PML: Location Management → вкладка Management → Upload. Права — управление локацией.

## Прочие загрузки в DOCK

Документы к визиту/слоту (фото пломб, CMR, сертификаты): требуемые типы настраиваются per-zone (`location_zone_attachment_types`), загрузка через S3 presigned (`GET /slots-uploads/s3Policy`), обязательные вложения контролируются перед закрытием визита. Бизнес-смысл: зона сама декларирует, без каких документов операция не считается завершённой.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.csv-uploads`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632979457 · **repo:** `dock/feature-docs/csv-uploads/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

