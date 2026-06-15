# Requirements Map — Shiptify Shipments Domain

**Версия:** 1.0  
**Дата:** 2026-06-10  
**Назначение:** Карта требований для построения матрицы тест-покрытия домена Shipments

---

## Легенда

| Приоритет | Описание |
|-----------|----------|
| P0 | Критично — блокирует основной бизнес-процесс |
| P1 | Важно — ключевая функциональность |
| P2 | Желательно — дополнительная/сопутствующая функциональность |

| Источник | Описание |
|----------|----------|
| frontend | Требование реализуется на стороне UI |
| backend | Требование реализуется на стороне API/сервисов |
| integration | Требование связано с внешними интеграциями |

---

## REQ-SH — Список отправлений (Shipment List)

> Фильтры, колонки, действия, пагинация, экспорт

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-SH-001 | Список отправлений доступен грузовладельцу (shipper) и перевозчику (carrier) с изоляцией по ACL-правилам (shipper_id, carrier_id, divisions, locations) | P0 | backend |
| REQ-SH-002 | Список поддерживает серверную пагинацию; заголовок `X-Total-Count` содержит общее количество записей | P0 | backend |
| REQ-SH-003 | Фильтрация по статусу отправления (статус-машина: created, booked, in_transit, delivered, canceled и т.д.) | P0 | frontend/backend |
| REQ-SH-004 | Фильтрация по диапазону дат (ETD, ETA, дата создания) | P1 | frontend/backend |
| REQ-SH-005 | Фильтрация по перевозчику (carrier_id), отделению шиппера (shipper_division_id) и отделению перевозчика (carrier_division_id) | P1 | frontend/backend |
| REQ-SH-006 | Фильтрация по адресу отправления и назначения (включая расширенный адресный матч через `extendAddressForMatchMiddleware`) | P1 | backend |
| REQ-SH-007 | Экспорт списка отправлений в Excel (`GET /shipments-excel`); файл формируется асинхронно через очередь и сохраняется в S3 | P1 | backend |
| REQ-SH-008 | Массовое обновление отправлений (`PATCH /shipments`) доступно без дополнительного ограничения роли | P1 | backend |
| REQ-SH-009 | Список «отправлений площадки» (`GET /site-shipments`) доступен только грузовладельцу (`requireShipper`) | P1 | backend |
| REQ-SH-010 | Получение мета-информации об отправлениях (`GET /shipments-info`) возвращает агрегированные данные по всем divisions для текущего пользователя | P2 | backend |

---

## REQ-CSW — Мастер создания отправления (CSW Wizard)

> Basics, Cargo, Pre-shipment, Booking, Modes, Validation

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-CSW-001 | Создание отправления (`POST /shipments`) доступно только грузовладельцу (`requireShipper`); обязательные поля: `tracking_code`, `carrier_id` | P0 | backend |
| REQ-CSW-002 | При создании отправления автоматически запускается постобработка через `processNewCreatedShipments` (уведомления, интеграции, индексация) | P0 | backend |
| REQ-CSW-003 | Режим отправления (mode) определяет доступные поля груза и валидацию (road, groupage, sea, air и т.д.) | P0 | backend |
| REQ-CSW-004 | Содержимое груза (cargo) сохраняется в ShipmentContent; доступно обновление через `PATCH /shipments/:id/contents` | P0 | backend |
| REQ-CSW-005 | Pre-shipment (`POST /pre-shipments`) создаётся до финального бронирования и привязывается к отправлению через `pre_shipment_id` | P1 | backend |
| REQ-CSW-006 | Поле `booking_sources` определяет источник бронирования (slotbook_shipper, slotbook_carrier и т.д.) и влияет на дальнейший workflow | P1 | backend |
| REQ-CSW-007 | Валидация при создании отправления: отсутствие `tracking_code` или невалидный `carrier_id` возвращает HTTP 400 | P0 | backend |
| REQ-CSW-008 | Тип содержимого определяет является ли позиция «логистическим средством» (`isLogisticMeanContent`) | P1 | backend |
| REQ-CSW-009 | Отправление типа «мультиконтейнер» (`is_multicontainer=true`) позволяет добавлять контейнеры через `POST /shipment-brothers/:sh_request_id` | P1 | backend |
| REQ-CSW-010 | Шаблоны отправлений (`shipment_templates`) позволяют предзаполнять поля мастера | P2 | frontend/backend |

