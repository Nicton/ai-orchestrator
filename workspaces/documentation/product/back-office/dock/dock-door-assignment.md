---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632684545
source_type: confluence
---
# Dock Door Assignment — Назначение ворот

Новый вид в Dock для управления назначением слотов на конкретные ворота (Dock Doors) через drag-and-drop.

> Источники: `2026 05 - Dock Door assignment screen`, `2026 05 - Dock Door specificities (WIP)`

---

## Assignment View

### Интерфейс

```
Dock Door View:
  X-ось: время (шаг 30 минут)
  Y-ось: Dock Doors (ворота)

  [DR 1] ──[slot 09:00-11:00]─────────────
  [DR 2] ──────────[slot 11:30-13:00]─────
  [DR 3] ──[slot 09:00-11:30][slot 12:00] ← OVERLAPPING → оранжевый
  
  [Unassigned Tray]  (12 не назначено)
    - DO-001: 09:00-11:00 (2h) / 4 паллеты
    - ...
```

### Цветовая кодировка

| Цвет | Статус |
|------|--------|
| Белый | Planned |
| Светло-голубой | Ongoing |
| Светло-зелёный | Closed |
| **Оранжевый** | Overlapping slots (на одних воротах) |

### Правила

- Снapping: к плановому времени слота
- Перепланирование: **невозможно** из этого вида (только назначение)
- Слоты с аномальным статусом: **скрыты полностью**

### Unassigned Tray

Панель внизу с не назначенными слотами:
- Счётчик не назначенных слотов
- Формат времени: "09:00 - 11:00 (2h)"

---

## Dock Door Specificities — Характеристики ворот

Новый справочник **BO > Dico > Dock-specificities**.

### Поля

| Поле | Тип |
|------|-----|
| id | Integer |
| name | String (с i18n ключом) |

### Предустановленные значения (seeded)

- **ADR** — опасные грузы
- **Side loading** — боковая загрузка
- **Temperature controlled** — температурный контроль
- **Bulk** — навалочный груз

### Настройка

**My Settings** → новая карточка "Dock Door Specificities":
- Видна только для Dock аккаунтов
- Скрыта для TMS аккаунтов
- Компонент: Metadata Prototypes (левая панель = Disabled, правая = Active)

Характеристики привязываются к воротам через теговые чипы в настройках Dock Door.

---

## URL

```
app.blu.shiptify.com/slotify/load/YYYY-MM-DD  ← Load module планирование
```

---

## 🔗 Граф-метаданные
- **id:** `back-office.dock.dock-door-assignment`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632684545 · **repo:** `back-office/dock/dock-door-assignment.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

