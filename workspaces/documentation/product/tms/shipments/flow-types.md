---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632324211
source_type: confluence
---
# Flow Types — Типы создания и отправки перевозок

Таксономия всех способов создания и отправки перевозки в Shiptify TMS.

> Источник: слайд `2026 01 - Flow Types`

---

## Creation Types — Типы создания (10 кодов)

| Код | Название | Описание | Режимы |
|-----|---------|---------|--------|
| **SC** | Standard Creation | Shipper заполняет CSW вручную | Все |
| **TC** | Template Creation | CSW предзаполнен из шаблона; заполняются только нужные поля | Все |
| **TT** | Token Template Creation | Внешний партнёр создаёт из выделенной ссылки (без логина) | Все |
| **BFM** | Book For Me | Внешний партнёр создаёт через бесплатный аккаунт Shiptify (с логином) | Все |
| **RC** | Repeat Creation | Клик REPEAT на существующем Booking → CSW с теми же данными | Все |
| **FW** | Forward Creation | Клик REPEAT → Booking с точкой B→XXX, груз тот же | Все |
| **TB** | Throwback Creation | Клик REPEAT → Booking с точкой B→A, груз тот же | Все |
| **RO** | Routine | Только Road | Road |
| **APIC** | API Creation | Booking создаётся через API | Все |
| **PDFAI** | PDF AI | Shipper загружает PDF → AI предлагает данные в AI UI | Все |
| **TAI** | Text AI | Shipper вставляет текст → AI предлагает данные в AI UI | Все |
| **TRC** | Transport Request Generated | Booking создаётся из TR (только Buy & Sell) | Все |

---

## Booking Types — Типы отправки (7 кодов)

| Код | Название | Описание | Режимы |
|-----|---------|---------|--------|
| **DB** | Direct Booking | Shipper выбирает 1 перевозчика → подтверждение | Air/Sea/Road |
| **QR** | Quote Request | Несколько перевозчиков → котировки → выбор лучшей | Air/Sea/Road |
| **ADB** | Automated Direct Booking | ERP/WMS отправляет данные напрямую → перевозчик подтверждает | Air/Sea/Road |
| **SADB** | Semi Automated Direct Booking | ERP/WMS отправляет → Shipper проверяет и выбирает перевозчика | Air/Sea/Road |
| **LCI** | Label Creation Indirect | Создание этикетки через Teliae (Express/Parcel) | Express/Parcel |
| **LCD** | Label Creation Direct | Создание этикетки напрямую через Express | Express |
| **FR** | First Responder | Несколько перевозчиков + максимальная цена → первый перевозчик ниже лимита получает заказ автоматически | Air/Sea/Road _(в разработке)_ |

---

## Детали ключевых типов

### SC — Standard Creation
- Shipper заполняет CSW вручную
- Add-ons: Templates, Token Template, Book for Me
- Enhancement: Easier CSW
- Польза: быстрее email, нет пропущенных данных

### TC — Template Creation
- Предзаполненный CSW из шаблона
- Add-ons: Token Template, Book for Me
- Enhancement: UI для создания/редактирования шаблонов (6-летний долг)
- Польза: ультрабыстро, стандартизация, совместимость с transport plan

### QR — Quote Request
- Несколько перевозчиков отвечают котировками в стандартном формате
- Shipper выбирает предпочтительного → как Direct Booking
- Enhancement: несколько котировок от одного перевозчика, лучший UI сравнения, QR без точных дат
- Польза: быстрее чем email каждому перевозчику, реактивность

### FR — First Responder _(в разработке)_
- Shipper выбирает несколько перевозчиков + максимальная стоимость (публичная или нет)
- Первый перевозчик ниже максимальной стоимости получает бронирование автоматически
- Польза: самый быстрый способ получить перевозчика по заданной цене

### TRC — Transport Request Generated (Buy & Sell)
- Booking создаётся из TR (Transport Request) в Buy & Sell-аккаунте
- Требования: Add-on Transport Plan + Rates Management
- Польза: минимальные ручные действия, трассируемость (Sell & Buy link), расчёт маржи на уровне TR

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.flow-types`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632324211 · **repo:** `tms/shipments/flow-types.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