---

## REQ-SH-DET — Детальная страница отправления (Shipment Detail)

> Заголовок, вкладки, видимость по роли

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-SH-DET-001 | Детальная страница отправления (`GET /shipments/:id`) доступна грузовладельцу, перевозчику и пользователям-спектаторам с соответствующими правами | P0 | backend |
| REQ-SH-DET-002 | Заголовок отображает: статус, режим перевозки, адреса отправления/назначения, ETD/ETA, трекинг-код, перевозчика и шиппера | P0 | frontend |
| REQ-SH-DET-003 | Обновление имени отправления (`PATCH /shipments/:id/name`) доступно совместным пользователям (`requireCollaborative`) | P1 | backend |
| REQ-SH-DET-004 | Вкладка «Документы» показывает прикреплённые файлы; видимость для спектатора управляется флагом `can_see_documents` | P1 | backend |
| REQ-SH-DET-005 | Вкладка «Заказы» (Orders) видна спектатору только при наличии разрешения `can_see_orders` | P1 | backend |
| REQ-SH-DET-006 | Вкладка «Чат» (Chat/Discussion) видна только пользователям с разрешением `can_see_chat` | P1 | backend |
| REQ-SH-DET-007 | Информация о водителе (`GET /shipments/:id/driver-transport`) доступна для просмотра и редактирования (`PATCH`) пользователям с соответствующим ACL | P1 | backend |
| REQ-SH-DET-008 | Связанные отправления (brothers) отображаются через `GET /shipment-brothers/:sh_request_id`; для спектатора через отдельный endpoint `/spectator-shipment-brothers` | P1 | backend |
| REQ-SH-DET-009 | Кнопка «Запросить POD» (`POST /shipments/:id/request-pod`) доступна только грузовладельцу; статус POD хранится в поле `pod_status` | P1 | backend |
| REQ-SH-DET-010 | Связанные отправления (`GET /shipments/:id/linked`) отображаются только грузовладельцу (`requireShipper`) | P2 | backend |

---

## REQ-TP — Трекинг-точки (Tracking Points)

> Добавление, подтверждение, перепланирование, обновление, Milkrun, уведомления

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-TP-001 | Список трекинг-точек отправления (`GET /shipments/:id/tracking`) доступен всем участникам с ACL-доступом к отправлению | P0 | backend |
| REQ-TP-002 | Создание трекинг-точки (`POST /shipments/:id/tracking`) доступно совместным пользователям; точки типов STY0000 и STY9999 (pickup/delivery) нельзя удалить | P0 | backend |
| REQ-TP-003 | Обновление трекинг-точки (`PATCH /shipments/:id/tracking/:id`) запускает транзакцию с post-обработкой: отправка уведомлений, webhook, обновление слота | P0 | backend |
| REQ-TP-004 | Удаление трекинг-точки (`DELETE /shipments/:id/tracking/:id`) доступно только грузовладельцу-администратору (`requireSelfAdminOrSuperUser + requireShipper`) | P0 | backend |
| REQ-TP-005 | Массовое обновление трекинг-точек (`PATCH /tracking/multipleUpdate`) доступно только грузовладельцу (`requireShipper`) | P1 | backend |
| REQ-TP-006 | Milkrun-обновление (`PATCH /tracking/milkrunUpdate`) обновляет трекинг-точки нескольких отправлений в одной транзакции с перепланированием слота | P1 | backend |
| REQ-TP-007 | При обновлении трекинг-точки типа DEPARTURE/ARRIVAL автоматически пересчитываются связанные слоты; если слот уже существует — вызывается `replanSlotByInputInTransaction` | P1 | backend |
| REQ-TP-008 | Напоминание о трекинге (`POST /shipments/:id/tracking/:id/remind`) доступно только грузовладельцу (`requireShipper`) | P2 | backend |
| REQ-TP-009 | Уведомление таможни (`POST /shipments/:id/tracking/:id/notify`) отправляется без ограничения роли | P2 | backend |
| REQ-TP-010 | Экспорт трекинг-точек в Excel (`GET /tracking-points-excel`) и экспорт перепланирований (`GET /tracking-points-replanning-excel`) доступны с ACL-фильтрацией | P2 | backend |

