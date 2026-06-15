---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631996530
source_type: confluence
---
# Карта требований — Shipments Domain

> Используется для построения матрицы покрытия тестами (Test Coverage Map).
> Формат: `REQ-ID | Требование | Приоритет | Источник`
> Приоритеты: P0=критично, P1=важно, P2=желательно

---

## REQ-SH — Список перевозок

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-SH-001 | Отображать все перевозки текущего пользователя | P0 | GET /shipments |
| REQ-SH-002 | Фильтр по статусу (planned / in_transit / delivered / canceled) | P0 | list.js |
| REQ-SH-003 | Фильтр по режиму (Road / Air / Sea) | P0 | list.js |
| REQ-SH-004 | Фильтр "All Carriers" — только для Shipper | P0 | ng-if isShipper |
| REQ-SH-005 | Фильтр "All Shippers" — только для Carrier | P0 | ng-if isCarrier |
| REQ-SH-006 | Фильтр по диапазону дат (отправка + прибытие) | P1 | list.js |
| REQ-SH-007 | Фильтр по тегам | P1 | list.js |
| REQ-SH-008 | Фильтр по юр. лицу (Entity) | P1 | list.js |
| REQ-SH-009 | Фильтр: отсутствующие метаданные | P2 | list.js |
| REQ-SH-010 | Фильтр: отсутствующие документы | P2 | list.js |
| REQ-SH-011 | Сортировка по дате отправки и прибытия | P1 | list.js |
| REQ-SH-012 | Пагинация результатов | P0 | GET /shipments?page= |
| REQ-SH-013 | Экспорт в Excel (Shipper всегда, Carrier — без history) | P1 | GET /shipments-excel |
| REQ-SH-014 | Smart-list: ?isNotConfirmed обходит UserSettings | P1 | router.js |
| REQ-SH-015 | Smart-list: ?tpIncident добавляет колонку Incidents | P1 | router.js |
| REQ-SH-016 | Smart-list: ?isTpDelayed фильтр задержанных | P1 | router.js |
| REQ-SH-017 | Smart-list: ?withoutPod фильтр без POD | P1 | router.js |
| REQ-SH-018 | Кнопки Confirm departure/arrival прямо из списка | P0 | ng-if !rtd/!rta |
| REQ-SH-019 | Иконка Spectator (eye) на строке shared перевозки | P2 | ng-if isSpectator |
| REQ-SH-020 | Переключатель видов: трекинг / доска / air-sea | P1 | ng-if canBook |

---

## REQ-CSW — CSW Wizard

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-CSW-001 | Создать SR через Direct Booking (1 перевозчик) | P0 | POST /shipment-requests |
| REQ-CSW-002 | Создать SR через Quote Request (N перевозчиков) | P0 | POST /shipment-requests |
| REQ-CSW-003 | Сохранить как Draft | P1 | status=draft |
| REQ-CSW-004 | Сохранить как Ready to Book | P1 | status=ready_to_book |
| REQ-CSW-005 | Поле название — обязательное, динамический label | P0 | ShipmentRequest.name |
| REQ-CSW-006 | Выбор режима перевозки (Mode switcher) | P0 | modes[] |
| REQ-CSW-007 | Выбор юридического лица (Entity) — если включено | P1 | accounting_entity_id |
| REQ-CSW-008 | Entity обязательна при is_mandatory_entities | P0 | isMandatoryEntity |
| REQ-CSW-009 | Выбор тегов (Tags chip-list) | P2 | booking_tag |
| REQ-CSW-010 | Добавление груза (Content Type + qty + weight + volume) | P0 | contents[] |
| REQ-CSW-011 | Система измерений metric / imperial с конвертацией | P1 | measurement_system |
| REQ-CSW-012 | Адрес отправки — обязательный | P0 | from_address_id |
| REQ-CSW-013 | Адрес доставки — обязательный | P0 | dest_address_id |
| REQ-CSW-014 | Дата отправки и прибытия | P0 | shipping_date_from/to |
| REQ-CSW-015 | Выбор зоны для Master Location | P1 | location_zone_id |
| REQ-CSW-016 | Инкотермы на уровне локации | P2 | incoterm_id |
| REQ-CSW-017 | Добавление второй точки (Milkrun) | P1 | pre_shipments[1] |
| REQ-CSW-018 | Выбор перевозчика из списка | P0 | carrier_division_id |
| REQ-CSW-019 | Auto-fill цены из Rate Sheet | P1 | buildQueryForRateSheet |
| REQ-CSW-020 | Повтор заявки (Repeat) | P1 | repeatAction=true |
| REQ-CSW-021 | Обратный маршрут (Reverse) | P2 | reverseAction=true |
| REQ-CSW-022 | Создание из шаблона | P1 | bookingTemplate |
| REQ-CSW-023 | Выбор Followers (уведомления при отправке) | P1 | followers[] |
| REQ-CSW-024 | Загрузка вложений в CSW | P2 | attachments[] |
| REQ-CSW-025 | Валидация: блокировка кнопок при неполных данных | P0 | validateProgress |

---

## REQ-DET — Детальная страница

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-DET-001 | Маршрут From → To с адресами | P0 | address_lines4() |
| REQ-DET-002 | Даты отправки и прибытия | P0 | view.js |
| REQ-DET-003 | Груз: содержимое, вес, объём | P0 | ShipmentContents |
| REQ-DET-004 | Вкладка Tracking (по умолчанию) | P0 | TAB_NAME_TRACKING |
| REQ-DET-005 | Вкладка Booking | P0 | TAB_NAME_QUOTES |
| REQ-DET-006 | Вкладка Invoicing (после confirm) | P1 | TAB_NAME_INVOICING |
| REQ-DET-007 | Вкладка Claim | P1 | TAB_NAME_CLAIM |
| REQ-DET-008 | Вкладка Transport Requests (Shipper only) | P2 | TAB_NAME_TRANSPORT_REQUESTS |
| REQ-DET-009 | Открытие вкладки через URL ?tab= | P1 | $stateParams.tab |
| REQ-DET-010 | Блок "Tracking shared with/by" | P1 | connectedPartnersNames |
| REQ-DET-011 | Режим Mini-App (kiosk branded header) | P2 | isMiniApp |
| REQ-DET-012 | Интеграционные алерты (красные / синие баннеры) | P1 | activeIntegrations |

---

## REQ-TP — Tracking Points

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-TP-001 | Таймлайн всех TP | P0 | view.js |
| REQ-TP-002 | Добавить новый TP | P0 | POST /tracking-points |
| REQ-TP-003 | Confirm TP departure | P0 | PUT /tracking-points/:id |
| REQ-TP-004 | Confirm TP arrival | P0 | PUT /tracking-points/:id |
| REQ-TP-005 | Replan TP (изменить дату/время) | P0 | PUT /tracking-points/:id |
| REQ-TP-006 | Указать тип задержки (DELAY_DIALOG step) | P1 | edit-tracking-point.js |
| REQ-TP-007 | Обновить груз при confirm (CONTENT_ACTION) | P1 | edit-tracking-point.js |
| REQ-TP-008 | Выбрать получателей уведомлений | P1 | NOTIFY_USERS step |
| REQ-TP-009 | Milkrun: выбрать связанные SH (UPDATE_MILKRUN) | P1 | edit-tracking-point.js |
| REQ-TP-010 | Указать инцидент при задержке | P1 | incident_id |

