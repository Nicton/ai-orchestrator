---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631767058
source_type: confluence
---
# Account Navigation Switcher — Переключение между типами аккаунтов

Функция для multi-account пользователей: переключение между TMS-аккаунтами (TML/TMS/TM) и DOCK-аккаунтами (DKS/DK) без выхода из системы.

> Источник: слайд `2025 11 - Acc structure navigation`

---

## Проблема (до фичи)

Multi-account пользователь на TMS-аккаунте видит DOCK как недоступный (grey out) и видит рекламу при каждом посещении.

---

## Новое поведение

### TMS → DOCK

Условие: пользователь на TMS-аккаунте, в списке аккаунтов есть хотя бы 1 DOCK-аккаунт (DKS/DK).

| Ситуация | Действие |
|---------|---------|
| 1 DOCK аккаунт | Автоматический редирект (без модала) |
| 2+ DOCK аккаунтов | Модал: выбор из списка DKS/DK аккаунтов |

После выбора: активный аккаунт прозрачно переключается, пользователь попадает на страницу **DOCK > SITE** (главная страница Dock).

Admin panel и dock settings — от выбранного DOCK аккаунта.

### DOCK → TMS

Условие: пользователь на DOCK-аккаунте, клик на иконку TMS (™).

| Ситуация | Действие |
|---------|---------|
| 1 TMS аккаунт | Автоматический редирект |
| 2+ TMS аккаунтов | Модал: выбор из TML/TMS/TM аккаунтов |

---

## Типы аккаунтов

| Код | Тип |
|-----|-----|
| TMS, TML, TM | Transport Management аккаунты |
| DKS, DK | Dock/Warehouse аккаунты |

---

## Не в скоупе

Pay, Track — рассматриваются позже.

Классическая навигация (single-account) — без изменений.

---

## 🔗 Граф-метаданные
- **id:** `back-office.account-navigation-switcher`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631767058 · **repo:** `back-office/account-navigation-switcher.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

