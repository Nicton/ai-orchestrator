---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629309491
source_type: confluence
---
# BO Account Operations — аккаунты, компании, перевозчики

> Сверено с кодом 2026-06-13 | BO client containers accounts/accountsOperations/companies/carriers/mergeAccountsOperation/shippersOperations, routes

## Зачем (бизнес-контекст)

Back-Office управляет жизненным циклом всех сущностей экосистемы: аккаунты (создание, статусы, спонсоры, теги), компании, перевозчики (замена, отключение, привязки), шипперы. Массовые операции (merge дублей, bulk-изменения) и фильтры дают команде поддержки и операций контроль над тысячами аккаунтов без прямого доступа к БД.

## Как устроено (код)

| Операция | Что делает |
|----------|-----------|
| Accounts | list/create/update/search (фильтры: source, status, sponsor, даты, products, galaxy, tags), favorite, references, price details |
| Account Operations | мониторинг bulk-изменений, merge, переходы статусов |
| Carriers / Carrier Operations | список, **replace carrier** (перенос отправок/заявок), привязки galaxy, фильтры status/countries/access |
| Shippers Operations | фильтры status/master/planning/booking/products, price details |
| Merge Operations | консолидация аккаунтов и референсов |
| Companies | управление компаниями |

## Где найти (UI Back-Office)

`/accounts`, `/accounts-operations`, `/carriers`, `/carriers-operations`, `/shippers-operations`, merge. API `/accounts` (+favorite/tag/:id), `/carriers/:id/replace`, `/carriers-operations`, `/shippers`.

## Сценарии

1. **Замена перевозчика**: `/carriers/:id/replace` → переносит shipments/claims/SR/templates на нового (см. DEFECTS — что именно переносится).
2. **Merge дублей**: merge operation консолидирует аккаунт + референсы.
3. **Поиск по фильтрам**: accounts по status=PAYING + galaxy → срез для анализа.

---

## 🔗 Граф-метаданные
- **id:** `back-office.account-management`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629309491 · **repo:** `back-office/account-management/accounts-operations.md`
- **code_refs:** `back-office/client/containers/{accounts,accountsOperations,companies,carriers,carriersOperations,mergeAccountsOperation,shippersOperations,galaxiesOperations}.tsx`, `server/routes/api/{accounts,carriers}.js`
- **modules:** Back-Office, TMS (carriers)
- **references:** `tms.carriers`, `back-office.sales-accounts`, `tms.galaxy`
- **requirements:** нет — реализовано без требований (replace carrier → DEFECTS D-набор)