---

## REQ-INV — Invoicing

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-INV-001 | Добавить / редактировать cost segment | P0 | price_details[] |
| REQ-INV-002 | Статус invoicing_status (7 значений) | P0 | invoicing_status |
| REQ-INV-003 | Assign to month + номер инвойса | P1 | invoicing_month |
| REQ-INV-004 | Gap analysis при расхождении с Rate Sheet | P1 | gap |
| REQ-INV-005 | FREEZE → closed → экспорт SAP | P1 | invoicing_status: closed |

---

## REQ-CLM — Claims

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-CLM-001 | Открыть claim — Shipper + accessClaims | P1 | isShipper && accessClaims |
| REQ-CLM-002 | Кнопка скрыта если есть активный claim | P1 | claims.length && status != canceled |
| REQ-CLM-003 | "See Claim" кнопка при наличии claim | P1 | canViewClaim |

---

## REQ-MOD — Модалы

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-MOD-001 | Отмена Shipment с комментарием (Self Admin) | P0 | activate-reactivate-modal |
| REQ-MOD-002 | Реактивация отменённого Shipment | P1 | activate-reactivate-modal |
| REQ-MOD-003 | Отмена бронирования слота | P1 | cancel-slot-booking |
| REQ-MOD-004 | Добавление Container ID (Sea) / AWB ID (Air) | P1 | container-id-modal |
| REQ-MOD-005 | Запрос POD от Carrier (только Shipper) | P1 | request-proof-of-delivery |
| REQ-MOD-006 | Переназначение Dock Door | P2 | update-dock-door |
| REQ-MOD-007 | Просмотр tracking по посылкам | P2 | parcel-details |
| REQ-MOD-008 | Добавить TP через модал (форма с типом, адресом, датами) | P0 | add-tracking-point |
| REQ-MOD-009 | Edit TP: 7 шагов MODE_CONFIRM с валидацией | P0 | edit-tracking-point |

---

## REQ-ROLE — Права доступа

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-ROLE-001 | Shipper видит фильтр Carriers, не Shippers | P0 | ng-if |
| REQ-ROLE-002 | Carrier не может создавать SR через CSW | P0 | requireShipper |
| REQ-ROLE-003 | Visibility Account: чат и вложения locked | P0 | isVisibilityAccount |
| REQ-ROLE-004 | Spectator видит только Tracking вкладку | P1 | isSpectator |
| REQ-ROLE-005 | Booker: отмена только с CAN_CANCEL_KEY | P1 | ACL key |
| REQ-ROLE-006 | Booker: canViewClaim = false | P1 | isBooker |
| REQ-ROLE-007 | Carrier: субподряд только Road mode | P1 | canSubcontract |
| REQ-ROLE-008 | Self Admin: может отменять и реактивировать | P0 | isSelfAdmin |

---

## REQ-INT — Интеграции

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-INT-001 | Интеграция запускается при создании Shipment | P0 | processNewCreatedShipments |
| REQ-INT-002 | P44: авто-создание TP от GPS данных | P1 | integrateP44Shipment |
| REQ-INT-003 | Shippeo: real-time трекинг | P1 | createShippeoShipment |
| REQ-INT-004 | Reflex/WMS: кнопка "Send to WMS" видна | P2 | showWMSButton |
| REQ-INT-005 | Отмена интеграций при Cancel Shipment | P1 | runCancelShipmentIntegrations |
| REQ-INT-006 | Ошибки интеграции → красный баннер | P1 | activeIntegrationErrors |
| REQ-INT-007 | Marine Traffic ссылка для контейнеров | P2 | isShowMarineTrafficLink |

---

## REQ-STAT — Статусы и переходы

| REQ-ID | Требование | P | Источник |
|--------|-----------|---|---------|
| REQ-STAT-001 | SR: new → confirmed (Auto-confirm Shipper) | P0 | state-machine |
| REQ-STAT-002 | SR: new → sent_to_carrier (Carrier side) | P0 | state-machine |
| REQ-STAT-003 | SR confirmed → Shipment создан | P0 | state-machine |
| REQ-STAT-004 | SH: planned → in_transit (confirm departure TP) | P0 | state-machine |
| REQ-STAT-005 | SH: in_transit → delivered (confirm arrival TP) | P0 | state-machine |
| REQ-STAT-006 | SH → canceled (Self Admin only) | P0 | state-machine |
| REQ-STAT-007 | POD: pending → expected → loaded → approved/declined | P1 | pod_status |
| REQ-STAT-008 | Invoicing: not_priced → waiting → invoiced → closed | P1 | invoicing_status |

---

## Итоговая статистика

| Группа | REQ | P0 | P1 | P2 |
|--------|-----|----|----|-----|
| Список | 20 | 5 | 11 | 4 |
| CSW Wizard | 25 | 9 | 12 | 4 |
| Детали | 12 | 4 | 6 | 2 |
| Tracking Points | 10 | 5 | 5 | 0 |
| Invoicing | 5 | 1 | 4 | 0 |
| Claims | 3 | 0 | 3 | 0 |
| Modals | 9 | 2 | 5 | 2 |
| Роли | 8 | 4 | 4 | 0 |
| Интеграции | 7 | 1 | 4 | 2 |
| Статусы | 8 | 6 | 2 | 0 |
| **ИТОГО** | **107** | **37** | **56** | **14** |


---

# Часть 2. Остальные домены TMS/DOCK (добавлено 2026-06-11)

> Выше — детальная карта домена Shipments (106 REQ). Ниже — **все остальные требования** платформы, извлечённые из чеклистов 09-16: **337 REQ** (уникальных; дубли между чеклистами исключены: 0).
> **Итого по платформе: 443 REQ в чеклистах**; канонический RTM консолидирует их в **410 строк покрытия** (объединение смежных, см. историю пересчёта в [RTM-MASTER](../../RTM-MASTER.md), Confluence 622854173). Покрытие документацией: **98.5%, 0 непокрытых**.

