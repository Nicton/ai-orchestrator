---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631799810
source_type: confluence
---
# Open Questions — Admin-App

> **Обновление 2026-06-11:** сверка с кодом `workspaces/admin-app/`. ✅ — ответ из кода, ❓ — остаётся (команда/DevOps).

## Аутентификация и доступ

| # | Вопрос | Ответ |
|---|--------|-------|
| 1 ✅ | requireAdmin | Проверка строки `'admin'` в поле `roles` пользователя (CSV-строка) — `auth.js:25`, `passport.js:81`. **Уровней админов нет** (никаких super-admin/read-only). |
| 2 ✅ | Google OAuth — домен | **Ограничения @shiptify.com нет**: после OAuth ищется User по email + проверяются roles (`googleStrategy.js:19,32-43`). Контроль — наличием админ-учётки. |
| 3 ✅ | Impersonation аудит | Логируется как обычный запрос (bunyan); создаётся запись **AdminAccessToken** (admin_id, user_id, token — `admin_access_token.js:14-26`) — след есть в БД. Уведомления пользователю нет. |

## Аккаунты и онбординг

| # | Вопрос | Ответ |
|---|--------|-------|
| 4 ✅ | PendingAccount | Создаётся вручную через POST API. Дубль email **не обрабатывается** — accept() падает на constraint БД (`pending-accounts.js:381`). ⚠️ Кандидат на улучшение. |
| 5 ✅ | Freemium | `is_freemium = !!sponsor_account_id` (`pending-accounts.js:30,338`) — простая производная, отдельных ограничений в коде нет. |
| 6 ✅ | CUSTOMS-аккаунт | Отдельного флоу нет: POST /accounts транзакцией создаёт Account + Shipper/Carrier + Division + связи (`accounts.js:124-207`); GET /accounts/customs — просто фильтр. |
| 7 ⚠️ | DELETE /accounts/:id | Вызывает destroy(); Account paranoid=true → **soft delete**, но каскады не описаны в коде — зависят от FK миграций. Поведение для users/integrations/shipments не определено явно. |

## Интеграции

| # | Вопрос | Ответ |
|---|--------|-------|
| 8 ✅ | FedEx read-only | UI только list-эндпоинты (`integration-fedex-api-accounts.js:13-58`); записи создаются POST-ом API/синхронизацией вне UI. |
| 9 ✅ | integration_name | Захардкоженный список строк в `integration_names.js:1-49` (НЕ DB enum). |
| 10 ✅ | Customer Auth Credentials | Generic-таблица login/password пар для интеграций с auth (UPS, DHL GF/Express, SAP...) — `customer-auth-credantials.js`. |
| 11 ✅ | Duplicate vs Collision | **Duplicate** — совпадение бизнес-ключа (UPS: ups_shipper_number; DHL: account_number), до 5 совпадений. **Collision** — конфликт комбинации (UPS: account_id+country_code+galaxy_service_id; DHL: account_id+accounting_entity_id). `ups/accounts.js:397`, `dhl-gfw/accounts.js:260`. |
| 12 ✅ | EDIFACT-конфиг | Таблица `edifact_agencies`: agency_code, agency_name, environment, is_active, carrier_id XOR shipper_id (`edifact_agency.js`). Направление in/out в конфиге не разделяется. |

## Пользователи и права

| # | Вопрос | Ответ |
|---|--------|-------|
| 13 ✅ | ACL значения | modules: **claims, requests, tracks** (захардкожено, `users.js:72-82`); роль ACL: operator (+spectator). Иерархия дивизионов — nested-set в ShipperACL/CarrierACL. |
| 14 ❓ | Multi-account UX | Со стороны admin-app не отвечается; в main app — переключатель Ctrl+K (см. TMS-доки). |
| 15 ❓ | Redis per-user | Из admin-app кода не видно полного набора — вопрос main-app backend (известно: сессии + ACL-кэш). |
| 16 ✅ | 2FA | **Опциональна** (`is_2fa` поле): после setConfirmationCode → `is_verified_2fa=true`, далее OTP при логине (`two-factor-auth.js:100-124`). Обязательности для админов нет. ⚠️ security-бэклог. |

## Справочники

| # | Вопрос | Ответ |
|---|--------|-------|
| 17 ✅ | Режимы/валюты | Полный CRUD через UI (dictionaries-*.js). **Защиты от удаления используемых значений в коде нет** — только FK-constraints БД. ⚠️ |
| 18 ❓ | Accounting Entities — источник | В admin-app только CRUD; синхронизация из SAP/1C не найдена — вероятно, ручное ведение. Подтвердить у команды. |
| 19 ⚠️ | Transit Companies | Справочник `DictionaryTransitCompany` — морские перевозчики (SCAC) для SeaLeg/Kpler (см. tms/features/sea-freight-ship-data.md). |

## Мониторинг и операции

| # | Вопрос | Ответ |
|---|--------|-------|
| 20 ✅ | Daily Report | Захардкожен: `config.emails.daily_report.to = board@shiptify.com` (`default.json:39-53`). |
| 21 ❓ | QuickSight | Из кода не видно состава дашбордов — DevOps/BI. |
| 22 ✅ | Kue retry | UI **только статистика** (`kue-stats.js`), retry из Admin-App нет. |

## Архитектура

| # | Вопрос | Ответ |
|---|--------|-------|
| 23-24 ✅ | Версии | **Sequelize ^3.19.2** (EOL, `package.json:96`); Node-версия не зафиксирована в package.json (нет engines) — фактическая зависит от окружения. ⚠️ Техдолг подтверждён. |
| 25 ✅ | События при изменении интеграций | **Нет** — updateActiveIntegration() просто UPDATE без событий/шины (`active-integrations.js:263`); изменения действуют со следующего запроса. |
| 26 ❓ | Prod deployment | Вопрос DevOps (из кода: та же БД main app). |

## История
| Дата | Изменение |
|------|-----------|
| 2026-06-11 | Сверка с кодом: 18✅/3⚠️/5❓. Ключевое: уровней админов нет; Google OAuth без доменного фильтра; impersonation оставляет след в AdminAccessToken; 2FA опциональна; Sequelize 3 EOL; интеграции меняются без событий. |

---

## 🔗 Граф-метаданные
- **id:** `admin-app.open-questions`
- **type:** module-doc · **domain:** Admin-App · **status:** implemented
- **confluence:** 631799810 · **repo:** `admin-app/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Admin-App
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