---

## REQ-INV — Инвойсинг (Invoicing)

> Детали цен, статусы, назначение, заморозка, gap-анализ

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-INV-001 | Список инвойсингов (`GET /invoicing`) доступен с полным ACL-фильтрованием по divisions, carriers, shippers | P0 | backend |
| REQ-INV-002 | Детальный просмотр инвойсинга (`GET /invoicing/:sh_request_id`) требует наличия разрешения `can_manage_invoicing` у совместного пользователя | P0 | backend |
| REQ-INV-003 | Обновление инвойсинга (`PATCH /invoicing/:sh_request_id`) запускает `postProcessUpdateInvoicing` (webhook, email, обновление терриального инвойса) | P0 | backend |
| REQ-INV-004 | Массовое обновление инвойсингов (`PATCH /invoicing/multiple`) требует роли `requireCollaborative` | P1 | backend |
| REQ-INV-005 | Экспорт инвойсинга в Excel: базовый (`GET /invoicing-excel`) и детальный (`GET /invoicing-excel/details`); файлы формируются асинхронно и сохраняются в S3 | P1 | backend |
| REQ-INV-006 | Загрузка дополнительных расходов (extra charges) через Excel (`POST /invoicing/extra-charges/upload`); доступно только грузовладельцу (`requireShipper`) | P1 | backend |
| REQ-INV-007 | Загрузка взаимных расходов (mutualized costs) через Excel (`POST /invoicing/mutualized-costs/upload`) с ACL-фильтрацией по shippers/divisions | P1 | backend |
| REQ-INV-008 | Счётчик инвойсингов по статусам с общей стоимостью (`GET /invoicing-count`) доступен только грузовладельцу | P2 | backend |
| REQ-INV-009 | Обязательные документы для инвойсинга (`GET /invoicing/:id/documents`) возвращают список с их статусом загрузки | P1 | backend |
| REQ-INV-010 | Детализированные затраты (`inv_detailed_costs`) загружаются для ShipmentRequest и могут быть обновлены с историей изменений | P1 | backend |

---

## REQ-CLM — Рекламации (Claims)

> Открытие, просмотр, отмена

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-CLM-001 | Список рекламаций (`GET /claims`) доступен совместным пользователям (`requireCollaborative`) с ACL-фильтрацией | P0 | backend |
| REQ-CLM-002 | Создание рекламации (`POST /claims`) доступно только грузовладельцу с правом доступа к фиче `claim` | P0 | backend |
| REQ-CLM-003 | Создание рекламации по отправлению (`POST /shipments/:id/claims`) требует прав `requireShipper + requireCollaborative + claim-feature` | P0 | backend |
| REQ-CLM-004 | Просмотр рекламации (`GET /claims/:id`) требует наличия feature-доступа `claim` | P1 | backend |
| REQ-CLM-005 | Обновление рекламации (`PUT /claims/:id`) доступно с feature `claim` и ACL-проверкой | P1 | backend |
| REQ-CLM-006 | Обновление статуса рекламации (`PUT /claims/:id/status`) выполняется через матрицу переходов: new→canceled/sent_to_carrier, sent_to_carrier→rejected/accepted/incomplete и т.д. | P0 | backend |
| REQ-CLM-007 | Статусная машина рекламации учитывает роль: gruzovladelec (shipper) инициирует переходы new→sent_to_carrier→refused, перевозчик (carrier) — accepted/rejected | P0 | backend |
| REQ-CLM-008 | Статистика рекламаций (`GET /claims-stats`) доступна с ACL-фильтрацией без ограничения по feature | P2 | backend |
| REQ-CLM-009 | Рекламация по отправлению (`GET /claims/shipment/:id`) возвращает одну рекламацию, связанную с конкретным shipment_id | P1 | backend |

---

## REQ-MODAL — Модальные окна (Modals)

