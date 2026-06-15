---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629080123
source_type: confluence
---
# Stream-Topics — Реестр Kafka-событий (контракты)

**stream-topics** (`workspaces/stream-topics`, пакет `@shiptify/stream-events`) — монорепо-пакет с **версионированными определениями Kafka-топиков и доменных событий**: типы, схемы и AJV-валидаторы. Это контракт обмена событиями между сервисами Shiptify. Ранее имел только упоминания — заполняем пробел.

> Репозиторий: `workspaces/stream-topics` · пакет в `pkg/stream-events/`.

---

## 1. Зачем (бизнес/архитектура)

Сервисы Shiptify общаются событиями через Kafka. Чтобы продьюсер и консьюмер не рассогласовались, все события описаны в одном месте как типизированные схемы с версиями. Здесь определены домены событий и каталог имён интеграций — единый источник правды для событийного контура.

---

## 2. Как устроено (код, file:line)

| Компонент | Файл | Назначение |
|-----------|------|-----------|
| Топик интеграций | `pkg/stream-events/src/topics/domain-integration.ts:34-58` | inbound integration events |
| Каталог интеграций | `pkg/stream-events/src/catalog/integration.ts:17-45` | enum `IntegrationName` |
| Контракты типов | `pkg/stream-events/src/types.ts:1-42` | `DomainEvent`, `EventVersionMap`, Actor, `StringableKey` |

**Домены событий (`src/topics/`):** `domain-integration`, `domain-tms`, `domain-dock`, `domain-account`, `domain-chat`, `email-transact`.

**`domain.integration` events:** `FedexMessageReceived`, `DhlFcaMessageReceived`, `EdifactMessageReceived`, `InttraMessageReceived`, `AftershipWebhookReceived`, `ShippeoTrackingUpdateReceived`, `P44WebhookReceived`, `MarineTrafficTrackingRequestCreated`, `PeripassVisitTrackingReceived`.

**`IntegrationName` (catalog):** aftership, brinks, dhl, dhl_express, dhl_fca, fedex, ups, p44, shippeo, marine_traffic, peripass, …

**Partition key:** `aggregateId` (shipmentId / filename / trackingNumber). Валидаторы — pre-compiled AJV.

### Кто использует

- **Продьюсеры:** [Brinks](../integrations/carriers/brinks.md), [UPS](../integrations/carriers/ups.md) → `sendToIntegrationLogQueue()` → `domain.integration`.
- **Консьюмеры:** backend слушает inbound-события (`FedexMessageReceived`, `InttraMessageReceived`, `AftershipWebhookReceived`, …).
- Транспорт реализуют адаптеры из [core-libs.md](core-libs.md) (`stream-kafka` и др.).

---

## 3. Где найти и настроить

- **Добавление события:** новый тип в соответствующем `domain-*.ts` + версия в `EventVersionMap` + AJV-схема.
- **Имя интеграции:** добавить в `catalog/integration.ts`.
- Пакет публикуется как `@shiptify/stream-events` и подключается сервисами как зависимость.

---

## 4. Сценарии

1. **Новая интеграция-перевозчик.** Добавляется `IntegrationName` + событие в `domain-integration` → продьюсер/консьюмер используют общий типизированный контракт.
2. **Эволюция схемы.** При изменении полей события поднимается версия в `EventVersionMap`, старые консьюмеры продолжают работать по своей версии.

---

## Связанные документы

- [README.md](README.md) — карта микросервисов
- [core-libs.md](core-libs.md) — транспортные адаптеры (stream-kafka/pg/redis)
- [../integrations/carriers/brinks.md](../integrations/carriers/brinks.md), [../integrations/carriers/ups.md](../integrations/carriers/ups.md) — продьюсеры событий

---

## 🔗 Граф-метаданные
- **id:** `microservices.stream-topics`
- **type:** module-doc · **domain:** Microservices · **status:** implemented
- **confluence:** 629080123 · **repo:** `microservices/stream-topics.md`
- **code_refs:** `stream-topics/pkg/stream-events/src/topics/domain-integration.ts:34-58`, `stream-topics/pkg/stream-events/src/catalog/integration.ts:17-45`, `stream-topics/pkg/stream-events/src/types.ts:1-42`
- **modules:** Microservices, Integrations
- **references:** microservices.overview, microservices.core-libs, integrations.carriers.brinks, integrations.carriers.ups
- **requirements:** нет требований — контракт событий (источник: код `workspaces/stream-topics`)
