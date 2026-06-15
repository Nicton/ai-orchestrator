---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632389781
source_type: confluence
---
# RTM: Требования → Документация
## TMS Shipments — Проверка покрытия документацией

> Цель: убедиться что каждое требование имеет описание "КАК работает" в документации.
> ✅ — документация есть | ❌ — документации нет | 🔶 — есть частично

---

## REQ-SH — Список перевозок (/shipments)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-SH-001 | Список всех перевозок пользователя | [shipments-list.md](../technical-view/pages/shipments-list.md) + [00_domain-map.ru.md](00_domain-map.ru.md) §1.2 | ✅ |
| REQ-SH-002 | Фильтр по статусу | [shipments-list.md](../technical-view/pages/shipments-list.md) + [00_domain-map.ru.md](00_domain-map.ru.md) §4 | ✅ |
| REQ-SH-003 | Фильтр по режиму (Road/Air/Sea) | [00_domain-map.ru.md](00_domain-map.ru.md) §1.3 resolve | ✅ |
| REQ-SH-004 | Фильтр "All Carriers" только Shipper | [06_roles-matrix.md](06_roles-matrix.md) §3.1 | ✅ |
| REQ-SH-005 | Фильтр "All Shippers" только Carrier | [06_roles-matrix.md](06_roles-matrix.md) §3.1 | ✅ |
| REQ-SH-006 | Фильтр по диапазону дат | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-007 | Фильтр по тегам | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-008 | Фильтр по юр. лицу (Entity) | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-009 | Фильтр: отсутствующие метаданные | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-010 | Фильтр: отсутствующие документы | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-011 | Сортировка по датам | [00_domain-map.ru.md](00_domain-map.ru.md) §1.2 | ✅ |
| REQ-SH-012 | Пагинация | [shipments-list.md](../technical-view/pages/shipments-list.md) | ✅ |
| REQ-SH-013 | Экспорт в Excel (роли Shipper/Carrier) | [06_roles-matrix.md](06_roles-matrix.md) §3.5 | ✅ |
| REQ-SH-014 | Smart-list ?isNotConfirmed | [00_domain-map.ru.md](00_domain-map.ru.md) §6.8 | ✅ |
| REQ-SH-015 | Smart-list ?tpIncident — колонка Incidents | [00_domain-map.ru.md](00_domain-map.ru.md) §6.8 | ✅ |
| REQ-SH-016 | Smart-list ?isTpDelayed | [00_domain-map.ru.md](00_domain-map.ru.md) §6.8 | ✅ |
| REQ-SH-017 | Smart-list ?withoutPod | [00_domain-map.ru.md](00_domain-map.ru.md) §6.8 | ✅ |
| REQ-SH-018 | Confirm departure/arrival из списка | [tab_tracking.md](03_details/tab_tracking.md) §1 | ✅ |
| REQ-SH-019 | Иконка Spectator на строке | [00_domain-map.ru.md](00_domain-map.ru.md) §2.2 | ✅ |
| REQ-SH-020 | Переключатель видов: список/доска/air-sea | [00_domain-map.ru.md](00_domain-map.ru.md) §5 | ✅ |

**SH покрытие: 20/20 ✅**

---

