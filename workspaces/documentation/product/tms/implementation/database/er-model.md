---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632684662
source_type: confluence
---
# ER-модель — Ключевые сущности

Диаграмма отображает основные модели TMS и связи между ними. Рендерится в GitLab автоматически.

## Ядро системы

```mermaid
erDiagram
    Account {
        int id PK
        string name
        int shipper_id FK
        int carrier_id FK
        string type
        timestamp deleted_at
    }
    User {
        int id PK
        int account_id FK
        string email UK
        string first_name
        string last_name
        json roles_list
        timestamp deleted_at
    }
    Shipper {
        int id PK
        string name
        timestamp deleted_at
    }
    Carrier {
        int id PK
        string name
        string logo_img
        timestamp deleted_at
    }
    ShipperACL {
        int id PK
        int user_id FK
        int shipper_id FK
        int division_id FK
        json permissions
    }
    CarrierACL {
        int id PK
        int user_id FK
        int carrier_id FK
        int division_id FK
        json permissions
    }

    Account ||--o{ User : "hasMany"
    Account }o--|| Shipper : "belongsTo"
    Account }o--|| Carrier : "belongsTo"
    User ||--o{ ShipperACL : "hasMany"
    User ||--o{ CarrierACL : "hasMany"
```

## Перевозки (Core Flow)

```mermaid
erDiagram
    ShipmentRequest {
        int id PK
        int shipper_id FK
        string name
        string status
        int from_location_id FK
        int dest_location_id FK
        date start_date
        date end_date
        timestamp deleted_at
    }
    QuoteRequest {
        int id PK
        int shipment_request_id FK
        date reply_before
        string status
        int winner_quote_id FK
    }
    Quote {
        int id PK
        int quote_request_id FK
        int carrier_id FK
        decimal price
        string currency
        string status
    }
    Shipment {
        int id PK
        int shipment_request_id FK
        int carrier_id FK
        int shipper_id FK
        string name
        string status
        string tracking_code UK
        string pod_status
        date start_date
        date end_date
        timestamp deleted_at
    }
    TrackingPoint {
        int id PK
        int shipment_id FK
        string type
        int location_id FK
        date planned_date
        date real_date
        string status
        string source
    }
    ShipmentContent {
        int id PK
        int shipment_id FK
        string content_type
        decimal weight
        decimal volume
        boolean is_dangerous
    }

    ShipmentRequest ||--o{ Shipment : "hasMany"
    ShipmentRequest ||--o| QuoteRequest : "hasOne"
    QuoteRequest ||--o{ Quote : "hasMany"
    Shipment ||--o{ TrackingPoint : "hasMany"
    Shipment ||--o{ ShipmentContent : "hasMany"
```

## Слоты

```mermaid
erDiagram
    Location {
        int id PK
        int account_id FK
        string name
        string address
        string city
        string country
        timestamp deleted_at
    }
    DockDoor {
        int id PK
        int location_id FK
        string name
        boolean is_active
    }
    Slot {
        int id PK
        int location_id FK
        int carrier_id FK
        int dock_door_id FK
        datetime start_time
        datetime end_time
        string status
        timestamp deleted_at
    }
    SlotShipment {
        int id PK
        int slot_id FK
        int shipment_id FK
    }

    Location ||--o{ DockDoor : "hasMany"
    Location ||--o{ Slot : "hasMany"
    DockDoor ||--o{ Slot : "hasMany"
    Slot ||--o{ SlotShipment : "hasMany"
    Slot }o--|| Carrier : "belongsTo"
```

## Инвойсинг

```mermaid
erDiagram
    PreInvoice {
        int id PK
        int shipment_id FK
        int carrier_id FK
        decimal amount
        string currency
        string status
        timestamp deleted_at
    }
    Invoice {
        int id PK
        int shipment_id FK
        int pre_invoice_id FK
        decimal amount
        string currency
        string status
    }
    CostSegment {
        int id PK
        int invoice_id FK
        string type
        decimal amount
        string description
    }

    Shipment ||--o| PreInvoice : "hasOne"
    PreInvoice ||--o| Invoice : "hasOne"
    Invoice ||--o{ CostSegment : "hasMany"
```

## Galaxy (Multi-tenant)

```mermaid
erDiagram
    Galaxy {
        int id PK
        string name
        int owner_account_id FK
    }
    GalaxyAccount {
        int id PK
        int galaxy_id FK
        int account_id FK
        boolean is_managed
    }
    Constellation {
        int id PK
        int galaxy_id FK
        string name
    }

    Galaxy ||--o{ GalaxyAccount : "hasMany"
    Galaxy ||--o{ Constellation : "hasMany"
    GalaxyAccount }o--|| Account : "belongsTo"
```

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.database.er-model`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632684662 · **repo:** `tms/implementation/database/er-model.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

