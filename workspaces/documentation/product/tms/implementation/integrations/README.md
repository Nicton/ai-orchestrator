---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881236
source_type: confluence
---
# Integrations — Внешние системы

Shiptify интегрируется с 27 перевозчиками и несколькими внешними платформами. Все интеграции следуют единому паттерну.

## Паттерн интеграции

```
service.js → Queue (Kue/Redis) → worker picks → impl.js → dataResolver → dataBuilder → provider.js → External API
```

Подробно: [backend/04_ИНТЕГРАЦИИ.md](../backend/04_ИНТЕГРАЦИИ.md)

---

## Перевозчики (27)

| Перевозчик | Тип | Папка |
|-----------|-----|-------|
| DHL | Глобальный | `integration/dhl/` |
| DHL Global Forwarding | Экспедирование | `integration/dhl-global-forwarding/` |
| MyDHL | DHL API v2 | `integration/mydhl/` |
| FedEx | Глобальный | `integration/fedex/` |
| FedEx API | FedEx API v1 | `integration/fedex-api/` |
| UPS | Глобальный | `integration/ups/` |
| DB Schenker | Европа | `integration/db-schenker/` |
| Heppner | Европа | `integration/heppner/` |
| Kuehne+Nagel | Глобальный | `integration/kuehne-nagel/` |
| Terrial | Региональный | `integration/terrial/` |
| Teliae | Региональный | `integration/teliae/` |
| Teliway | Региональный | `integration/teliway/` |
| Dimotrans | Франция | `integration/dimotrans/` |
| Dachser | Европа | `integration/dachser/` |
| INTTRA | Морские перевозки | `integration/inttra/` |
| Brinks | Ценные грузы | `integration/brinks/` |
| Living Packets | Умная упаковка | `integration/livingpacket/` |

## Трекинговые платформы

| Платформа | Описание | Тип подключения |
|-----------|---------|----------------|
| P44 (Project44) | Агрегатор трекинга, 27+ перевозчиков | REST polling (cron) |
| Shippeo | GPS-трекинг в реальном времени | Webhook / polling |
| AfterShip | Мультиперевозчик, уведомления клиентам | Webhook |
| Marine Traffic | Морской транспорт | REST API |
| Calvacom | Телематика (GPS трекер) | REST API |

## Бизнес-системы

| Система | Назначение | Триггер |
|---------|-----------|---------|
| SAP | ERP синхронизация (заказы, инвойсы) | Invoice confirmed |
| HubSpot | CRM (лиды, контакты) | Account events |
| Peripass | Gate management складов | Slot confirmed |
| Ecotransit | Расчёт CO₂ углеродного следа | Shipment created |
| Reflex | WMS интеграция | Shipment events |

## Retry стратегия

Каждая интеграция имеет специфичные настройки retry:

```javascript
// app/lib/retryAttempts.js
const retryAttempts = (job, error, maxAttempts, retryDelays) => {
    const attempts = job.data.attempts || 0;
    if (attempts >= maxAttempts) return false; // fatal → alert

    const delayMs = retryDelays[attempts] * 1000;
    job.failed().delay(delayMs).state('delayed').priority('high').update();
    return true;
};
```

При исчерпании попыток: уведомление в Telegram + job → `failed` state в Kue.

## Логи интеграций

Все запросы/ответы к внешним API логируются в AWS S3:

```javascript
const logger = buildLogger('integration-dhl');
logger.info('Booking request', { shipmentId, payload });
logger.error('API error', { error, response });
// → S3: integration-logs/dhl/YYYY-MM-DD/shipment-{id}.log
```

Просмотр: `integration_logs_s3_helper.js`

## workspaces/integrations (отдельный сервис)

Отдельный микросервис для трекинговых интеграций:

```
workspaces/integrations/
├── src/
│   ├── carriers/      ← DHL, MyDHL, AfterShip sync
│   ├── cron/          ← scheduled polling tasks
│   └── kafka/         ← Kafka consumer/producer
```

- Express 5, Sequelize 6, Kafka
- Синхронизация данных через SFTP/CSV/API
- Cron: DHL, MyDHL, AfterShip polling

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.integrations`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881236 · **repo:** `tms/implementation/integrations/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

