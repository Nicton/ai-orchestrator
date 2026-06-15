---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631799826
source_type: confluence
---
# Operations — Просмотр операций в Back-Office

## Обзор

Раздел Operations предоставляет команде Back-Office инструменты для мониторинга операционной активности: запросов на котировку, трекинга, инвойсинга, а также управления специализированными рабочими процессами (TMS-лиды, Dock-лиды, онбординг).

## Quote Requests (Запросы котировок)

Страница `requests.tsx` — список запросов на котировки и отправки.

**API:** `GET /api/v1/quote_requests` — поиск с пагинацией.

Модели: `QuoteRequest`, `QuoteRequestService`.

## Операционные дашборды (iframe-дашборды)

Back-Office интегрируется с внешней дашборд-системой через signed JWT-токены.

| Дашборд | Маршрут | Описание |
|---|---|---|
| Today Dashboard | `GET /api/v1/dashboards/today` | Дашборд активности за сегодня |
| Ops Dashboard | `GET /api/v1/dashboards/ops` | Операционный дашборд |
| Ops Excel Export | `GET /api/v1/dashboards/ops/excel` | Экспорт в Excel через очередь задач |

URL дашборда формируется как `{config.dashboardUrl}/dashboards/{type}/{token}`. Токен содержит `type` и TTL (1 день для shared, 7 дней для internal). Excel-экспорт публикуется в очередь через `publishExcelActions('operationsDashboardExport', ...)` и выполняется асинхронно.

## TMS Leads и Pending TM

Страница `pendingTm.tsx` — список шипперов, ожидающих активации TMS-модуля.

**API:** `GET /api/v1/accounts-operations/pending-tm`

Операции:
- Просмотр статуса TMS-онбординга
- Обновление информации TMS: `PATCH /api/v1/accounts/tms-info`
- Добавление комментариев: `POST /api/v1/accounts/tms-comment`
- Удаление комментариев: `DELETE /api/v1/accounts/tms-comment/:id`
- Просмотр истории комментариев: `GET /api/v1/accounts/tms-comments`

Модели: `TmsLeads`, `TmsLeadsComment`.

## Dock Leads

Страница `dockLeads.tsx` — pipeline по продукту Dock (управление складскими слотами).

**API:** `GET /api/v1/accounts-operations/pending-dock`

Страница `pendingDocks.tsx` включает функциональность **массового назначения BillingAccount** (`POST /api/v1/accounts/bulk-assign-billing`) для пакетной привязки аккаунтов к биллингу.

## Alerting (Оповещения)

Страница `alerts.tsx` — управление системными оповещениями для пользователей платформы Shiptify.

**Поля Alert (JSONB `data`):**
| Поле | Значения |
|---|---|
| `severity` | Уровень критичности (red / orange / blue) |
| `audience.method` | `ACCOUNT_TYPE` или `FUNCTIONALITY` |
| `audience.account_types` | Список типов аккаунтов (если method=ACCOUNT_TYPE) |
| `audience.functionalities` | Список функциональностей (если method=FUNCTIONALITY) |
| `messages.en` | Сообщение на английском (обязательно, мин. 30 символов) |
| `messages.*` | Сообщения на других языках (опционально) |

**Поля даты:** `valid_from`, `valid_to` — опциональный период действия алерта.

**API-маршруты:**
| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/alerts` | Список (limit ≤ 100, сортировка DESC by created_at) |
| POST | `/api/v1/alerts` | Создание (с валидацией severity, audience, EN-сообщения) |
| PATCH | `/api/v1/alerts/:id` | Обновление |
| DELETE | `/api/v1/alerts/:id` | Удаление |

Алерт немедленно отображается как баннер всем целевым пользователям. Скрывается только на текущую сессию (повторно появляется при следующем входе).

## NSM (North-South Metrics)

Страница `nsm.tsx` — статистика активных аккаунтов по продуктам.

**API:** `GET /api/v1/nsm-statistic`

Возвращает статистику уникальных аккаунтов по месяцам за 25 месяцев:
- `tmStats` — TM-аккаунты (≥10 отправок)
- `sbStats` — Slotbook-аккаунты (<10 TM отправок, >5 SB отправок)
- `slotifyStats` — Slotify-аккаунты
- `tmsbStats` — TM + SB совместно

Данные кэшируются в Redis (ключ `nsm`). Текущий месяц загружается всегда в реальном времени поверх кэша.

## Onboarding (Онбординг шипперов)

Онбординг-процесс интегрирован в accounts-operations. Статусы: `Pending` → `Setup` → `Go-live` → `Monitor` → `Care` → `Run`.

**API:** `GET /api/v1/accounts-operations/load-onboarding-mentors` — список менторов онбординга.

Модель `AccountMentor` отслеживает назначение ментора на аккаунт.

## Growth-инструменты

| Инструмент | Описание |
|---|---|
| `newSellers.tsx` | Новые продавцы / клонирование продавцов |
| `referrals.tsx` | Реферальная программа |
| `linkedin.tsx` | Публикации LinkedIn |
| `spectators.tsx` | Аккаунты-наблюдатели |

**API для referrals:** `GET /api/v1/referrals`
**API для linkedin:** `GET/POST/PATCH/DELETE /api/v1/linkedin-post`
**API для clone sellers:** `GET /api/v1/clone-sellers`

---

## 🔗 Граф-метаданные
- **id:** `back-office.operations`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631799826 · **repo:** `back-office/operations/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