### Booking Flows (BOOK) (55 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-BOOK-001 | Создание заявки — Standard Creation (SC) | P0 | 09_checklist-booking |
| REQ-BOOK-002 | Создание заявки из шаблона (Template Creation — TC) | P0 | 09_checklist-booking |
| REQ-BOOK-003 | Создание заявки по Token Template (TT) — без авторизации | P1 | 09_checklist-booking |
| REQ-BOOK-004 | Book For Me (BFM) — внешний партнёр с бесплатным аккаунтом | P1 | 09_checklist-booking |
| REQ-BOOK-005 | Повторное создание заявки (Repeat Creation — RC) | P1 | 09_checklist-booking |
| REQ-BOOK-006 | Forward Creation (FW) — создание продолжения маршрута | P2 | 09_checklist-booking |
| REQ-BOOK-007 | Throwback Creation (TB) — создание обратного маршрута | P2 | 09_checklist-booking |
| REQ-BOOK-008 | Создание заявки через API (APIC) | P0 | 09_checklist-booking |
| REQ-BOOK-009 | Создание заявки из PDF через AI (PDFAI) | P1 | 09_checklist-booking |
| REQ-BOOK-010 | Создание заявки из текста через AI (TXTAI) | P1 | 09_checklist-booking |
| REQ-BOOK-011 | Создание заявки из Transport Request (TRC) | P1 | 09_checklist-booking |
| REQ-BOOK-012 | Direct Booking (DB) — выбор одного перевозчика | P0 | 09_checklist-booking |
| REQ-BOOK-013 | Quote Request (QR) — запрос котировок у нескольких перевозчиков | P0 | 09_checklist-booking |
| REQ-BOOK-014 | Automated Direct Booking (ADB) — полностью автоматическое бронирование | P1 | 09_checklist-booking |
| REQ-BOOK-015 | Semi Automated Direct Booking (SADB) — авто-создание с ручным выбором перевозчика | P1 | 09_checklist-booking |
| REQ-BOOK-016 | First Responder (FR) — первый перевозчик с ценой ниже лимита получает бронь | P2 | 09_checklist-booking |
| REQ-BOOK-017 | CSW — обновлённый выбор перевозчика (отображение комментария) | P1 | 09_checklist-booking |
| REQ-BOOK-018 | Отмена отправки — причина отмены (Reason Code) | P0 | 09_checklist-booking |
| REQ-BOOK-019 | Отмена отправки — хранение данных и аудит | P1 | 09_checklist-booking |
| REQ-BOOK-020 | Replanning tracking point — причина переноса (Replan Reason Code) | P1 | 09_checklist-booking |
| REQ-BOOK-021 | Replanning — API и чат с reason code | P1 | 09_checklist-booking |
| REQ-BOOK-022 | Admin — конфигурация причин отмены и переноса (Cancellation & Replan Management) | P1 | 09_checklist-booking |
| REQ-BOOK-023 | PUT /shipments/contents — пересчёт Weight/Volume/CW/LM | P0 | 09_checklist-booking |
| REQ-BOOK-024 | POST /shipments/contents — пересчёт при добавлении позиции | P0 | 09_checklist-booking |
| REQ-BOOK-025 | PATCH /shipments/contents — патч по content_id с пересчётом CW | P1 | 09_checklist-booking |
| REQ-BOOK-026 | Обновление packing list при подтверждении пикапа/доставки (TP confirmation) | P1 | 09_checklist-booking |
| REQ-BOOK-027 | CW на уровне Transport Request (TR) — корректное отображение | P1 | 09_checklist-booking |
| REQ-BOOK-028 | Консолидация TR в SR — логика распределения CW | P1 | 09_checklist-booking |
| REQ-BOOK-029 | API POST /shipments/{id}/transit — добавление транзитных точек | P1 | 09_checklist-booking |
| REQ-BOOK-030 | API транзит — валидация SCAC/IATA/LOCODE кодов | P1 | 09_checklist-booking |
| REQ-BOOK-031 | Панель уведомлений — Business Log (Notification Center) | P1 | 09_checklist-booking |
| REQ-BOOK-032 | Настройки уведомлений — подписка по типам событий | P1 | 09_checklist-booking |
| REQ-BOOK-033 | Digest-уведомления по расписанию (Email Digest) | P2 | 09_checklist-booking |
| REQ-BOOK-034 | Vacation Mode и переадресация уведомлений | P2 | 09_checklist-booking |
| REQ-BOOK-035 | Уведомление — просроченный пикап или доставка без подтверждения | P1 | 09_checklist-booking |
| REQ-BOOK-036 | Мute/Follow уведомлений на уровне отдельного объекта | P2 | 09_checklist-booking |
| REQ-BOOK-037 | Rebuilt UI — просмотр адреса отправки/доставки (truncate + modal) | P1 | 09_checklist-booking |
| REQ-BOOK-038 | Rebuilt UI — Quick Status Update (быстрые действия по статусу) | P0 | 09_checklist-booking |
| REQ-BOOK-039 | Rebuilt UI — скрытие CTA после подтверждения pickup/delivery | P1 | 09_checklist-booking |
| REQ-BOOK-040 | Rebuilt UI — статус Delivered и Upload POD | P0 | 09_checklist-booking |
| REQ-BOOK-041 | Rebuilt UI — CO2 пиктограмма и виджет | P2 | 09_checklist-booking |
| REQ-BOOK-042 | Rebuilt UI — список действий (Actions panel) и группировка | P1 | 09_checklist-booking |
| REQ-BOOK-043 | Rebuilt UI — отображение Services и Additional Services | P2 | 09_checklist-booking |
| REQ-BOOK-044 | Rebuilt UI — сжатое отображение дополнительной информации | P2 | 09_checklist-booking |
| REQ-BOOK-045 | Rebuilt UI — отображение Incident Reported | P1 | 09_checklist-booking |
| REQ-BOOK-046 | Rebuilt UI — привязка к слоту (BOOK A SLOT) из заголовка | P2 | 09_checklist-booking |
| REQ-BOOK-047 | Rebuilt UI — изоляция чата от логов (Chat vs Logs) | P1 | 09_checklist-booking |
| REQ-BOOK-048 | Multi-account навигация — переключение между TMS и DOCK аккаунтами | P1 | 09_checklist-booking |
| REQ-BOOK-049 | Tracking Timeline — сворачивание/разворачивание детальных точек треккинга | P1 | 09_checklist-booking |
| REQ-BOOK-050 | Packing List на карточке отправки — отображение специфик | P1 | 09_checklist-booking |
| REQ-BOOK-051 | Заголовок карточки отправки — синтез ключевой информации | P1 | 09_checklist-booking |
| REQ-BOOK-052 | Уведомления — дедупликация при update location + replan TP | P2 | 09_checklist-booking |
| REQ-BOOK-053 | Label Creation Indirect (LCI) и Direct (LCD) — Express/Parcel | P2 | 09_checklist-booking |
| REQ-BOOK-054 | Shipping — Share Truck & Driver details | P1 | 09_checklist-booking |
| REQ-BOOK-055 | Tracking point — Add Transit Points (промежуточные точки для Air/Sea) | P1 | 09_checklist-booking |

