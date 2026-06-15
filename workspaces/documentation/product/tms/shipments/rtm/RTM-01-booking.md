---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631701637
source_type: confluence
---
# RTM-01: Booking — Требования → Документация
## 55 требований | Источник: 09_checklist-booking.md

> ✅ Документация есть | 🔶 Частично (тема упомянута, но не детализирована) | ❌ Нет документации

---

## Flow Types — типы создания заявок (REQ-BOOK-001..016)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-001 | Standard Creation (SC) — ручное создание | [flow-types.md](../flow-types.md) §SC | ✅ |
| REQ-BOOK-002 | Template Creation (TC) — из шаблона | [flow-types.md](../flow-types.md) §TC | ✅ |
| REQ-BOOK-003 | Token Template (TT) — без авторизации | [flow-types.md](../flow-types.md) §TT | ✅ |
| REQ-BOOK-004 | Book For Me (BFM) — бесплатный аккаунт партнёра | [flow-types.md](../flow-types.md) §BFM | ✅ |
| REQ-BOOK-005 | Repeat Creation (RC) — повтор заявки | [flow-types.md](../flow-types.md) §RC | ✅ |
| REQ-BOOK-006 | Forward Creation (FW) — продолжение маршрута | [flow-types.md](../flow-types.md) §FW | ✅ |
| REQ-BOOK-007 | Throwback Creation (TB) — обратный маршрут | [flow-types.md](../flow-types.md) §TB | ✅ |
| REQ-BOOK-008 | API Creation (APIC) — создание через API/ERP | [flow-types.md](../flow-types.md) §APIC | ✅ |
| REQ-BOOK-009 | PDF AI (PDFAI) — создание из PDF через AI | [flow-types.md](../flow-types.md) §PDFAI + [ai-reader-dual-screen.md](../ai-reader-dual-screen.md) | ✅ |
| REQ-BOOK-010 | Text AI (TXTAI) — создание из текста через AI | [flow-types.md](../flow-types.md) §TXTAI | ✅ |
| REQ-BOOK-011 | From Transport Request (TRC) — из TR | [flow-types.md](../flow-types.md) §TRC | ✅ |
| REQ-BOOK-012 | Direct Booking (DB) — один перевозчик | [flow-types.md](../flow-types.md) §DB | ✅ |
| REQ-BOOK-013 | Quote Request (QR) — несколько перевозчиков | [flow-types.md](../flow-types.md) §QR | ✅ |
| REQ-BOOK-014 | Automated Direct Booking (ADB) — авто | [flow-types.md](../flow-types.md) §ADB | ✅ |
| REQ-BOOK-015 | Semi-Automated Direct Booking (SADB) | [flow-types.md](../flow-types.md) §SADB | ✅ |
| REQ-BOOK-016 | First Responder (FR) — первый дешевле лимита | [flow-types.md](../flow-types.md) §FR | ✅ |

---

## CSW — обновления интерфейса (REQ-BOOK-017)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-017 | CSW: отображение комментария, email нового carrier, SAVE убран, FreeTM MD убран | [step-04_booking.md](../02_create-wizard/step-04_booking.md) | ✅ |

---

## Cancel / Replan Reason Codes (REQ-BOOK-018..022)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-018 | Отмена: причина отмены (модал с dropdown + comment) | [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md) | ✅ |
| REQ-BOOK-019 | Отмена: хранение данных и аудит (user, time, reason) | [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md) | ✅ |
| REQ-BOOK-020 | Replan TP: причина переноса (шаг + custom value) | [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md) | ✅ |
| REQ-BOOK-021 | Replan API: reason code + comment + лог в чате | [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md) | ✅ |
| REQ-BOOK-022 | Admin: конфигурация причин отмены и переноса | [replan-cancel-reason-codes.md](../replan-cancel-reason-codes.md) | ✅ |

---

