---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930994
source_type: confluence
---
# Технические интеграции — Как включить и настроить

> Источник: видео "How To Enable Integrations For Shipments Main App.mkv" (технический туториал)

---

## Архитектура: Main App + Workers

Приложение состоит из **двух отдельных процессов**:

```
Main App (основное приложение)
    ↓ выбрасывает задачи
  Kue Queue (очередь)
    ↑ читают задачи
Workers (воркеры)
    ↓ выполняют
  Integration Logic (логика интеграции)
```

- **Main App** → обрабатывает запросы, выбрасывает задачи в очередь
- **Workers** → слушают очередь, выполняют логику интеграций
- Запускаются **отдельно** (два независимых процесса)

---

## Когда срабатывает интеграция

Интеграция запускается на стадии **confirm-assignment** (подтверждение Shipment).

**Где в коде:**
```
app/services/shipments.js
  └── processNewCreatedShipments()
        └── вызывается при shipmentConfirmed
              └── проверяет, включена ли интеграция
                    └── если да → выбрасывает задачу в очередь
```

---

## Структура файлов интеграции

```
app/
  services/
    integration/
      [integration-name]/        ← папка новой интеграции
        index.js                 ← добавляет задачу в очередь (импортится в Main App)
        implementation.js        ← логика интеграции (импортится в Workers)
```

**Main App** импортирует только файл выброса задачи.
**Workers** импортируют имплементацию.

---

## Как выбросить задачу в очередь

В методе `processNewCreatedShipments`:

```javascript
// Проверить, включена ли интеграция для пары shipper-carrier
const integration = await findActiveIntegration(shipperId, carrierId);

if (integration) {
    // Выбросить задачу с нужными параметрами
    await queue.add('integration-task-name', {
        shipmentId,
        shipperId,
        carrierId,
        // дополнительные параметры
    });
}
```

---

## Как Workers слушают задачи

```javascript
// В воркере каждая интеграция слушает свои офферы (задачи) по имени
queue.process('integration-task-name', async (job) => {
    const { shipmentId, shipperId, carrierId } = job.data;
    await integrationImplementation(shipmentId, shipperId, carrierId);
});

// Дополнительно может слушать другие задачи
queue.process('another-task', async (job) => {
    // ...
});
```

---

## Активация интеграции в БД

Интеграция срабатывает только если активирована через **две таблицы**:

### 1. integration_settings

Существование интеграции в системе:

```sql
INSERT INTO integration_settings (name, ...additional_settings)
VALUES ('test_integration', ...);
-- Сохранить полученный id
```

### 2. active_integrations

Активация для конкретной пары Shipper-Carrier:

```sql
INSERT INTO active_integrations (
    integration_settings_id,  -- id из integration_settings
    shipper_id,               -- id Shipper аккаунта
    carrier_id,               -- id Carrier аккаунта
    -- опциональные доп. настройки
)
VALUES (25, 20, 33);
```

---

## Пошаговый процесс включения новой интеграции

```
1. Создать папку в app/services/integration/[name]/
2. Написать файл выброса задачи → импортировать в Main App
3. Написать имплементацию → импортировать в Workers
4. Запустить Workers
5. Добавить запись в integration_settings (Admin или прямо в БД)
6. Добавить запись в active_integrations (связать shipper + carrier)
7. Создать Booking между этой парой → Confirm
8. Проверить воркеры → интеграция должна сработать
```

---

## Важные особенности

- Интеграция может быть настроена для конкретного **Shipment Mode** (Air, Sea, Road) — дополнительные настройки
- Записи в `active_integrations` могут различаться по **аккаунтинговым системам** (accounting system)
- Если записи нет в `active_integrations` — интеграция **не сработает** даже при наличии кода

---

## Пример потока (по видео)

```
Создать Booking (Shipper: 20, Carrier: 33)
    ↓ Нажать Confirm
    ↓ processNewCreatedShipments()
    ↓ Проверить active_integrations → нашли запись (integration_id=25, shipper=20, carrier=33)
    ↓ Выбросить задачу в очередь с параметрами

Workers читают очередь
    ↓ Нашли задачу 'test_integration'
    ↓ Вызвали implementationFunction(shipmentId, shipperId, carrierId)
    ↓ ✅ Интеграция выполнена
```

---

## Отладка

Если интеграция не срабатывает — проверить:
1. Workers запущены?
2. Запись в `integration_settings` существует?
3. Запись в `active_integrations` существует для этой пары shipper-carrier?
4. Правильный mode/shipment?
5. Задача выброшена в очередь? (Kue Dashboard)

---

## 🔗 Граф-метаданные
- **id:** `onboarding.06_integrations-technical`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631930994 · **repo:** `onboarding/06_integrations-technical.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

