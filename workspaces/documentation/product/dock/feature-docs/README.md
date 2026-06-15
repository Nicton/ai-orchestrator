---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632291345
source_type: confluence
---
# DOCK Feature Docs — индекс

> Обновлено 2026-06-12: +5 модулей по комментариям Product (слоты как сущность, настройки PML, валидация, CSV-импорт, Load view).

## Ядро

| Папка | Что покрывает | REQ |
|-------|---------------|-----|
| 🆕 [slots-core/](slots-core/README.md) | **Слот как бизнес-сущность** (общее TMS+DOCK): зачем, duration-алгоритм с примерами, capacity, cargo-типы, 17+10 статусов с обоснованием и матрицей акторов | — |
| 🆕 [pml-settings/](pml-settings/README.md) | **Настройки PML**: 3 уровня (площадка/зона/календарные исключения), все ограничители зоны, правила бронирования, реплан/отмена-окна, санкции | — |
| 🆕 [slot-validation/](slot-validation/README.md) | Валидация броней: whitelist, очередь pending → approved/declined, кто влияет | — |
| 🆕 [csv-uploads/](csv-uploads/README.md) | Массовый импорт слотов/заказов (схемы v1/v2, ошибки построчно), вложения к визитам | — |
| 🆕 [load-view/](load-view/README.md) | Тепловая карта загрузки (зоны×часы), сценарии чтения, связь с Assignment View | — |

## Платформенные и новые модули (2026-06-12, вторая волна)

| Страница | Что покрывает |
|----------|---------------|
| 🆕 [dock-center/](dock-center/README.md) | Главный экран /dock: Last Slot, Inbound, Outbound, Updates |
| 🆕 [tv-display/](tv-display/README.md) | Режим табло: Upcoming/Delayed/Current/Completed |
| 🆕 [zones/](zones/README.md) | Зона vs dock door, поля, управление |
| 🆕 [external-partners/](external-partners/README.md) | Партнёры площадки, контакты carrier (1 max), My partners — условия появления |
| 🆕 [order-management/](order-management/README.md) | CRUD заказов, CSV-парсер, Order Tags (цвет/тип) |
| 🆕 [cargo-dgd/](cargo-dgd/README.md) | Cargo types/groups/DGD + интеграция Back-Office |
| 🆕 [platform/managed-accounts.md](platform/managed-accounts.md) | Как managed account влияет на систему |
| 🆕 [platform/auth-management.md](platform/auth-management.md) | DockPermissions: кто что может |
| 🆕 [platform/drivers-and-sms.md](platform/drivers-and-sms.md) | Slot drivers (is_checked) + SMS (языки, 149 симв.) |
| 🆕 [platform/emailing.md](platform/emailing.md) | Email-события брони (msg-email, шаблоны) |
| 🆕 [platform/localization.md](platform/localization.md) | Языки гостя/пользователя, Tolgee |
| 🆕 [platform/webhooks-dock.md](platform/webhooks-dock.md) | 6 DOCK-событий для внешних систем |
| 🆕 [slot-sharing.md](slot-sharing.md) | Статус: не реализовано (близкие механизмы перечислены) |

## Модули

| Папка | Что покрывает | REQ |
|-------|---------------|-----|
| [dock-doors/](dock-doors/README.md) | Ворота, зоны, specificities (informational) | DOCK-001..005 |
| [dock-orders/](dock-orders/README.md) | Заказы: листинг, **статусы с механикой переходов (вкл. авто-MISSING_SLOT)**, multi-client buyer/seller, CSV/API V2 | DOCK-016..020, 024..025 |
| [master-location/](master-location/README.md) | Master Location | — |
| [partner-db/](partner-db/README.md) | Partner DB: роли, видимость | DOCK-021..023 |
| [planning/](planning/README.md) | Planning: **Week/Board/Load/Assignment — что для чего**, tracking points | DOCK-006..010 |
| [slot-booking/](slot-booking/README.md) | Бронирование, динамическое именование, Same as PML | SLOTIFY-008..012, 016..017 |
| [slotify/](slotify/01_booking-flow.md) | Slotify booking flow | — |
| [slotify-ui3/](slotify-ui3/README.md) | Slotify UI 3.0/3.1 | SLOTIFY-001..007, 013..015 |
| [visits-management/](visits-management/README.md) | **Визит как сущность** (модель, жизненный цикл, gate-only), статусы, TP API, Manual Mode | DOCK-011..015, 026..028, SLOTIFY-018 |

Аудит-вопросы: [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (обновлён 2026-06-12 ответами Product).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632291345 · **repo:** `dock/feature-docs/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