> Каждая модальная форма = набор требований

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-MODAL-001 | Модал «Назначить водителя» (`PATCH /shipments/:id/driver`) сохраняет driver_id и отправляет SMS-уведомление через `notifyDriverShipmentAssigned` | P1 | backend |
| REQ-MODAL-002 | Модал «Контакт» (`POST /shipments/:id/contact`) доступен пользователям с ролью visibility-account и отправляет сообщение перевозчику | P1 | backend |
| REQ-MODAL-003 | Модал «Трекинг посылок» (`GET /shipments/:id/parcels/:parcel_id/tracking`) отображает трекинг по конкретному посылочному коду | P1 | backend |
| REQ-MODAL-004 | Модал «Температура посылок» (`GET /shipments/:id/parcels-temperatures`) отображает температурные данные для всех посылок отправления | P2 | backend |
| REQ-MODAL-005 | Модал «Статус площадки» (site status) позволяет создавать/обновлять/удалять статусы через `/site-shipments/:id/status`; доступен только грузовладельцу | P1 | backend |
| REQ-MODAL-006 | Модал «Спектаторы» (`GET /shipments/:id/spectators`) отображает список подключённых аккаунтов с их разрешениями | P1 | backend |
| REQ-MODAL-007 | Модал «Ярлыки» (`GET /shipments-labels/:id`) генерирует ZIP-архив с CMR-ярлыками для отправления | P1 | backend |
| REQ-MODAL-008 | Модал «Отдельный ярлык» (`GET /shipments-single-label/:id`) генерирует один ярлык для конкретного отправления | P2 | backend |
| REQ-MODAL-009 | Модал «Slotify» (`POST /shipments/slotify`) создаёт отправление через Slotify-интеграцию с уведомлением при успешном бронировании слота | P1 | integration |
| REQ-MODAL-010 | Модал «Обновить имя» (`PATCH /shipments/:id/name` и `/entity-name`) выполняет обновление и рассылает уведомления подписчикам через `emitShipmentNameUpdated` | P1 | backend |

---

## REQ-ROLE — Ролевой доступ (Role-based Access)

> Правила доступа по ролям

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-ROLE-001 | Грузовладелец (shipper) имеет полный доступ к созданию, изменению и отмене своих отправлений; перевозчик не может создавать отправления | P0 | backend |
| REQ-ROLE-002 | Перевозчик (carrier) видит только отправления, в которых он участвует (ACL: allowed shippers + divisions) | P0 | backend |
| REQ-ROLE-003 | Booker (совместный пользователь) имеет гранулированные права: `can_manage_tracking_points`, `can_see_chat`, `can_manage_documents`, `can_manage_metadata`, `can_confirm_booking`, `can_cancel_shipment`, `can_edit_booking`, `can_manage_invoicing` | P0 | backend |
| REQ-ROLE-004 | Spectator (пользователь-наблюдатель) имеет права: `can_see_tracking_points`, `can_manage_tracking_points`, `can_see_chat`, `can_manage_truck_driver_info`, `can_manage_metadata`, `can_manage_documents`, `can_see_documents`, `can_see_orders` | P0 | backend |
| REQ-ROLE-005 | Self-admin и Super User могут удалять трекинг-точки; обычный пользователь не может удалять точки pickup и delivery (STY0000, STY9999) | P0 | backend |
| REQ-ROLE-006 | Visibility-account имеет доступ к отправке контактного сообщения (`sendContact`); полный collaborative-доступ закрыт для этой роли | P1 | backend |
| REQ-ROLE-007 | Доступ к фиче `claim` контролируется через `acl.checkAccountAccess([['claim']])` и может быть выключен на уровне аккаунта | P1 | backend |
| REQ-ROLE-008 | Доступ к фиче `invoicing` контролируется разрешением `can_manage_invoicing` у booker; базовый просмотр требует только ACL-фильтрации | P1 | backend |
| REQ-ROLE-009 | Galaxy Manager и Multi-Vision Manager имеют специальные middlewares (`requireGalaxyManager`, `requireMultiVision`) для управления кросс-аккаунтовыми данными | P2 | backend |
| REQ-ROLE-010 | Kiosk Mode (token app) создаёт временный токен для доступа без стандартной аутентификации; ограничен IP-вайтлистом и scope-mini-app | P1 | backend |

---

