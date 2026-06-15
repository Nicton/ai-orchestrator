---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553587
source_type: confluence
---
# Чек-лист TMS — OCR (image-only pptx файлы)

> Источник: 8 файлов .pptx с текстом в виде картинок, OCR через Tesseract.js (EN+FR)
> Файлы: Layout Inside Shipment, CO2 widget, Add user phone, Switch Account, Sales CSM Owner, Dashboard screen

---

## REQ-OCR — Активация функций аккаунта

### REQ-OCR-001 — Управление функциями аккаунта (Activated Functions)

**Приоритет:** P0 | **Источник:** 2021 11 - Add user phone.pptx

**Проверки:**
- [ ] Флаг `SLOT BOOKING` включает функционал бронирования слотов — без него кнопка слотов недоступна
- [ ] Флаг `PLANNING / SHIPTI-DOCK` включает страницу Planning для операторов склада
- [ ] Флаг `SHIPPER` переключает аккаунт между Shipper (полный TMS) и не-Shipper режимом
- [ ] Флаг `VISIBILITY` ограничивает аккаунт только просмотром (без бронирования)
- [ ] Флаг `COLLABORATIVE` включает совместный просмотр shipments между аккаунтами
- [ ] Флаг `WAREHOUSE LIMITED VIEW` ограничивает видимость данными конкретного склада
- [ ] Флаг `ORDER VIEW` включает вкладку Orders на детальной странице
- [ ] Флаг `MARKETING` открывает маркетинговые инструменты в Back-Office
- [ ] Флаг `BOOKER USER` — пользователь может создавать заявки от имени другого аккаунта
- [ ] Изменение любого флага требует прав Super User или Admin
- [ ] Временная зона пользователя (`USER TIMEZONE`) корректно применяется к датам и слотам

---

## REQ-OCR — Switch Account (Переключение аккаунтов)

### REQ-OCR-002 — Быстрое переключение аккаунта

**Приоритет:** P1 | **Источник:** 2022 12 - Switch Account UX Adjustment.pptx

**Проверки:**
- [ ] Комбинация `Ctrl+K` открывает модал быстрого переключения аккаунта
- [ ] В модале есть поиск — фильтрация по имени аккаунта в реальном времени
- [ ] Список аккаунтов включает: Dock-аккаунты, Shipper-аккаунты, смешанные типы
- [ ] Переключение аккаунта не требует повторного логина
- [ ] Активный аккаунт отмечен визуально в списке
- [ ] Подсказка "Utiliser [Ctrl]+[K] для быстрого переключения" видна пользователям с доступом к нескольким аккаунтам

---

## REQ-OCR — Dashboard

### REQ-OCR-003 — Вкладки и метрики Dashboard

**Приоритет:** P1 | **Источник:** 2023 08 SAN - Update field in Dashboard screen.pptx

**Проверки:**
- [ ] Dashboard содержит вкладки: AUJOURD'HUI, GENERAL, COTATIONS À SUIVI, SUIVI, FACTURATION, MONITORING, CO2
- [ ] Вкладка GENERAL показывает: количество отправок, расходы (€), среднее время котировки, экономию, Total Linear Meters
- [ ] Фильтры Dashboard: диапазон дат, перевозчик, маршрут From/To, тип пользователя, сущности
- [ ] График "Nombre d'Expéditions" корректно отображает тренд за выбранный период
- [ ] Метрика "Délai de cotation" рассчитывается в часах/минутах
- [ ] Вкладка CO2 доступна при наличии интеграции EcoTransit / DHL API

---

## REQ-OCR — CO2 Widget (Carbon Footprint)

### REQ-OCR-004 — Виджет углеродного следа: источники и поля

**Приоритет:** P1 | **Источник:** 2026 03 - CO2 widget.pptx

**Проверки:**
- [ ] Виджет Carbon Footprint отображает основное значение CO2e в кг
- [ ] Scope отображается как WTW (Well-to-Wheel) — включает добычу и сжигание топлива
- [ ] Дистанция в км отображается рядом с CO2e значением
- [ ] Источник данных показывается: DHL API / EcoTransit / Manual Entry / EcoTransit Benchmark
- [ ] Режим "Compare Sources" показывает данные из нескольких источников одновременно
- [ ] Поле "Manual Entry": Distance (km) — обязательное; CO2e WTW (kg) — обязательное; CO2e TTW (kg) — опциональное
- [ ] При ошибке источника (FAILED) показывается красный бейдж + кнопка "Hide error details" / разворачиваемый лог
- [ ] EcoTransit Benchmark как fallback — показывается если основной расчёт недоступен
- [ ] Переключение между источниками не требует перезагрузки страницы

