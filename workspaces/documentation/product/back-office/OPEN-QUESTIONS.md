---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632389650
source_type: confluence
---
# Open Questions — Back-Office

> **Обновление 2026-06-11:** сверка с кодом `workspaces/back-office/` (server + client). ✅ — ответ из кода, ❓ — остаётся (Product/команда BO).

## BON (BO Notifications)

| # | Вопрос | Ответ |
|---|--------|-------|
| 1 ⚠️ | Статус BON-системы | Тачпоинты с @mentions работают (`SalesAccountTouchpoint`, JSONB, email-уведомления). Полная BON-система (инбокс, bo_notifications, автоархив 20 дней) — **не реализована**, спека в messaging/bo-notifications.md. Jira-тикет не найден → Product. |
| 2 ❓ | Схема bo_notifications | Таблицы нет — схема не утверждена. |
| 3 ⚠️ | Парсинг @mentions | Реализован синхронно при сохранении тачпоинта (`SalesAccountTouchpoint.js`); для BON-инбокса — вопрос будущей реализации. |
| 4-5 ❓ | Email-шаблоны BON, автоархив 20 дней | Не реализовано — вопросы к дизайну BON. |

## Sales Accounts

| # | Вопрос | Ответ |
|---|--------|-------|
| 6 ✅ | MRR_YEAR=2026 | **Захардкожен в двух местах**: `server/services/salesAccounts/sales_accounts.js:10` и `client/constants/salesAccount.ts:39`. Переключение — ручная правка кода. ⚠️ Техдолг: сломается 2027-01-01. |
| 7 ✅ | Иммутабельность тачпоинтов | Подтверждено: в модели `SalesAccountTouchpoint` нет `deleted_at`/paranoid — soft delete отсутствует. Исправление ошибки AM — только новым тачпоинтом. |
| 8 ✅ | Группы contact_info | **Док был неверен**: в коде группы = `top_1, top_2, top_3, other` (enum `SA_GROUP`, `client/constants/salesAccount.ts:43-48`), а не VHP/Potential/Tapped. |
| 9 ✅ | ToPo формула | `CALL_FREQ_EXPR * 1.1 → 'late'`, `* 0.8 → 'limit'` — захардкожено в SQL (`sales_accounts.js:590-591`), **не конфигурируемо**. |

## Billing Accounts

| # | Вопрос | Ответ |
|---|--------|-------|
| 10 ✅ | SalesAccount ↔ BillingAccount | Через **galaxy_id** (`SalesAccount.js:22-28`) — прямого FK нет. |
| 11 ✅ | mode в MRR-линиях | Enum в коде (`BillingAccountMrrLines.js:101-107`): **TM, DOCK, OPTION, PARCEL, TRACK, BUY_SELL** (в БД STRING). |
| 12 ❓ | Жизненный цикл спота | В коде не определён — Product. |

## Operations / NSM

| # | Вопрос | Ответ |
|---|--------|-------|
| 13 ✅ | NSM кэш | TTL **3600 сек (1 час)** (`server/services/cache.js:13`); инвалидация только ручная `cacheRemove()`, авто-триггеров нет. |
| 14 ✅ | Onboarding статусы | **В коде не хранятся** — Onboard Module v1.0 (Pending→Setup→Go-live→Monitor→Care→Run) не реализован; есть лишь метрика countUsersPending. Спека из слайдов. |
| 15 ✅ | dashboardUrl | Iframe-дашборды Kibana/Grafana, staging `https://dashboards.blu.shipt.io` (`config/develop.json:12`, `services/dashboards.js:22`). |

## Carriers

| # | Вопрос | Ответ |
|---|--------|-------|
| 16 ✅ | Replace Carrier | Переносит **shipments, claims, quote requests, shipment requests, shipment templates** на нового перевозчика в транзакции (`services/carriers.js:352-414`). |
| 17 ✅ | Killed Carriers | **Только вручную** — флаг `is_killed` на Account (`Account.js:218`); авто-триггеров нет. |

## Общие

| # | Вопрос | Ответ |
|---|--------|-------|
| 18 ✅ | Elasticsearch | Только **Quote Requests** (`indexQr`, `services/elasticsearch/`). |
| 19 ⚠️ | RBAC матрица | Явной матрицы нет: роли в таблицах Users/Roles/RolesGroups + ShipperACL/CarrierACL с кэшем (`utils/acl.js`). Документированной матрицы ролей не существует — стоит составить. |
| 20 ✅ | Языки | Объявлено **17 локалей** (`client/constants/app.ts`), реально переведены **EN и FR** (остальные пустые). |

## История
| Дата | Изменение |
|------|-----------|
| 2026-06-11 | Сверка с кодом: 13✅/3⚠️/4❓. Ключевое: BON и Onboard Module не реализованы (спеки); MRR_YEAR=2026 захардкожен (техдолг!); группы top_1..3/other (не VHP); ToPo-коэффициенты в SQL. |

---

## 🔗 Граф-метаданные
- **id:** `back-office.open-questions`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632389650 · **repo:** `back-office/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

