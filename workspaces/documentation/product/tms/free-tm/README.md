---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631341175
source_type: confluence
---
# FreeTM / TM Light — Облегчённый TMS

> 🧭 Контур: FreeTM — инструмент **Back-Office-контура** (онбординг/фримиум-воронка), а не основной TMS. В Confluence страница перенесена под «Back-Office — Внутренние инструменты» (2026-06-12).

**FreeTM** (также: TML, TM Light) — бесплатный/облегчённый тир Shiptify TMS для пользователей с базовыми потребностями в управлении перевозками.

> Источники: слайды `2025 12 - TM Light feedback`, `2026 02 - FreeTM 0.2`

---

## Отличия от полного TMS

| Параметр | FreeTM (TML) | Полный TMS |
|---------|-------------|-----------|
| Название модуля | **BOOK** | TM |
| Под-действия | Book a Transport + Book a Slot | Нет разделения |
| Master Data | Скрыт | Доступен |
| Режимы | Road + Air + Sea | Все |
| Mode toggle | Скрыт если только 1 режим | Всегда виден |

---

## Навигация BOOK модуля

В FreeTM модуль **TM** переименован в **BOOK** и разделён на:
- **Book a Transport** — создание перевозки
- **Book a Slot** — бронирование слота на складе

---

## Флоу создания заявки

```
Нажатие BOOK:
  ├── [NO CUSTOMER] → Booking CSW напрямую (BK CSW)
  └── Выбор 3PL Customer → TR CSW
```

Кнопка **NO CUSTOMER** пропускает экран выбора клиента и открывает классический Booking CSW.

---

## Фильтры списка слотов (новые)

Кнопки быстрого доступа заменяют стандартный фильтр по дате:

| Кнопка | Логика |
|--------|--------|
| TO BOOK | BOOK_LATER=TRUE и дата >= сегодня - 1 день |
| TODAY | Слоты на сегодня |
| NEXT 3 DAYS | Сегодня < дата < сегодня + 2 дня |
| THIS WEEK | Текущая Пн-Вс неделя |
| NEXT WEEK | Следующая Пн-Вс неделя |
| UPCOMING | После следующей недели |
| PAST | Дата < сегодня (обратная хронология) |
| ALL SLOTS | Все слоты (обратная хронология) |

**TO BOOK** показывается только если есть хотя бы 1 такой слот.
Состояние фильтра сохраняется при навигации и после переподключения.

---

## Флоу приглашений

Кнопка "Invite Colleague" открывает модал с тремя опциями:

| Кнопка | URL | Кто может |
|--------|-----|----------|
| COLLEAGUE | /self-admin | Все пользователи |
| CARRIER | /self-admin/carrier/users | Только Admin |
| PARTNER | /partners | Только Admin |

Для не-admin: кнопки CARRIER и PARTNER серые с меткой "ADMIN ONLY".

---

## Изменения в меню

**Добавлено внизу левого меню (только Admin):**
- `Manage Account` — в модулях TM, Slots, Dock, Pay
- `Dock Settings` — только в модуле Dock (первым, выше Manage Account)

**Убрано из правого верхнего меню:** оба пункта выше.

---

## Выбор перевозчика в CSW (FreeTM)

- Master Data (MD) убран с экрана выбора перевозчика
- При вводе email нового перевозчика: скрывается панель "select carrier", появляются поля FirstName, Name, Language
- Shipment Card перемещена в левую часть экрана 2 CSW
- Кнопка SAVE удалена с экрана 2 CSW

---

## CSR Admin задачи (время выполнения)

| Задача | Время |
|--------|-------|
| Разблокировать заблокированный аккаунт | 1 мин |
| Новый Carrier создан Shipper | 4 мин |
| Новый Slotbook Shipper | 3 мин |
| Новый Slotbook Carrier | 3 мин |
| Mail in Black (разблокировка) | 1 мин |

---

## 🔗 Граф-метаданные
- **id:** `tms.free-tm`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631341175 · **repo:** `tms/free-tm/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

