---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629243915
source_type: confluence
---
# Metadata (MD) — кастомные поля платформы

> Сверено с кодом 2026-06-13 | `models/metadata_prototype.js`, `metadata_request.js`, `account_metadata_*.js`, `services/metadata.js`, routes `metadata.js`

## Зачем (бизнес-контекст)

Каждый клиент возит по-своему: одному нужен номер заказа SAP на каждой отправке, другому — температурный режим, третьему — номер таможенной декларации. Зашивать это в код невозможно. **Metadata** — механизм кастомных полей: клиент сам определяет, какие данные собирать, на каких объектах и обязательны ли они. Это превращает Shiptify из жёсткой формы в настраиваемую под процесс клиента систему, и одновременно даёт «completion score» — контроль полноты данных перед сменой статуса.

## Как устроено (код)

- **Prototype** (`metadata_prototype.js`) — *определение поля*: name, slug, format (date/port/airport/text), **scope** (details/quotes/tracking/invoicing/claims/slots/transport_request), флаги режимов for_air/road/sea…, is_doc, is_trackable, notify_3rd_party, allow_grouping. Прототипы заводит BO/Admin.
- **Request** (`metadata_request.js`) — *запрос/ответ значения* на конкретном объекте: prototype_id + (shipment/sr/quote/slot/transport_request)_id, requested_by (shipper/carrier), status (new→done/canceled), value, provided_at. Матрица: запросивший может cancel+done, другая сторона — только done.
- **Account-level**: `account_metadata_settings` (is_custom_value), `account_metadata_values` (дефолтные значения), `address_metadata_prototype` (обязательность по адресу).

## Где найти и настроить (UI)

| Что | Где |
|-----|-----|
| Управление прототипами (вкл/выкл per аккаунт, предопределённые значения) | `frontend/app/dicts` → list-metadata-prototypes; прототипы заводятся в Admin-App (`metadata-prototypes`) / BO |
| MD на объекте (заполнить/запросить) | вкладка Metadata на shipment/SR/quote/slot — директивы `common/metadata/*` |
| Реестр запросов | `/metadata-requests` |
| Обязательность по адресу | карточка локации → MD prototypes |

API: `GET/POST /:entity/:id/metadata`, `PATCH/DELETE /:entity/:id/metadata/:id`, `GET /metadata/prototypes`.

## Сценарии

1. **SAP-номер обязателен**: BO заводит прототип scope=details, помечает required по адресу клиента → отправку нельзя подтвердить без номера.
2. **Запрос данных у перевозчика**: shipper создаёт metadata request (requested_by=shipper) → перевозчик видит запрос, заполняет value → status=done.
3. **Группировка по полю**: прототип с allow_grouping → отправки группируются по значению MD.

---

## 🔗 Граф-метаданные
- **id:** `tms.metadata`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629243915 · **repo:** `tms/metadata/README.md`
- **code_refs:** `backend/app/services/metadata.js`, `metadata/predefined.js`, `utility-metadata.js`, `models/{metadata_prototype,metadata_request,account_metadata_settings,account_metadata_values}.js`, `routes/api/metadata.js`, `frontend/public/app/{metadata-requests,common/metadata,dicts}`
- **modules:** TMS, Back-Office (прототипы), Admin-App
- **references:** `tms.followers`, `tms.templates`, `tms.shipments`
- **requirements:** REQ-STY-009..020 (MD completion — частично); прочее — реализовано без требований
