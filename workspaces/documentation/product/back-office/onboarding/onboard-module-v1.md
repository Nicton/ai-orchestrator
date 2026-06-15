---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632717329
source_type: confluence
---
# Onboard Module v1.0 — Управление онбордингом клиентов

Новый раздел в Back-Office для управления жизненным циклом онбординга новых Shipper-аккаунтов.

> Источник: слайд `2026 04 - Onboard - 1.0`

---

## Навигация в BO

Новый раздел **Onboard** размещён между Growth и AM в sidebar BO.

Под-меню:
- **Pending** — аккаунты, ожидающие начала онбординга
- **Setup** — на этапе настройки
- **Go-live** — запуск в продакшн
- **Monitor** — мониторинг первых недель
- **Care** — поддержка
- **Dashboard** — сводный дашборд

---

## Новые поля OPS Account

| Поле | Тип | Описание |
|------|-----|---------|
| `Onboard_Method` | Enum | Shipti Support / Self Central / Self / Partner / Non Applicable / Other |
| `Onboard_Status_L1` | Enum | Pending / Setup / Go-live / Monitor / Care / Run / Other |
| `Onboard_Partner` | String (50) | Название партнёра онбординга |
| `Hubspot link` | URL | Ссылка на карточку в Hubspot CRM |
| `Setup_start` | Date | Дата начала Setup |
| `Golive_start` | Date | Дата Go-live |
| `Monitor_start` | Date | Дата начала мониторинга |
| `Care_start` | Date | Дата начала поддержки |

---

## Автоматическое правило

Shipper-аккаунты, созданные **вручную** (не через Slotify):
→ автоматически получают `Onboard_Status_L1 = Pending`

---

## Логика переходов статусов

При подтверждении в модале:

| Onboard_Method | Переход в статус |
|----------------|-----------------|
| Shipti Support | Setup |
| Self / Self Central / Partner | Monitor |
| Non Applicable / Other | Other |

---

## Данные из BO

- Список аккаунтов в Pending: `back.shipt.io/buyers`
- Sales Account BO страница: `back.shipt.io/sales-accounts/{id}`

---

## 🔗 Граф-метаданные
- **id:** `back-office.onboarding.onboard-module-v1`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632717329 · **repo:** `back-office/onboarding/onboard-module-v1.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

