---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629243963
source_type: confluence
---
# Attachments & Doc Center — документы и централизованный реестр

> Сверено с кодом 2026-06-13 | `models/{attachment,account_attachments,attachments_categories,attachment_access_accounts}.js`, `services/attachments.js`, `doc-center.js`, routes `attachments.js`, `doc-center.js`

## Зачем (бизнес-контекст)

Каждая перевозка обрастает документами: инвойс, CMR, packing list, POD, таможня, ярлыки. Они разбросаны по объектам — найти «все CMR за месяц» невозможно. **Attachments** — система вложений с типами, категориями, контролем доступа (public/private/limited) и антивирусным сканом. **Doc Center** — централизованный реестр поверх вложений: единый поиск/выгрузка документов по всем отправкам/заявкам/слотам + account-level хранилище (договоры, лицензии со сроком годности). Без Doc Center аудит документов и массовая выгрузка были бы невозможны.

## Как устроено (код)

- **Attachment** (`attachment.js`): att_type (INVOICE/CMR/CUSTOMS/LABEL/POD/PACKING_LIST/BILL_OF_LADING…), **access_type** (PUBLIC/LIMITED/PRIVATE/TAILORMADE), контекст-FK (shipment/sr/claim/quote/slot/visit/invoice/customs/transport_request), файл (s3_key, size, type), **scan_status** + viruses (ClamAV), is_external, source_url.
- **AccountAttachment** (`account_attachments.js`): документы уровня аккаунта (тип, **expiration_date**, carrier_id) — договоры/сертификаты.
- **AttachmentsCategories** — пользовательские категории; **AttachmentAccessAccount** — кому видно при LIMITED; **AttachmentRequest** — запрос недостающего документа.
- **Doc Center** (`doc-center.js`): listDocsByInput (агрегация по shipments/requests/slots, пагинация, контекст: ETD/ETA/маршрут/перевозчик), downloadDocs (zip), CRUD account-документов.

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Doc Center (реестр) | `/doc-center` — поиск/фильтр/выгрузка zip |
| Account-документы | `/account-doc-center` (тип, срок годности) |
| Категории вложений | `/attachments-categories` |
| Вложение на объекте | вкладка Documents (тип + access_type) |

API: `GET /attachments` (ACL-фильтрация по CAN_MANAGE/SEE_DOCUMENTS), `POST /attachments` (скан+S3), `GET /doc-center`, `/doc-center/list-split`, `POST /doc-center/download`, `/account-doc-center`. Связано с [doc-workflow](../features/doc-workflow.md) (автоправила) и [labels-sscc](../features/labels-sscc.md).

## Сценарии

1. **Аудит документов**: Doc Center → фильтр по типу CMR + период → выгрузить zip всех CMR.
2. **Приватный документ**: загрузить с access_type=private → виден только владельцу; limited → выбранным аккаунтам.
3. **Контроль сроков**: account-документ (лицензия) с expiration_date → напоминание об истечении.

---

## 🔗 Граф-метаданные
- **id:** `tms.doc-center`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629243963 · **repo:** `tms/doc-center/README.md`
- **code_refs:** `backend/app/models/{attachment,account_attachments,attachments_categories,attachment_access_accounts,attachment_requests}.js`, `services/{attachments,doc-center}.js`, `routes/api/{attachments,doc-center,attachments_categories}.js`, `frontend/public/app/{doc-center,attachments-categories,account-doc-center}`
- **modules:** TMS, DOCK (vis attachments), Integrations (labels)
- **references:** `tms.features.doc-workflow`, `tms.features.labels-sscc`, `tms.customs`
- **requirements:** REQ-DOC-001..011 (doc workflow — частично); прочее — реализовано без требований
