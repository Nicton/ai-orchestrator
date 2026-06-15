---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632684562
source_type: confluence
---
# Руководство по активации интеграции

Это пошаговое руководство объясняет, как активировать существующую интеграцию для конкретной пары Shipper + Carrier в Shiptify.

---

## Предварительные условия

- Доступ к базе данных Shiptify (staging или production)
- ID аккаунта Shipper (грузоотправитель)
- ID аккаунта Carrier (перевозчик)
- Название интеграции (например: `kuehne-nagel`, `teliae`, `p44`)
- Workers запущены и слушают очередь

---

## Шаг 1 — Найти нужные ID

```sql
-- Найти Shipper по имени
SELECT id, name FROM accounts
WHERE name ILIKE '%acme%' AND type = 'SHIPPER';
-- → id = 42

-- Найти Carrier по имени
SELECT id, name FROM accounts
WHERE name ILIKE '%dhl%' AND type = 'CARRIER';
-- → id = 15
```

---

## Шаг 2 — Создать запись в integration_settings

`integration_settings` определяет, какая интеграция и с какими параметрами должна работать.

```sql
INSERT INTO integration_settings (
    integration_name,        -- название интеграции (обязательно)
    shipment_mode_id,        -- ID режима: NULL = все, 1 = Air, 2 = Sea, 3 = Road
    metadata_prototype_id,   -- прототип поля для трекинг-референса (если нужен)
    reference_field_name     -- тип референса: 'HAWB', 'MAWB', 'ALL_CUSTOMER_REFERENCES'
)
VALUES (
    'kuehne-nagel',
    NULL,                    -- для всех режимов
    NULL,                    -- без привязки к метаданным
    'HAWB'
)
RETURNING id;
-- → id = 25
```

### Примеры для разных интеграций

```sql
-- DHL — только Air
INSERT INTO integration_settings (integration_name, shipment_mode_id, reference_field_name)
VALUES ('dhl', 1, 'HAWB')
RETURNING id;

-- Teliae — Road, по трекинг-номеру
INSERT INTO integration_settings (integration_name, shipment_mode_id, reference_field_name)
VALUES ('teliae', 3, 'TRACKING_NUMBER')
RETURNING id;

-- P44 — все режимы
INSERT INTO integration_settings (integration_name)
VALUES ('p44')
RETURNING id;

-- DB Schenker — Sea, MAWB
INSERT INTO integration_settings (integration_name, shipment_mode_id, reference_field_name)
VALUES ('db_schenker', 2, 'MAWB')
RETURNING id;
```

---

## Шаг 3 — Активировать для пары Shipper + Carrier

`active_integrations` создаёт конкретную связь между шиппером, перевозчиком и настройками интеграции.

```sql
INSERT INTO active_integrations (
    shipper_id,                -- ID аккаунта Shipper
    carrier_id,                -- ID аккаунта Carrier
    integration_setting_id,    -- ID из integration_settings (шаг 2)
    shipper_code,              -- опционально: код клиента на стороне перевозчика
    carrier_code,              -- опционально: код перевозчика
    carrier_product_code,      -- опционально: продукт/тариф перевозчика
    accounting_entity_id       -- опционально: привязка к accounting entity
)
VALUES (
    42,      -- shipper_id
    15,      -- carrier_id
    25,      -- integration_setting_id
    'ACME',  -- shipper_code (как перевозчик знает этого клиента)
    NULL,    -- carrier_code
    NULL,    -- carrier_product_code
    NULL     -- accounting_entity_id
);
```

### Активация с продуктовым кодом

```sql
-- Heppner с конкретным продуктом HPR
INSERT INTO active_integrations (
    shipper_id, carrier_id, integration_setting_id,
    shipper_code, carrier_product_code
)
VALUES (42, 55, 20, 'ACME_HEPPNER', 'HPR_STANDARD');
```

### Активация для конкретного accounting entity

```sql
-- Если у Shipper есть несколько юридических лиц
INSERT INTO active_integrations (
    shipper_id, carrier_id, integration_setting_id,
    accounting_entity_id
)
VALUES (42, 15, 25, 7);
```

---

## Шаг 4 — Проверить активацию

```sql
-- Проверить, что запись создана корректно
SELECT
    ai.id,
    s.name AS shipper,
    c.name AS carrier,
    is2.integration_name,
    ai.shipper_code,
    ai.carrier_product_code,
    ai.deleted_at
FROM active_integrations ai
JOIN accounts s ON s.id = ai.shipper_id
JOIN accounts c ON c.id = ai.carrier_id
JOIN integration_settings is2 ON is2.id = ai.integration_setting_id
WHERE ai.shipper_id = 42
  AND ai.carrier_id = 15
  AND ai.deleted_at IS NULL;
```

---

## Шаг 5 — Тест: создать отправку и подтвердить

1. Создать Booking в Shiptify для Shipper = 42, Carrier = 15
2. Нажать **Confirm** (подтверждение assignment)
3. Система вызовет `processNewCreatedShipments()`
4. Найдётся запись в `active_integrations`
5. Задача выброшена в Kue Queue

---

## Шаг 6 — Проверить воркеры