## REQ-CSW — CSW Wizard

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-CSW-001 | Создать SR через Direct Booking | [step-04_booking.md](02_create-wizard/step-04_booking.md) | ✅ |
| REQ-CSW-002 | Создать через Quote Request | [step-04_booking.md](02_create-wizard/step-04_booking.md) | ✅ |
| REQ-CSW-003 | Сохранить как Draft | [step-01_basics.md](02_create-wizard/step-01_basics.md) | ✅ |
| REQ-CSW-004 | Сохранить как Ready to Book | [step-01_basics.md](02_create-wizard/step-01_basics.md) | ✅ |
| REQ-CSW-005 | Название заявки — обязательное, динамический label | [step-01_basics.md](02_create-wizard/step-01_basics.md) §Поля | ✅ |
| REQ-CSW-006 | Режим перевозки (Mode switcher) | [step-01_basics.md](02_create-wizard/step-01_basics.md) §Mode | ✅ |
| REQ-CSW-007 | Выбор Entity — если включено в аккаунте | [step-01_basics.md](02_create-wizard/step-01_basics.md) §Entity | ✅ |
| REQ-CSW-008 | Entity обязательна при is_mandatory_entities | [step-01_basics.md](02_create-wizard/step-01_basics.md) §Entity | ✅ |
| REQ-CSW-009 | Теги (Tags chip-list) | [step-01_basics.md](02_create-wizard/step-01_basics.md) §Теги | ✅ |
| REQ-CSW-010 | Груз: Content Type + qty + weight + volume | [step-02_cargo.md](02_create-wizard/step-02_cargo.md) | ✅ |
| REQ-CSW-011 | Metric/Imperial с конвертацией | [step-02_cargo.md](02_create-wizard/step-02_cargo.md) §Измерения | ✅ |
| REQ-CSW-012 | Адрес отправки — обязательный | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) §Адреса | ✅ |
| REQ-CSW-013 | Адрес доставки — обязательный | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) §Адреса | ✅ |
| REQ-CSW-014 | Зона Master Location + slots | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) §Зоны | ✅ |
| REQ-CSW-015 | Инкотермы | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) §Инкотермы | ✅ |
| REQ-CSW-016 | Milkrun — второй pre-shipment | [step-03_pre-shipment.md](02_create-wizard/step-03_pre-shipment.md) §Milkrun | ✅ |
| REQ-CSW-017 | Выбор перевозчика | [step-04_booking.md](02_create-wizard/step-04_booking.md) §Carrier | ✅ |
| REQ-CSW-018 | Auto-fill из Rate Sheet | [step-04_booking.md](02_create-wizard/step-04_booking.md) §RateSheet | ✅ |
| REQ-CSW-019 | Повтор заявки (Repeat) | [00_domain-map.ru.md](00_domain-map.ru.md) + [flow-types.md](flow-types.md) | ✅ |
| REQ-CSW-020 | Reverse route | [flow-types.md](flow-types.md) | ✅ |
| REQ-CSW-021 | Создание из шаблона (Template) | [00_domain-map.ru.md](00_domain-map.ru.md) §1.2 + [flow-types.md](flow-types.md) | ✅ |
| REQ-CSW-022 | Followers при создании | [step-04_booking.md](02_create-wizard/step-04_booking.md) §Followers | ✅ |
| REQ-CSW-023 | Вложения в CSW | [step-04_booking.md](02_create-wizard/step-04_booking.md) | ✅ |
| REQ-CSW-024 | Валидация: блокировка кнопок | [02_create-wizard/README.md](02_create-wizard/README.md) + [step-01_basics.md](02_create-wizard/step-01_basics.md) §Validation | ✅ |

**CSW покрытие: 24/24 ✅**

---

## REQ-DET — Детальная страница

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-DET-001 | Маршрут From → To с адресами | [tab_tracking.md](03_details/tab_tracking.md) §Shipment Card | ✅ |
| REQ-DET-002 | Даты отправки и прибытия | [tab_tracking.md](03_details/tab_tracking.md) §Card | ✅ |
| REQ-DET-003 | Груз: содержимое, вес, объём | [tab_tracking.md](03_details/tab_tracking.md) §Card | ✅ |
| REQ-DET-004 | Вкладка Tracking (по умолчанию) | [03_details/README.md](03_details/README.md) §Вкладки | ✅ |
| REQ-DET-005 | Вкладка Booking | [tab_booking.md](03_details/tab_booking.md) | ✅ |
| REQ-DET-006 | Вкладка Invoicing (после confirm) | [tab_invoicing.md](03_details/tab_invoicing.md) | ✅ |
| REQ-DET-007 | Вкладка Claim | [03_details/README.md](03_details/README.md) §Вкладки | 🔶 Нет детальной страницы Claims |
| REQ-DET-008 | Вкладка Transport Requests (Shipper) | [00_domain-map.ru.md](00_domain-map.ru.md) §6.9 | ✅ |
| REQ-DET-009 | Открытие через URL ?tab= | [03_details/README.md](03_details/README.md) §Дефолтная вкладка | ✅ |
| REQ-DET-010 | Блок "Tracking shared with/by" | [tab_tracking.md](03_details/tab_tracking.md) §Card | ✅ |
| REQ-DET-011 | Mini-App режим (kiosk header) | [00_domain-map.ru.md](00_domain-map.ru.md) §6.10 | ✅ |
| REQ-DET-012 | Integration alerts | [tab_tracking.md](03_details/tab_tracking.md) §8 | ✅ |

**DET покрытие: 11/12 ✅ (Claims вкладка — 🔶)**

---

