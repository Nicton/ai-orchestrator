---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631636003
source_type: confluence
---
# Навигация и типы аккаунтов

> Источник требований: REQ-NAV-001..008, REQ-ACC-001..008 | Слайды: 2025 03 - New Navigation Product, 2024 08 - Account types & menus

---

## Концепция навигации (REQ-NAV-001)

Навигационное меню Shiptify разделено на **master features** по категориям:

| Модуль | Описание |
|--------|----------|
| **TM** (TMS) | Транспортное управление |
| **DOCK** | Управление воротами и визитами |
| **SLOT** | Слоты (только для SLOTBOOK-аккаунтов) |
| **PAY** | Инвойсинг |

**Принцип доступа:**
- Если модуль не доступен → открывается «Teasing / AD Page» в **новой вкладке** (Shiptify остаётся открытым)
- Локализация AD-страниц: FR / ES / EN

---

## Меню по типам аккаунтов

### SLOTBOOK аккаунт (REQ-NAV-002)

| Модуль | Доступ |
|--------|--------|
| SLOT | Полный |
| TMS | AD-режим → рекламная страница TMS |
| DOCK | AD-режим → рекламная страница DOCK |

Carrier-версия SLOTBOOK видит FREIGHT вместо TMS. В будущем AD TMS заменяется на self-upgrade к TMS FREE.

### TMS аккаунты (REQ-NAV-003)

| Тип | Модули |
|-----|--------|
| TMS Free | TMS (SLOT внутри), DOCK (AD), PAY (AD) |
| TMS Light | TMS (SLOT внутри), PAY (полный), DOCK (AD) |
| TMS Advanced | TMS (SLOT внутри), DOCK (AD), PAY |
| TMS Free + DOCK | TMS (SLOT внутри), DOCK (полный) |

SLOT встроен внутрь раздела TM — **не отображается** как отдельный пункт для TMS-аккаунтов.

Раздел EXPENSES в TMS = ссылка на `/invoicing` с переименованием.

### DOCK аккаунт (REQ-NAV-004)

| Элемент | Условие отображения |
|---------|---------------------|
| TMS | AD-режим |
| DOCK Default | Всегда |
| VISITS | DOCK = YES и VISITS = YES |
| ORDER | DOCK = YES и ORDER = YES |
| LOAD | Только DOCK Advanced |
| SLOT SlotBook | Не отображается у чистых DOCK-аккаунтов |

### Carrier / Freight аккаунт (REQ-NAV-007)

| Модуль | Описание |
|--------|----------|
| FREIGHT | Основной раздел транспортировок |
| SLOTS | — |
| PAY | Invoice Lines, Pre-Invoices, Invoices, Dashboard (только invoicing) |

- 99% перевозчиков без TR-функции → сокращённое меню (без Transport Request раздела)
- При BUY&SELL → раздел SELL появляется с доступом к Invoice Lines, Pre-Invoices, Invoices, Dashboard

### Spectator аккаунт (REQ-ACC-007)

- Видит: только TRACK (отправления/слоты, к которым имеет доступ)
- Не видит: DOCK, TMS, PAY
- Только чтение — не может создавать или изменять объекты

---

## Управление историей — OLD-режим (REQ-NAV-005)

| Раздел | Фильтр по умолчанию |
|--------|---------------------|
| TMS/FREIGHT | SR с Expected Delivery Date или DELIVERED (< 40 дней) |
| TR | Только ASSIGNED + SR (< 40 дней) |
| SLOT/VISIT | Объекты < 40 дней от текущей даты |

Раздел **OLD** в навигации даёт доступ ко всем историческим записям без ограничения.

---

## Условная видимость меню TMS Shipper (REQ-NAV-006)

| Пункт меню | Условие |
|-----------|---------|
| ORDER VIEW / ORDERLINES | TM = YES и ORDER VIEW или ORDERLINES = YES |
| CUSTOMS INVOICE | TM = YES и CUSTOMS INVOICE = YES |
| SEA SCHEDULE | TM = YES и SEA SCHEDULE = YES |
| FREIGHT UNIT | TM = YES и FREIGHT UNIT = YES |
| GROUPING | TM = YES и GROUPING = YES |
| POD REQUEST | TM = YES и POD REQUEST = YES |

