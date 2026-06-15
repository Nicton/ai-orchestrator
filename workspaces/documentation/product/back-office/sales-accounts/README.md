---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029218
source_type: confluence
---
# Sales Accounts — Модуль CRM для Account Managers

## Что такое Sales Account

SalesAccount — это коммерческая сущность в CRM-системе Back-Office. Она представляет отношения между Shiptify и клиентом на уровне Account Manager. Это **верхний уровень трёхуровневой иерархии**:

```
SalesAccount (коммерческие отношения, один AM)
  └── BillingAccount (контракт / счёт на оплату)
        └── OPS Account / Shipper (операционный аккаунт)
```

SalesAccount отличается от OPS-аккаунта: OPS-аккаунт — это платформенная сущность (шиппер), а SalesAccount — CRM-запись AM.

## Модель данных (`sales_accounts`)

| Поле | Тип | Описание |
|---|---|---|
| `name` | STRING | Название клиента |
| `comment` | TEXT | Свободный комментарий |
| `account_manager_id` | INTEGER | Назначенный AM (FK → users) |
| `galaxy_id` | INTEGER | Организационная группа |
| `total_price` | DECIMAL(10,3) | Текущий MRR (EUR по умолчанию) |
| `currency_code` | STRING(3) | Валюта (default: EUR) |
| `role` | STRING | Тип клиента: `manufacturer`, `retail_b2b`, `retail_b2c`, `retail_pure_e_commerce`, `4_pl`, `3_pl_log`, `freight_forwarder`, `carrier`, `software` |
| `type` | STRING | Размер: `global`, `eti_large`, `smb` |
| `risk_level` | STRING | Риск оттока: `low`, `med`, `high` (синхронизируется из тачпоинтов) |
| `contact_info` | JSONB | Частота звонков, группа — ⚠️ по коду (2026-06-11): **top_1/top_2/top_3/other** (enum SA_GROUP), а не VHP/Potential/Tapped из слайдов, настроение |
| `deleted_at` | DATE | Soft delete (paranoid: true) |

## Связанные таблицы

| Таблица | Назначение |
|---|---|
| `sales_account_statuses` | Статусы жизненного цикла: `active` → `paused` → `churned` |
| `sales_account_addresses` | Адрес (zipcode, city, country, logistic_zone) |
| `sales_account_contacts` | Контакты (Decision Maker, Key User, Others) |
| `sales_account_tags` + `dict_sales_account_tags` | Теги из словаря |
| `sales_account_mrr` | MRR по годам: `mrr_value` (факт), `mrr_target` (цель), год 2026 |
| `sales_account_opportunities` | Возможности с `target_revenue`, `type`, `target_date` |
| `sales_accounts_am_opps` | AMOpps: покрытие продуктами (JSONB) |
| `sales_accounts_touchpoints` | Тачпоинты (история взаимодействий) |
| `sa_touchpoints_history` | История изменений статусов тачпоинтов (для дашборда) |

## Система ToPo (своевременность контактов)

ToPo — расчётный статус, показывающий насколько своевременно AM контактирует с клиентом. Рассчитывается на основе поля `call_freq` из `contact_info`:

| Статус | Условие |
|---|---|
| `LATE` | `last_touchpoint_days > call_freq × 1.1` |
| `LIMIT` | `last_touchpoint_days > call_freq × 0.8` |
| `ON_TIME` | Иначе |

## Тачпоинты (Touchpoints)

Тачпоинты хранятся как записи в `sales_accounts_touchpoints` с данными в поле `data` (JSONB):

| Поле в JSONB | Значения |
|---|---|
| `type` | `visio`, `call`, `on_site`, `steering_committee`, `internal_note` |
| `mood` | Целое число 1–5 (1=Angry, 2=Sad, 3=Neutral, 4=Happy, 5=Love) |
| `churn_risk` | `no_idea`, `low`, `medium`, `high` |
| `likes`, `hates`, `notes`, `detailed_notes` | Текстовые поля |
| `main_contact` | FK → `sales_account_contacts` |

При создании/обновлении тачпоинта: `mood` и `churn_risk` **атомарно записываются** в `sales_accounts.risk_level` и `contact_info.mood` в той же транзакции. История изменений пишется в `sa_touchpoints_history`. Тачпоинты после создания **неизменяемы** (удаление поля `deleted_at` из модели).

## AMOpps (AM Opportunities)

AMOpps — трекер покрытия продуктами по каждому клиенту. Хранится в `sales_accounts_am_opps` как JSONB.

**Типы продуктов:**
- TM-семейство: `plug_and_play`, `labelling`, `seatrack`, `invoicing`, `control_tower`, `api_connection`
- Dock-семейство: `plug_and_play`, `visit`, `driver_welcome`, `api_connection`
- Прочие: `crossell_group`, `other`

**Статусы:** `covered`, `pending`, `refused`, `competitor`, `na`, `unknown`

Поля в `data`: `type`, `status`, `value` (EUR), `note`.

## Фильтры на странице списка

`GET /api/v1/sales-accounts` поддерживает параметры: поиск по имени, galaxy, country, logistic_zone, status, tags, role, type, group (top_1/top_2/top_3/other — см. выше), mood, churn_risk (topo), диапазоны MRR value/target/potential, типы MRR-линий, покрытие/ожидание по продукту, account_manager. Активные фильтры **сохраняются в URL** и localStorage, сбрасываются кнопкой "Reset Filters".

## API-маршруты

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/sales-accounts` | Постраничный список с фильтрами |
| GET | `/api/v1/sales-accounts/:id` | Детальная запись |
| PATCH | `/api/v1/sales-accounts/:id` | Обновление |
| PATCH | `/api/v1/sales-accounts/:id/update-status` | Смена статуса жизненного цикла |
| GET/POST | `/api/v1/sales-accounts/:id/contacts` | Контакты |
| PATCH/DELETE | `/api/v1/sales-accounts/:id/contacts/:contact_id` | Редактирование/удаление контакта |
| GET | `/api/v1/sales-accounts/:id/mrr-lines` | MRR-линии из BillingAccounts |
| GET/POST | `/api/v1/sales-accounts/:id/touchpoints` | Тачпоинты |
| PATCH | `/api/v1/sales-accounts/:id/touchpoints/:touchpointId` | Обновление тачпоинта |
| GET/POST | `/api/v1/sales-accounts/:id/am-opportunities` | AMOpps |
| DELETE | `/api/v1/sales-accounts/:id/am-opportunities/:opp_type` | Удаление AMOpp |
| GET/POST/DELETE | `/api/v1/sales-accounts/:id/opportunities` | Обычные возможности |
| GET | `/api/v1/sales-accounts/touchpoints` | Глобальный список тачпоинтов |
| GET | `/api/v1/sales-accounts/am-opportunities/list` | Глобальный список AMOpps |
| GET | `/api/v1/sales-accounts/log-zones` | Автодополнение логистических зон |
| GET | `/api/v1/sales-accounts-tags` | Поиск по словарю тегов |

---

## 🔗 Граф-метаданные
- **id:** `back-office.sales-accounts`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632029218 · **repo:** `back-office/sales-accounts/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