## REQ-TP — Tracking Points

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-TP-001 | Таймлайн TP | [tab_tracking.md](03_details/tab_tracking.md) §3 | ✅ |
| REQ-TP-002 | Добавить новый TP | [05_modals/README.md](05_modals/README.md) §7 | ✅ |
| REQ-TP-003 | Confirm departure | [tab_tracking.md](03_details/tab_tracking.md) §3 + [05_modals/README.md](05_modals/README.md) §8 | ✅ |
| REQ-TP-004 | Confirm arrival | [tab_tracking.md](03_details/tab_tracking.md) §3 + [05_modals/README.md](05_modals/README.md) §8 | ✅ |
| REQ-TP-005 | Replan TP | [05_modals/README.md](05_modals/README.md) §8 | ✅ |
| REQ-TP-006 | Тип задержки (DELAY_DIALOG шаг) | [05_modals/README.md](05_modals/README.md) §8 — 7 шагов | ✅ |
| REQ-TP-007 | Обновить груз при confirm | [05_modals/README.md](05_modals/README.md) §8 CONTENT_ACTION | ✅ |
| REQ-TP-008 | Получатели уведомлений | [05_modals/README.md](05_modals/README.md) §8 NOTIFY_USERS | ✅ |
| REQ-TP-009 | Milkrun: выбор siblings (UPDATE_MILKRUN) | [05_modals/README.md](05_modals/README.md) §8 | ✅ |
| REQ-TP-010 | Инцидент при задержке | [tab_tracking.md](03_details/tab_tracking.md) §3 + [05_modals/README.md](05_modals/README.md) §8 | ✅ |

**TP покрытие: 10/10 ✅**

---

