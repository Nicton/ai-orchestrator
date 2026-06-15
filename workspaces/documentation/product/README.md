---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632094738
source_type: confluence
---
# Продуктовая документация Shiptify

Внутренняя документация для разработчиков. Цель: понять любую часть продукта за 10 минут.

## Навигация

| Документ | Описание |
|----------|---------|
| [PROJECT-MAP.md](PROJECT-MAP.md) | Типы пользователей, user journeys, corner cases, матрица прав |
| [TEMPLATE.md](TEMPLATE.md) | Шаблон для добавления нового домена |
| [../OVERVIEW.md](../OVERVIEW.md) | Статус документации: % готовности |

## Продукты

| Продукт | Папка | Описание | % готовности |
|---------|-------|---------|-------------|
| **TMS** | [tms/](tms/README.md) | Transport Management System — основной продукт | 45% |
| Mini-apps | _не начато_ | Driver App, Carrier Portal, Customs, Quick Shipment | 0% |
| Back-office | _не начато_ | Внутренний инструмент команды Shiptify | 0% |
| Admin App | _не начато_ | Административная панель | 0% |
| Public API | _не начато_ | Публичное API для внешних клиентов | 0% |

## Как читать эту документацию

**Новый в команде** → начни с [PROJECT-MAP.md](PROJECT-MAP.md): узнай кто такие Shipper и Carrier, как они работают

**Хочу понять конкретную фичу** → иди в [tms/](tms/README.md) → выбери домен

**Хочу добавить документацию** → скопируй [TEMPLATE.md](TEMPLATE.md), заполни, обнови [OVERVIEW.md](../OVERVIEW.md)

## Главный поток системы

```
Shipper → CSW Wizard → ShipmentRequest (SR или QR)
                              ↓
                         Shipment создан
                              ↓
              Carrier обновляет трекинг-точки
                              ↓
                           Delivered
                              ↓
                           Invoicing
```

Подробнее с corner cases → [PROJECT-MAP.md](PROJECT-MAP.md)
