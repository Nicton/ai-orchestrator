---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632619057
source_type: confluence
---
# Диаграммы жизненного цикла моделей

Показывают как модели меняют состояние, какие события их триггерят, и как изменение одной модели затрагивает другие.

---

## 1. Жизненный цикл ShipmentRequest → Shipment

```mermaid
stateDiagram-v2
    [*] --> draft : Shipper начинает CSW wizard

    draft --> rtb : Все обязательные поля заполнены
    rtb --> draft : Shipper редактирует

    rtb --> pending : Shipper отправляет SR перевозчику
    rtb --> pending_quotes : Shipper создаёт QR (несколько перевозчиков)

    pending --> confirmed : Carrier подтверждает SR
    pending --> cancelled : Carrier отклоняет / Shipper отменяет

    pending_quotes --> confirmed : Shipper выбирает котировку QR
    pending_quotes --> cancelled : Deadline истёк / Shipper отменяет

    confirmed --> [*] : Shipment создан (переход к Shipment lifecycle)
    cancelled --> [*]

    note right of confirmed
        При confirmed:
        - Shipment создаётся автоматически
        - TrackingPoints создаются (departure + arrival)
        - Email уведомления отправляются
    end note
```

---

## 2. Жизненный цикл Shipment

```mermaid
stateDiagram-v2
    [*] --> planned : ShipmentRequest confirmed → Shipment создан

    planned --> expected_pick_up : Дата pick-up приближается (cron)
    planned --> slot_confirmed : Slot подтверждён оператором
    planned --> cancelled : Shipper/Admin отменяет

    expected_pick_up --> in_transit_estimate : Расчётное время отправки
    expected_pick_up --> in_transit : Carrier подтверждает departure TP
    expected_pick_up --> cancelled : Отмена

    slot_confirmed --> in_transit : Carrier подтверждает departure TP
    slot_confirmed --> cancelled : Отмена

    in_transit_estimate --> in_transit : Carrier подтверждает departure TP
    in_transit --> expected_delivery : Дата delivery приближается (cron)
    in_transit --> cancelled : Экстренная отмена

    expected_delivery --> delivered_estimate : Расчётное время доставки
    expected_delivery --> delivered : Carrier подтверждает arrival TP

    delivered_estimate --> delivered : Carrier подтверждает arrival TP
    delivered --> [*] : Invoicing начинается

    cancelled --> planned : Admin реактивирует

    note right of in_transit
        Триггер: TrackingPoint (departure)
        status → confirmed
        calculateShipmentStatus()
    end note

    note right of delivered
        Триггер: TrackingPoint (arrival)
        status → confirmed
        POD flow начинается
    end note
```

---

## 3. Жизненный цикл TrackingPoint

```mermaid
stateDiagram-v2
    [*] --> not_confirmed : AUTO создаётся при создании Shipment

    not_confirmed --> confirmed : Carrier подтверждает (UI / Driver App / API)
    not_confirmed --> delayed : Плановая дата прошла (cron check)
    not_confirmed --> incident : Carrier отмечает инцидент

    delayed --> confirmed : Carrier подтверждает (с опозданием)
    delayed --> incident : Ситуация ухудшилась

    incident --> confirmed : Инцидент разрешён, TP подтверждён

    confirmed --> [*] : Финальное состояние

    note right of confirmed
        При confirmation:
        real_date = NOW()
        source = 'manual'|'driver_app'|'p44'|'shippeo'
        → calculateShipmentStatus()
        → Email уведомление Shipper
        → Webhook shipmentStatusUpdated
    end note

    note right of delayed
        Cron проверяет каждые N минут:
        IF planned_date < NOW() AND status = not_confirmed
        THEN status = delayed
    end note
```

---

## 4. Жизненный цикл Slot

```mermaid
stateDiagram-v2
    [*] --> pending : Carrier/Shipper бронирует слот

    pending --> confirmed : Operator подтверждает
    pending --> rescheduled : Operator предлагает другое время
    pending --> cancelled : Отмена

    rescheduled --> confirmed : Carrier принимает новое время
    rescheduled --> cancelled : Carrier отклоняет

    confirmed --> done : Операция завершена (после Shipment delivered)
    confirmed --> cancelled : Shipment отменён → Slot освобождается

    done --> [*]
    cancelled --> [*]

    note right of confirmed
        Email: mailSlotConfirmedToCarrier
        Shipment.status → slot_confirmed
        Webhook: slotBooked
    end note
```

---

