---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308468
source_type: confluence
---
# RTM-03: Rate Sheets + Tracking + Notifications — Требования → Документация
## 45 требований | Источник: 11_checklist-rate-sheets.md

---

## Rate Sheets — Sea Freight на базе LOCODE

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-RS-001 | Переключатель LOCODE-based при создании RS | [rate-sheets/README.md](../../rate-sheets/README.md) | 🔶 RS структура описана, LOCODE специфика нет |
| REQ-RS-002 | 10 типов Sub Rate Sheet (SRS) для SEA FREIGHT | [rate-sheets/README.md](../../rate-sheets/README.md) | 🔶 базово |
| REQ-RS-003 | Логика сборки RS: алгоритм поиска по LOCODE | ❌ нет | ❌ |
| REQ-RS-004 | Приоритет LOCODE над Country при поиске | ❌ нет | ❌ |
| REQ-RS-005 | Валидация импорта данных SRS: обязательные поля | ❌ нет | ❌ |
| REQ-RS-006 | Правило округления W/M (CW) | ❌ нет | ❌ |
| REQ-RS-007 | Обработка опасных грузов (DGD/UN) в RS | ❌ нет | ❌ |
| REQ-RS-008 | Lead Time: поля и правила | [rate-sheets/README.md](../../rate-sheets/README.md) §Leadtime | 🔶 упомянуто |
| REQ-RS-009 | Правила RS для нескольких контейнеров (FCL/LCL) | ❌ нет | ❌ |
| REQ-RS-010 | Влияние инкотермов на сегменты затрат | [rate-sheets/README.md](../../rate-sheets/README.md) | 🔶 упомянуто |
| REQ-RS-011 | Shiptify Internal Key: маппинг FCL-контейнеров | ❌ нет | ❌ |
| REQ-RS-012 | Шаблон SRS: скачать и загрузить формат | [rate-sheets/README.md](../../rate-sheets/README.md) | 🔶 упомянуто |
| REQ-RS-017 | Quote Strategy (5 стратегий котирования в CSW) | [rate-sheets/README.md](../../rate-sheets/README.md) + [step-04_booking.md](../02_create-wizard/step-04_booking.md) | 🔶 упомянуто |
| REQ-RS-018 | Применение RS при нулевых стоимостях | ❌ нет | ❌ |
| REQ-RS-019 | Incoterm в ретро-консолидации | ❌ нет | ❌ |
| REQ-RS-020 | Автозаполнение страны из LOCODE | ❌ нет | ❌ |

## Retro Consolidation

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-RS-013 | API назначения Financial Group ID | ❌ нет | ❌ |
| REQ-RS-014 | Правила пересчёта ставок для группы | ❌ нет | ❌ |
| REQ-RS-015 | Mutualized Cost (snapshot) | ❌ нет | ❌ |
| REQ-RS-016 | Загрузка mutualized cost через XLS | ❌ нет | ❌ |
| REQ-TRACK-011 | Валидация статуса отправки при назначении группы | ❌ нет | ❌ |
| REQ-TRACK-012 | Обработка ошибок API ретро-консолидации | ❌ нет | ❌ |
| REQ-TRACK-015 | Экспорт данных ретро-консолидации | ❌ нет | ❌ |

## Container Tracking (Kpler / Marine Traffic)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-TRACK-001 | Активация Container Tracking Service | ❌ нет | ❌ |
| REQ-TRACK-002 | Поле Container ID + условия вызова Kpler API | ❌ нет | ❌ |
| REQ-TRACK-003 | Маппинг событий Kpler → STY Tracking Points | ❌ нет | ❌ |
| REQ-TRACK-004 | Приоритет источников: Carrier vs Kpler | ❌ нет | ❌ |
| REQ-TRACK-013 | Логирование вызовов Kpler (биллинг) | ❌ нет | ❌ |
| REQ-TRACK-014 | Kpler API: POST запрос и обработка ответа | ❌ нет | ❌ |

## API Tracking Points

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-TRACK-005 | POST /tracking-points: UNLOCODE и IATA CODE | [07_integrations-behavior.md](../07_integrations-behavior.md) | 🔶 частично |
| REQ-TRACK-006 | Правила POST/PUT/PATCH для Tracking Points | [07_integrations-behavior.md](../07_integrations-behavior.md) | 🔶 частично |
| REQ-TRACK-010 | Transit Point при Pre-carriage SRS (STY0446) | ❌ нет | ❌ |

## New Tracking Architecture (2026)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-TRACK-007 | 3 экрана: Setup / Shipment / Public Page | ❌ нет | ❌ |
| REQ-TRACK-008 | STY-коды, группы, исключения | ❌ нет | ❌ |
| REQ-TRACK-009 | Публичная страница: Map, Predicted ETA, Status Badge | ❌ нет | ❌ |

## Notifications / Business Log (из этого чек-листа)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-NOTIF-001 | Business Log: таблица событий на уровне аккаунта | [notifications/README.md](../../notifications/README.md) | 🔶 базово |
| REQ-NOTIF-002 | Фильтрация Business Log | [notifications/README.md](../../notifications/README.md) | 🔶 упомянуто |
| REQ-NOTIF-003 | Настройки уведомлений: роли и аккаунты | [notifications/README.md](../../notifications/README.md) | 🔶 частично |
| REQ-NOTIF-004 | Каналы: In-App и Email | [notifications/README.md](../../notifications/README.md) §Каналы | ✅ |
| REQ-NOTIF-005 | Digest-письмо: формат и структура | [notifications/README.md](../../notifications/README.md) | 🔶 упомянуто |
| REQ-NOTIF-006 | Vacation Mode и делегирование | ❌ нет | ❌ |
| REQ-NOTIF-007 | Триггеры: события Tracking Points | [notifications/README.md](../../notifications/README.md) | 🔶 частично |
| REQ-NOTIF-008 | Уведомления Chat (TD-359) | ❌ нет | ❌ |
| REQ-NOTIF-009 | Гранулярность: mute/follow на уровне объекта | ❌ нет | ❌ |
| REQ-NOTIF-010 | Приоритизация: 1-я волна (BOOKING, TRACKING, SLOT) | [notifications/README.md](../../notifications/README.md) | 🔶 упомянуто |

---

## Итог Rate Sheets + Tracking + Notifications

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 1 | 2% |
| 🔶 Частично | 13 | 29% |
| ❌ Нет | 31 | 69% |
| **Всего** | **45** | |

**Главные пробелы (нужны отдельные файлы):**
- `features/container-tracking.md` — Container Tracking / Kpler (6 REQ)
- `features/retro-consolidation.md` — Retro Consolidation (7 REQ)
- `tracking/new-tracking-architecture.md` — New Tracking 2026 (3 REQ)
- Расширить `rate-sheets/README.md` — LOCODE RS structure (8 REQ)
- Расширить `notifications/README.md` — Vacation Mode, Chat, Mute/Follow (4 REQ)

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-03-rate-sheets`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631308468 · **repo:** `tms/shipments/rtm/RTM-03-rate-sheets.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

