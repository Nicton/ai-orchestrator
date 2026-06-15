---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632356914
source_type: confluence
---
# Мастер-данные (Master Data)

Справочники системы: локации, партнёры, перевозчики, пользователи, продукты. Настраиваются администраторами и влияют на работу всех остальных доменов.

## Кто управляет

- **Admin / Self-Admin** — основные управляющие
- **Shipper** — управляет своими локациями, партнёрами, пользователями
- **Carrier** — управляет своими локациями и водителями

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_locations.md](01_locations.md) | Локации: склады, адреса, ворота, зоны, слот-настройки |

---

## Основные справочники

| Справочник | URL | Описание |
|-----------|-----|---------|
| Локации | `/locations` | Склады, адреса, точки pick-up/delivery |
| Партнёры | `/partners` | Shipper-Carrier relationships |
| Перевозчики | `/carriers` | Список перевозчиков |
| Пользователи | `/users` | Аккаунты пользователей |
| Водители | `/drivers` | Водители (для Driver App) |
| Продукты / SKU | `/products` | Номенклатура грузов |
| Шаблоны заявок | `/shipment-templates` | Повторяющиеся маршруты |
| Теги | `/tags` | Метки для фильтрации |
| Команды | `/teams` | Группы пользователей |
| Типы груза | `/cargo-types` | Справочник типов груза |
| Типы вложений | `/attachment-types` | Категории документов |
| Валюты | `/account-currencies` | Поддерживаемые валюты |
| Payment terms | `/account-payment-terms` | Условия оплаты |

---

## Дочерние справочники (Dictionary / Dicts)

Настраиваются в `app/routes/` для каждого аккаунта:
- `/metadata-prototypes` — кастомные поля
- `/account-specificities` — особые условия
- `/dangerous-goods-descriptions` — ADR-описания
- `/cost-centers` — центры затрат
- `/profit-centers` — центры прибыли
- `/accounting-entities` — юридические лица

---

## Galaxy — мультиарендность (multi-account)

Galaxy = группа аккаунтов под одним управлением.

| URL | Описание |
|-----|---------|
| `/galaxy/accounts` | Аккаунты в Galaxy |
| `/galaxy/constellations` | Группы Galaxy |
| `/galaxy/managed-accounts` | Управляемые аккаунты |
| `/connected-galaxies` | Связанные Galaxy |

Модели: `Galaxy`, `GalaxyAccount`, `Constellation`

---

## Backend

- Локации: `app/services/locations.js`
- Партнёры: `app/services/partners.js`
- Аккаунты: `app/services/accounts.js`
- Пользователи: `app/services/users.js`
- ACL: `app/lib/acl.js`, `app/models/ShipperACL.js`, `app/models/CarrierACL.js`
- Frontend: `workspaces/frontend/public/app/locations/`, `/partners/`, `/users/`, `/drivers/`

---

## 🔗 Граф-метаданные
- **id:** `tms.master-data`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632356914 · **repo:** `tms/master-data/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

