---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632979523
source_type: confluence
---
# Billing Entities — Сущности для выставления счетов клиентам

**Billing Entity** — юридическое лицо на стороне SELL (продавца), симметричное существующим Accounting Entities (Buying Entities) на стороне BUY. Используется для правильной маршрутизации счетов при выставлении их 3PL Customers.

> Источник: слайд `2025 12 - Buy&Sell - Accounting entities (BUY & SELL)`

---

## Контекст

```
Схема Buy & Sell:
  3PL Customer → запрашивает транспорт у → BUYER (TBS account / freight broker)
  BUYER → субподряд → SELLER / Carrier

У BUYER может быть несколько Accounting Entities (BUYING/BILLED) — для покупки.
Теперь по аналогии: несколько Billing Entities (SELLING/BILLING) — для продажи клиенту.
```

---

## Поля Billing Entity

| Поле | Обязательное | Описание |
|------|-------------|---------|
| Name | ✅ | Название юридического лица |
| Prefix | — | Префикс |
| EORI | — | EORI номер |
| VAT Number | — | Номер НДС |
| Description | — | Описание |
| 3PL Customer | — | Привязка к клиенту (поиск из списка партнёров) |
| Is Active | — | По умолчанию YES при создании |
| Is Default | — | Дефолтная сущность для данного клиента |

> Вне скоупа сейчас: Billing Address, Contacts, Payment Terms (на будущее)

---

## Логика автозаполнения на уровне TR

| Ситуация | Поведение |
|---------|----------|
| У 3PL Customer ровно 1 Billing Entity | Автозаполнение независимо от флага Is Default |
| Несколько Billing Entities, одна помечена Default | Автозаполнение дефолтной |
| Несколько Billing Entities, нет дефолтной | Поле не заполняется автоматически |
| У 3PL Customer нет Billing Entities | Поле Billing Entity скрыто в TR |

---

## Правило конфликта

Если пользователь устанавливает Is Default для клиента, у которого уже есть дефолтная Billing Entity → система выдаёт предупреждение или блокирует действие.

---

## Где применяется

- **TR level** — Billing Entity (для выставления счета клиенту)
- **SR level** — Buying Entity (бывшие "Entities", для покупки у перевозчика)

В Admin Panel при типе аккаунта BUY & SELL с включёнными accounting entities — оба поля отображаются рядом:
- `Accounting entities (BUYING / BILLED)`
- `Billing Accounting entities (SELLING / BILLING)`

---

## Переименования в UI

"Entities" во всём интерфейсе переименованы в **"Buying Entities"**: admin panel, фильтры, Tolgee-ключи, экспорты.

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell.billing-entities`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632979523 · **repo:** `tms/buy-sell/billing-entities.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