### Invoicing (INV) (40 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-INV-001 | Фильтрация строк инвойса по статусу PENDING перед созданием пре-инвойса | P0 | 10_checklist-invoicing |
| REQ-INV-002 | Массовый выбор строк: чекбокс 'Select All' в заголовке таблицы | P0 | 10_checklist-invoicing |
| REQ-INV-003 | Генерация пре-инвойсов: 1 пре-инвойс на партнёра | P0 | 10_checklist-invoicing |
| REQ-INV-004 | Кнопка 'Generate Invoices' для аккаунтов SELLER с включённой опцией Invoicing Creation | P1 | 10_checklist-invoicing |
| REQ-INV-005 | Имя пре-инвойса: формат PI + год + месяц + 6-значный инкрементальный номер | P1 | 10_checklist-invoicing |
| REQ-INV-006 | Период отображения пре-инвойсов: последние 2 месяца + текущий месяц | P1 | 10_checklist-invoicing |
| REQ-INV-007 | 7 статусов пре-инвойса/инвойса: DRAFT, PENDING, TO CHECK, BLOCKED, CHECKED, VALIDATED, CANCELLED | P0 | 10_checklist-invoicing |
| REQ-INV-008 | Ролевые ограничения действий по статусам для CREATOR и CHECKER | P0 | 10_checklist-invoicing |
| REQ-INV-009 | Видимость пре-инвойса по статусам для обеих сторон | P1 | 10_checklist-invoicing |
| REQ-INV-010 | Отмена пре-инвойса: снятие назначения всех строк | P0 | 10_checklist-invoicing |
| REQ-INV-011 | Навигационная структура: разделы Listing, Pre-Invoices, Invoices | P1 | 10_checklist-invoicing |
| REQ-INV-012 | Список пре-инвойсов: отображение сводной информации и счётчиков по статусам строк | P1 | 10_checklist-invoicing |
| REQ-INV-013 | Страница деталей пре-инвойса: только назначенные строки + кнопки действий | P1 | 10_checklist-invoicing |
| REQ-INV-014 | Статусы инвойсинга строки: NOT PRICED, TO CHECK, GAP, BLOCKED, CHECKED | P0 | 10_checklist-invoicing |
| REQ-INV-015 | Статус инвойсирования транспорта: Pending, Pre-invoiced, Invoiced, No Invoice, Cancelled | P0 | 10_checklist-invoicing |
| REQ-INV-016 | Gap Analysis: визуализация расхождения между ожидаемой и фактической суммой | P0 | 10_checklist-invoicing |
| REQ-INV-017 | Создание инвойса вручную: обязательные поля | P0 | 10_checklist-invoicing |
| REQ-INV-018 | Кредит-нота: отрицательная инвойс-строка | P1 | 10_checklist-invoicing |
| REQ-INV-019 | Инвойс может иметь тип BUY или SELL | P1 | 10_checklist-invoicing |
| REQ-INV-020 | SAP-экспорт: webhook при переходе инвойса в статус VALIDATED | P0 | 10_checklist-invoicing |
| REQ-INV-021 | Freeze инвойса: редактирование заблокировано для невалидированных инвойсов | P0 | 10_checklist-invoicing |
| REQ-INV-022 | Сегменты стоимости (Cost Segments): настройка и применение | P1 | 10_checklist-invoicing |
| REQ-INV-023 | Детализация цены: суммы initial, validated, invoiced и % расхождения | P1 | 10_checklist-invoicing |
| REQ-INV-024 | Валютная обработка: мультивалютные инвойс-строки и пользовательские валюты | P0 | 10_checklist-invoicing |
| REQ-INV-025 | Массовые операции: массовое закрытие пре-инвойсов и создание инвойсов | P1 | 10_checklist-invoicing |
| REQ-INV-026 | Excel-экспорт данных листинга инвойс-строк | P1 | 10_checklist-invoicing |
| REQ-INV-027 | Назначение (Assign) и снятие назначения (Unassign) строк с инвойса | P0 | 10_checklist-invoicing |
| REQ-INV-028 | Фильтрация при назначении строк: дата, POD, статус цены | P1 | 10_checklist-invoicing |
| REQ-INV-029 | Magic Filter: сохранение избранных запросов для массовой обработки | P2 | 10_checklist-invoicing |
| REQ-INV-030 | Обновление статуса строк после назначения на пре-инвойс | P0 | 10_checklist-invoicing |
| REQ-INV-031 | Инвойс: возможность создания без строк (empty invoice) | P2 | 10_checklist-invoicing |
| REQ-INV-032 | Инвойс-строка: ручное создание с привязкой или без привязки к объекту | P1 | 10_checklist-invoicing |
| REQ-INV-033 | Несколько инвойс-строк на один SR: разные периоды и типы затрат | P1 | 10_checklist-invoicing |
| REQ-INV-034 | Загрузка инвойса от контрагента (Upload): создание IN на стороне BUYER | P1 | 10_checklist-invoicing |
| REQ-INV-035 | Billing Account: привязка покупательских аккаунтов (Buyer Accounts) | P1 | 10_checklist-invoicing |
| REQ-INV-036 | Настройки инвойсинга: иерархия My company > My carrier > My setting | P1 | 10_checklist-invoicing |
| REQ-INV-037 | Переименование колонки дат: Pick-up date → DATE с тултипом | P2 | 10_checklist-invoicing |
| REQ-INV-038 | Компоненты CHAT, METADATA, DOCUMENTS, NOTIFICATION на уровне инвойса и строки | P1 | 10_checklist-invoicing |
| REQ-INV-039 | Поиск дополнительных строк для инвойса: рекомендации по матчингу | P2 | 10_checklist-invoicing |
| REQ-INV-040 | Округление сумм в интерфейсе до 1 знака после запятой | P2 | 10_checklist-invoicing |

