---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629243979
source_type: confluence
---
# Galaxy — группы аккаунтов и мультиарендность

> Сверено с кодом 2026-06-13 | `models/{galaxy,galaxy_mentor,galaxy_service,constellation,constellation_account}.js`, `account.js:116-122`, services `galaxies/*`, routes `galaxy.js`, frontend `galaxy`

## Зачем (бизнес-контекст)

Крупный клиент или 3PL — это не один аккаунт, а сеть: головной офис, филиалы, обслуживаемые клиенты. Нужно управлять ими как группой (единый брендинг, общие перевозчики, сводный обзор), но с изоляцией данных. **Galaxy** — эта группа аккаунтов под управлением owner-аккаунта. **Constellation** — подгруппа внутри Galaxy, связывающая carrier↔shipper аккаунты. **Managed accounts** — иерархия «управляющий ведёт управляемых». Это фундамент мультиарендности и [Multivision](../control-tower/multivision-module.md).

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Galaxy | `galaxy.js` | name, logo/brand_img, domains, owner_account_id, customer_status (active/pending/blocked), allow_manage_accounts_freight_units |
| Mentor | `galaxy_mentor.js` | sales_member, csm_member, billing_account, status (created→training_done→started→secured→risk/inactive/churn) |
| Service | `galaxy_service.js` | shipment_mode, code, require_location/goods/incoterms/customs/docs — конфиг требований по режиму |
| Constellation | `constellation.js` + `_account.js` | подгруппа; account↔constellation |
| Привязка аккаунта | `account.js:116` | **galaxy_id** (все в группе), **managed_by_account_id** (иерархия) |

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Аккаунты Galaxy | `/galaxy/accounts` |
| Constellations | `/galaxy/constellations` (+add) |
| Managed accounts | `/galaxy/managed-accounts` |
| Connected galaxies | `/galaxy/connected-galaxies` |
| External users (контакты) | `/galaxy/external-users` |
| Connected shippers | `/galaxy/connected-shippers` |

API: `GET /galaxies`, `POST/PATCH /galaxies/:id/accounts`, `/galaxies/managed-accounts`, `/galaxies/connected-shippers`, public `/galaxies-for-invite`. Доступ — роль `requireGalaxyManager`. Создание/менторство Galaxy — в Back-Office (см. [galaxy контур](README.md)).

## Сценарии

1. **Холдинг с филиалами**: Galaxy + аккаунты филиалов (общий galaxy_id) → единый брендинг, Multivision по всем.
2. **3PL управляет клиентами**: managed_by_account_id → 3PL ведёт аккаунты клиентов, бронирует за них.
3. **Constellation carrier↔shipper**: связать перевозчиков и шипперов в подгруппу для общих правил/видимости.

---

## 🔗 Граф-метаданные
- **id:** `tms.galaxy.module`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629243979 · **repo:** `tms/galaxy/galaxy-module.md`
- **code_refs:** `backend/app/models/{galaxy,galaxy_mentor,galaxy_service,constellation,constellation_account}.js`, `account.js:116-122`, `services/galaxies/*`, `routes/api/galaxy.js`, `frontend/public/app/galaxy`
- **modules:** TMS, Back-Office, Multivision
- **references:** `tms.multivision`, `tms.self-admin`, `back-office`
- **requirements:** нет — реализовано без требований