По умолчанию открывается `/map` для Shipper TMS.

---

## Переключение аккаунтов (REQ-NAV-008)

- «Manage your account» / «Search» — переключение между аккаунтами
- «Disconnect from all accounts» — завершает все активные сессии
- Поиск по имени или email
- После переключения — навигационное меню перестраивается согласно правам нового аккаунта

---

## Матрица типов аккаунтов (REQ-ACC-001)

| Тип аккаунта | TM | DOCK | BUY&SELL |
|-------------|-----|------|---------|
| SLOTBOOK | — | — | — |
| TM FREE | ✅ | — | — |
| TM LIGHT | ✅ | — | — |
| TM STANDARD | ✅ | — | — |
| TM ADVANCED | ✅ | — | — |
| TM DOCK | ✅ | ✅ | — |
| DOCK FREE | — | ✅ | — |
| DOCK LIGHT | — | ✅ | — |
| DOCK ADVANCED | — | ✅ | — |

Активация TM-модуля → 4 кнопки в LEFTER view.
Активация DOCK-модуля → 2 кнопки.
Активация BUY&SELL → 3 кнопки.

---

## Роли пользователей на отправлении (REQ-ACC-002)

| Роль | Описание |
|------|----------|
| **Owner** | Отправление забронировано на его аккаунте; только Owner выбирает Executor |
| **Executor** | Активирован на Owner-аккаунте; аккаунт выбран Owner как исполнитель |
| **Creator** | Создал отправление и назначил другому аккаунту |
| **Informee** | Email/аккаунт добавлен как RESPONSIBLE или NOTIFY в LPA; не требует login |

Один пользователь может одновременно быть Owner на одном SH и Executor на другом.

---

## LPA (Logistics Point of Action) (REQ-ACC-003)

LPA определяет: Reference Name, функция Pick Up / Appointment, Mode, Sentence in ToDoList.

**LPA Footprint** — упорядоченный список LPA с назначенными ролями, Followers, типами инцидентов, Required Metadata и локацией.

| Правило | Поведение |
|---------|----------|
| Pick Up Repeat = YES | LPA повторяется для каждой точки погрузки |
| Pick Up Repeat = NO | LPA добавляется в цепочку только один раз |

**Статусы LPA:** Planned → Required → Confirmed (или Blocked при инциденте).

---

## Настройки TM / DOCK Options (REQ-ACC-004)

- Раздел «TM Options» в настройках → только если TM = YES
- Раздел «DOCK Options» в настройках → только если DOCK = YES
- Поле «WH Customers» переименовано

---

## Informee через локации в сети (REQ-ACC-005)

- Пользователь добавляет Shiptify-пользователя к локации в «MY NETWORK»
- При создании SH с маршрутом через эту локацию → добавленный пользователь автоматически получает доступ как Informee
- Informee видит SH с ограниченным доступом (только чтение)
- Удаление пользователя из локации **не** ретроактивно лишает доступа к существующим SH

---

## Tизинговые страницы при отсутствии доступа (REQ-ACC-008)

| Модуль | FR | ES | EN |
|--------|----|----|-----|
| TMS | `/fr/tms-transport-management-system` | `/es/tms-software` | `/en/transportation-management-system-software` |
| DOCK | `/fr/portail-rdv-transport-gestion-quais` | `/es/gestion-de-muelles` | `/en/dock-scheduling-software` |
| PAY | `/fr/tms-transport-management-system/controle-facturation` | — | `/en/transportation-management-system-software/billing-control` |

Открываются в **новой вкладке** (Shiptify остаётся открытым). В будущем: self-upgrade flow заменит AD-страницу.

---

## 🔗 Граф-метаданные
- **id:** `tms.admin.navigation-account-types`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631636003 · **repo:** `tms/admin/navigation-account-types.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

