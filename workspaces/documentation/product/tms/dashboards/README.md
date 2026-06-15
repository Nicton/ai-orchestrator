---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632946738
source_type: confluence
---
# Дашборды (Dashboards)

Набор аналитических страниц для мониторинга состояния перевозок, финансов и операций в реальном времени. Каждый дашборд — это срез данных по определённой области.

## Кто использует

- **Shipper** — следит за своими перевозками, KPI, задержками
- **Admin** — мониторинг всей системы
- **Finance** — дашборд инвойсинга, Cost of transport

## Страницы

| URL | Название | Описание |
|-----|---------|---------|
| `/dashboard` | Главный дашборд | KPI-сводка: активные перевозки, задержки, pending слоты |
| `/dashboard/general` | General | Общая статистика аккаунта |
| `/dashboard/tracking` | Tracking | Проблемные перевозки: задержки, инциденты, без POD |
| `/dashboard/invoicing` | Invoicing | Финансовые KPI: pending инвойсы, суммы |
| `/dashboard/quotes` | Quotes | Статистика котировок (QR) |
| `/dashboard/daily` | Daily / Today | Снимок на сегодня: что приезжает, что отправляется |
| `/dashboard/monitoring` | Monitoring | Системный мониторинг очередей и интеграций |
| `/dashboard/co2` | CO2 | Углеродный след перевозок (через Ecotransit) |
| `/multivision` | Multivision | Агрегированный вид для Galaxy (несколько аккаунтов) |
| `/claims-dashboard` | Claims | Статистика претензий |

---

## Tracking Dashboard — главный для ежедневной работы

**URL:** `/dashboard/tracking`

### Что видит пользователь

| Виджет | Что показывает | Источник |
|--------|---------------|---------|
| Задержанные перевозки | Shipment'ы с `TrackingPoint.status = delayed` | `Shipment` + `TrackingPoint` |
| Не подтверждённые TP | Отправки без подтверждения pick-up | `TrackingPoint.status = not_confirmed` |
| Без POD | Перевозки `delivered` но без `pod_status = loaded` | `Shipment.pod_status` |
| С инцидентами | `TrackingPoint.status = incident` | `TrackingPoint` |
| ETA отклонение | Разница между planned и real датой | Рассчитывается |

### Действия

| Действие | Что происходит |
|----------|---------------|
| Клик на перевозку | → `/shipments/{id}` таб Tracking |
| Отправить напоминание | `remindTracking()` → email Carrier |
| Создать инцидент | `TrackingPoint.status = incident` |

---

## Multivision Dashboard

**URL:** `/multivision`

Для аккаунтов в составе Galaxy — агрегированный вид перевозок всех дочерних аккаунтов.

| Колонка | Описание |
|---------|---------|
| Аккаунт | Название sub-аккаунта Galaxy |
| Активных перевозок | Shipments в статусе in_transit |
| Задержки | Количество delayed TP |
| Этот месяц | Количество delivered |

---

## Дашборд CO2

**URL:** `/dashboard/co2`

Расчёт углеродного следа через интеграцию с **Ecotransit**.

| Метрика | Описание |
|---------|---------|
| CO2 на перевозку | г/km или кг CO2 |
| Итого за период | Суммарный след за месяц/квартал |
| По режимам | Road vs Air vs Sea vs Express |
| Топ маршрутов | Самые "грязные" маршруты |

**Интеграция:** `app/services/integration/ecotransit/` — запрос при создании/завершении Shipment.

---

## Навигация

- Все дашборды доступны из главного меню → **Dashboard**
- С любого виджета → переход на соответствующую страницу (Shipment, Invoice и т.д.)

## Backend

- Frontend: `workspaces/frontend/public/app/dashboard/`
- Data: агрегирующие запросы в `app/services/shipments.js`, `app/services/shipment_requests.js`
- CO2: `app/services/integration/ecotransit/`

---

## 🔗 Граф-метаданные
- **id:** `tms.dashboards`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632946738 · **repo:** `tms/dashboards/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

