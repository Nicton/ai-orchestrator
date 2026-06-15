---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632029319
source_type: confluence
---
# Shipment Detail Rebuild — Переработка страницы перевозки

> Источник требований: REQ-BOOK-037..047 | Слайды: 2026 06 - Shipment rebuild

Масштабная переработка детальной страницы Shipment (June 2026). Новый виджет быстрого обновления статуса, переработанный CO2, разделение чата и логов, Actions Panel с группировкой.

---

## Отображение адреса (REQ-BOOK-037)

- Название локации обрезается до **20 символов**: если > 20 → показывается 17 символов + `...`
- **Hover** на название → показывает полный адрес и Main Contact (имя, email, телефон)
- **Клик** → открывает модальное окно со всеми контактами и действиями:
  - `Update Pick-up/Delivery Location`
  - `Map` (открыть на карте)
  - `Copy` (скопировать адрес)
- Формат адреса: компания, улица, здание, индекс, город, страна

---

## Quick Status Update (REQ-BOOK-038..039)

Клик на **тег статуса** открывает контекстно-зависимую панель быстрых действий.

| Статус | Доступные действия |
|--------|-------------------|
| `PLANNED` / Estimated | Confirm Pick-up, Replan Pick-up |
| `IN_TRANSIT` | Confirm Delivery, Replan Delivery, Add Intermediate Point |

- **Confirm Pick-up** → маркирует отправление из Origin
- **Replan Pick-up** → обновляет ETD
- **Confirm Delivery** → маркирует отправку как доставленную
- **Replan Delivery** → обновляет ETA
- **Add Intermediate Point** → добавляет промежуточную точку треккинга (border crossing и т.д.)

**После подтверждения:**
- Кнопки Confirm/Replan скрываются из CTA (REQ-BOOK-039)
- CTA адаптирован под тип аккаунта: Shipper и Carrier видят разные действия
- Приоритетные 2 действия — прямые кнопки; остальные — в выпадающем `Actions`

---

## Статус Delivered и Upload POD (REQ-BOOK-040)

- После подтверждения доставки статус отображается как `Delivered`
- В статусе `Delivered` основное CTA-действие — **Upload POD**
- Tracking Timeline показывает дату/время фактического прибытия (`Arrival: confirmed date`)
- Кнопки Confirm/Replan Delivery **не отображаются** в статусе Delivered
- Статус `Delivered` с инцидентом → отображается предупреждающий баннер `A`

---

## CO2 Pictogram (REQ-BOOK-041)

| Состояние | Индикатор |
|-----------|----------|
| Нет CO2-данных | Серая иконка CO2 |
| Хотя бы один CO2-элемент заполнен | Зелёная иконка CO2 |

- Клик на иконку → открывает модальное окно с детальными CO2-данными (Jira TMS-2922)
- Ecotransit-баннеры **убраны** из UI — вся информация перенесена в CO2 модал
- CO2 счётчик **не отображается** напрямую на карточке — только индикатор

---

## Actions Panel с группировкой (REQ-BOOK-042)

Все действия сгруппированы по **4 секциям**:

| Секция | Действия |
|--------|---------|
| **EXECUTION & UPDATES** | Confirm Pick-up, Replan Pick-up, Confirm Delivery, Replan Delivery, Add Tracking point, Add Transit points, Share Truck & Driver details |
| **INFORMATION EXCHANGE** | Request/Share metadata, Request/Share document, Request/Upload POD |
| **PRINT & EXPORT** | Print Label, Print CMR |
| **CONFIGURATION** | Change pick-up/delivery location, Edit packing list, Edit Accounting Entity, Add Carrier Tracking, Open a Claim, Cancel Shipment |

- Неприменимые действия **скрыты или задизейблены** (контекстуализация)
- Для отправки в статусе `Incident Reported` → добавляется визуальный индикатор в Actions

---

## Services и Additional Services (REQ-BOOK-043)

- Модал сервисов и доп. сервисов отображается **поверх всех виджетов**
- Сервисы и доп. сервисы доступны для просмотра в rebuilt UI
- **Нет регрессии** по отображению специфик Air/Sea (transit details)
- Сохраняется возможность **редактирования** сервисов через модал

---

## Сжатое отображение доп. информации (REQ-BOOK-044)

- Секция Additional Information сжата по умолчанию
- Детали открываются в маленьком виджете или модальном окне
- Технические баннеры (ecotransit и подобные) **удалены** с главного экрана
- Карточка для Shipper оптимизирована под слежение (follow-up)
- Карточка для Carrier показывает инструкции более заметно

---

## Incident Reported (REQ-BOOK-045)

- При инциденте шапка карточки отображает тег `A Incident Reported` рядом со статусом
- Tracking Timeline показывает событие инцидента как отдельную точку
- Поле `Last event: Xh ago` — время последнего треккинга
- **Collapse/Expand** детальных точек: `Hide Detailed Tracking` / `Show All Tracking Points`
- Кнопка `Show All Tracking Points` → раскрывает все точки включая детальные
- Чат в режиме Incident → история переписки с временными метками

---

## Book A Slot из заголовка (REQ-BOOK-046)

- Действие `BOOK A SLOT (PML)` доступно в заголовке карточки как CTA
- Видно пользователям с соответствующим правом доступа
- Доступно для отправок в статусе `PLANNED`
- Если отправка привязана к группе — это видно на карточке

---

## Разделение чата и логов (REQ-BOOK-047)

Новый переключатель в чате позволяет скрыть системные логи:

```
[Human messages ✓]  [System logs   ]  ← toggle

15:30 — User confirmed pick-up    ← human
14:22 — Shipment status: booked   ← system log (скрываемый)
13:10 — "груз готов к отправке"   ← human
```

- Системные и человеческие сообщения можно разделить визуально
- В режиме `Human messages` видны только реальные переписки (без автологов)
- По умолчанию: все сообщения показаны

---

## Связанные документы

| Документ | Путь |
|----------|------|
| Booking Types | [booking-types.md](booking-types.md) |
| Quick Status Update — Tracking Points | [../features/container-tracking.md](../features/container-tracking.md) |
| CO2 Widget | [../features/co2-widget.md](../features/co2-widget.md) |
| Notifications | [notifications.md](notifications.md) |
| State Machine | [04_state-machine.md](04_state-machine.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.shipment-detail-rebuild`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632029319 · **repo:** `tms/shipments/shipment-detail-rebuild.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

