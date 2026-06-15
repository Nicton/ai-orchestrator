# Slot Booking — BLU App

## Цвета слотов в календаре (week view)

При бронировании слота шиппер видит calendar с временными плашками двух цветов:

| Цвет | CSS-класс | Что означает |
|---|---|---|
| **Серый/белый** | (нет класса) | Обычный доступный слот |
| **Светло-оранжевый** | `--orange-semi` | Принудительно открытый слот (`isForcedAvailable = true`) |
| **Яркий оранжевый** | `--orange` | Принудительный слот + выбран пользователем |
| **Голубой** | `--blue` | Обычный слот, выбран |
| **Disabled** | `--disabled` | Недоступен (нет мест / зона закрыта) |

---

## Что такое "принудительно открытый" слот (isForcedAvailable)

Слот становится `isForcedAvailable = true` когда:
- Слот **нормально недоступен** (по правилам склада/зоны)
- Но пользователь имеет permission **`can_force_slot`** (обычно менеджер склада/PML-оператор)

В этом случае слот показывается оранжевым вместо серого/заблокированного.

---

## Причины, по которым слот становится недоступным (и может быть принудительно открыт)

| Причина | Условие |
|---|---|
| **Вместимость превышена** | Загруженность дока > 100% (fillRate > rate) |
| **Зона закрыта** | Время слота вне рабочих часов зоны |
| **Лимит поставок на слот** | Достигнут `range_per_slot` (макс. число грузовиков) |
| **Лимит погонных метров** | Груз > `linear_meter_per_slot` |
| **Время в прошлом** | Слот уже прошёл по текущему времени |
| **Вне окна бронирования** | Дата раньше min или позже max разрешённого периода |

### Жёсткие ограничения (нельзя принудить даже с `can_force_slot`)
- `lockMinTime` / `lockMaxTime` — хард-лок временного диапазона, заданный складом.

---

## UX при выборе принудительного слота

1. Слот отображается **оранжевым** с предупреждением: `"95% of standard capacity"`
2. Кнопка "Next" **заблокирована** — пользователь должен явно подтвердить перегруз
3. После подтверждения бронирование проходит

---

## Технические детали

| Что | Где |
|---|---|
| Логика `isForcedAvailable` | `frontend-mono/.../helper/slotify.js` lines 608–617 |
| `canForceSlot` из permissions | `frontend-mono/.../slotify-calendar/week-day.directive.js` lines 50–51 |
| CSS классы цветов | `mfe-layout/.../styles/clean/components/_c-day-week-selection.scss` |
| ng-class в шаблоне | `frontend-mono/.../slotify-calendar/week-day.html` lines 4–9 |
| Alert с % загруженности | `frontend-mono/.../slotify-calendar/slotify-calendar.html` lines 86–90 |
| Блокировка кнопки Next | `frontend-mono/.../create-book-slot/controllers/book-slot.js` lines 463–476 |
| Расчёт fillRate (backend) | `backend/app/services/slotify.js` lines 2904–2927 |
| Permission `can_force_slot` | `backend/app/models/user.js` lines 511–551 |
