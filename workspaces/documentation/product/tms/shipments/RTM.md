---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422564
source_type: confluence
---
# RTM — Requirements Traceability Matrix
## TMS Shipments Domain

> **RTM** связывает каждое требование с документацией, тест-кейсами и автотестами.
> Позволяет увидеть: что не документировано, что не протестировано, что не автоматизировано.

---

## Как читать таблицу

| Статус | Значение |
|--------|---------|
| ✅ | Полностью покрыто |
| 🔶 | Частично покрыто |
| ❌ | Пробел — нет покрытия |
| — | Не применимо |

---

## REQ-SH — Список перевозок

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-SH-001 | Список всех перевозок пользователя | [shipments-list.md](../technical-view/pages/shipments-list.md) | TC-1334 Login as shipper | `smokeTest/shipmentRequest.js` | ✅ | — |
| REQ-SH-002 | Фильтр по статусу | [shipments-list.md](../technical-view/pages/shipments-list.md) | TC-2937..2945 Tracking statuses | — | 🔶 | Нет автотеста для фильтра |
| REQ-SH-003 | Фильтр по режиму (Road/Air/Sea) | [00_domain-map.ru.md](00_domain-map.ru.md) | — | — | ❌ | Нет тест-кейса и автотеста |
| REQ-SH-004 | Фильтр "All Carriers" только Shipper | [06_roles-matrix.md](06_roles-matrix.md) | — | — | ❌ | — |
| REQ-SH-011 | Smart-list ?isNotConfirmed | [00_domain-map.ru.md](00_domain-map.ru.md) | — | — | ❌ | — |
| REQ-SH-012 | Confirm departure/arrival из списка | [tab_tracking.md](03_details/tab_tracking.md) | TC-2937 In Transit status | `smokeTest/confirmTP.js` | ✅ | — |
| REQ-SH-013 | Экспорт в Excel | [shipments-list.md](../technical-view/pages/shipments-list.md) | — | — | ❌ | — |

---

## REQ-CSW — CSW Wizard

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-CSW-001 | Создать SR через Direct Booking | [step-04_booking.md](02_create-wizard/step-04_booking.md) | TC-1337 Creating SR | `smokeTest/shipmentRequest.js` | ✅ | — |
| REQ-CSW-002 | Создать через Quote Request | [step-04_booking.md](02_create-wizard/step-04_booking.md) | TC-1338 Creating QR | `smokeTest/quoteRequest.js` | ✅ | — |
| REQ-CSW-003 | Сохранить как Draft | [step-01_basics.md](02_create-wizard/step-01_basics.md) | TC-1339 Creating Draft | `smokeTest/creatingDraft.js` | ✅ | — |
| REQ-CSW-004 | Сохранить как RTB | [step-01_basics.md](02_create-wizard/step-01_basics.md) | TC-1340 Creating RTB | `smokeTest/readyToBook.js` | ✅ | — |
| REQ-CSW-005 | Название заявки — обязательное | [step-01_basics.md](02_create-wizard/step-01_basics.md) | — | — | ❌ | Нет тест-кейса на валидацию |
| REQ-CSW-007 | Выбор Entity (юр. лицо) | [step-01_basics.md](02_create-wizard/step-01_basics.md) | — | — | ❌ | — |
| REQ-CSW-010 | Груз: Content Type + qty + weight | [step-02_cargo.md](02_create-wizard/step-02_cargo.md) | — | — | ❌ | — |
| REQ-CSW-011 | Metric/Imperial конвертация | [step-02_cargo.md](02_create-wizard/step-02_cargo.md) | — | — | ❌ | Нет тест-кейса |
| REQ-CSW-012 | Адрес отправки — обязательный | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) | — | — | ❌ | — |
| REQ-CSW-014 | Milkrun — второй pre-shipment | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) | TC-1625 Milkrun creation | `smokeTest/creatingMilkrun.js` | ✅ | — |
| REQ-CSW-015 | Выбор перевозчика | [step-04_booking.md](02_create-wizard/step-04_booking.md) | TC-1337 SR | `smokeTest/shipmentRequest.js` | ✅ | — |
| REQ-CSW-016 | Auto-fill из Rate Sheet | [step-04_booking.md](02_create-wizard/step-04_booking.md) | Rate sheet TC | `rateSheets/countMilkrunRateSheet.js` | 🔶 | Только Milkrun RS |

---

## REQ-TP — Tracking Points

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-TP-001 | Таймлайн TP на странице | [tab_tracking.md](03_details/tab_tracking.md) | TC-2937..2945 | — | 🔶 | Нет автотеста |
| REQ-TP-003 | Confirm TP departure | [tab_tracking.md](03_details/tab_tracking.md) | TC-2940 In Transit | `smokeTest/confirmTP.js` | ✅ | — |
| REQ-TP-004 | Confirm TP arrival | [tab_tracking.md](03_details/tab_tracking.md) | TC-2943 Delivered | `smokeTest/confirmTP.js` | ✅ | — |
| REQ-TP-005 | Replan TP | [tab_tracking.md](03_details/tab_tracking.md) | TC-X Replan | `smokeTest/replanTP.js` | ✅ | — |
| REQ-TP-006 | Тип задержки (DELAY_DIALOG) | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-TP-007 | Обновить груз при confirm | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-TP-009 | Milkrun: выбор siblings | [tab_tracking.md](03_details/tab_tracking.md) | TC-1447 Milkrun TP | — | 🔶 | Нет автотеста |
| REQ-TP-010 | Инцидент при задержке | [tab_tracking.md](03_details/tab_tracking.md) | — | — | ❌ | — |

