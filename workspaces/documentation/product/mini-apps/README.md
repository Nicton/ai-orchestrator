---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632750129
source_type: confluence
---
# Mini-Apps — Обзор монорепозитория

## Что такое mini-apps

Mini-apps — это отдельный Node.js/Express сервер (`workspaces/mini-apps/`), который обслуживает 8 независимых веб-приложений (мини-приложений). Каждое мини-приложение — это отдельная SPA-страница, доступная по уникальной ссылке с токеном. Они НЕ являются частью основного TMS-приложения Shiptify, но работают с той же базой данных PostgreSQL.

Основная идея: TMS генерирует уникальную ссылку с токеном и отправляет её нужному пользователю (водителю, таможне, перевозчику и т.д.). Пользователь открывает ссылку, не проходя регистрацию в основной системе.

## Как мини-приложения связаны с основным TMS

| Механизм | Описание |
|---|---|
| **Токен в URL** | TMS генерирует JWT или access-token и встраивает его в URL. Сервер мини-приложений верифицирует токен и рендерит страницу |
| **Общая БД** | Бэкенд мини-приложений работает с теми же таблицами PostgreSQL (shipments, tracking, slots, users, carriers, shippers и т.д.) |
| **Общий S3** | Загрузка файлов (CMR, вложения) идёт в тот же AWS S3-бакет |
| **Общий Redis** | Очереди задач (`kue` + `ioredis`) разделяются с основной инфраструктурой |
| **Переменная `MAIN_APP_BASE_URL`** | Инжектируется через webpack DefinePlugin — используется для ссылок обратно в основное приложение |
| **Shared-пакеты** | `@shiptify/lib-core`, `@shiptify/node-http`, `@shiptify/package-calculation` — внутренние npm-пакеты |

## Архитектура

```
┌─────────────────────────────────────────────────────┐
│  Express 5 + Apollo Server 4 (GraphQL API)          │
│  src/services/ — отдельный роутер на каждый app     │
│  src/graphql/  — единый GraphQL-эндпоинт /graphql   │
│  src/views/    — EJS-шаблоны (SSR shell)            │
└────────────────────┬────────────────────────────────┘
                     │ GraphQL queries / mutations
┌────────────────────▼────────────────────────────────┐
│  8 frontend-бандлов (Webpack 5 + SWC)               │
│  3 × React 19 + Redux Toolkit + Apollo Client 4     │
│  5 × AngularJS 1.8 + ui-router + Apollo Client 4   │
└─────────────────────────────────────────────────────┘
```

При каждом запросе сервер:
1. Проверяет токен в URL через middleware-цепочку
2. Загружает необходимые данные (shipper, location, user) из БД
3. Рендерит EJS-шаблон, который инжектирует данные в `window.*` globals
4. Отдаёт HTML — фронтенд-бандл берёт данные из `window` и делает GraphQL-запросы

## Список мини-приложений

| Приложение | URL-паттерн | Тип пользователя | Стек |
|---|---|---|---|
| [Driver App](driver-app/README.md) | `/driver/:token/shipments/:id` | Водитель | React 19 |
| [Carrier Portal](carrier-portal/README.md) | `/carrier/:token` | Перевозчик | React 19 |
| [Slotify](slotify/README.md) | `/slotify/:locationToken` | Поставщик / Перевозчик / Клиент | AngularJS 1.8 |
| [Slot Status](../../../docs/product/mini-apps/slot-status) | `/slotify/status/:zoneToken` | Внутренний экран склада | React 19 |
| [Customs App](customs-app/README.md) | `/customs/:token` | Таможенный агент | AngularJS 1.8 |
| [Quick Shipment](quick-shipment/README.md) | `/quick-shipment/:token` | Сотрудник грузоотправителя | AngularJS 1.8 |
| [Shipments (Tracking)](../../../docs/product/mini-apps/shipments) | `/shipments/:publicToken` | Внешний наблюдатель / Перевозчик | AngularJS 1.8 |
| [Transport Requests](transport-requests/README.md) | `/transport-requests/:token` | Перевозчик (ответ на котировку) | AngularJS 1.8 |

## Технологический стек (сводка)

| Уровень | Технология |
|---|---|
| Backend runtime | Node.js >= 24.12, Express 5 |
| API | Apollo Server 4 + GraphQL 16 |
| Real-time | GraphQL Subscriptions (`graphql-ws`, `graphql-subscriptions`) |
| База данных | PostgreSQL — `pg` 8 + Sequelize 3 |
| Кэш / очереди | Redis — `ioredis` + `kue` |
| Файловое хранилище | AWS S3 (`@aws-sdk/client-s3`), presigned URLs |
| Авторизация | JWT (`jsonwebtoken`, `express-jwt`), Passport.js |
| Сборка фронтенда | Webpack 5 + SWC (`swc-loader`) |
| React-приложения (3) | React 19, Redux Toolkit 2, Apollo Client 4, react-intl 7, React Router DOM 7 |
| AngularJS-приложения (5) | AngularJS 1.8, ui-router 1.0, angular-translate 2.19, ng-file-upload |
| Карты | Mapbox GL 3 |
| Стили | SCSS — sass-loader + MiniCssExtractPlugin |
| Логирование | pino + pino-pretty |

## Shared-библиотеки фронтенда

- `frontend/lib/` — утилиты для AngularJS-приложений: `address.js`, `arr.js`, `date.js`, `str.js`, `entity-convert.js` (imperial/metric), `cargo.js`, `number.js`
- `frontend/constants/` — константы `IMPERIAL`/`METRIC`, типы вложений
- `frontend/slotify/common/` — переиспользуемые Angular-компоненты: загрузчик файлов, датпикер, dropdown, metadata, карты Mapbox, phone-number-input
- `frontend/shared-templates/` — дополнительные Angular-шаблоны (carriers, customs-invoices, shipments и т.д.)

---

## 🔗 Граф-метаданные
- **id:** `mini-apps`
- **type:** overview · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 632750129 · **repo:** `mini-apps/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