### Rate Sheets + Tracking + Notifications (RS/TRACK/NOTIF) (45 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-RS-001 | Структура Rate Sheet на базе LOCODE: включить переключатель LOCODE при создании RS | P0 | 11_checklist-rate-sheets |
| REQ-RS-002 | Десять типов Sub Rate Sheet (SRS) для режима SEA FREIGHT на базе LOCODE | P0 | 11_checklist-rate-sheets |
| REQ-RS-003 | Логика сборки Rate Sheet: пошаговый алгоритм поиска маршрута по LOCODE | P0 | 11_checklist-rate-sheets |
| REQ-RS-004 | Приоритет LOCODE над Country при поиске в SRS | P1 | 11_checklist-rate-sheets |
| REQ-RS-005 | Валидация импорта данных SRS: обязательные и опциональные поля | P0 | 11_checklist-rate-sheets |
| REQ-RS-006 | Правило округления W/M (Chargeable Weight) в SRS | P1 | 11_checklist-rate-sheets |
| REQ-RS-007 | Обработка опасных грузов (DGD/UN) в Rate Sheet | P1 | 11_checklist-rate-sheets |
| REQ-RS-008 | Структура Lead Time в SRS: поля и правила заполнения | P2 | 11_checklist-rate-sheets |
| REQ-RS-009 | Правила RS для отправок с несколькими контейнерами | P1 | 11_checklist-rate-sheets |
| REQ-RS-010 | Влияние инкотермов на применение сегментов затрат Rate Sheet (TMS-397) | P1 | 11_checklist-rate-sheets |
| REQ-RS-011 | Shiptify Internal Key: маппинг колонок FCL на типы контейнеров | P1 | 11_checklist-rate-sheets |
| REQ-RS-012 | Шаблон SRS: возможность скачать и загрузить формат | P2 | 11_checklist-rate-sheets |
| REQ-RS-013 | Ретро-консолидация: API назначения Financial Group ID к отправкам | P0 | 11_checklist-rate-sheets |
| REQ-RS-014 | Ретро-консолидация: правила пересчёта ставок для финансовой группы | P0 | 11_checklist-rate-sheets |
| REQ-RS-015 | Ретро-консолидация: мутуализированная стоимость (Mutualized Cost) | P1 | 11_checklist-rate-sheets |
| REQ-RS-016 | Ретро-консолидация: загрузка мутуализированных стоимостей через XLS | P2 | 11_checklist-rate-sheets |
| REQ-RS-017 | Стратегии котирования (Quote Strategy) в CSW2 | P1 | 11_checklist-rate-sheets |
| REQ-RS-018 | Применение RS при отправке с нулевыми стоимостями и граничные условия | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-001 | Интеграция Container Tracking Service (Kpler Marine Traffic): активация | P0 | 11_checklist-rate-sheets |
| REQ-TRACK-002 | Container Tracking: поле Container ID и условия вызова Kpler API | P0 | 11_checklist-rate-sheets |
| REQ-TRACK-003 | Container Tracking: маппинг событий Kpler на Tracking Points Shiptify | P0 | 11_checklist-rate-sheets |
| REQ-TRACK-004 | Приоритет источников Tracking Points: перевозчик vs Kpler | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-005 | API Tracking: поддержка UNLOCODE и IATA CODE в Tracking Points | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-006 | API Tracking: правила поведения POST/PUT/PATCH для Tracking Points | P0 | 11_checklist-rate-sheets |
| REQ-TRACK-007 | Новая архитектура Tracking (2026): три экрана управления | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-008 | Новая архитектура Tracking: коды событий, группы и исключения | P2 | 11_checklist-rate-sheets |
| REQ-TRACK-009 | Публичная страница отслеживания: UI-концепция и AI-функции | P2 | 11_checklist-rate-sheets |
| REQ-TRACK-010 | Создание Transit Point и Tracking Point при инициализации Pre-carriage SRS | P2 | 11_checklist-rate-sheets |
| REQ-TRACK-011 | Ретро-консолидация: валидация статуса отправки при назначении группы | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-012 | Обработка ошибок API ретро-консолидации | P0 | 11_checklist-rate-sheets |
| REQ-NOTIF-001 | Центр уведомлений: бизнес-лог на уровне аккаунта | P0 | 11_checklist-rate-sheets |
| REQ-NOTIF-002 | Фильтрация бизнес-лога уведомлений | P1 | 11_checklist-rate-sheets |
| REQ-NOTIF-003 | Настройка уведомлений на уровне пользователя: роли и аккаунты | P1 | 11_checklist-rate-sheets |
| REQ-NOTIF-004 | Каналы доставки уведомлений: In-App и Email | P1 | 11_checklist-rate-sheets |
| REQ-NOTIF-005 | Digest-письмо: формат и структура | P2 | 11_checklist-rate-sheets |
| REQ-NOTIF-006 | Vacation Mode и делегирование уведомлений | P2 | 11_checklist-rate-sheets |
| REQ-NOTIF-007 | Триггеры уведомлений: события Tracking Points | P1 | 11_checklist-rate-sheets |
| REQ-NOTIF-008 | Уведомления Chat: интеграция с новой структурой чата (TD-359) | P1 | 11_checklist-rate-sheets |
| REQ-NOTIF-009 | Уведомления: гранулярность на уровне отдельного объекта | P2 | 11_checklist-rate-sheets |
| REQ-NOTIF-010 | Приоритизация объектов для первой волны реализации уведомлений | P0 | 11_checklist-rate-sheets |
| REQ-RS-019 | Правило Incoterm в ретро-консолидации: ограничения применения | P2 | 11_checklist-rate-sheets |
| REQ-RS-020 | Автозаполнение страны из LOCODE в настройках отправки | P2 | 11_checklist-rate-sheets |
| REQ-TRACK-013 | Логирование использования Container Tracking Service (Kpler) | P1 | 11_checklist-rate-sheets |
| REQ-TRACK-014 | Kpler API: создание tracking request и обработка ответа | P0 | 11_checklist-rate-sheets |
| REQ-TRACK-015 | Экспорт данных ретро-консолидации | P2 | 11_checklist-rate-sheets |

### DOCK + SLOTIFY (46 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-DOCK-001 | Создание нового экрана «Dock Door» с назначением слотов на ворота | P0 | 12_checklist-dock |
| REQ-DOCK-002 | Отображение карточек слотов на экране Dock Door | P0 | 12_checklist-dock |
| REQ-DOCK-003 | Фильтрация по зонам на экране Dock Door | P1 | 12_checklist-dock |
| REQ-DOCK-004 | Словарь специфик ворот (Dock Door Specificities) | P1 | 12_checklist-dock |
| REQ-DOCK-005 | Привязка специфик к конкретным воротам | P1 | 12_checklist-dock |
| REQ-DOCK-006 | Visit Carrier — отдельное поле, независимое от Booking/Shipment Carrier | P0 | 12_checklist-dock |
| REQ-DOCK-007 | Поиск и создание перевозчика при бронировании слота (NOTIFY CARRIER BY MAIL = NO) | P0 | 12_checklist-dock |
| REQ-DOCK-008 | Поиск и отображение перевозчика при бронировании слота (NOTIFY CARRIER BY MAIL = YES) | P0 | 12_checklist-dock |
| REQ-DOCK-009 | Отображение перевозчика в листинге Visit/Slot | P1 | 12_checklist-dock |
| REQ-DOCK-010 | Трекинг-поинты (Tracking Points) для Visit и Slot | P0 | 12_checklist-dock |
| REQ-DOCK-011 | Меню History для пользователей трассировки (Traceability Users) | P1 | 12_checklist-dock |
| REQ-DOCK-012 | Фильтры и сортировка для ежедневных пользователей (Daily User — Slot/Visit) | P0 | 12_checklist-dock |
| REQ-DOCK-013 | Редизайн модального окна обновления статуса слота | P0 | 12_checklist-dock |
| REQ-DOCK-014 | Корректная обработка опоздания при обновлении статуса | P1 | 12_checklist-dock |
| REQ-DOCK-015 | Номер ворот на экране обновления статуса | P2 | 12_checklist-dock |
| REQ-DOCK-016 | Листинг Dock Orders: разделение Inbound / Outbound | P0 | 12_checklist-dock |
| REQ-DOCK-017 | Фильтрация и поиск в листинге Dock Orders | P0 | 12_checklist-dock |
| REQ-DOCK-018 | Детали и действия по Dock Order в листинге | P0 | 12_checklist-dock |
| REQ-DOCK-019 | Автоматическое закрытие Dock Order по сроку поставки | P1 | 12_checklist-dock |
| REQ-DOCK-020 | Мульти-заказ, мульти-клиент на одном слоте (Multi Order / Multi Customer) | P1 | 12_checklist-dock |
| REQ-DOCK-021 | Структура Partner DB: роли SELLER / BUYER / BOOKER / SPECTATOR | P1 | 12_checklist-dock |
| REQ-DOCK-022 | Видимость Dock Order для партнёров (BOOKER / SUPPLIER / CUSTOMER) | P2 | 12_checklist-dock |
| REQ-DOCK-023 | Референсы партнёров в Dock Order (SELLER REF / BUYER REF / BOOKER REF) | P1 | 12_checklist-dock |
| REQ-SLOTIFY-001 | Редизайн шапки страницы Slotify (UI 3.0) | P1 | 12_checklist-dock |
| REQ-SLOTIFY-002 | Сводная панель данных при заполнении формы бронирования | P1 | 12_checklist-dock |
| REQ-SLOTIFY-003 | Разделение шага 1 регистрации на шаги 1.1 и 1.2 (UI 3.1) | P0 | 12_checklist-dock |
| REQ-SLOTIFY-004 | Форма регистрации для типа CARRIER на шаге 1.1 | P0 | 12_checklist-dock |
| REQ-SLOTIFY-005 | Форма регистрации для типа Supplier / Customer на шаге 1.1 | P1 | 12_checklist-dock |
| REQ-SLOTIFY-006 | Упаковочный лист (Packing List) в Slotify — общий режим | P0 | 12_checklist-dock |
| REQ-SLOTIFY-007 | Данные водителя и грузовика в форме Slotify | P2 | 12_checklist-dock |
| REQ-SLOTIFY-008 | Улучшение выбора перевозчика в SlotBook — выбор из списка контактов | P0 | 12_checklist-dock |
| REQ-SLOTIFY-009 | Ускоренное создание нового перевозчика (Light Carrier Creation) в SlotBook | P1 | 12_checklist-dock |
| REQ-SLOTIFY-010 | Валидация и квалификация целевого перевозчика (Targeted Carrier) | P2 | 12_checklist-dock |
| REQ-SLOTIFY-011 | Динамическое именование слотов для SlotBook-аккаунтов | P1 | 12_checklist-dock |
| REQ-SLOTIFY-012 | Обновление статуса слота с отображением времени опоздания | P2 | 12_checklist-dock |
| REQ-SLOTIFY-013 | Фильтрация и интерфейс поиска по слотам для ежедневных пользователей Slotify | P1 | 12_checklist-dock |
| REQ-SLOTIFY-014 | Отображение логотипа зоны при выборе зоны в Slotify | P2 | 12_checklist-dock |
| REQ-DOCK-024 | CSV и API структура Dock Order V2 | P1 | 12_checklist-dock |
| REQ-DOCK-025 | UI упаковочного листа для нескольких заказов в SlotBook | P1 | 12_checklist-dock |
| REQ-DOCK-026 | Группировка Visits по перевозчику (Visit Grouping) | P2 | 12_checklist-dock |
| REQ-SLOTIFY-015 | Страница инструкций вместо карты на последнем шаге Slotify | P2 | 12_checklist-dock |
| REQ-SLOTIFY-016 | Динамическое именование слотов для DOCK-аккаунтов (существующая функция, расширение) | P1 | 12_checklist-dock |
| REQ-SLOTIFY-017 | Видимость Dock Order для ShipperAccount при использовании SlotBook | P1 | 12_checklist-dock |
| REQ-DOCK-027 | Маркировка статуса Slot Delivery при обновлении через модал | P2 | 12_checklist-dock |
| REQ-DOCK-028 | Уведомление водителя о переносе визита (Prevent Delay) | P2 | 12_checklist-dock |
| REQ-SLOTIFY-018 | Корректное отображение экрана Manual Mode при обновлении статуса слота | P2 | 12_checklist-dock |