### REQ-OCR-005 — CO2 Widget: ошибки и edge cases

**Приоритет:** P2 | **Источник:** 2026 03 - CO2 widget.pptx

**Проверки:**
- [ ] "CALCULATION ERROR" от EcoTransit показывается с текстом ошибки и не крашит страницу
- [ ] При недоступности всех источников виджет показывает placeholder, а не пустой блок
- [ ] Manual Entry валидирует: дистанция > 0, CO2e WTW > 0, числовой формат
- [ ] CO2 данные сохраняются на уровне Shipment и не пересчитываются при перезагрузке

---

## REQ-OCR — Shipment Card Layout

### REQ-OCR-006 — Карточка отправки: tracking points и followers

**Приоритет:** P0 | **Источник:** Layout Inside Shipment.pptx

**Проверки:**
- [ ] Карточка Shipment показывает адрес прибытия в верхней части (Arrival Address Line 1)
- [ ] Tracking points отображаются хронологически с датой, статусом и местом
- [ ] Статус-бейджи на TP: "Picked Up", "Damaged Cargo", "Waiting Tracking", "Planned Arrival", "Delivered" — каждый с уникальным цветом
- [ ] TP с задержкой показывает "N day(s) late" прямо на бейдже
- [ ] Кнопка "Click here to remind [CarrierName]" видна на TP в статусе Waiting Tracking
- [ ] Секция Followers показывает аватары первых 3 followers + кнопку "Add (N)"
- [ ] Followers: имя + иконка аккаунта видна при hover
- [ ] Карточка корректно отображается для Shipper, Carrier и Spectator (с ограничениями)

---

## REQ-OCR — Back-Office управление аккаунтами

### REQ-OCR-007 — Sales / CSM Owner и статус аккаунта

**Приоритет:** P1 | **Источник:** 2023 01 - Sales CSM Owner.pptx

**Проверки:**
- [ ] В Back-Office у каждого аккаунта назначается Sales Owner (выпадающий список сотрудников)
- [ ] CSM (Customer Success Manager) назначается аналогично — отдельное поле
- [ ] Статусы аккаунта: PENDING, FREEMIUM, PAYING, TEST, CHURN — переключаются только Super User
- [ ] Galaxy: поле "Managed by [ID]" корректно заполняется при создании через Galaxy
- [ ] "Billing account" линкуется с аккаунтом — обязательно для PAYING статуса
- [ ] Carrier Owner назначается отдельно от Shipper Owner

---

## REQ-OCR — Пользователь: телефон и временная зона

### REQ-OCR-008 — Добавление телефона пользователя

**Приоритет:** P1 | **Источник:** 2021 11 - Add user phone.pptx

**Проверки:**
- [ ] Поле "Phone" добавлено в профиль пользователя в Admin-App
- [ ] Временная зона пользователя (`USER TIMEZONE: +01:00, Europe/Paris`) сохраняется и применяется ко всем датам в UI
- [ ] При смене временной зоны — существующие даты пересчитываются автоматически
- [ ] Source ("SOURCE: SPONSORED BY:") отображает реферальный аккаунт (если есть)

---

## Итоговая статистика OCR чек-листа

| REQ-ID | Домен | Items | Источник |
|--------|-------|-------|---------|
| REQ-OCR-001 | Account Functions | 11 checks | Add user phone |
| REQ-OCR-002 | Switch Account | 6 checks | Switch Account UX |
| REQ-OCR-003 | Dashboard | 6 checks | Dashboard SAN |
| REQ-OCR-004 | CO2 Widget | 9 checks | CO2 widget |
| REQ-OCR-005 | CO2 Edge Cases | 4 checks | CO2 widget |
| REQ-OCR-006 | Shipment Card | 8 checks | Layout Inside Shipment |
| REQ-OCR-007 | BO Account Mgmt | 6 checks | Sales CSM Owner |
| REQ-OCR-008 | User Profile | 4 checks | Add user phone |
| **ИТОГО** | | **54 checks** | **8 OCR файлов** |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.16_checklist-tms-ocr`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632553587 · **repo:** `tms/shipments/16_checklist-tms-ocr.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

