# Управление аккаунтами

## Обзор

Раздел Accounts — главная точка входа для онбординга новых клиентов платформы. Здесь создаются и управляются аккаунты типов **SHIPPER**, **CARRIER** и **CUSTOMS**.

---

## Типы аккаунтов

| Тип | Описание |
|---|---|
| `SHIPPER` | Грузоотправитель. При создании автоматически создаётся связанный объект `Shipper` + корневой `ShipperDivision` + настройки цен |
| `CARRIER` | Перевозчик. При создании создаётся объект `Carrier` + корневой `CarrierDivision` |
| `CUSTOMS` | Таможенный брокер. Отображается в отдельном списке (`GET /accounts/customs`) |

---

## API-эндпоинты

Все эндпоинты защищены `auth.api.requireAdmin`.

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/accounts` | Список всех аккаунтов |
| `POST` | `/api/v1/accounts` | Создать аккаунт (атомарная транзакция) |
| `GET` | `/api/v1/accounts/customs` | Список аккаунтов типа CUSTOMS |
| `GET` | `/api/v1/accounts/:id` | Детали аккаунта (включает `shipper`, `carrier`, `sponsor_account`, `address`) |
| `PUT` | `/api/v1/accounts/:id` | Обновить аккаунт |
| `DELETE` | `/api/v1/accounts/:id` | Удалить аккаунт |

---

## Создание аккаунта — атомарная транзакция

`POST /api/v1/accounts` выполняет в одной DB-транзакции:

1. Создание записи `Account`
2. Создание связанного `Shipper` или `Carrier`
3. Создание корневого `Division` (`ShipperDivision.createRoot` или `CarrierDivision`)
4. Создание дефолтных `ShipperPriceDetails` (для шипперов)
5. Создание cross-links `ShipperCarrierMode` (режимы перевозки)
6. Создание метаданных аккаунта (`createAccountMetadataWithDefaultParams`)

Если любой шаг падает — вся транзакция откатывается.

---

## Pending Accounts (ожидающие регистрации)

Когда клиент регистрируется самостоятельно через публичную форму, он попадает в очередь `PendingAccount`. Администратор должен явно одобрить или отклонить заявку.

### API

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/pending-accounts` | Список ожидающих заявок |
| `GET` | `/api/v1/pending-accounts/:id` | Детали заявки |
| `DELETE` | `/api/v1/pending-accounts/:id` | Отклонить и удалить заявку |
| `PUT` | `/api/v1/pending-accounts/:id/accept` | Одобрить заявку |

### Что происходит при одобрении (`accept`)

Также выполняется атомарной транзакцией:

1. Создание `Account` на основе данных `PendingAccount`
2. Создание `Shipper` или `Carrier`
3. Создание корневого `Division`
4. Создание метаданных (`createAccountMetadataWithDefaultParams`)
5. Добавление аккаунта в систему мониторинга (`UserLinkedAccount` для monitoring user)
6. Синхронизация контакта в SendInBlue CRM (`createOrUpdateContact`)

---

## Shippers (расширенная конфигурация)

Отдельный раздел для управления объектом `Shipper` — специфичными настройками шиппера, не относящимися к Account.

### API

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/shippers` | Список шипперов |
| `POST` | `/api/v1/shippers` | Создать шиппера |
| `GET` | `/api/v1/shippers/:id` | Детали шиппера |
| `PUT` | `/api/v1/shippers/:id` | Обновить шиппера |
| `DELETE` | `/api/v1/shippers/:id` | Удалить шиппера |

Дополнительные связанные эндпоинты:

| Метод | URL | Действие |
|---|---|---|
| `GET/POST/DELETE` | `/api/v1/shipper-divisions` | Дивизии шиппера |
| `GET/POST/DELETE` | `/api/v1/shipper-price-details` | Детали цен шиппера |

Флаги, управляемые в разделе Shippers (пример из контроллера pending-accounts при создании):

- `can_direct_booking` — разрешить прямое бронирование
- `can_record_claim` | `can_auto_confirm` | `can_transport_plan` | `can_schedule`
- `has_accounting_entity` — флаг наличия бухгалтерской сущности

---

## Carriers (расширенная конфигурация)

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/carriers` | Список перевозчиков |
| `POST` | `/api/v1/carriers` | Создать перевозчика |
| `GET/PUT/DELETE` | `/api/v1/carriers/:id` | CRUD конкретного перевозчика |

Связанные:

| URL | Назначение |
|---|---|
| `/api/v1/carrier-divisions` | Дивизии перевозчика |
| `/api/v1/carrier-rules` | Бизнес-правила перевозчика (маршрутизация, условия применения) |

---

## Companies

Профили компаний, привязанные к аккаунтам.

| Метод | URL | Действие |
|---|---|---|
| `GET/POST` | `/api/v1/companies` | Список / создание |
| `GET/PUT/DELETE` | `/api/v1/companies/:id` | CRUD |

---

## Locations

Управление адресами/локациями платформы, включая master locations и timezone lookup.

| Метод | URL | Действие |
|---|---|---|
| `GET/POST` | `/api/v1/locations` | Список / создание локации |
| `PUT` | `/api/v1/locations/replace` | Замена одной локации другой (merge) |
| `GET/PUT/DELETE` | `/api/v1/locations/:id` | CRUD конкретной локации |
| `GET` | `/api/v1/master-locations` | Список master locations |
| `GET` | `/api/v1/time-zones` | Список timezone-ов |

---

## Galaxy (мульти-аккаунт группы)

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/galaxies` | Список galaxy-объектов |
| `GET/POST/PUT/DELETE` | `/api/v1/galaxy-services` | Сервисы, подключённые к galaxy |
