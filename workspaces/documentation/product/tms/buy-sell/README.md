---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632160387
source_type: confluence
---
# Buy & Sell (TBS) — Аккаунт типа "Покупатель и Продавец"

**Buy & Sell (TBS)** — это новый тип аккаунта в Shiptify TMS для 3PL-операторов (freight brokers), которые одновременно являются и покупателем транспорта у Carrier, и продавцом транспортных услуг своим клиентам (3PL Customers).

> Источники: слайды Dec 2025 — Feb 2026 (Buy & Sell series)

---

## Концепция

```
3PL Customer → ПРОДАЁТ транспорт → TBS Account (Seller/Buyer)
                                        ↓
                               ПОКУПАЕТ транспорт → Carrier
```

TBS-аккаунт видит оба направления:
- **BUY side** — классический TMS (заявки перевозчикам, трекинг, инвойсинг)
- **SELL side** — управление запросами от клиентов (3PL Customers)

---

## Признак в Back-Office

- Тег в BO: **TBS** (To Be Sold / Buy & Sell)
- Базируется на расширенном baseline-аккаунте
- Доступные фичи: spectator, transport request, auto confirm, incoterm for partners, transport plan, follower plan, rate sheets, accounting entities, custom currency, chargeable weights, dashboard
- Технические флаги: Carrier auto validation, can request, can receive request

---

## Навигация для TBS-аккаунта

```
Sidebar:
  BUY   ← переименованный классический TMS
  SELL  ← новый модуль
    ├── Requests  → /receive-requests
    └── Groups    → /transport-request-groups
```

**Для не-TBS аккаунтов** с флагом `can request` — существующие меню `My requests / Requests` остаются без изменений.

---

## Флоу создания заявки в TBS

Нажатие **+BOOK** в TBS-аккаунте:
1. Открывается экран выбора 3PL Customer (пропускает стандартный dual-screen)
2. Пользователь выбирает клиента → сразу открывается TR CSW (без кнопки NEXT)
3. Кнопка **NO CUSTOMER** → классический Booking CSW (spot purchase)

### Как выглядит TR CSW в TBS

- Заголовок TR CSW увеличен на 50% по высоте
- Если у клиента есть логотип → логотип клиента вместо логотипа перевозчика
- Имя клиента и режим транспортировки отображаются серым шрифтом

### SR view в TBS

- Логотип перевозчика скрыт до подтверждения (carrier awarded/confirmed)
- Вместо блока с перевозчиком: имя клиента + количество запросов + цена + маржа %
- **Маржа %** показывается только если: есть продажная цена И QR передан перевозчику
- Если 2+ TR и у одного нет продажной цены — маржа не показывается

---

## Подфичи Buy & Sell

| Фича | Файл |
|------|------|
| Billing Entities (сущности для выставления счетов клиентам) | [billing-entities.md](billing-entities.md) |
| Selling Rate Sheet (тарифы для клиентов) | [selling-rate-sheet.md](selling-rate-sheet.md) |
| Send Quotes (отправка котировок клиенту) | [send-quotes.md](send-quotes.md) |
| Repeat Request (дублирование TR) | [repeat-request.md](repeat-request.md) |
| Buy & Sell V3: QR → TR flow | [buysell-v3-qr-to-tr.md](buysell-v3-qr-to-tr.md) |

---

## Ключевые объекты

| Объект | Уровень | Описание |
|--------|---------|---------|
| **TR** (Transport Request) | SELL side | Запрос от 3PL Customer — аналог SR для покупки |
| **SR** (Shipment Request) | BUY side | Классическая заявка перевозчику |
| **Buying Entity** | SR level | Юридическое лицо для покупки (бывшие "Entities") |
| **Billing Entity** | TR level | Юридическое лицо для выставления счета клиенту |
| **Selling Rate Sheet** | SELL side | Тариф для 3PL Customer (зеркало Buy Rate Sheet) |

---

## Связь объектов (Buy & Sell V3)

```
Initial SR (от 3PL Customer)
  └── QR (запрос котировок)
        └── TR (автоматически создаётся для TBS-аккаунта)
              └── SR (заявка перевозчику)
                    └── SH (Shipment — факт перевозки)
```

Документы и метаданные каскадируются по всей цепочке.

---

## Экспортные колонки (изменения в UI)

| Старое название | Новое название |
|----------------|----------------|
| Entity | **Buying Entity** (Billed Entity) |
| Entity EORI | Billed Entity EORI |
| Entity VAT | Billed Entity VAT |

Новые колонки: Billing Entity, Billing Entity EORI, Billing Entity VAT.

---

## Дублирование чатов при создании SH из QR (REQ-STY-004)

При создании SH из QR система автоматически переносит историю чатов:

| Действие | Результат |
|----------|----------|
| SH создан из QR | Новый чат на уровне SH для каждого чата QR (с историей) |
| SH создан из QR | Новый чат на уровне SH для каждого чата BK (с историей) |
| Сообщение на подтверждённом QR | Копируется во все связанные SH |
| Сообщение на уровне PSH | Копируется в связанный SH и QR |

**Иерархия чатов по объектам:** PSH → QR → BK → SH

Группы чата:
- **Public** — видят все аккаунты с доступом к объекту
- **Private** — только моя команда
- **Private Carrier/Shipper** — только конкретная сторона

Spectators, добавленные на уровне BK, имеют доступ ко всем публичным группам чата в каждом QR.

---

## Настройки MD и документов по умолчанию (REQ-STY-006)

Настройки по умолчанию для метаданных и документов задаются на уровне MD и Doc:

- Применяются при создании **BK** и при создании **SH**
- Подписчики чата BK формируются при создании BK по персональным настройкам пользователей
- Подписчики чата SH формируются при создании SH по персональным настройкам пользователей
- Изменение настроек **не затрагивает** уже существующие чаты

**Управление уведомлениями (REQ-STY-008):**
- Отдельная вкладка **Notifications** в профиле пользователя (не в General)
- На carrier-стороне: раздел **Customers** для настройки уведомлений по конкретным клиентам
- Кнопка **Notify** = «SEND ONLY CHAT MESSAGE NOTIFICATIONS»

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632160387 · **repo:** `tms/buy-sell/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

