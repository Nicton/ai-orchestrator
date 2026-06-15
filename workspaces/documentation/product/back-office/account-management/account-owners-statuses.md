---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632127521
source_type: confluence
---
# BO Account Management — Owners и статусы аккаунта

> Источник требований: REQ-OCR-007 | Слайды (OCR): 2023 01 - Sales CSM Owner | Сверено с кодом 2026-06-11

---

## Дизайн из слайдов (2023)

- У каждого аккаунта назначается **Sales Owner** и **CSM** (Customer Success Manager) — выпадающие списки сотрудников; Carrier Owner — отдельно от Shipper Owner
- Статусы аккаунта: **PENDING, FREEMIUM, PAYING, TEST, CHURN** — переключает только Super User
- «Managed by [ID]» для Galaxy-аккаунтов; Billing account обязателен для PAYING

## Статус по коду (2026-06-11)

| Элемент | Что в коде |
|---------|-----------|
| Sales/CSM/Carrier Owner на Account | ❌ Полей `sales_owner_id`/`csm_id` в модели Account **нет** — ownership живёт в модуле **Sales Accounts** Back-Office (`SalesAccount`, связь через `galaxy_id`; см. `back-office/sales-accounts/`) |
| Статусы PENDING/FREEMIUM/PAYING/TEST/CHURN | ❌ Enum в Account **нет** (`account.status` — свободная STRING). FREEMIUM реализован отдельным флагом `is_freemium = !!sponsor_account_id`. Жизненный цикл клиента (paying/churn) трекается на уровне Sales/Billing Accounts (MRR-линии) |
| Managed by (Galaxy) | ✅ Связь через `galaxy_id` существует |
| Billing account для PAYING | ⚠️ Привязка BillingAccount↔Account есть (через Galaxy); валидации «обязателен для PAYING» нет, т.к. нет самого статуса PAYING |

**Вывод:** слайдовая модель owners/статусов на уровне Account **не реализована** — её роль выполняют модули Sales Accounts (тачпоинты, группы top_1..3/other, ToPo) и Billing Accounts (MRR: TM/DOCK/OPTION/PARCEL/TRACK/BUY_SELL). При документировании клиентского lifecycle ссылаться на них, а не на Account.

## Связанные документы

| Документ | Что покрывает |
|----------|--------------|
| [../sales-accounts/](../sales-accounts/) | Sales Accounts, тачпоинты, ToPo |
| [../billing-accounts/](../billing-accounts/) | MRR-линии, споты |
| [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) | Аудит BO 2026-06-11 |

---

## 🔗 Граф-метаданные
- **id:** `back-office.account-management.account-owners-statuses`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632127521 · **repo:** `back-office/account-management/account-owners-statuses.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

