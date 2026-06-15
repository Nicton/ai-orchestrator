---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633012306
source_type: confluence
---
# Локации (Locations)

## Что это

Локация — физическое место: склад, терминал, адрес клиента, точка pick-up или delivery. Это фундамент маршрутизации: каждая заявка (SR/QR) использует локации как "откуда" и "куда".

**URL:** `/locations` / `/locations/{id}`
**Frontend:** `workspaces/frontend/public/app/locations/`

---

## Список локаций

### Что видит пользователь

| Колонка | Описание |
|---------|---------|
| Название | Имя локации |
| Адрес | Улица, город, страна |
| Тип | Warehouse / Customer / Hub / Gate |
| Партнёры | Связанные компании |
| Активность | Активная / Неактивная |

---

## Страница деталей локации (8 табов)

**URL:** `/locations/{id}/[tab]`

| Таб | URL | Содержимое |
|-----|-----|-----------|
| General | `/general` | Адрес, контакты, основные настройки |
| Management | `/management` | Управление: ответственные лица |
| Partners | `/partners` | Связанные shipper'ы и carrier'ы |
| Settings | `/settings` | Настройки уведомлений и доступа |
| Customer View | `/customer` | Вид для внешних клиентов |
| Statuses | `/statuses` | Кастомные статусы для этой локации |
| Zones | `/zones` | Зоны внутри склада |
| Slot Configuration | `/slot` | Настройка тайм-слотов |
| Slot Validation | `/slot-validation` | Правила валидации слотов |
| Constraints | `/constraints` | Ограничения (вес, высота, тип транспорта) |
| Calendar | `/calendar` | Рабочий календарь (выходные, праздники) |
| Data Fields | `/data-fields` | Кастомные поля для этой локации |
| Display Settings | `/display` | Настройки отображения |

---

## Таб "Slot Configuration" — ключевой для слотов

Здесь настраивается логика слотов на этой локации:

| Поле | Описание |
|------|---------|
| Slot duration | Длительность одного слота (мин) |
| Working hours | Часы работы (откр./закр.) |
| Dock doors | Список ворот (DockDoor) |
| Capacity per slot | Максимум машин в один слот |
| Buffer time | Буфер между слотами |
| Auto-confirm | Автоподтверждение слотов |
| Advance booking | За сколько дней можно бронировать |

---

## Действия

| Действие | Что происходит | Кто может |
|----------|---------------|-----------|
| Добавить локацию | `/locations/add` → форма создания | Admin, Shipper |
| Редактировать | Изменение данных любого таба | Admin, Shipper |
| Добавить контакт | Добавляет пользователя к локации | Admin |
| Добавить зону | Создаёт зону внутри локации | Admin |
| Добавить dock door | Новые ворота для слотов | Admin |
| Деактивировать | Локация перестаёт быть доступна в wizard | Admin |

---

## Как локации влияют на работу системы

```
Локация используется в:
  ├── CSW Wizard → поле "Pick-up location" и "Delivery location"
  ├── Slot Configuration → на этой локации появляются слоты
  ├── Calendar → учитывается при планировании дат
  ├── Zone → влияет на сортировку слотов и dock doors
  └── Partners → определяет, кто видит эту локацию
```

---

## Мутации (создание локации)

**Внутренние:**
- `Location` создаётся
- `DockDoor[]` создаются (если заданы ворота)
- `LocationZone[]` создаются
- `SlotConfiguration` создаётся

**Внешние:**
- Peripass интеграция (если gate management): `app/services/integration/peripass/` → синхронизация ворот

---

## My Sites (личные склады)

**URL:** `/my-sites`

Упрощённый вид: только "мои" локации для быстрого доступа в wizard.

---

## Backend

- `app/services/locations.js` — все операции с локациями
- `app/models/location.js`, `app/models/dock_door.js`, `app/models/location_zone.js`
- Peripass: `app/services/integration/peripass/` — gate management синхронизация
- Frontend: `workspaces/frontend/public/app/locations/`

---

## 🔗 Граф-метаданные
- **id:** `tms.master-data.01_locations`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633012306 · **repo:** `tms/master-data/01_locations.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