### Buy & Sell (BS/ORD/QUOTA/TP) (43 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-BS-001 | Создание типа аккаунта TBS (Buy & Sell) | P0 | 13_checklist-buy-sell |
| REQ-BS-002 | Разделение интерфейса на модули BUY и SELL | P0 | 13_checklist-buy-sell |
| REQ-BS-003 | Объекты SO (Shipment Offer) и QA (Quote Answer) в Buy & Sell | P0 | 13_checklist-buy-sell |
| REQ-BS-004 | TR (Transport Request) как основной объект продажи в TBS | P0 | 13_checklist-buy-sell |
| REQ-BS-005 | Статусы квотирования для TR в режиме Buy & Sell | P1 | 13_checklist-buy-sell |
| REQ-BS-006 | Customer 3PL — создание и управление клиентами TBS | P0 | 13_checklist-buy-sell |
| REQ-BS-007 | Рабочий процесс Customer 3PL — создание и отслеживание запросов | P1 | 13_checklist-buy-sell |
| REQ-BS-008 | Billing Entities (сущности выставления счетов) для продаж | P1 | 13_checklist-buy-sell |
| REQ-BS-009 | Selling Rate Sheet — продажные прайс-листы для клиентов 3PL | P1 | 13_checklist-buy-sell |
| REQ-BS-010 | Отправка котировки (Send Quote) клиенту 3PL | P1 | 13_checklist-buy-sell |
| REQ-BS-011 | Публичная страница котировки (Public Quote Page) | P1 | 13_checklist-buy-sell |
| REQ-BS-012 | QR → TR: преобразование запроса котировки в транспортный запрос для TBS | P0 | 13_checklist-buy-sell |
| REQ-BS-013 | QR → TR: статусы и подтверждение после Award | P1 | 13_checklist-buy-sell |
| REQ-BS-014 | QR → TR: обработка изменений и отмен от shipper | P1 | 13_checklist-buy-sell |
| REQ-BS-015 | Модуль Quotes для TBS — приём и обработка запросов на котировку | P1 | 13_checklist-buy-sell |
| REQ-BS-016 | Создание котировок вручную для клиентов вне Shiptify | P1 | 13_checklist-buy-sell |
| REQ-BS-017 | Множественные ответы на один запрос котировки (Multi Quote Answer) | P2 | 13_checklist-buy-sell |
| REQ-BS-018 | Видимость маржи и финансовой информации в Buy & Sell | P1 | 13_checklist-buy-sell |
| REQ-ORD-001 | Структура данных: Dock Order (DO) и Sub Dock Order (SDO) | P0 | 13_checklist-buy-sell |
| REQ-ORD-002 | Статусы Dock Order (DO) | P0 | 13_checklist-buy-sell |
| REQ-ORD-003 | Статусы Sub Dock Order (SDO) | P0 | 13_checklist-buy-sell |
| REQ-ORD-004 | Перенос SDO между слотами (Transfer SDO) | P1 | 13_checklist-buy-sell |
| REQ-ORD-005 | Упаковочный лист SDO vs упаковочный лист слота | P1 | 13_checklist-buy-sell |
| REQ-ORD-006 | Создание DO и SDO через CSW и API | P1 | 13_checklist-buy-sell |
| REQ-ORD-007 | Транспортные запросы (TR): связь с заказами и структура | P0 | 13_checklist-buy-sell |
| REQ-ORD-008 | Поиск Dock Order и улучшение сообщений | P2 | 13_checklist-buy-sell |
| REQ-ORD-009 | Инциденты и алертинг на уровне слота | P1 | 13_checklist-buy-sell |
| REQ-ORD-010 | Связь TMO с PSH/SH в рамках Buy & Sell | P0 | 13_checklist-buy-sell |
| REQ-QUOTA-001 | Активация модуля управления квотами | P1 | 13_checklist-buy-sell |
| REQ-QUOTA-002 | Создание и настройка квоты | P1 | 13_checklist-buy-sell |
| REQ-QUOTA-003 | Отображение квот при создании запроса котировки (RFQ) | P1 | 13_checklist-buy-sell |
| REQ-QUOTA-004 | Пороговые алерты и автоматический фоллбэк по квотам | P2 | 13_checklist-buy-sell |
| REQ-QUOTA-005 | Dashboard аккруала квот и отчётность | P2 | 13_checklist-buy-sell |
| REQ-TP-001 | Дублирование строк транспортного плана | P2 | 13_checklist-buy-sell |
| REQ-TP-002 | Название и поиск транспортного плана | P2 | 13_checklist-buy-sell |
| REQ-TP-003 | Email спектатора в транспортном плане | P2 | 13_checklist-buy-sell |
| REQ-TP-004 | Ограничение транспортного плана по бухгалтерским сущностям (Entities) | P1 | 13_checklist-buy-sell |
| REQ-TP-005 | Ограничение транспортного плана по специфике груза и типу товаров | P1 | 13_checklist-buy-sell |
| REQ-TP-006 | Ограничение транспортного плана по опасным грузам (DGD) | P1 | 13_checklist-buy-sell |
| REQ-TP-007 | Ограничение транспортного плана по Инкотермам | P1 | 13_checklist-buy-sell |
| REQ-TP-008 | Весовые и объёмные ограничения транспортного плана | P1 | 13_checklist-buy-sell |
| REQ-TP-009 | Поединичные ограничения габаритов и веса в транспортном плане | P1 | 13_checklist-buy-sell |
| REQ-TP-010 | Групповая обработка PSH/SH и массовый трекинг в транспортном плане | P1 | 13_checklist-buy-sell |

