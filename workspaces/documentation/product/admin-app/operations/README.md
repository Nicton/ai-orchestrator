---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632160305
source_type: confluence
---
# Мониторинг и операции

## Обзор

Раздел Operations включает инструменты для наблюдения за состоянием платформы в реальном времени: операционный дашборд с метриками активности, embedded BI от Amazon QuickSight, мониторинг очереди фоновых задач и журнал вызовов интеграций.

Это read-heavy раздел — большинство инструментов предназначены для наблюдения, а не для изменений.

---

## Операционный дашборд (`/api/v1/dashboard`)

Агрегирует ключевые метрики платформы за выбранный период.

```
GET /api/v1/dashboard?startDate=...&endDate=...
```

### Что отображается

| Метрика | Описание |
|---|---|
| Shipments | Количество отправлений за период |
| Quote Requests | Количество запросов котировок |
| Tracking Points | Количество трекинговых событий |
| Chat Messages | Количество сообщений в чате |
| Active Users Activity | Активность пользователей по месяцам (чат-посты) |

### Email-отчёт

Dashboard-контроллер включает сервис `email-report`, который умеет:
- `findShipments`, `findQuoteRequests`, `findTrackingPoints`, `findChatMessages` — запросы к базе
- `buildShipmentsInfo`, `buildQuoteRequestsInfo`, `buildChatMessagesInfo` — форматирование данных
- `sendDailyReportEmail` — отправка ежедневного отчёта

Ежедневный email-отчёт отправляется автоматически через Kue job. Может быть отправлен вручную из интерфейса.

### Временные диапазоны

Поддерживаются гибкие диапазоны: по дате начала/конца, с группировкой по месяцам (`TO_CHAR(created_at, 'YYYY-MM-01')`).

---

## Amazon QuickSight (`/api/v1/quicksight`)

Embeds Amazon QuickSight BI-дашборд в Admin-App.

```
GET /api/v1/quicksight
```

Контроллер получает presigned URL для embedded-сессии через AWS SDK (`amazon-quicksight-embedding-sdk 1.0.x`). Дашборд отображается в iframe внутри AngularJS SPA.

Предоставляет более глубокую аналитику, чем операционный дашборд: исторические тренды, сегментация, BI-отчёты.

---

## Kue Stats — очередь фоновых задач (`/api/v1/kue-stats`)

Мониторинг состояния Redis-backed очереди Kue.

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/kue-stats/types` | Список типов job-ов в очереди |
| `GET` | `/api/v1/kue-stats` | Статистика по job-ам (count по статусам) |

### Какие задачи проходят через Kue

На основе кода приложения через Kue обрабатываются:
- **Login events** — запись событий входа в систему (async, чтобы не замедлять логин)
- **Email sends** — отправка email через SendInBlue (приглашения, уведомления)
- **Daily report** — ежедневный email-отчёт дашборда

Раздел `kue-stats` в UI отображает типы задач и их количество по статусам (active, waiting, failed, complete).

---

## Integration Logs (`/api/v1/integration-logs`)

Read-only журнал всех HTTP-вызовов к внешним API перевозчиков.

```
GET /api/v1/integration-logs
GET /api/v1/integration-logs/:id
```

### Когда использовать

- Отладка интеграции: посмотреть, что именно было отправлено в API UPS/DHL/FedEx
- Расследование ошибок: найти failed-запросы с кодом ошибки
- Аудит: проверить, когда и с какими параметрами выполнялись вызовы

Журнал не редактируется через Admin-App — только чтение.

---

## Login Events (`/api/v1/login-events`)

Аудит-лог всех попыток входа на платформу.

```
GET /api/v1/login-events
```

В UI раздел `login-events` отображает:
- Список событий с датой, email, IP, результатом (успех/неудача)
- ECharts-график с динамикой попыток входа по времени

Используется для выявления аномальной активности и поддержки пользователей.

---

## Jobs / Карьерный портал

Admin-App управляет вакансиями, публикуемыми на сайте Shiptify.

### Вакансии (`/api/v1/job-offerings`)

| Метод | URL | Действие |
|---|---|---|
| `GET/POST` | `/api/v1/job-offerings` | Список / создать вакансию |
| `GET/PUT/DELETE` | `/api/v1/job-offerings/:id` | CRUD |

Каждая вакансия ссылается на справочники: `dict_job_functionalities`, `dict_job_contracts`, `dict_job_experiences`.

### Заявки соискателей (`/api/v1/job-applicants`)

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/job-applicants` | Список заявок |
| `GET` | `/api/v1/job-applicants/:id` | Детали заявки |

Заявки создаются через публичный сайт Shiptify. Admin-App предоставляет только просмотр.

---

## Healthcheck

```
GET /healthcheck
```

Endpoint для мониторинга доступности сервера. Не требует авторизации. Используется балансировщиком нагрузки и системами мониторинга инфраструктуры.

---

## 🔗 Граф-метаданные
- **id:** `admin-app.operations`
- **type:** module-doc · **domain:** Admin-App · **status:** implemented
- **confluence:** 632160305 · **repo:** `admin-app/operations/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Admin-App
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

