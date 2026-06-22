---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629309475
source_type: confluence
---
# BO Operations — NSM, Alerts, очереди онбординга

> Сверено с кодом 2026-06-13 | BO `models/Alert.js`, routes nsm/alerts, client containers nsm/alerts/pendingDocks/pendingTm/dockLeads/newSellers/killedCarriers

## Зачем (бизнес-контекст)

Операционной команде Shiptify нужен пульт: ключевые метрики роста (NSM), система объявлений пользователям (Alerts) и рабочие очереди онбординга — новые аккаунты, ждущие привязки к биллингу (Pending Docks/TM), лиды складов (Dock Leads), новые/отключённые перевозчики. Без этого операционка велась бы вручную, теряя аккаунты на этапе активации.

## Как устроено (код)

| Раздел | Что | Ключевое |
|--------|-----|----------|
| **NSM** (North Star Metrics) | Сводные метрики платформы | shipments/shippers/carriers/revenue — `GET /nsm-statistic` |
| **Alerts** | Объявления пользователям | `Alert.js`: valid_from/to, data (severity HIGH/MED/LOW, audience по account_type/functionality, messages en/fr/es); CRUD `/alerts` |
| **Pending Docks / TM** | Очереди новых аккаунтов на привязку биллинга | search + omFilter (Onboarding Manager), slot_counts (динамика 1m/1q/1y), bulk-assign billing |
| **Dock Leads** | Лиды складов (slot-book адреса) | фильтры country/owner/status/контакты; update owner+status; `/slot-book-addresses` |
| **New Sellers / Killed Carriers / New Carriers** | Мониторинг перевозчиков | списки новых/отключённых (is_killed) |

## Где найти (UI Back-Office)

| Что | Роут |
|-----|------|
| NSM | `/nsm` |
| Alerts | `/alerts` |
| Pending Docks / TM | `/pending-docks`, `/pending-tm` |
| Dock Leads | `/dock-leads` |
| New Sellers / Killed / New Carriers | `/new-sellers`, `/killed-carriers`, `/new-carriers` |

## Сценарии

1. **Объявление о техработах**: создать Alert (severity HIGH, audience=all, messages 3 языка, valid_to) → видят целевые пользователи.
2. **Онбординг нового склада**: появляется в Pending Docks → OM привязывает billing account (bulk-assign).
3. **Мониторинг оттока**: Killed Carriers → видно отключённых перевозчиков для анализа.

---

## 🔗 Граф-метаданные
- **id:** `back-office.operations.module`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629309475 · **repo:** `back-office/operations/operations-module.md`
- **code_refs:** `back-office/server/models/Alert.js`, `routes/api/{nsm,alerts}.js`, `client/containers/{nsm,alerts,pendingDocks,pendingTm,dockLeads,newSellers,killedCarriers,newCarriers}.tsx`
- **modules:** Back-Office, DOCK (dock leads)
- **references:** `back-office.account-management`, `back-office.sales-accounts`, `dock.external-partners`
- **requirements:** нет — реализовано без требований