## REQ-INV — Invoicing

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-001 | Добавить/редактировать cost segment | [tab_invoicing.md](03_details/tab_invoicing.md) §1 | ✅ |
| REQ-INV-002 | 7 статусов invoicing_status | [tab_invoicing.md](03_details/tab_invoicing.md) §2 + [02_invoicing-statuses-detail.md](../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-003 | Assign to month + номер инвойса | [tab_invoicing.md](03_details/tab_invoicing.md) §3 | ✅ |
| REQ-INV-004 | Gap analysis при расхождении с RS | [tab_invoicing.md](03_details/tab_invoicing.md) §6 | ✅ |
| REQ-INV-005 | FREEZE → closed → SAP export | [tab_invoicing.md](03_details/tab_invoicing.md) §2 | ✅ |

**INV покрытие: 5/5 ✅**

---

## REQ-CLM — Claims

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-CLM-001 | Открыть claim (Shipper + accessClaims) | [tab_tracking.md](03_details/tab_tracking.md) §1 (кнопки действий) | 🔶 Нет детальной Claims страницы |
| REQ-CLM-002 | Кнопка скрыта при активном claim | [00_domain-map.ru.md](00_domain-map.ru.md) §2.3 | ✅ |
| REQ-CLM-003 | "See Claim" при наличии | [tab_tracking.md](03_details/tab_tracking.md) §1 | 🔶 |

**CLM покрытие: 1/3 ✅ (нужна claims/README.md)**

---

## REQ-MOD — Модальные окна

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-MOD-001 | Отмена Shipment с комментарием | [05_modals/README.md](05_modals/README.md) §1 | ✅ |
| REQ-MOD-002 | Реактивация Shipment | [05_modals/README.md](05_modals/README.md) §1 | ✅ |
| REQ-MOD-003 | Отмена бронирования слота | [05_modals/README.md](05_modals/README.md) §2 | ✅ |
| REQ-MOD-004 | Container ID / AWB ID | [05_modals/README.md](05_modals/README.md) §3 | ✅ |
| REQ-MOD-005 | Запрос POD | [05_modals/README.md](05_modals/README.md) §4 | ✅ |
| REQ-MOD-006 | Переназначение Dock Door | [05_modals/README.md](05_modals/README.md) §5 | ✅ |
| REQ-MOD-007 | Parcel Details | [05_modals/README.md](05_modals/README.md) §6 | ✅ |
| REQ-MOD-008 | Добавить TP (форма) | [05_modals/README.md](05_modals/README.md) §7 | ✅ |
| REQ-MOD-009 | Edit TP: 7 шагов | [05_modals/README.md](05_modals/README.md) §8 | ✅ |

**MOD покрытие: 9/9 ✅**

---

## REQ-ROLE — Права доступа

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-ROLE-001 | Shipper: фильтр Carriers | [06_roles-matrix.md](06_roles-matrix.md) §3.1 | ✅ |
| REQ-ROLE-002 | Carrier не создаёт SR | [06_roles-matrix.md](06_roles-matrix.md) §3.2 | ✅ |
| REQ-ROLE-003 | Visibility Account: чат locked | [06_roles-matrix.md](06_roles-matrix.md) §3.5 + [tab_tracking.md](03_details/tab_tracking.md) §6 | ✅ |
| REQ-ROLE-004 | Spectator: только Tracking | [06_roles-matrix.md](06_roles-matrix.md) §3.1 | ✅ |
| REQ-ROLE-005 | Booker: отмена только с ключом | [06_roles-matrix.md](06_roles-matrix.md) §2 | ✅ |
| REQ-ROLE-006 | Booker: canViewClaim = false | [06_roles-matrix.md](06_roles-matrix.md) §5 | ✅ |
| REQ-ROLE-007 | Carrier: субподряд только Road | [tab_tracking.md](03_details/tab_tracking.md) §4 | ✅ |
| REQ-ROLE-008 | Self Admin: отмена/реактивация | [06_roles-matrix.md](06_roles-matrix.md) §3.3 | ✅ |

**ROLE покрытие: 8/8 ✅**

---

## REQ-INT — Интеграции

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INT-001 | Интеграция при confirm shipment | [07_integrations-behavior.md](07_integrations-behavior.md) §1 | ✅ |
| REQ-INT-002 | P44: авто-TP от GPS | [07_integrations-behavior.md](07_integrations-behavior.md) §3 | ✅ |
| REQ-INT-003 | Shippeo: real-time трекинг | [07_integrations-behavior.md](07_integrations-behavior.md) §3 | ✅ |
| REQ-INT-004 | WMS кнопка видна | [tab_tracking.md](03_details/tab_tracking.md) §1 + [07_integrations-behavior.md](07_integrations-behavior.md) §4 | ✅ |
| REQ-INT-005 | Отмена интеграций при Cancel | [07_integrations-behavior.md](07_integrations-behavior.md) §1 | ✅ |
| REQ-INT-006 | Ошибки интеграции → баннер | [tab_tracking.md](03_details/tab_tracking.md) §8 | ✅ |
| REQ-INT-007 | Marine Traffic ссылка | [tab_tracking.md](03_details/tab_tracking.md) §1 | ✅ |

**INT покрытие: 7/7 ✅**

---

## REQ-STAT — Статусы и переходы

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-STAT-001 | SR: new → confirmed (Auto-confirm) | [04_state-machine.md](04_state-machine.md) + [tab_booking.md](03_details/tab_booking.md) | ✅ |
| REQ-STAT-002 | SR: new → sent_to_carrier | [04_state-machine.md](04_state-machine.md) | ✅ |
| REQ-STAT-003 | SR confirmed → Shipment создан | [04_state-machine.md](04_state-machine.md) | ✅ |
| REQ-STAT-004 | SH: planned → in_transit | [04_state-machine.md](04_state-machine.md) + [02_tracking-statuses-detail.md](../tracking/02_tracking-statuses-detail.md) | ✅ |
| REQ-STAT-005 | SH: in_transit → delivered | [04_state-machine.md](04_state-machine.md) + [02_tracking-statuses-detail.md](../tracking/02_tracking-statuses-detail.md) | ✅ |
| REQ-STAT-006 | SH → canceled (Self Admin) | [04_state-machine.md](04_state-machine.md) + [05_modals/README.md](05_modals/README.md) §1 | ✅ |
| REQ-STAT-007 | POD: 5 статусов | [00_domain-map.ru.md](00_domain-map.ru.md) §4.3 | ✅ |
| REQ-STAT-008 | Invoicing: 7 статусов | [02_invoicing-statuses-detail.md](../invoicing/02_invoicing-statuses-detail.md) | ✅ |

**STAT покрытие: 8/8 ✅**

---

## Итоговая таблица по группам

| Группа | Всего REQ | ✅ Есть дока | 🔶 Частично | ❌ Нет доки | % покрытия |
|--------|-----------|------------|------------|-----------|-----------|
| Список (SH) | 20 | 20 | 0 | 0 | **100%** |
| CSW Wizard | 24 | 24 | 0 | 0 | **100%** |
| Детали (DET) | 12 | 11 | 1 | 0 | **92%** |
| Tracking Points (TP) | 10 | 10 | 0 | 0 | **100%** |
| Invoicing (INV) | 5 | 5 | 0 | 0 | **100%** |
| Claims (CLM) | 3 | 1 | 2 | 0 | **33%** |
| Modals (MOD) | 9 | 9 | 0 | 0 | **100%** |
| Roles (ROLE) | 8 | 8 | 0 | 0 | **100%** |
| Integrations (INT) | 7 | 7 | 0 | 0 | **100%** |
| Statuses (STAT) | 8 | 8 | 0 | 0 | **100%** |
| **ИТОГО** | **106** | **103** | **3** | **0** | **97%** |

---

## Что требует доработки (3 пробела)

| REQ-ID | Требование | Что нужно |
|--------|-----------|----------|
| REQ-DET-007 | Вкладка Claim | Создать `product/tms/claims/README.md` с описанием вкладки Claim на детальной странице |
| REQ-CLM-001 | Открыть Claim (кнопка, условия) | Дополнить claims документацию: когда видна кнопка, что происходит после клика |
| REQ-CLM-003 | See Claim кнопка | То же — описание условий canViewClaim |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm-req-to-docs`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632389781 · **repo:** `tms/shipments/RTM-REQ-TO-DOCS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

