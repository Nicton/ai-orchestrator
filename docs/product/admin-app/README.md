# Shiptify Admin-App

## Что это

Admin-App (`admin.blu.shiptify.com`) — внутренний инструмент для технической команды и senior-операторов Shiptify. Через него выполняются все задачи, которые требуют прямого доступа к платформенным данным: создание аккаунтов, настройка интеграций с перевозчиками, управление пользователями и их правами, поддержка справочников.

**Admin-App — это не Back-Office.** Путать их нельзя.

---

## Admin-App vs Back-Office

| Параметр | Admin-App | Back-Office |
|---|---|---|
| Кто использует | Инженеры, DevOps, senior-операторы платформы | Account managers, sales ops, коммерческая команда |
| URL | `admin.blu.shiptify.com` | отдельный домен BO |
| Аутентификация | Только аккаунт с флагом `admin` или Google OAuth корпоративный | Активированный пользователь платформы |
| Tech stack | AngularJS 1.5, Node.js 12, Sequelize 3, PostgreSQL | React 16 + Redux + TypeScript, Node.js 16, Sequelize 6 |
| Создание аккаунтов | Полный workflow: Account + Shipper/Carrier + Division + price details — в одной транзакции | Только просмотр/редактирование существующих |
| Управление интеграциями | Полный CRUD для всех перевозчиков (UPS, DHL, FedEx, SAP, Dachser, P44, Teliae, Brinks) | Нет доступа к конфигурации интеграций |
| Биллинг | Отсутствует | Полное управление billing accounts и MRR |
| CRM / Sales | Отсутствует | Sales accounts, touchpoints, dashboards AM |
| Справочники | Полный CRUD (режимы, валюты, типы вложений и т.д.) | Только чтение для dropdown-ов |
| Импersonация пользователей | Да (`GET /users/:id/login`) | Нет |
| Job-posting (карьерный портал) | Да | Нет |
| Аналитика | Операционный дашборд (отправления, запросы котировок, чат) + Amazon QuickSight | AM-дашборды, NSM-статистика, Dock/TM views |
| Galaxy-управление | Admin-сторона CRUD | BO-сторона операций |
| Cargo types / dangerous goods | Отсутствует | Полный CRUD |
| LinkedIn / marketing | Отсутствует | Есть |
| 2FA управление | Да (включить/выключить, установить код) | Нет |

---

## Технический стек

### Backend

| Компонент | Версия / пакет |
|---|---|
| Runtime | Node.js 12 |
| HTTP-фреймворк | Express 4.14 |
| ORM | Sequelize 3.x + pg 4.x (PostgreSQL) |
| Аутентификация | Passport.js (local strategy + Google OAuth 2.0) |
| API-авторизация | express-jwt 3.x (cookie или Bearer header) |
| Session / Cache | Redis (ioredis 4.x, connect-redis 3.x) |
| Background jobs | Kue 0.11 (Redis-backed queue) |
| Cloud | AWS SDK 2.x (Amazon QuickSight embedding) |
| Логирование | Bunyan + express-bunyan-logger |
| Шаблонизатор | EJS (только страница логина) |

### Frontend

| Компонент | Версия / пакет |
|---|---|
| SPA-фреймворк | AngularJS 1.5.x |
| Роутинг | Angular UI Router 0.2 (hash-routing: `/app#!/...`) |
| UI-компоненты | Angular UI Bootstrap 2.x, ui-select, ng-file-upload |
| CSS-фреймворк | Bootstrap 3.3.7 + Font Awesome 4.5 |
| Charts | ECharts 3.x |
| Build | Webpack 1.x + Babel (ES2015) |

### Архитектурный паттерн

Классический MVC:
- `app/routes/api/` — Express-роуты (61 файл), все защищены `auth.api.requireAdmin`
- `app/controllers/api/` — контроллеры (62 файла), 1:1 с роутами
- Sequelize-модели подключаются через `app.db`
- Фронтенд — AngularJS SPA, раздаётся с `/`, общается с `/api/v1/*`

---

## Структура разделов

```
product/admin-app/
  README.md              — этот файл, обзор
  accounts/README.md     — создание аккаунтов, shippers, carriers
  integrations/README.md — управление интеграциями с перевозчиками
  users/README.md        — пользователи, роли, impersonation
  dictionary/README.md   — справочники платформы
  operations/README.md   — дашборд, мониторинг, jobs, QuickSight
  OPEN-QUESTIONS.md      — вопросы для верификации
```

---

## Авторизация

Все API-эндпоинты Admin-App требуют middleware `auth.api.requireAdmin`. Это означает, что:

1. JWT в cookie или Authorization header должен содержать валидный токен
2. Пользователь, соответствующий токену, должен иметь флаг `is_admin = true`

Попасть в приложение можно:
- Через форму логина с email/password (`POST /login`)
- Через Google OAuth (`GET /login/google`) — корпоративный аккаунт Shiptify

Обычные пользователи платформы (shipper, carrier) **не могут** авторизоваться в Admin-App.

---

## Запуск локально

```bash
# Backend + worker
WORKERS=1 BLUEBIRD_WARNINGS=0 DEBUG=retry-as-promised node ./bin/server.js | bunyan

# Frontend (Webpack, watch mode)
NODE_ENV=development webpack --watch
```

Основной конфиг: `config/` (node-config). Redis и PostgreSQL должны быть доступны.
