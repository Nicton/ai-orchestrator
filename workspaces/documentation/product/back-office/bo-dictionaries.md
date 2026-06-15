---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375111
source_type: confluence
---
# BO Dictionaries & Settings — справочники Back-Office

> Сверено с кодом 2026-06-13 | BO client containers metadata/paymentTerms/unitMeasurements/incidents/attachmentTypes/externalCosts/cargo*, routes

## Зачем (бизнес-контекст)

Платформа работает на справочниках: типы оплаты, единицы измерения, типы вложений, статьи внешних затрат, метаданные-прототипы, типы/группы груза, опасные грузы. Их ведёт **Back-Office** — централизованно, чтобы все аккаунты использовали единые значения, а добавление нового типа не требовало релиза кода. Изменение справочника мгновенно отражается в продукте (формы CSW, правила зон, инвойсинг).

## Как устроено (код) и где найти

| Справочник | Что | Роут BO |
|-----------|-----|---------|
| Metadata | Прототипы и значения кастомных полей (см. [tms.metadata](../tms/metadata/README.md)) | `/metadata` |
| Payment Terms | Условия оплаты (net 30, COD…) | `/payment-terms` |
| Unit Measurements | Единицы измерения (вес/габариты) | `/unit-measurements` |
| Incidents | Типы операционных инцидентов | `/incidents` |
| Attachment Types | Типы документов-вложений | `/attachment-types` |
| External Cost Types | Типы внешних затрат (fuel/handling/customs) | `/external-costs` |
| Cargo Types / Groups / Dangerous Goods | Типы/группы груза, ADR (см. [cargo-dgd](../dock/feature-docs/cargo-dgd/README.md)) | через dictionaries |

CRUD-эндпоинты: `/metadata`, `/payment-terms`, `/incidents`, `/external-cost-types`, `/attachment-types` (+`:id`). Admin-App ведёт более низкоуровневые dictionaries (валюты, режимы, content-types, specificities, transit-companies) — см. волну 5.

## Сценарии

1. **Новый тип оплаты**: BO → Payment Terms → создать «net 60» → доступен во всех аккаунтах при выставлении счёта.
2. **Тип вложения**: добавить attachment type → появляется в выборе при загрузке документа.
3. **Статья затрат**: external cost type «Customs fee» → доступна в external costs на SR.

---

## 🔗 Граф-метаданные
- **id:** `back-office.dictionaries`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629375111 · **repo:** `back-office/bo-dictionaries.md`
- **code_refs:** `back-office/client/containers/{metadata,metadataValue,paymentTerms,unitMeasurements,incidents,attachmentTypes,externalCosts,cargoGroups,cargoTypes,dangerousGoodsDescriptions}.tsx`, `server/routes/api/*`
- **modules:** Back-Office, TMS, DOCK, Admin-App
- **references:** `tms.metadata`, `dock.cargo-dgd`, `tms.invoicing.cost-segments`
- **requirements:** нет — реализовано без требований
