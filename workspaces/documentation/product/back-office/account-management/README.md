---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029201
source_type: confluence
---
# Account Management — Управление аккаунтами, перевозчиками и организациями

## Обзор

Раздел Account Management охватывает управление всеми типами операционных сущностей: шипперами, перевозчиками, галактиками (организационными группами) и пользователями платформы. Это ядро Back-Office для OPS-команды.

## Иерархия сущностей

```
Galaxy (тенант-группа)
  └── BillingAccount (контракт)
        └── OPS Account / Shipper (операционный аккаунт платформы)
              └── ShipperDivision (подразделения)

Carrier (перевозчик)
  └── CarrierDivision (подразделения перевозчика)
```

## Galaxies (Галактики)

Galaxy — это организационная группа, объединяющая связанные аккаунты (например, холдинг с несколькими юридическими лицами). Основные поля: `name`, теги (`GalaxyTags`), менторы (`GalaxyMentor`), сервисы (`GalaxyServices`).

**API-маршруты:**

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/galaxies` | Список галактик |
| POST | `/api/v1/galaxies` | Создание |
| PUT | `/api/v1/galaxies/:id` | Обновление |
| DELETE | `/api/v1/galaxies/:id` | Удаление |
| GET | `/api/v1/galaxies/:id/connections` | Связанные подключения |
| GET | `/api/v1/galaxies/:id/services` | Сервисы галактики |
| POST | `/api/v1/galaxies/:id/services` | Добавление сервиса |
| PUT/DELETE | `/api/v1/galaxies/:id/services/:serviceId` | Управление сервисом |
| GET | `/api/v1/galaxies-operations` | Операционный вид галактик |
| GET/PUT | `/api/v1/customer-galaxies` | Клиентские галактики |

## Accounts (OPS Accounts)

Операционные аккаунты — это шипперы и перевозчики на платформе Shiptify.

**API-маршруты:**

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/accounts` | Список аккаунтов |
| POST | `/api/v1/accounts` | Создание |
| PATCH | `/api/v1/accounts/:id` | Обновление |
| GET | `/api/v1/accounts/:id` | Детальная запись |
| PATCH | `/api/v1/accounts/access` | Обновление прав доступа |
| POST | `/api/v1/accounts/favorite` | Добавление в избранное |
| POST | `/api/v1/accounts/tag` | Изменение тега |
| GET | `/api/v1/accounts/growth` | Статистика отправок |
| GET | `/api/v1/accounts/login-as-account-user` | Вход от имени аккаунта |
| POST | `/api/v1/accounts/merge` | Слияние аккаунтов |
| POST | `/api/v1/accounts/bulk-assign-billing` | Массовое назначение BillingAccount |
| GET | `/api/v1/accounts-operations` | Операционный список аккаунтов |
| GET | `/api/v1/accounts-operations/pending-tm` | Ожидающие TMS |
| GET | `/api/v1/accounts-operations/pending-dock` | Ожидающие Dock |

## Carriers (Перевозчики)

Перевозчики — контрагенты, осуществляющие доставку.

**API-маршруты:**

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/carriers` | Список активных перевозчиков |
| GET | `/api/v1/carriers/killed-carriers` | Отключённые перевозчики |
| GET | `/api/v1/carriers/:id` | Детальная запись |
| GET | `/api/v1/carriers/:id/connections` | Подключения перевозчика |
| PATCH | `/api/v1/carriers/:id/replace` | Замена перевозчика |
| GET | `/api/v1/carriers/admin` | Список для администрирования |
| PATCH/DELETE | `/api/v1/carriers/admin` | Активация/деактивация |
| GET | `/api/v1/carriers-operations` | Операционный список |
| GET | `/api/v1/carriers-operations/addresses` | Адреса перевозчиков |
| GET | `/api/v1/carriers-operations/office` | Офисы перевозчиков |

## Shippers (Шипперы)

Шипперы — клиентские операционные аккаунты на платформе.

**API-маршруты:**

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/v1/shippers` | Список шипперов |
| GET | `/api/v1/shippers/:id` | Детальная запись |
| GET | `/api/v1/shippers/:id/price-details` | Детализация цен |
| POST/PATCH/DELETE | `/api/v1/shippers/:id/price-details` | Управление ценами |

## Users, Roles, Domains

- **Users** (`/api/v1/users`) — управление пользователями Back-Office и платформы
- **Roles** (`/api/v1/roles-groups`) — роли и группы ролей (RBAC)
- **Domains** (`/api/v1/domains`) — домены для организации доступа
- **Companies** (`/api/v1/companies`) — юридические лица
- **Sites** — физические площадки
- **Locations** (`/api/v1/locations`) — склады и логистические локации

## Merge Accounts

Страница `mergeAccountsOperation.tsx` позволяет объединить два OPS-аккаунта. Используется маршрут `POST /api/v1/accounts/merge` (`consolidateSlotbookAccounts`). История слияний хранится в `AccountMergeHistory`.

## Spectators

Spectators — наблюдатели, имеющие доступ для просмотра без права изменений. Управляются через отдельный контейнер `spectators.tsx`.

---

## 🔗 Граф-метаданные
- **id:** `back-office.account-management`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632029201 · **repo:** `back-office/account-management/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

