---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633012273
source_type: confluence
---
# Account Functions — Флаги функций аккаунта и профиль пользователя

> Источник требований: REQ-OCR-001, REQ-OCR-008 | Слайды (OCR): 2021 11 - Add user phone, Switch Account | Верифицировано по коду 2026-06-11

---

## Активируемые функции аккаунта (REQ-OCR-001)

Функции аккаунта управляются boolean-флагами модели `Account` (`backend/app/models/account.js:124-250`). Редактирование — **только через Admin-App** (`PUT /api/v1/accounts/:id`), права — роль admin.

| Флаг (код) | Слайдовое имя | Что включает |
|------------|---------------|--------------|
| `can_slot_validation` | SLOT BOOKING | Валидация слотов при бронировании |
| `allow_slots_grouping` | SLOT BOOKING | Группировка слотов |
| `allow_pre_request` | PLANNING / SHIPTI-DOCK | Pre-request флоу для складов |
| `is_visibility` | VISIBILITY | Режим «только просмотр» (без бронирования) |
| `allow_forwarding` | COLLABORATIVE | Пересылка/совместный доступ к отправкам |
| `is_warehouse_limited` | WAREHOUSE LIMITED VIEW | Ограничение видимости данными склада |
| `can_modify_order`, `can_split_order` | ORDER VIEW | Работа с заказами на детальной странице |
| `allow_invoicing_creation` | (INVOICING) | Создание счетов |
| `is_freemium` | (FREEMIUM) | Производный флаг: `!!sponsor_account_id` |

На уровне **пользователя** дополнительно: `User.DockPermissions.CAN_SLOT_BOOKING` — право бронирования слотов конкретным пользователем.

> ⚠️ Расхождение со слайдами: флаги `SHIPPER`, `MARKETING`, `BOOKER USER` как отдельные поля в модели **не найдены** — роль shipper определяется наличием связанной сущности Shipper; «booker» реализован через connected accounts (`CAN_EDIT_BOOKING_KEY`).

---

## Профиль пользователя: телефон и часовой пояс (REQ-OCR-008)

| Поле (код) | Описание | Где редактируется |
|------------|----------|-------------------|
| `users.phone_number` (STRING) | Телефон пользователя | Профиль: `PATCH /api/v1/profile`; Admin-App |
| `users.time_zone` (STRING, default `Europe/Paris`) | Часовой пояс — применяется ко всем датам/слотам в UI | Профиль; Admin-App |
| `accounts.time_zone` | Часовой пояс аккаунта (fallback) | Admin-App |
| `accounts.source` | Источник/реферал («SPONSORED BY») | Admin-App |

Поведение timezone: при смене пояса существующие даты **отображаются** в новом поясе автоматически (хранение в UTC, пересчёт на рендере).

---

## Переключение аккаунтов (REQ-OCR-002)

Основная документация: [back-office/account-navigation-switcher.md](../../back-office/account-navigation-switcher.md) (TMS↔DOCK переключение, ID 614*).

Технически:
- Endpoint: **`POST /api/v1/profile/active-account`** (`controllers/api/profile.js:284-330`)
- Модал выбора: `switchAccountModalOpen()` из header (`common/header/index.js:400-430`)
- Повторный логин не требуется — переключается активный аккаунт сессии

> ⚠️ Горячая клавиша **Ctrl+K** из слайдов 2022 в текущем коде **не найдена** — вход через меню header. Если шорткат нужен — это feature request.

---

## Связанные документы

| Документ | Что покрывает |
|----------|--------------|
| [navigation-account-types.md](navigation-account-types.md) | Меню по типам аккаунтов |
| [../../back-office/account-navigation-switcher.md](../../back-office/account-navigation-switcher.md) | TMS↔DOCK switcher |
| [auth-sso.md](auth-sso.md) | Сессии, JWT, refresh |

---

## 🔗 Граф-метаданные
- **id:** `tms.admin.account-functions`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633012273 · **repo:** `tms/admin/account-functions.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

