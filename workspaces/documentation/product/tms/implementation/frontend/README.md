---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632717361
source_type: confluence
---
# Frontend — Клиентская часть TMS

Два параллельных фронтенда: legacy AngularJS и современный React (миграция в процессе).

## Репозитории

| Репо | Стек | Назначение |
|------|------|-----------|
| `workspaces/frontend` | AngularJS 1.8, Webpack 5 | Legacy основное приложение |
| `workspaces/frontend-mono` | React 19, Rspack, npm workspaces | Современный монорепозиторий |
| `workspaces/mini-apps` | React + AngularJS + GraphQL | Специализированные мини-приложения |

---

## workspaces/frontend (Legacy AngularJS)

### Запуск

```bash
cd workspaces/frontend
npm install
npm run dev    # http://localhost:8080
npm run build  # production build
```

### Структура

```
workspaces/frontend/public/app/
├── shipments/              ← домен Перевозки
├── shipmentRequests/       ← домен Заявки + CSW wizard
├── slots/                  ← домен Слоты
├── invoicing/              ← домен Инвойсинг
├── locations/              ← домен Локации
├── orders/                 ← домен Заказы
├── dashboard/              ← Дашборды
├── claims/                 ← Претензии
├── partners/               ← Партнёры
├── users/                  ← Пользователи
└── ...
```

Каждый домен содержит:
```
shipments/
├── shipments.router.js     ← ui-router state definitions
├── shipments.service.js    ← HTTP вызовы к backend API
├── list/                   ← компонент списка
│   ├── list.component.js
│   └── list.html
├── view/                   ← детали перевозки
│   ├── view.component.js
│   └── view.html
└── ...
```

### Паттерны AngularJS

- **Routing**: ui-router с именованными states
- **HTTP**: AngularJS `$http` → REST API
- **State management**: сервисы + `$rootScope`
- **Шаблоны**: HTML + AngularJS directives
- **Компоненты**: `angular.component()` (новый стиль) + некоторые controllers (legacy)

---

## workspaces/frontend-mono (Modern React)

### Структура (npm workspaces)

```
workspaces/frontend-mono/packages/
├── shell/          ← main shell (single-spa)
├── sidebar/        ← навигационный сайдбар
├── layout/         ← общий layout
├── auth/           ← аутентификация
├── chat/           ← чат компонент
├── claims/         ← претензии (React)
├── notifications/  ← уведомления
├── ai-doc-reader/  ← ИИ-чтение документов
├── shipti-store/   ← маркетплейс
├── common/         ← shared библиотека
└── frontend/       ← основное приложение (содержит legacy AngularJS)
```

### Запуск

```bash
cd workspaces/frontend-mono
npm install          # устанавливает все пакеты
npm run dev          # запускает shell + все micro-frontends
npm run build        # production build
```

### Стек

- **React 19** с Server Components (где нужно)
- **Rspack** (быстрый webpack-compatible bundler)
- **Biome** (linter + formatter, заменяет ESLint + Prettier)
- **Single-SPA** для микрофронтендной архитектуры
- **TypeScript** (частично)

---

## workspaces/mini-apps (Специализированные приложения)

| Приложение | Стек | Для кого |
|-----------|------|---------|
| `driver-app` | React (mobile-first) | Водители |
| `carrier` | React + Apollo GraphQL | Перевозчики (онбординг) |
| `slot-status` | React | Операторы склада (монитор) |
| `slotify` | AngularJS + GraphQL | Dock-менеджеры |
| `quick-shipment` | AngularJS | Быстрое создание заявки |
| `customs-app` | AngularJS | Таможенные брокеры |

### Запуск mini-apps

```bash
cd workspaces/mini-apps
npm install

# Запустить конкретное приложение
npm run dev:driver-app    # Driver App
npm run dev:carrier       # Carrier Portal
npm run dev:slotify       # Slotify
```

---

## Как frontend общается с backend

```
Frontend (AngularJS/React)
  │
  │  REST API (JSON)
  ▼
Backend API (Express.js :3013)
  │
  │  SQL
  ▼
PostgreSQL

Mini-apps (GraphQL)
  │
  │  GraphQL
  ▼
Backend GraphQL endpoint
  │  (некоторые mini-apps используют Apollo)
```

### Аутентификация

Все запросы требуют заголовок:
```
Authorization: Bearer <jwt-token>
```

JWT получается при логине: `POST /api/auth/login`
Хранится в: `localStorage` / `sessionStorage`
Отзыв: через Redis blacklist

---

## Связь с техническим слоем backend

| Frontend action | Backend endpoint | Сервис |
|----------------|-----------------|--------|
| Список перевозок | `GET /api/shipments` | `shipments.js → getShipmentsList()` |
| Детали перевозки | `GET /api/shipments/{id}` | `shipments.js → loadExtendedShipmentInfo()` |
| Создать SR | `POST /api/shipment-requests` | `shipment_requests.js → createShipmentRequestByInput()` |
| Подтвердить TP | `PATCH /api/tracking-points/{id}/confirm` | `shipments.js → createTrackingPoint()` |

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.frontend`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632717361 · **repo:** `tms/implementation/frontend/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

