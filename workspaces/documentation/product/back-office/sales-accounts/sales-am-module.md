---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571659
source_type: confluence
---
# Sales Accounts / Touchpoints / AM — управление продажами

> Сверено с кодом 2026-06-13 | BO `models/SalesAccount*.js`, `routes/api/sales_accounts.js`, client containers salesAccounts/amDashboard/amOpportunities

## Зачем (бизнес-контекст)

Back-Office — внутренний инструмент Shiptify (не клиентский). Sales-команде нужно вести клиентов как воронку: кто чем занимается (role), какой потенциал (MRR target vs value), когда последний контакт (touchpoints/ToPo), какие возможности роста (opportunities по типам TM/DOCK/OPTION/PARCEL/TRACK). AM Dashboard сводит это в метрики настроения/риска оттока. Без модуля продажи велись бы в Excel без связи с реальными данными платформы.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Sales account | `SalesAccount.js` | name, galaxy_id, account_manager_id, **role** (MANUFACTURER/RETAIL_B2B/B2C/E-COMMERCE/3PL/4PL/FORWARDER/CARRIER/SOFTWARE), **type** (GLOBAL/ETI_LARGE/SMB), risk_level, contact_info (JSONB, группы top_1/2/3/other) |
| Touchpoint | `SalesAccountTouchpoint.js` | data (call freq/duration/notes), main_contact, status_updated_at — **иммутабелен** (нет deleted_at) |
| MRR | `SalesAccountMrr.js` | year, mrr_target, mrr_value (⚠️ MRR_YEAR=2026 захардкожен — TD-1222) |
| Opportunity | `SalesAccountOpportunity.js` | target_revenue, type, target_date |
| AM Opportunity | `SalesAccountAMOpportunity.js` | data (типы+статусы PENDING/REFUSED/COMPETITOR) |

ToPo (частота звонков): коэффициенты `call_freq × 1.1 / × 0.8` в SQL (не конфигурируемо).

## Где найти (UI Back-Office)

| Что | Роут |
|-----|------|
| Sales accounts | `/sales-accounts`, `/sales-accounts/:id` |
| Touchpoints | `/touchpoints` |
| AM sales accounts | `/am-sales-accounts` |
| AM Opportunities | `/am-opportunities` |
| AM Dashboard | `/am-dashboard` (mood, churn risk, touchpoints по месяцам, AMOpps по типам) |

API: `/sales-accounts` (+contacts/touchpoints/mrr-lines/opportunities/am-opportunities), `/sales-accounts/dashboard/{customers,touchpoints,amopps}`.

## Сценарии

1. **Воронка AM**: завести sales account (role+type) → MRR target → touchpoints по контактам → дашборд показывает риск оттока.
2. **Возможности роста**: AM opportunities по типам → дашборд агрегирует pending/refused/competitor.
3. **ToPo-приоритизация**: частота звонков подсвечивает «пора связаться».

---

## 🔗 Граф-метаданные
- **id:** `back-office.sales-accounts`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629571659 · **repo:** `back-office/sales-accounts/sales-am-module.md`
- **code_refs:** `back-office/server/models/{SalesAccount,SalesAccountTouchpoint,SalesAccountMrr,SalesAccountOpportunity,SalesAccountAMOpportunity}.js`, `routes/api/sales_accounts.js`, `client/containers/{salesAccounts,salesAccount,salesAccountTouchpoints,amDashboard,amOpportunities,amSalesAccounts}.tsx`
- **modules:** Back-Office, Galaxy
- **references:** `back-office.billing-accounts`, `back-office.account-management`, `tms.galaxy`
- **requirements:** нет — реализовано без требований (баг MRR_YEAR → TD-1222)