### TMS General I (FU/GRP/AUTH/NAV/PAL...) (42 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-GRP-001 | Создание группы из одного отправления | P1 | 14_checklist-tms-general-batch1 |
| REQ-GRP-002 | Группировка отправлений с уже существующей группой | P1 | 14_checklist-tms-general-batch1 |
| REQ-GRP-003 | Освобождение (FREE) одного SH из группы двух | P1 | 14_checklist-tms-general-batch1 |
| REQ-GRP-004 | Отображение Grouping ID без манифеста | P2 | 14_checklist-tms-general-batch1 |
| REQ-GRP-005 | Типы группировки: определения и правила | P0 | 14_checklist-tms-general-batch1 |
| REQ-GRP-006 | Загрузка документов на сгруппированные отправления | P1 | 14_checklist-tms-general-batch1 |
| REQ-GRP-007 | Уровни доступа к документам: Private / Limited / Public / Specific | P0 | 14_checklist-tms-general-batch1 |
| REQ-GRP-008 | Уведомления о документах в сгруппированных отправлениях | P2 | 14_checklist-tms-general-batch1 |
| REQ-FU-001 | Создание Freight Unit через API (VPE → STY) | P0 | 14_checklist-tms-general-batch1 |
| REQ-FU-002 | Веб-хуки от Shiptify к Veepee | P0 | 14_checklist-tms-general-batch1 |
| REQ-FU-003 | Статусы Freight Unit | P0 | 14_checklist-tms-general-batch1 |
| REQ-FU-004 | Поля Last Transit Location и маршрутные таблицы | P1 | 14_checklist-tms-general-batch1 |
| REQ-FU-005 | Ручная маршрутизация FU (Manual Routing) | P1 | 14_checklist-tms-general-batch1 |
| REQ-FU-006 | Автоматическая маршрутизация FU (Automated Routing) | P2 | 14_checklist-tms-general-batch1 |
| REQ-FU-007 | Листинг FU с фильтрами | P1 | 14_checklist-tms-general-batch1 |
| REQ-FU-008 | Crossdock листинг и создание SH из FU | P1 | 14_checklist-tms-general-batch1 |
| REQ-FU-009 | Инвентаризация поддонов | P2 | 14_checklist-tms-general-batch1 |
| REQ-FU-010 | Движения поддонов и подтверждение контрагентом | P2 | 14_checklist-tms-general-batch1 |
| REQ-FU-011 | Запрос на перемещение поддонов между сайтами | P2 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-001 | Требования к аутентификации через Identity Provider | P0 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-002 | SAML 2.0 аутентификация | P0 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-003 | OAuth 2.0 / OpenID Connect — Implicit Grant (SPA) | P0 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-004 | OAuth 2.0 Authorization Code Grant (Web App / Native App) | P0 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-005 | OAuth 2.0 Client Credentials Grant (M2M / Daemon) | P1 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-006 | TLS аутентификация (M2M с сертификатами) | P1 | 14_checklist-tms-general-batch1 |
| REQ-AUTH-007 | Управление учётными данными и аутентификация на разных OS | P1 | 14_checklist-tms-general-batch1 |
| REQ-NAV-001 | Основная концепция навигационного меню по категориям | P0 | 14_checklist-tms-general-batch1 |
| REQ-NAV-002 | Правила отображения меню для SLOTBOOK аккаунта | P1 | 14_checklist-tms-general-batch1 |
| REQ-NAV-003 | Правила отображения меню для TMS аккаунтов | P0 | 14_checklist-tms-general-batch1 |
| REQ-NAV-004 | Правила отображения меню для DOCK аккаунтов | P0 | 14_checklist-tms-general-batch1 |
| REQ-NAV-005 | Управление историей (OLD-режим) | P2 | 14_checklist-tms-general-batch1 |
| REQ-NAV-006 | Условная видимость пунктов меню TMS (Shipper) | P0 | 14_checklist-tms-general-batch1 |
| REQ-NAV-007 | Навигация Carrier / Freight аккаунта | P0 | 14_checklist-tms-general-batch1 |
| REQ-NAV-008 | Переключение аккаунтов и профиль пользователя | P1 | 14_checklist-tms-general-batch1 |
| REQ-ACC-001 | Матрица типов аккаунтов | P0 | 14_checklist-tms-general-batch1 |
| REQ-ACC-002 | Роли пользователей на отправлении (Owner, Executor, Creator, Informee) | P0 | 14_checklist-tms-general-batch1 |
| REQ-ACC-003 | LPA (Logistics Point of Action) — структура и назначение | P0 | 14_checklist-tms-general-batch1 |
| REQ-ACC-004 | Настройки модулей TM Options и DOCK Options | P1 | 14_checklist-tms-general-batch1 |
| REQ-ACC-005 | Управление доступом Informee через локации в сети | P2 | 14_checklist-tms-general-batch1 |
| REQ-ACC-006 | NEW SLOT — кнопка создания слота по умолчанию для DOCK аккаунтов | P1 | 14_checklist-tms-general-batch1 |
| REQ-ACC-007 | Тип аккаунта Spectator и доступ к объектам | P1 | 14_checklist-tms-general-batch1 |
| REQ-ACC-008 | Страница рекламного/teasing контента при отсутствии доступа к модулю | P2 | 14_checklist-tms-general-batch1 |

