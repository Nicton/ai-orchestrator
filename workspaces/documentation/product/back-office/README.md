---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632389666
source_type: confluence
---
# Shiptify Back-Office — Обзор приложения

## Что такое Back-Office

Back-Office (`back.blu.shipt.io`) — это внутренний инструмент команды Shiptify. Он предназначен для Account Managers, команды продаж, поддержки и операционного персонала. **Это отдельное приложение от Admin-App** (`admin.blu.shiptify.com`), которое используется клиентами.

Back-Office позволяет команде управлять клиентскими аккаунтами, отслеживать коммерческие отношения, настраивать биллинг, контролировать онбординг шипперов и публиковать системные оповещения.

## Кто использует приложение

| Роль | Основные задачи |
|---|---|
| Account Manager (AM) | Ведение SalesAccounts, тачпоинты, дашборд |
| Sales / Growth | Pipeline перевозчиков, рефералы, LinkedIn |
| Operations | Управление шипперами, перевозчиками, онбординг |
| Finance / Billing | BillingAccounts, MRR-линии |
| Admin | Пользователи, роли, домены, словари |

## Технологический стек

**Backend:**
- Node.js 16 (`.nvmrc`)
- Express.js 4.18.2 — HTTP-сервер и маршрутизация
- Sequelize 6.32.1 — ORM для PostgreSQL (поддержка read/write реплик)
- Passport.js 0.6.0 + express-jwt — аутентификация (Google OAuth + JWT HS256)
- express-session + connect-redis — управление сессиями
- ioredis 5.3.2 — клиент Redis
- Elasticsearch 7.x — полнотекстовый поиск
- AWS SDK 2.x — хранение файлов в S3
- Bunyan 1.8.15 — структурированное JSON-логирование
- shiptify-pkg-queue — внутренняя очередь задач через Redis

**Frontend:**
- React 16.3.1 + React Router 5.1.2 — SPA
- Redux 4.0.5 + Redux Thunk 2.3.0 — управление состоянием
- TypeScript 5.1.6 — типизация клиентского кода
- Bootstrap 5.3.0 + React Bootstrap 1.0.1 — UI
- react-intl 6.4.4 — интернационализация
- Webpack 5.97.1 — сборщик
- Axios 1.4.0 — HTTP-клиент

**Инфраструктура:**
- PostgreSQL 12+ (primary + read replica)
- Redis 6+ (сессии, кэш, очередь задач)
- Elasticsearch 7.x
- AWS S3 (несколько bucket'ов)
- Docker (Node.js 16-alpine)
- Prometheus метрики на порту 9091

## Архитектура

Приложение — **полностековый монолит**. Сервер рендерит EJS-шаблон как точку входа, далее React SPA берёт управление на себя.

```
Browser → EJS entry point → React SPA
         ↓
Express routes/api/ → controllers/api/ → services/ → models/ → PostgreSQL
```

Паттерн на клиенте: Redux container/component. Контейнер подключён к Redux-хранилищу и передаёт данные как props компоненту.

## Разделы приложения

| Раздел | Ключевые страницы |
|---|---|
| Sales / CRM | SalesAccounts, SalesAccount (детальная), AMOpportunities, AM Dashboard, Touchpoints |
| Billing | BillingAccounts, BillingAccount (детальная), MRR Lines |
| Accounts / OPS | Accounts, ShippersOperations, CarriersOperations, GalaxiesOperations |
| Growth | DockLeads, PendingTM, PendingDocks, NewSellers, NSM, Referrals, LinkedIn |
| Alerting | Alerts |
| Справочники | CargoGroups, CargoTypes, AttachmentTypes, PaymentTerms, UnitMeasurements, Metadata и др. |
| Администрирование | Users, Roles, Domains, Companies, Sites, Locations, Galaxies |

## API

Все API-маршруты находятся под префиксом `/api/v1/` и защищены JWT middleware (`auth.api.requireAuth`). Список ресурсов: `accounts`, `billing_accounts`, `sales_accounts`, `carriers`, `galaxies`, `shippers`, `alerts`, `dashboards`, `users`, `roles-groups`, `domains`, `locations`, `metadata`, `dictionaries` и другие (всего 37 файлов маршрутов).

## Аутентификация

- Google OAuth через Passport.js для браузерного входа
- JWT (HS256) для API-запросов, токен хранится в localStorage
- Сессии через express-session + Redis backend
- Конфигурация: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `JWT_TOKEN_SECRET`

---

## 🔗 Граф-метаданные
- **id:** `back-office`
- **type:** overview · **domain:** Back-Office · **status:** implemented
- **confluence:** 632389666 · **repo:** `back-office/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