### Проверка через Kue Dashboard

```
http://localhost:3000/kue/  (или порт воркера)
```

Найти задачу с именем `integration-<name>` в статусах:
- `active` — выполняется
- `complete` — успешно
- `failed` — ошибка (смотреть logs)
- `delayed` — отложено (retry)

### Проверка через логи S3

```javascript
// Логи сохраняются в S3 по пути:
// integration-logs/<name>/YYYY-MM-DD/shipment-{id}.log
```

### Проверка через базу данных

```sql
-- Для интеграций с метаданными (например P44)
SELECT * FROM shipment_integration_p44
WHERE shipment_id = 1234;

-- Для интеграций с трекинг-точками
SELECT * FROM tracking_points
WHERE shipment_id = 1234
ORDER BY created_at DESC
LIMIT 10;
```

---

## Диагностика проблем

### Интеграция не срабатывает

```sql
-- Проверка 1: Workers запущены?
-- (проверить процессы на сервере)

-- Проверка 2: Запись в integration_settings?
SELECT * FROM integration_settings
WHERE integration_name = 'kuehne-nagel'
  AND deleted_at IS NULL;

-- Проверка 3: Запись в active_integrations?
SELECT * FROM active_integrations
WHERE shipper_id = 42
  AND carrier_id = 15
  AND deleted_at IS NULL;

-- Проверка 4: Правильный режим?
SELECT ai.*, is2.shipment_mode_id, sm.name AS mode
FROM active_integrations ai
JOIN integration_settings is2 ON is2.id = ai.integration_setting_id
LEFT JOIN shipment_modes sm ON sm.id = is2.shipment_mode_id
WHERE ai.id = 25;
```

### Интеграция срабатывает, но с ошибкой

```sql
-- Посмотреть ошибки active integration
SELECT * FROM active_integration_errors
WHERE active_integration_id = 25
ORDER BY created_at DESC
LIMIT 5;
```

### Мягкое удаление (deactivation)

Для деактивации интеграции используется soft delete:

```sql
-- Деактивировать интеграцию (НЕ удалять)
UPDATE active_integrations
SET deleted_at = NOW()
WHERE id = 25;

-- Проверить, что деактивирована
SELECT id, deleted_at FROM active_integrations WHERE id = 25;
```

---

## Таблица integration_name для всех интеграций

| Интеграция | `integration_name` |
|-----------|-------------------|
| DHL | `dhl` |
| DHL Global Forwarding | `dhl_global_forwarding` |
| MyDHL | `mydhl` |
| DHL FCA | `dhl-fca` |
| DHL Inovert | `dhl_inovert` |
| FedEx legacy | `teliae-fedex` |
| FedEx API | `fedex-api` |
| UPS | `ups` |
| DB Schenker | `db_schenker` |
| Heppner | `heppner` |
| Kuehne+Nagel | `kuehne-nagel` |
| Dachser | `dachser` |
| Teliae | `teliae` |
| Calvacom | `calvacom` |
| Teliway Urby | `teliway_urby` |
| Teliway Evol | `teliway_evol` |
| Brinks | `brinks` |
| LivingPackets | `living-packets` |
| P44 | `p44` |
| Shippeo | `shippeo` |
| AfterShip | `aftership` |
| Marine Traffic | `marine_traffic_kpler` |
| SAP | `sap` |
| Peripass | `peripass` |
| Ecotransit | `ecotransit` |
| Reflex | `reflex` |

---

## Пример полного сценария: активация Kuehne+Nagel для Shipper

```sql
-- 1. Найти ID
SELECT id FROM accounts WHERE name = 'Acme Corp' AND type = 'SHIPPER'; -- 42
SELECT id FROM accounts WHERE name = 'Kuehne+Nagel' AND type = 'CARRIER'; -- 88

-- 2. Создать настройки (Air, по HAWB)
INSERT INTO integration_settings (integration_name, shipment_mode_id, reference_field_name)
VALUES ('kuehne-nagel', 1, 'HAWB')
RETURNING id; -- 30

-- 3. Активировать
INSERT INTO active_integrations (shipper_id, carrier_id, integration_setting_id, shipper_code)
VALUES (42, 88, 30, 'ACME-KN-CODE');

-- 4. Проверить
SELECT ai.*, is2.integration_name, is2.reference_field_name
FROM active_integrations ai
JOIN integration_settings is2 ON is2.id = ai.integration_setting_id
WHERE ai.shipper_id = 42 AND ai.carrier_id = 88 AND ai.deleted_at IS NULL;

-- 5. Создать Air Shipment с Carrier = 88 → Confirm → проверить воркеры
```

---

## Связанные документы

- [architecture/README.md](architecture/README.md) — техническая архитектура
- [carriers/README.md](carriers/README.md) — все перевозчики
- [onboarding/06_integrations-technical.md](../onboarding/06_integrations-technical.md) — видео-туториал

---

## 🔗 Граф-метаданные
- **id:** `integrations.setup-guide`
- **type:** module-doc · **domain:** Integrations · **status:** implemented
- **confluence:** 632684562 · **repo:** `integrations/setup-guide.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Integrations
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

