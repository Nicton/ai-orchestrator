---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632684645
source_type: confluence
---
# Galaxy — Мультиарендность и группы аккаунтов

> 🧭 Контур: модуль относится к **Back-Office/mini-apps** (управление группами аккаунтов — внутренний инструмент), а не к пользовательскому TMS. В Confluence страница перенесена под «Back-Office — Внутренние инструменты» (2026-06-12).

Galaxy — механизм объединения нескольких аккаунтов в иерархическую структуру. Позволяет холдингам и группам компаний управлять несколькими Shipper/Carrier аккаунтами из одного места с единым видом данных.

## Кто использует

- **Холдинги и группы компаний** — объединяют дочерние компании в Galaxy
- **Admin Shiptify** — создаёт и настраивает Galaxy
- **Account Manager** — управляет Galaxy через Back-office

## Концепция

```
Galaxy (группа)
  ├── Constellation A (подгруппа)
  │   ├── Account 1 (Shipper France)
  │   └── Account 2 (Shipper Germany)
  ├── Constellation B
  │   ├── Account 3 (Carrier EU)
  │   └── Account 4 (Carrier Global)
  └── Owner Account (управляющий)
```

---

## Типы аккаунтов в Galaxy

| Тип | Описание |
|-----|---------|
| **Owner** | Управляющий аккаунт Galaxy — видит все данные |
| **Member** | Обычный участник — видит свои данные + данные Galaxy |
| **Managed** | Управляемый — не может сам создавать заявки, всё через Owner |
| **Connected** | Связанный (read-only вид чужих данных по договорённости) |

---

## Страницы

| URL | Описание |
|-----|---------|
| `/galaxy/accounts` | Аккаунты в Galaxy текущего пользователя |
| `/galaxy/constellations` | Список Constellation (подгрупп) |
| `/galaxy/constellations/add` | Создать Constellation |
| `/galaxy/managed-accounts` | Управляемые аккаунты |
| `/galaxy/customer-contacts` | Контакты клиентов Galaxy |
| `/galaxy/connected-shippers` | Связанные Shipper'ы |
| `/connected-galaxies` | Связанные внешние Galaxy |
| `/multivision` | Дашборд — агрегированный вид всей Galaxy |

---

## Что даёт Galaxy

### 1. Единый вид данных

Owner аккаунт видит перевозки **всех** аккаунтов Galaxy:
- `/shipments` — объединённый список
- `/multivision` — агрегированный дашборд
- Фильтр по аккаунту

### 2. Managed Accounts

Если аккаунт `is_managed = true`:
- Не может сам создавать ShipmentRequest
- Все заявки создаёт Owner от его имени
- Данные полностью видны Owner'у

### 3. Shared Carriers

Перевозчики в Galaxy доступны всем аккаунтам группы без дублирования настроек.

---

## Изоляция данных

```
Без Galaxy:
  Account A видит только свои Shipment'ы
  Account B видит только свои Shipment'ы

С Galaxy (A и B в одной Galaxy):
  Owner видит Shipment'ы A + B
  A видит свои Shipment'ы (+ опционально B если разрешено)
  B видит свои Shipment'ы (+ опционально A если разрешено)
```

ACL: `GalaxyAccount.is_managed`, `Galaxy.owner_account_id`

---

## Мутации

**Создание Galaxy:**
- `Galaxy` создаётся
- `GalaxyAccount` создаётся для Owner
- Owner получает расширенный доступ

**Добавление аккаунта в Galaxy:**
- `GalaxyAccount` создаётся
- Аккаунт получает доступ к shared ресурсам
- Email уведомление аккаунту

---

## Backend

- Модели: `app/models/galaxy.js`, `app/models/galaxy_account.js`, `app/models/constellation.js`
- Frontend: `workspaces/frontend/public/app/galaxy/`
- Back-office: `workspaces/back-office/src/` → galaxies страницы

---

## 🔗 Граф-метаданные
- **id:** `tms.galaxy`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632684645 · **repo:** `tms/galaxy/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