---

## REQ-INV — Invoicing

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-INV-001 | Добавить cost segment | [tab_invoicing.md](03_details/tab_invoicing.md) | TC-2946..2952 | — | 🔶 | Нет автотеста |
| REQ-INV-002 | Редактировать стоимость | [tab_invoicing.md](03_details/tab_invoicing.md) | — | — | ❌ | — |
| REQ-INV-003 | 7 статусов invoicing_status | [tab_invoicing.md](03_details/tab_invoicing.md) + [02_invoicing-statuses-detail.md](../invoicing/02_invoicing-statuses-detail.md) | TC-2946..2952 | — | ✅ | Только ручные тесты |
| REQ-INV-005 | Gap analysis с Rate Sheet | [tab_invoicing.md](03_details/tab_invoicing.md) | — | — | ❌ | — |
| REQ-INV-006 | FREEZE → SAP export | [tab_invoicing.md](03_details/tab_invoicing.md) | — | — | ❌ | Зависит от SAP интеграции |

---

## REQ-MOD — Модальные окна

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-MOD-001 | Отмена Shipment | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-MOD-002 | Реактивация | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-MOD-005 | Запрос POD | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-MOD-008 | Добавить TP (форма) | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |
| REQ-MOD-009 | Edit TP: 7 шагов | [05_modals/README.md](05_modals/README.md) | — | — | ❌ | — |

---

## REQ-ROLE — Права доступа

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-ROLE-001 | Shipper видит Carriers фильтр | [06_roles-matrix.md](06_roles-matrix.md) | TC-1334..1336 | `smokeTest/shipmentRequest.js` | ✅ | — |
| REQ-ROLE-002 | Carrier не создаёт SR | [06_roles-matrix.md](06_roles-matrix.md) | TC-1335 Login as carrier | — | 🔶 | Нет explicit теста |
| REQ-ROLE-003 | Visibility: чат locked | [06_roles-matrix.md](06_roles-matrix.md) | — | — | ❌ | — |
| REQ-ROLE-004 | Spectator: только Tracking | [06_roles-matrix.md](06_roles-matrix.md) | TC-4164 Spectator | `smokeTest/addingSpectator.js` | ✅ | — |
| REQ-ROLE-007 | Carrier: субподряд Road only | [tab_tracking.md](03_details/tab_tracking.md) | — | — | ❌ | — |

---

## REQ-INT — Интеграции

| REQ-ID | Требование (ЧТО?) | Документация (КАК?) | Тест-кейсы (Qase TC) | Автотесты | Coverage | Notes |
|--------|-------------------|---------------------|---------------------|-----------|---------|-------|
| REQ-INT-001 | Интеграция при confirm | [07_integrations-behavior.md](07_integrations-behavior.md) | — | BDD: dispor.feature | 🔶 | Только DHL DISPOR |
| REQ-INT-002 | P44: авто-TP от GPS | [07_integrations-behavior.md](07_integrations-behavior.md) | — | — | ❌ | — |
| REQ-INT-004 | WMS кнопка видна | [07_integrations-behavior.md](07_integrations-behavior.md) | — | — | ❌ | — |

---

## Итоговая статистика покрытия

| Группа | Всего REQ | ✅ Полное | 🔶 Частичное | ❌ Пробел | % покрытия |
|--------|-----------|----------|-------------|----------|-----------|
| Список (SH) | 7 | 2 | 1 | 4 | 29% |
| CSW Wizard | 12 | 5 | 1 | 6 | 42% |
| Tracking Points | 8 | 3 | 2 | 3 | 38% |
| Invoicing | 5 | 1 | 1 | 3 | 20% |
| Modals | 5 | 0 | 0 | 5 | 0% |
| Roles | 5 | 2 | 1 | 2 | 40% |
| Integrations | 3 | 0 | 1 | 2 | 17% |
| **ИТОГО** | **45** | **13** | **7** | **25** | **29%** |

> ⚠️ **55% требований не имеют тест-кейсов.** Это основная зона роста для QA.

---

## Что делать дальше — GAP Analysis

### Приоритет 1 — написать тест-кейсы для P0 без покрытия

| REQ-ID | Описание | Почему критично |
|--------|---------|----------------|
| REQ-SH-003 | Фильтр по режиму (Road/Air/Sea) | Основной фильтр, используется каждым пользователем |
| REQ-CSW-005 | Валидация: название заявки обязательно | P0 — без имени SR не создаётся |
| REQ-CSW-010 | Груз: content type + quantity | Основная секция CSW |
| REQ-CSW-012 | Адрес отправки обязателен | Критичная валидация |
| REQ-INV-002 | Редактировать стоимость | Финансовые операции |
| REQ-MOD-001 | Отмена Shipment | Критичное действие |

### Приоритет 2 — автоматизировать существующие P0 тест-кейсы

Из `COVERAGE.md`: только **10.8%** кейсов автоматизированы.  
Следующие кандидаты на автоматизацию:
1. **CSW Wizard** (240 кейсов, 0% авто) — самый высокий риск
2. **Booking List фильтры** (88 кейсов, 0% авто)
3. **Invoicing statuses** (7 кейсов, 0% авто) — финансы

---

## Как поддерживать RTM актуальным

```
1. Новое требование → добавить строку в таблицу со статусом ❌
2. Написан тест-кейс → обновить колонку "Тест-кейсы", статус → 🔶
3. Написан автотест → обновить "Автотесты", статус → ✅
4. Ревью RTM раз в спринт — проверить новые ❌
```

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632422564 · **repo:** `tms/shipments/RTM.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

