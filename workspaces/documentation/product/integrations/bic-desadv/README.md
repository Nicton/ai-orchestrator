---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631701572
source_type: confluence
---
# BIC DESADV — Входящая EDI-интеграция

Интеграция для автоматического создания Shipments в Shiptify из DESADV (dispatch advice) EDI-сообщений от WMS системы клиента BIC.

> Источник: слайд `2025 11 - BIC DESADV`

> ⚠️ **СТАТУС ПО КОДУ (2026-06-11): НЕ РЕАЛИЗОВАНО** — кода нет ни в backend, ни в microservices, ни в integrations-app. Оценка из слайдов: 90-120 чел.-дней. Документ — спецификация.

---

## Архитектура

```
BIC WMS
  └── SFTP
        └── Dedicated Microservice (вне Shiptify)
              └── Shiptify Public API
                    └── Shipments / ShipmentRequests
```

Microservice обрабатывает: SFTP-доступ, cron, recovery файлов, transcodification, ingestion, error logging.

---

## Триггер

Одно DESADV-сообщение генерируется на 1 отправку (1 контейнер/грузовик). Все сообщения создаются в момент подтверждения отхода грузовика со склада.

---

## Логика по transport code

| Transport Code | Действие |
|---------------|---------|
| **B2B2C** | `POST /shipment` с internal_ref = DN number; автоподтверждение pick-up STY0000 по дате отхода из DESADV |
| **B2B + B2C** | (1) `POST /shipment` от HUB → клиент (B2C нога), (2) буферизация содержимого, (3) когда все DESADV для контейнера обработаны → `POST /shipment-request` склад → HUB (shuttle нога) с суммарным packing list |

---

## Таблица transcodification

Необходимо смапировать:
- BIC content types → Shiptify IDs (логика паллет / посылок)
- Carrier codes → прямая доставка или shuttle-split
- Адреса склада → Shiptify address IDs + IDs адресов carrier hub
- Коды опасных грузов → Shiptify DG IDs

---

## Структура DESADV JSON

| Сегмент | Содержимое |
|---------|-----------|
| HI | message_id, sender name/address, creation datetime |
| TI | reference, name, address, type (consignee) |
| OI | order_number, delivery_note, dates, buyer GLN, seller GLN, status, appointment, notes |
| PL | type EXP/Palette/Carton, qty, dimensions, weight gross/net, EAN, SSCC, reference |
| CI | EAN, quantity, unit, weight, volume |
| Summary | total pallets, cartons, weight, carrier, delivery appointment |

---

## Ретроконсолидация

**Бизнес-правило:** после обработки всех DESADV для контейнера — пересчёт и распределение стоимости на уровне отдельных DN-отправок.

**Пример:** 4 DN по 99 кг → отдельно попадают в тариф `<100 кг`. После консолидации: 396 кг / 4 паллеты / 1.6 LM / 3.4 CBM → применяется более подходящий тариф (pallet-type RS), стоимость распределяется пропорционально на 4 DN.

**Важно:** IMPORT SURCHARGES применяются ПОСЛЕ ретроконсолидации.

---

## Оценка трудозатрат

| Задача | Срок |
|--------|------|
| Microservice + SFTP/CRON | 2–6 недель |
| DESADV→shipment mapping B2C baseline | 7 дней |
| B2B адаптация | 4 дня |
| Ретроконсолидация carrier array exclusion | 3–5 дней |
| QA | 14 дней |
| Корректировки | 10 дней |
| **Итого (tech only)** | **90–120 человеко-дней** |

---

## 🔗 Граф-метаданные
- **id:** `integrations.bic-desadv`
- **type:** module-doc · **domain:** Integrations · **status:** implemented
- **confluence:** 631701572 · **repo:** `integrations/bic-desadv/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Integrations
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