## 5. Жизненный цикл Quote (QR Flow)

```mermaid
stateDiagram-v2
    [*] --> pending : Carrier получает запрос котировки

    pending --> submitted : Carrier отвечает с ценой
    pending --> declined_by_carrier : Carrier отказывается
    pending --> expired : Deadline (reply_before) прошёл

    submitted --> accepted : Shipper выбирает эту котировку
    submitted --> declined : Shipper выбирает другого Carrier

    accepted --> [*] : Shipment создаётся с этим Carrier
    declined --> [*]
    declined_by_carrier --> [*]
    expired --> [*]
```

---

## 6. Межсистемный Impact: создание Shipment

Что происходит в других частях системы при создании Shipment:

```mermaid
flowchart TD
    A[ShipmentRequest confirmed] --> B[Shipment.create]

    B --> C[TrackingPoints создаются<br/>departure + arrival]
    B --> D[Email задача в Kue<br/>mailConfirmShipmentRequest]
    B --> E[Webhook событие<br/>shipmentCreated]
    B --> F{Интеграция активна?}

    F -->|Да| G[Carrier API<br/>integration/carrier/service.js]
    F -->|Нет| H[Ручной режим]

    G --> I[Job в Kue<br/>integrationCarrier]
    I --> J[provider.js<br/>POST /carrier-api/book]
    J --> K[tracking_number получен]
    K --> L[Shipment.tracking_code обновляется]

    D --> M[worker/tasks/notify_by_email.js]
    M --> N[Email → Shipper]
    M --> O[Email → Carrier]

    E --> P[webhooks/service.js]
    P --> Q[POST → клиентский URL]

    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
    style K fill:#bfb,stroke:#333
```

---

## 7. Межсистемный Impact: подтверждение TrackingPoint

```mermaid
flowchart TD
    A[Carrier нажимает<br/>Confirm TP] --> B[PATCH /api/tracking-points/id/confirm]

    B --> C[TrackingPoint.status = confirmed<br/>TrackingPoint.real_date = NOW]
    C --> D[calculateShipmentStatus]
    D --> E{Все departure TP<br/>confirmed?}

    E -->|Да| F[Shipment.status = in_transit]
    E -->|Нет| G[Shipment.status не меняется]

    F --> H{Все arrival TP<br/>confirmed?}
    H -->|Да| I[Shipment.status = delivered]
    H -->|Нет| F

    C --> J[Email задача в Kue<br/>mailStatus]
    J --> K[worker tasks notify_by_email.js]
    K --> L[Email → Shipper + followers]

    C --> M[Webhook задача в Kue<br/>shipmentStatusUpdated]
    M --> N[POST → клиентский webhook URL]

    I --> O{POD требуется?}
    O -->|Да| P[Shipment.pod_status = pending<br/>email → requestProofOfDelivery]
    O -->|Нет| Q[Invoicing flow]

    style A fill:#f9f,stroke:#333
    style F fill:#ffa,stroke:#333
    style I fill:#bfb,stroke:#333
```

---

## 8. Зависимости между репозиториями

```mermaid
flowchart LR
    FE[frontend<br/>AngularJS/React] -->|REST API| BE[backend<br/>Express.js :3013]
    FE_MONO[frontend-mono<br/>React 19] -->|REST API| BE
    MINI[mini-apps<br/>Driver, Carrier, Slots] -->|GraphQL + REST| BE

    BE -->|SQL| PG[(PostgreSQL 16)]
    BE -->|Queue jobs| REDIS[(Redis 6)]
    BE -->|Consume/Produce| KAFKA[Kafka]

    WORKER[backend worker<br/>:3018] -->|Jobs| REDIS
    WORKER -->|SQL| PG
    WORKER -->|External APIs| CARRIERS[27 Carriers<br/>DHL, FedEx, UPS...]
    WORKER -->|Email| MAILGUN[Mailgun]
    WORKER -->|Files| S3[AWS S3]

    MICRO[microservices<br/>auth, msg, locations...] -->|Kafka events| KAFKA
    MICRO -->|SQL| PG2[(PostgreSQL 16<br/>supply DB)]

    BO[back-office<br/>React + Express] -->|REST| PG
    PUBAPI[public-api<br/>Express 5] -->|REST| BE

    style BE fill:#bbf
    style WORKER fill:#fbb
    style KAFKA fill:#ffa
```

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.database.lifecycle-diagrams`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632619057 · **repo:** `tms/implementation/database/lifecycle-diagrams.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

