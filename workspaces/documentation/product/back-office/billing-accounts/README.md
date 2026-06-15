---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225841
source_type: confluence
---
# Billing Accounts — Управление биллингом и MRR

## Что такое Billing Account

BillingAccount — это **контрактная/инвойсинговая сущность** между Shiptify и клиентом. Он находится между SalesAccount (коммерческий CRM-уровень) и OPS-аккаунтами (операционные шипперы). Один SalesAccount может иметь несколько BillingAccounts.

```
SalesAccount
  └── BillingAccount (контракт, условия оплаты, MRR)
        └── OPS Accounts / Shippers (операционные аккаунты платформы)
```

## Модель данных (`billing_accounts`)

| Поле | Тип | Описание |
|---|---|---|
| `name` | STRING | Название биллингового аккаунта |
| `accounting_name` | STRING | Бухгалтерское название |
| `galaxy_id` | INTEGER | Организационная группа |
| `monthly_fee` | INTEGER | Фиксированная ежемесячная оплата |
| `monthly_min` | INTEGER | Минимальный ежемесячный порог |
| `max_shipments` | INTEGER | Максимальное число отправок |
| `total_price` | DECIMAL(10,3) | Текущий MRR |
| `currency_code` | STRING(3) | Валюта (default: EUR) |
| `vat` | INTEGER | НДС в % (default: 20) |
| `invoicing_frequency` | STRING | Периодичность выставления счетов (default: `monthly`) |
| `invoicing_day` | INTEGER | День выставления счёта (default: 1) |
| `po_requested` | BOOLEAN | Требуется ли Purchase Order |
| `payment_term_id` | INTEGER | FK → `dict_payment_terms` |
| `address_id` | INTEGER | FK → `billing_account_addresses` |
| `is_active` | BOOLEAN | Активен ли аккаунт |
| `deleted_at` | DATE | Soft delete (paranoid: true) |

## MRR-линии (`billing_account_mrr_lines`)

Каждый BillingAccount содержит MRR-линии — отдельные строки подписок на продукты.

| Поле | Описание |
|---|---|
| `type` | Тип продукта: `tm`, `dock`, `option`, `parcel`, `track`, `buy_sell` |
| `date_from` / `date_to` | Период подписки |
| `total_price` | Цена линии (DECIMAL) |
| `currency_code` | Валюта (default: EUR) |
| `status` | Статус изменения: `churn`, `downgrade`, `upgrade` |
| `status_reason`, `status_comment`, `status_date` | Детали изменения статуса |
| `invoicing_comment` | Комментарий для инвойса |
| `internal_comment` | Внутренний комментарий |
| `main_mrr_line_id` | Self-reference для связи линий |

## Правила по типам продуктов

Для каждого типа MRR-линии существует отдельная таблица правил:

| Таблица | Тип | Обязательные поля правила |
|---|---|---|
| `billing_account_mrr_rule_tms` | tm | `mode`, `count_shipments`, `price` |
| `billing_account_mrr_rule_docks` | dock | `quantity`, `type`, `price` |
| `billing_account_mrr_rule_parcels` | parcel | `mode`, `count_shipments`, `price` |
| `billing_account_mrr_rule_options` | option | `type`, `price` |
| `billing_account_mrr_rule_tracks` | track | `count_shipments`, `price` |
| `billing_account_mrr_rule_buy_sell` | buy_sell | `price` |

## Спот-ценообразование (`billing_account_spots`)

Споты — это разовые/временные прайсинговые записи. Обязательные поля: `name`, `date`, `types` (каждый тип имеет `type`, `quantity`, `price`).

## Процесс работы с MRR

1. Создание BillingAccount и привязка к SalesAccount
2. Добавление MRR-линий (`POST /api/v1/billing-accounts/:id/mrr-line`) с типом, периодом и правилами
3. Массовое назначение OPS-аккаунтов (шипперов) к BillingAccount (`PATCH /api/v1/billing-accounts/:id/accounts`)
4. Добавление контактов для выставления счетов
5. Изменение статуса MRR-линии (`PATCH /api/v1/billing-accounts/:id/mrr-line/:id/status`) при churn/downgrade/upgrade
6. Суммирование MRR отражается в `SalesAccountMrr` (цель и факт за год)

## API-маршруты

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/billing-accounts` | Список с фильтрами (galaxy, поиск, сортировка) |
| POST | `/api/v1/billing-accounts` | Создание |
| GET | `/api/v1/billing-accounts/:id` | Детальная запись |
| PATCH | `/api/v1/billing-accounts/:id` | Обновление |
| GET/POST | `/api/v1/billing-accounts/:id/contacts` | Контакты |
| PATCH/DELETE | `/api/v1/billing-accounts/:id/contacts/:contact_id` | Редактирование/удаление контакта |
| GET | `/api/v1/billing-accounts/:id/mrr-lines` | Список MRR-линий |
| POST | `/api/v1/billing-accounts/:id/mrr-line` | Создание MRR-линии |
| PATCH | `/api/v1/billing-accounts/:id/mrr-line/:mrr_line_id` | Обновление MRR-линии |
| PATCH | `/api/v1/billing-accounts/:id/mrr-line/:mrr_line_id/status` | Изменение статуса MRR-линии |
| DELETE | `/api/v1/billing-accounts/:id/mrr-line/:mrr_line_id` | Удаление MRR-линии |
| GET/POST | `/api/v1/billing-accounts/:id/spots` | Споты |
| PATCH/DELETE | `/api/v1/billing-accounts/:id/spot/:spot_id` | Редактирование/удаление спота |
| PATCH | `/api/v1/billing-accounts/:id/accounts` | Переназначение OPS-аккаунтов |
| GET | `/api/v1/billing-mrr-lines` | Глобальный список MRR-линий |

## Глобальный список MRR-линий

Страница `billingMrrLines.tsx` показывает все MRR-линии во всех BillingAccounts с фильтрацией и экспортом. Позволяет Finance-команде отслеживать полный биллинговый портфель.

---

## 🔗 Граф-метаданные
- **id:** `back-office.billing-accounts`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632225841 · **repo:** `back-office/billing-accounts/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