### TMS General II (MC/SEA/DOC/STY...) (58 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-MC-001 | Условие создания мульти-контейнера | P0 | 15_checklist-tms-general-batch2 |
| REQ-MC-002 | Именование контейнеров при подтверждении бронирования | P0 | 15_checklist-tms-general-batch2 |
| REQ-MC-003 | Экран бронирования: список контейнеров | P1 | 15_checklist-tms-general-batch2 |
| REQ-MC-004 | Управление метаданными для нескольких контейнеров | P1 | 15_checklist-tms-general-batch2 |
| REQ-MC-005 | Загрузка документов на несколько контейнеров | P1 | 15_checklist-tms-general-batch2 |
| REQ-MC-006 | Трекинг: обновление точек трекинга для нескольких контейнеров | P1 | 15_checklist-tms-general-batch2 |
| REQ-MC-007 | Инвойсинг мульти-контейнерных бронирований | P1 | 15_checklist-tms-general-batch2 |
| REQ-MC-008 | Отмена отдельных контейнеров | P2 | 15_checklist-tms-general-batch2 |
| REQ-SEA-001 | Структура данных морского перехода (SeaLeg) | P0 | 15_checklist-tms-general-batch2 |
| REQ-SEA-002 | Управление справочником морских перевозчиков | P1 | 15_checklist-tms-general-batch2 |
| REQ-SEA-003 | Добавление данных о судне (Add Ship Info) | P0 | 15_checklist-tms-general-batch2 |
| REQ-SEA-004 | Обновление данных судна для группы контейнеров | P1 | 15_checklist-tms-general-batch2 |
| REQ-SEA-005 | Отображение данных судна в UI | P1 | 15_checklist-tms-general-batch2 |
| REQ-SEA-006 | Передача документов в контексте Sea Freight + MC | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-001 | Настройка уведомлений о документах на уровне пользователя | P0 | 15_checklist-tms-general-batch2 |
| REQ-DOC-002 | Типы документов в workflow | P0 | 15_checklist-tms-general-batch2 |
| REQ-DOC-003 | Условия триггера workflow уведомлений | P0 | 15_checklist-tms-general-batch2 |
| REQ-DOC-004 | Действия, triggering уведомление | P0 | 15_checklist-tms-general-batch2 |
| REQ-DOC-005 | Географический периметр уведомлений | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-006 | Канал доставки уведомлений | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-007 | Список workflow и управление ими | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-008 | Выбор аккаунтов для workflow | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-009 | Уровни доступа к документам в групповых отправках | P0 | 15_checklist-tms-general-batch2 |
| REQ-DOC-010 | Передача документов по типу группировки | P1 | 15_checklist-tms-general-batch2 |
| REQ-DOC-011 | Уведомления при загрузке документов в группе | P1 | 15_checklist-tms-general-batch2 |
| REQ-STY-001 | Двусторонняя модель аккаунта (Carrier + Shipper) | P0 | 15_checklist-tms-general-batch2 |
| REQ-STY-002 | Новый объект: Transport Request (QR) | P0 | 15_checklist-tms-general-batch2 |
| REQ-STY-003 | Жизненный цикл Transport Request | P0 | 15_checklist-tms-general-batch2 |
| REQ-STY-004 | Дублирование чатов при создании SH из QR | P1 | 15_checklist-tms-general-batch2 |
| REQ-STY-005 | Навигация BUY / SALES | P1 | 15_checklist-tms-general-batch2 |
| REQ-STY-006 | Общие настройки MD и документов по умолчанию | P1 | 15_checklist-tms-general-batch2 |
| REQ-STY-007 | Spectators в контексте BK и QR | P1 | 15_checklist-tms-general-batch2 |
| REQ-STY-008 | Управление уведомлениями пользователя | P1 | 15_checklist-tms-general-batch2 |
| REQ-EO-001 | Создание объекта EO (Expected Order) | P0 | 15_checklist-tms-general-batch2 |
| REQ-EO-002 | Связь EO с заказами и слотами | P0 | 15_checklist-tms-general-batch2 |
| REQ-EO-003 | Процесс бронирования слота через EO | P0 | 15_checklist-tms-general-batch2 |
| REQ-EO-004 | Управление статусами EO из PML аккаунта | P1 | 15_checklist-tms-general-batch2 |
| REQ-EO-005 | Список EO (замена списка DOCK ORDER) | P1 | 15_checklist-tms-general-batch2 |
| REQ-EO-006 | Представление EO в аккаунте Supplier | P1 | 15_checklist-tms-general-batch2 |
| REQ-EO-007 | Перенос данных DOCK ORDER в EO | P0 | 15_checklist-tms-general-batch2 |
| REQ-LOG-001 | Реструктуризация специфик груза | P0 | 15_checklist-tms-general-batch2 |
| REQ-LOG-002 | Специфики отправки (Shipment Specificities) | P1 | 15_checklist-tms-general-batch2 |
| REQ-LOG-003 | Специфики груза (Cargo Specificities) | P1 | 15_checklist-tms-general-batch2 |
| REQ-LOG-004 | Sub-packing list для FTL/FCL | P1 | 15_checklist-tms-general-batch2 |
| REQ-LOG-005 | Справочник специфик в BO и переводы | P2 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-001 | Включение SSCC на уровне аккаунта | P0 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-002 | Структура SSCC кода | P0 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-003 | Trigger генерации штрихкодов на уровне перевозчика | P0 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-004 | Хранение SSCC в структуре данных | P0 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-005 | Управление изменениями пакинг-листа при SSCC | P1 | 15_checklist-tms-general-batch2 |
| REQ-LABEL-006 | Совместимость с workflow отправки по почте | P1 | 15_checklist-tms-general-batch2 |
| REQ-VIS-001 | Разделение ожидаемых и проверенных данных водителя | P0 | 15_checklist-tms-general-batch2 |
| REQ-VIS-002 | UI блока водителя в карточке визита | P1 | 15_checklist-tms-general-batch2 |
| REQ-VIS-003 | Идентификация заблокированных водителей | P0 | 15_checklist-tms-general-batch2 |
| REQ-VIS-004 | Процесс заполнения CHECKED Driver данных | P0 | 15_checklist-tms-general-batch2 |
| REQ-VIS-005 | Валидация CHECKED данных | P0 | 15_checklist-tms-general-batch2 |
| REQ-VIS-006 | Логирование расхождений водителя и грузовика | P1 | 15_checklist-tms-general-batch2 |
| REQ-VIS-007 | Сохранение водителя в базе данных | P1 | 15_checklist-tms-general-batch2 |

### OCR (Account Functions, Dashboard, CO2, BO) (8 REQ)

| REQ-ID | Требование | P | Чеклист |
|--------|-----------|---|---------|
| REQ-OCR-001 | Управление функциями аккаунта (Activated Functions) | P0 | 16_checklist-tms-ocr |
| REQ-OCR-002 | Быстрое переключение аккаунта | P1 | 16_checklist-tms-ocr |
| REQ-OCR-003 | Вкладки и метрики Dashboard | P1 | 16_checklist-tms-ocr |
| REQ-OCR-004 | Виджет углеродного следа: источники и поля | P1 | 16_checklist-tms-ocr |
| REQ-OCR-005 | CO2 Widget: ошибки и edge cases | P2 | 16_checklist-tms-ocr |
| REQ-OCR-006 | Карточка отправки: tracking points и followers | P0 | 16_checklist-tms-ocr |
| REQ-OCR-007 | Sales / CSM Owner и статус аккаунта | P1 | 16_checklist-tms-ocr |
| REQ-OCR-008 | Добавление телефона пользователя | P1 | 16_checklist-tms-ocr |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.08_requirements-map`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631996530 · **repo:** `tms/shipments/08_requirements-map.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

