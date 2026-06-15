---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629080073
source_type: confluence
---
# Templates — шаблоны перевозок, шаринг, группы

> Сверено с кодом 2026-06-13 | `models/shipment_template*.js`, `services/templates.js`, `shipment-templates.js`, `template_sharing.js`, routes `template_groups.js`, `shipment_templates.js`, `template_sharing.js`

## Зачем (бизнес-контекст)

Шиппер возит одни и те же маршруты десятки раз в неделю. Шаблон — это **снимок конфигурации перевозки** (маршрут, режим, перевозчик, груз, обязательные MD), из которого новая заявка создаётся в один клик. Шаринг шаблона решает обратную задачу: дать **внешнему партнёру или перевозчику** забронировать по готовому шаблону, не давая доступ в систему. Группы шаблонов объединяют их для пакетных/еженедельных операций (recurring booking).

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Шаблон | `shipment_template.js` | name_template, shipper/carrier, from/dest_address, total_cost, has_mode_*, duration, tag_color |
| Группа | `shipment_template_group.js` | name, code, **is_weekly**, **pre_booking**, **auto_confirm** |
| Шаринг | `shipment_template_sharing.js` | token, followers (emails), **direct_to_carrier** (TRUE = перевозчик бронирует сам), notify_email, **can_create_location** |
| Bookers/Spectators | `shipment_template_booker.js`, `_spectator.js` | аккаунты с правом бронировать / смотреть |
| Контент/цены/MD | `_contents.js`, `_price_details.js`, `_metadata_request.js` (is_required) | строки груза, ставки, обязательные поля |

Запуск шаблона → создание заявки: `POST /shipment-templates/:id/run`. Шаринг создаёт SR/QR от имени владельца через middleware подмены booker-аккаунта (`template_sharing.js`).

## Где найти и настроить (UI)

| Что | Роут | Контроллер |
|-----|------|-----------|
| Список шаблонов | `/shipment-templates` | ShipmentTemplatesCtrl (право `tp_templates`) |
| Создать/из перевозки | `/shipment-templates/add`, `.../{id}` | NewShipmentTemplateCtrl |
| Группы шаблонов | `/template-groups` | право `accessManageRoutines` (`tp_routines`) |
| Дублировать группу | `/template-groups/{id}/duplicate` | DuplicateTemplateGroupCtrl |

Шаринг: на шаблоне → «Share» → ссылка с token; флаг **Direct to Carrier** определяет, бронирует ли перевозчик напрямую или заявка идёт владельцу.

## Сценарии

1. **Еженедельный маршрут**: создать группу (is_weekly + auto_confirm) → шаблоны выполняются по расписанию без ручного ввода.
2. **Партнёр без аккаунта бронирует**: расшарить шаблон с direct_to_carrier=true → партнёр по ссылке создаёт заявки в рамках заданных маршрута/груза.
3. **Стандарт для команды**: шаблон с обязательными MD → все заявки из него имеют заполненные кастомные поля.

---

## 🔗 Граф-метаданные
- **id:** `tms.templates`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629080073 · **repo:** `tms/templates/README.md`
- **code_refs:** `backend/app/services/templates.js`, `shipment-templates.js`, `template_sharing.js`, `models/shipment_template*.js`, `routes/api/{template_groups,shipment_templates,template_sharing}.js`, `frontend/public/app/{shipment-templates,template-groups}`
- **modules:** TMS, Buy&Sell (sharing→partners)
- **references:** `tms.metadata`, `tms.followers`, `tms.shipments`
- **requirements:** REQ-BOOK-001..005 (частично, Repeat/templates); прочее — реализовано без требований