## API: Packing List (REQ-BOOK-023..026) — ❌ ПРОБЕЛ

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-023 | PUT /shipments/contents — замена packing list + пересчёт | ❌ Нет | ❌ |
| REQ-BOOK-024 | POST /shipments/contents — добавление позиции + пересчёт | ❌ Нет | ❌ |
| REQ-BOOK-025 | PATCH /shipments/contents — патч по content_id + CW | ❌ Нет | ❌ |
| REQ-BOOK-026 | Обновление packing list при подтверждении TP | ❌ Нет | ❌ |

**Нужно создать:** `api/packing-list-api.md`

---

## CW и API Transit (REQ-BOOK-027..030) — ❌ ПРОБЕЛ

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-027 | CW на уровне TR — формула, тултип, Tolgee | ❌ Нет | ❌ |
| REQ-BOOK-028 | Консолидация TR в SR — распределение CW | ❌ Нет | ❌ |
| REQ-BOOK-029 | API POST /shipments/{id}/transit — транзитные точки | [07_integrations-behavior.md](../07_integrations-behavior.md) | 🔶 |
| REQ-BOOK-030 | API transit: валидация SCAC/IATA/LOCODE | [07_integrations-behavior.md](../07_integrations-behavior.md) | 🔶 |

---

## Notifications / Business Log (REQ-BOOK-031..036, 052)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-031 | Business Log — панель событий с полями WHO/HOW/WHAT/WHY | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-032 | Настройки уведомлений — подписка по типам событий, режимам, STY | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-033 | Digest-уведомления по расписанию (1h/2h/4h/8h) | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-034 | Vacation Mode — переадресация уведомлений | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-035 | Алёрт: просроченный pickup/delivery без подтверждения | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-036 | Mute/Follow уведомлений на уровне объекта | [notifications/README.md](../../notifications/README.md) | 🔶 |
| REQ-BOOK-052 | Дедупликация: update location + replan TP = 1 уведомление | [notifications/README.md](../../notifications/README.md) | 🔶 |

**Статус:** notifications/README.md содержит базовый список событий, но не детализирует Business Log, digest, vacation mode.

---

## Rebuilt UI — обновлённый интерфейс карточки (REQ-BOOK-037..051)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-037 | Адрес: truncate 20 символов + hover popup + модал | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-038 | Quick Status Update — панель при клике на статус | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-039 | Скрытие CTA после подтверждения pickup/delivery | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-040 | Статус Delivered + Upload POD | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-041 | CO2 пиктограмма (серая/зелёная) + модал CO2 | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-042 | Actions panel — 4 группы: EXECUTION / INFO EXCHANGE / PRINT / CONFIG | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-043 | Services и Additional Services в rebuilt UI | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-044 | Additional Information — сжатое отображение | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-045 | Incident Reported — тег + Timeline + collapse | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-046 | BOOK A SLOT (PML) из заголовка карточки | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-047 | Chat vs Logs — переключатель скрытия автологов | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-049 | Tracking Timeline: Show/Hide Detailed Tracking | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-050 | Packing List на карточке: totals, constraints, CW | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-051 | Заголовок карточки: SHP-номер, маршрут, incoterm, статус | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |

---

## Multi-account Navigation (REQ-BOOK-048)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-048 | Переключение TMS ↔ DOCK через навигацию (модал выбора аккаунта) | [00_domain-map.ru.md](../00_domain-map.ru.md) §6.10 | 🔶 |

---

## LCI / LCD и прочие типы (REQ-BOOK-053..055)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BOOK-053 | LCI / LCD — Label Creation для Express/Parcel через Teliae | [flow-types.md](../flow-types.md) §LCI | ✅ |
| REQ-BOOK-054 | Share Truck & Driver details — из Actions panel | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |
| REQ-BOOK-055 | Add Transit Points — Air/Sea из Actions panel | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) | ✅ |

---

## Итог по Booking

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть документация | 36 | 65% |
| 🔶 Частично | 11 | 20% |
| ❌ Нет документации | 8 | 15% |
| **Итого** | **55** | |

**Главный пробел:** API Packing List (PUT/POST/PATCH /contents) + CW на уровне TR — нужен файл `api/packing-list-api.md`.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-01-booking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631701637 · **repo:** `tms/shipments/rtm/RTM-01-booking.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