## REQ-INT — Интеграционное поведение (Integration Behaviors)

> DHL, P44, Heppner, SAP и др.

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-INT-001 | Отправка данных отправления в интеграцию (`POST /shipments/:id/integrations/:name`) инициирует асинхронный job через очередь | P0 | integration |
| REQ-INT-002 | Интеграция Heppner: при обновлении трекинг-точки вызывается `sendTrackingRequestInfoToHeppner`; при запросе POD — `sendRequestPODToHeppner` | P0 | integration |
| REQ-INT-003 | Интеграция AfterShip: трекинг посылок через `getAftershipTracking` доступен через `GET /tracking/aftership` | P1 | integration |
| REQ-INT-004 | Интеграция DHL Global Forwarding: OAuth2-авторизация с Client Credentials flow; данные отправляются асинхронно через worker | P0 | integration |
| REQ-INT-005 | Интеграция SAP: обновление отправлений через SAP выполняется worker-задачей; хранение данных в S3 в папке `integrations/sap/` | P0 | integration |
| REQ-INT-006 | Интеграция Ecotransit: расчёт CO₂ (`co2_amount`) запускается асинхронно; при наличии данных поле заполняется в модели Shipment | P1 | integration |
| REQ-INT-007 | Интеграция Terrial: при обновлении инвойсинга вызывается `setCheckedTerrialInvoice` для синхронизации данных | P1 | integration |
| REQ-INT-008 | Webhook-уведомления при обновлении инвойсинга: `webhookShipmentRequestInvoiced` и `webhookShipmentRequestInvoiceStarted` | P1 | integration |
| REQ-INT-009 | Интеграция Calvacom: документы и данные отправления передаются через SFTP-провайдер (`calvacom/ftpProvider.js`) | P2 | integration |
| REQ-INT-010 | Все интеграции реализуют retry-логику с задержками [30, 60, 240, 1440] секунд при ошибках; ошибки логируются в S3 в `integration-logs/` | P1 | integration |

---

## REQ-STAT — Машина состояний (Status Machine Transitions)

> Переходы статусов отправления и рекламации

| REQ-ID | Описание требования | Приоритет | Источник |
|--------|---------------------|-----------|----------|
| REQ-STAT-001 | Статус отправления хранится в поле `shipment.status` (строка); переходы управляются бизнес-логикой в `shipments.js` и `tracking.js` | P0 | backend |
| REQ-STAT-002 | Отмена отправления (`canceler_id` != null) запускает `runCancelShipmentIntegrations` для уведомления интеграций; отмена рассылает email-уведомление `notifyShipmentCanceled` | P0 | backend |
| REQ-STAT-003 | Реактивация отменённого отправления запускает `runReactivateShipmentIntegrations`; доступна только для соответствующих статусов | P0 | backend |
| REQ-STAT-004 | Статус рекламации: `new` → `sent_to_carrier` (shipper) → `rejected`/`accepted`/`incomplete` (carrier) → конечные статусы (shipper) | P0 | backend |
| REQ-STAT-005 | Переход статуса рекламации в `canceled` возможен только из статусов `new` и `incomplete` шиппером | P0 | backend |
| REQ-STAT-006 | Статус POD (`pod_status`) имеет значение по умолчанию `pending`; обновляется при подтверждении доставки | P1 | backend |
| REQ-STAT-007 | Событие изменения статуса отправления публикуется в Kafka-топик для потребителей-микросервисов | P1 | backend |
| REQ-STAT-008 | После коммита транзакции изменения статуса срабатывает `processAfterCommitActions`: email, webhook, ES-индексация; при ошибке — `deleteAftercommitActions` | P0 | backend |
| REQ-STAT-009 | Статус-переходы при обновлении трекинг-точки: при подтверждении реальной даты отправления формируется «подтверждённый» статус отправки; при подтверждении доставки — финальный статус | P0 | backend |
| REQ-STAT-010 | Архивирование отправления управляется отдельными флагами `archived_shipper` и `archived_carrier`; отображение в списке зависит от значений этих флагов | P2 | backend |

---

*Итого требований: 99 (10 групп × 9–10 требований)*  
*Источник анализа: backend codebase — routes, controllers, models, services, constants*
