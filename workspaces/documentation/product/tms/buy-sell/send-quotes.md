---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633143329
source_type: confluence
---
# Send Quotes — Отправка котировок клиентам

Функция **Send Quotes** позволяет 3PL-оператору (TBS-аккаунт) отправить формальную ценовую котировку клиенту (3PL Customer) прямо из Transport Request.

> Источник: слайд `2025 12 - Buy&Sell - Send Quotes`

---

## Общий флоу

```
TBS пользователь создаёт TR с продажной ценой
    ↓
Нажимает [Send Quote]
    ↓
Заполняет модал: email получателя, срок действия, комментарий
    ↓
Клиент получает email + публичная Quote Page
    ↓
Клиент нажимает Accept или Decline
    ↓
Статус TR обновляется автоматически
```

---

## Поле "Requester Email" на TR

- Новое опциональное поле для email контакта клиента
- Размещается на странице 1 TR (ниже названия TR)
- Автодополнение: помнит email адреса, использованные в рамках аккаунта
- Используется для предзаполнения поля получателя в модале Send Quote

---

## Модал Send Quotes

| Поле | Описание |
|------|---------|
| Recipient email(s) | Один или несколько адресов; предзаполняется из Requester Email |
| Quote valid till | Опциональная дата и время истечения котировки |
| Comment | Опциональный комментарий (виден на публичной странице) |
| Price synthesis | Итоговая цена, маршрут FROM/TO, даты, packing list |

**Кнопка Send Quote скрыта/недоступна** если продажная цена = 0 или не задана.

**Предупреждение об убытке:** если маржа отрицательная → двойное подтверждение: "You are going to send a quotation at loss — are you sure?"

---

## Публичная Quote Page

Доступна по публичному URL (аналог публичной страницы трекинга):

| Элемент | Описание |
|---------|---------|
| FROM / TO | Маршрут |
| Content | Груз |
| Comments | Комментарий от отправителя |
| Selling price | Детализация цены |
| Validity period | Срок действия |
| Documents | Публичные документы TR |
| [ACCEPT] | Принять котировку |
| [DECLINE] | Отклонить котировку |

После действия клиента кнопки заменяются сообщением: "You accepted this quote (дата и время)" или "You refused this quote (дата и время)".

---

## Email уведомление клиенту

Включает: название партнёра, VAT ID, имя перевозчика, итоговая цена с валютой, срок действия, комментарии, синтез (режим, название TR, FROM, TO, содержимое), кнопки Accept/Decline + ссылка на публичную страницу.

---

## PDF документ котировки

- Генерируется из шаблона transport order document
- Содержит: разбивку cost segments, комментарии, юридические условия, SIRET/VAT/RCS/EORI/Capital
- Логотип 3PL Customer, имя, адрес, email
- Хранится в разделе Documents TR как **PRIVATE**, тип вложения #19 (Quote)
- При повторной отправке — предыдущая версия сохраняется: `QUOTE_YYYYMMDD-HHMM`

---

## Статусы TR (новые)

### Новые группы статусов:

| Группа | Статусы |
|--------|---------|
| **Quote Customer** | Quote Sent, Quote Accepted, Quote Declined |
| **Open** | Поглощает TRs в статусах ON QUOTE или WAITING CONFIRMATION |
| **Closed** | BOOKED (переименован для ясности) |
| **Provisional** | Created (через CTRW форму), Quoted (когда котировка отправлена) |

### Защита при бронировании:

- Если TR в статусе **Quote Sent** → предупреждение: "Customer didn't confirm the quote — are you sure you want to book without validation?"
- После подтверждения → статус → Quote Accepted + запись в чат "QUOTE ACCEPTED BY <user>"
- То же правило для **Quote Declined**

---

## Аудит лог

При каждой отправке котировки создаётся запись: кто отправил, имя документа, email получателя(ей).

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell.send-quotes`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633143329 · **repo:** `tms/buy-sell/send-quotes.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

