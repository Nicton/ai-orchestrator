---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881270
source_type: confluence
---
# RTM-06: General Batch 1 — Grouping / FU / Auth / Nav
## 42 требования | Источник: 14_checklist-tms-general-batch1.md

---

## Grouping 2.0

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-GRP-001 | Создание группы из одного отправления | [grouping/README.md](../../grouping/README.md) §Создание | 🔶 упомянуто |
| REQ-GRP-002 | Группировка с уже существующей группой (merge) | [grouping/README.md](../../grouping/README.md) §Добавление | 🔶 упомянуто |
| REQ-GRP-003 | FREE одного SH из группы двух | [grouping/README.md](../../grouping/README.md) §FREE | 🔶 упомянуто |
| REQ-GRP-004 | Grouping ID без манифеста | [grouping/README.md](../../grouping/README.md) §GroupingID | 🔶 упомянуто |
| REQ-GRP-005 | Типы группировки: Departure/Delivery/Shipments/Milkrun | [grouping/README.md](../../grouping/README.md) §Типы | ✅ |
| REQ-GRP-006 | Загрузка документов на сгруппированные отправления | [grouping/README.md](../../grouping/README.md) §Документы | 🔶 упомянуто |
| REQ-GRP-007 | Уровни доступа: Private/Limited/Public/Specific | [grouping/README.md](../../grouping/README.md) §Доступ | ✅ |
| REQ-GRP-008 | Уведомления о документах в группах | [grouping/README.md](../../grouping/README.md) §Уведомления | 🔶 упомянуто |

## Freight Units (FU)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-FU-001 | Создание FU через API (Veepee → STY) | [features/fu-improvements.md](../../features/fu-improvements.md) §API | ✅ |
| REQ-FU-002 | Вебхуки от Shiptify к Veepee (FU-200/202/300/400) | [features/fu-improvements.md](../../features/fu-improvements.md) §Webhooks | ✅ |
| REQ-FU-003 | Статусы FU (Pending/Assigned/In Transit/Delivered) | [features/fu-improvements.md](../../features/fu-improvements.md) §Статусы | ✅ |
| REQ-FU-004 | Last Transit Location + маршрутные таблицы | [features/fu-improvements.md](../../features/fu-improvements.md) §Маршрут | ✅ |
| REQ-FU-005 | Ручная маршрутизация FU | [features/fu-improvements.md](../../features/fu-improvements.md) §Ручная | ✅ |
| REQ-FU-006 | Автоматическая маршрутизация FU | [features/fu-improvements.md](../../features/fu-improvements.md) §Авто | ✅ |
| REQ-FU-007 | Листинг FU с фильтрами | [features/fu-improvements.md](../../features/fu-improvements.md) §Листинг | ✅ |
| REQ-FU-008 | Crossdock листинг и создание SH из FU | [features/fu-improvements.md](../../features/fu-improvements.md) §Crossdock | ✅ |

## Pallets Management (FU смежный модуль)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-FU-009 | Инвентаризация поддонов | ❌ нет | ❌ |
| REQ-FU-010 | Движения поддонов и подтверждение контрагентом | ❌ нет | ❌ |
| REQ-FU-011 | Запрос на перемещение поддонов | ❌ нет | ❌ |

## Auth / SSO

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-AUTH-001 | IDP: все приложения через Chanel IDP (AD) | ❌ нет | ❌ |
| REQ-AUTH-002 | SAML 2.0 аутентификация (SP cert, SHA-256) | ❌ нет | ❌ |
| REQ-AUTH-003 | OAuth 2.0 / OpenID Connect — Implicit Grant (SPA) | ❌ нет | ❌ |
| REQ-AUTH-004 | OAuth 2.0 Authorization Code Grant (Web/Native App) | ❌ нет | ❌ |
| REQ-AUTH-005 | OAuth 2.0 Client Credentials Grant (M2M) | ❌ нет | ❌ |
| REQ-AUTH-006 | TLS аутентификация (M2M с сертификатами) | ❌ нет | ❌ |
| REQ-AUTH-007 | Управление учётными данными на разных OS | ❌ нет | ❌ |

## Navigation — Новая продуктовая навигация

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-NAV-001 | Основная концепция меню: TM / DOCK / SLOT / PAY | [00_domain-map.ru.md](../00_domain-map.ru.md) §6.10 | 🔶 упомянуто |
| REQ-NAV-002 | Меню для SLOTBOOK аккаунта | [00_domain-map.ru.md](../00_domain-map.ru.md) | 🔶 упомянуто |
| REQ-NAV-003 | Меню для TMS аккаунтов (Free/Light/Advanced) | [06_roles-matrix.md](../06_roles-matrix.md) §Аккаунты | 🔶 частично |
| REQ-NAV-004 | Меню для DOCK аккаунтов | [06_roles-matrix.md](../06_roles-matrix.md) §Dock | 🔶 частично |
| REQ-NAV-005 | OLD-режим: история без временного ограничения | ❌ нет | ❌ |

---

## Итог General Batch 1

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 10 | 24% |
| 🔶 Частично | 14 | 33% |
| ❌ Нет | 18 | 43% |
| **Всего** | **42** | |

**Хорошо задокументировано:** Freight Units (`features/fu-improvements.md`) — 8/8 REQ.
**Главный пробел:** Auth/SSO (7 REQ) — нет ни одного слова в документации. Нужен файл `admin/auth-sso.md`.
**Grouping:** базово задокументирован в `grouping/README.md`, но без детализации edge cases.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-06-general-batch1`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881270 · **repo:** `tms/shipments/rtm/RTM-06-general-batch1.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

