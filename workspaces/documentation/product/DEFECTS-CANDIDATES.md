---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029185
source_type: confluence
---
# Код vs Требования — кандидаты в дефекты

> Сформировано по итогам код-аудита 2026-06-11 (10 списков вопросов, ~240 вопросов, 14+ параллельных исследований кода). Каждый пункт — место, где **код противоречит требованию/документации** или несёт скрытый риск. Это кандидаты: перед заведением тикета подтвердить на стенде.

## 🔴 Высокий приоритет (поведение противоречит требованию / сломается само)

| # | Что | Требование | Код | Где | Риск |
|---|-----|-----------|-----|-----|------|
| D1 → **TMS-3738** | Отмена контейнера в MC | REQ-MC-008: «отмена одного контейнера **не отменяет** всё бронирование» | Установка `canceler_id` вызывает `cancelShipmentRequestById()` — **отменяется всё бронирование**; механизма отмены одного контейнера нет | `backend/app/services/shipments.js:1969-1976` | Потеря брони всех контейнеров при попытке отменить один |
| D2 → **TD-1222** | MRR_YEAR захардкожен | Биллинг-аналитика BO должна работать постоянно | `MRR_YEAR=2026` зашит в двух местах | `back-office/server/services/salesAccounts/sales_accounts.js:10`, `client/constants/salesAccount.ts:39` | **Сломается 2027-01-01** |
| D3 → **TMS-3739** | Kpler без SCAC — тихий пропуск | TRACK-001: SCAC обязателен для активации | `createContainerTracking()` возвращает `false`, перевозчик отфильтровывается — **ни ошибки, ни предупреждения пользователю** | `integration/marine-traffic/impl.js:299-307`, `dataResolver.js:553` | Клиент думает, что трекинг включён, а его нет |
| D4 → **TMS-3740** | Дубли TP при P44+Shippeo | Один источник истины трекинга | Оба источника создают TP независимо; dedup только внутри источника (по type/code/dates), приоритета нет | `services/tracking/external.js:196-231`, `models/tracking.js:104` | Двойные/противоречивые события в Tracking List |
| D5 → **TMS-3741** | Qase-кейс 1340 (RTB) | Тест должен проверять RTB | Кейс утверждает «включается фильтр Draft» — фактически RTB имеет **собственный статус и вкладку** `ready_to_book` | `shipment_request.js:718,825`; кейс 1340 | Тест проверяет неверное ожидание (copy-paste из 1339) |

## 🟡 Средний (расхождение дизайна и кода — уточнить намерение)

| # | Что | Требование/док | Код | Где |
|---|-----|----------------|-----|-----|
| D6 | Fuel Surcharge «cron» | Доки: «обновляется периодически (cron)» | Cron-задачи **нет** — только ручная загрузка XLS | `models/fuel_surcharge_sheets.js`, `rate_sheet_upload.js`; доки исправлены 2026-06-11 |
| D7 | TR: видимость чужих котировок | Sealed-сценарии (буд. Quote Strategy) требуют закрытости | Все перевозчики на одном Transport Request **видят ответы друг друга** | `mini-apps/src/services/access-tokens/index.js:10` |
| D8 | Переименование контейнера | REQ-MC-002: «после подтверждения пакинг-лист не меняется» (суффикс?) | `PATCH /shipments/:id/name` меняет `container_name` **в любом статусе** (только ACL) | `services/shipments.js:4197` |
| D9 | Consolidation-флаг проверяется не везде | Флаг `allow_financial_consolidation` должен ограничивать функцию | Проверка **только при пересчёте**, при назначении группы (PUT) и удалении — нет | `public-api/financial-groups/helper.js:428` vs `index.js:239-306` |
| D10 | Incoterm в ретро-консолидации | REQ-RS-019: одинаковый incoterm обязателен | Incoterm **не загружается и не проверяется** | `financial-groups/helper.js:500-543` |
| D11 | Slotify «100% занятость» | Видео/слайды: «слот больше нельзя создать» | Жёсткого блока нет — проверяются только зона/часы/праздники; overlapping на двери лишь подсвечивается оранжевым | `dock-door-assignment` view; `services/slots` |
| D12 | Sales-группы | Слайды/доки: VHP/Potential/Tapped | Enum `SA_GROUP`: **top_1/top_2/top_3/other** | `back-office/client/constants/salesAccount.ts:43-48`; доки исправлены |
| D13 | Counter-offer перевозчика | BOOK-048..052 (слайды): альтернативные даты/контр-предложение | Полей нет — перевозчик просто перезаписывает cost/dates в PATCH | `controllers/api/quote_requests.js:1017` |
| D14 | DOCK specificities | Слайды 2026-05: tag chips ADR/Temp/Bulk на воротах | Словаря и enforcement **нет**; модель ворот минимальна | `models/location_zones_dock_door.js` |
| D15 | AI Reader: private-attach | Слайды: «документ автоприкрепляется к SR как private» | Документ не прикрепляется — только metadata-связь `used_for` | `ai-extract/api-info.ts:93` |
| D16 | AI Reader: Google Maps | Слайды: цепочка PML→AddressBook→Google→Manual | Google-этапа нет: PML DB → создание нового | `ai-worker/convert-csw-data.ts:118-130` |

## 🔒 Security-бэклог (не дефекты функционала, но риски)

| # | Что | Код | Где |
|---|-----|-----|-----|
| S1 → **TD-1223** | MFA отсутствует | totp/mfa в ms-auth — 0 вхождений (speakeasy только для FedEx) | `microservices/node/auth` |
| S2 → **TD-1224** | 2FA админов опциональна | `is_2fa` — opt-in, обязательности нет | `admin-app/.../two-factor-auth.js:100` |
| S3 → **TD-1225** | Google OAuth без доменного фильтра | Ограничения @shiptify.com нет — только наличие учётки с ролью | `admin-app/googleStrategy.js:19,32` |
| S4 → **TD-1226** | Ротация SAML-cert и Client Secret | Механизмов нет (один секрет, замена = downtime) | `sso_keys`; `oauth-tokens.js:301` |
| S5 | PendingAccount: дубль email | Не обрабатывается — accept() падает на constraint БД | `admin-app/pending-accounts.js:381` |
| S6 | Справочники: удаление используемых значений | Защиты в коде нет — только FK БД | `admin-app/dictionaries-*.js` |
| S7 | DAG-worker без stage-timeout (AI Orchestrator) | Зависший агент висит бесконечно | `ai-orchestrator/src/worker.js:61-276` |
| S8 | Транскрипция intake сломана | `transcribeAudioFile()` бросает ошибку после удаления Whisper | `ai-orchestrator/src/llm.ts:70` |

## 📋 Тест-долг (выявлено аудитом)

- Qase 1340 — исправить ожидание (см. D5)
- Qase 2826-2829 (Milkrun+MC) — без description; код взаимодействие допускает, кейсы дописать
- TC «Heppner CO2» — CO2 в heppner/ нет; уточнить, что тестируется (вероятно EcoTransit обычных отправок)
- Кейсы Slotify inactive-account (4.4 mini-apps) — краевой случай не покрыт

---

| Дата | Изменение |
|------|-----------|
| 2026-06-11 (2) | Заведены тикеты: TMS-3738/3739/3740/3741, TD-1222..1226 (label code-audit-2026-06). |
| 2026-06-11 | Первая версия: 16 функциональных кандидатов + 8 security + 4 тест-долга. Источник — код-аудит всех модулей. |
