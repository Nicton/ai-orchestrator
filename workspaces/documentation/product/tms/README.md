---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632979506
source_type: confluence
---
# TMS — Transport Management System

Основной продукт Shiptify. Система управления перевозками: от создания заявки до доставки и выставления счёта.

## Домены TMS

| Домен | Папка | % готовности |
|-------|-------|-------------|
| **Отправки (Shipments)** | [shipments/](shipments/README.md) | 80% |
| **Заявки (Requests SR/QR)** | [requests/](requests/README.md) | 75% |
| **Слоты (Slots)** | [slots/](slots/README.md) | 65% |
| **Трекинг (Tracking)** | [tracking/](tracking/README.md) | 60% |
| **Инвойсинг (Invoicing)** | [invoicing/](invoicing/README.md) | 40% |
| **Мастер-данные (Master Data)** | [master-data/](master-data/README.md) | 35% |
| **Дашборды (Dashboards)** | [dashboards/](dashboards/README.md) | 60% |
| **Заказы (Orders)** | [orders/](orders/README.md) | 55% |
| **Претензии (Claims)** | [claims/](claims/README.md) | 60% |
| **Milkrun** | [milkrun/](milkrun/README.md) | 70% |
| **Транспортные запросы** | [transport-requests/](transport-requests/README.md) | 55% |
| **Rate Sheets** | [rate-sheets/](rate-sheets/README.md) | 60% |
| **Galaxy / Multi-tenant** | [galaxy/](galaxy/README.md) | 65% |

## Техническая документация

| Раздел | Описание |
|--------|---------|
| [technical-view/](technical-view/README.md) | Страницы для разработчика: типы, зависимости, impact |
| [implementation/](implementation/README.md) | Setup, backend, frontend, database, integrations |

## Главный поток (Happy Path)

```
Shipper создаёт заявку (CSW wizard)
         ↓
    Shipment Request
    ├─ SR (1 перевозчик) → подтверждение
    └─ QR (N перевозчиков) → котировки → выбор
                   ↓
              Shipment создан
                   ↓
         Carrier обновляет трекинг
         (pick-up → in transit → delivered)
                   ↓
              Invoicing (счёт)
```

---

## 🔗 Граф-метаданные
- **id:** `tms`
- **type:** overview · **domain:** TMS · **status:** implemented
- **confluence:** 632979506 · **repo:** `tms/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

