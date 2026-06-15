---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553571
source_type: confluence
---
# Чек-лист: RATE SHEETS + TRACKING + NOTIFICATIONS

> Источник: слайды + код Shiptify TMS

> Формат: каждый пункт = тестируемое поведение с проверками

---


## RATE SHEETS + TRACKING + NOTIFICATIONS


### REQ-RS-001 — Структура Rate Sheet на базе LOCODE: включить переключатель LOCODE при создании RS

**Приоритет:** P0 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 7–10


**Проверки:**
- [ ] Переключатель LOCODE-based отображается только для транспортных режимов SEA, RAIL, AIR/SEA, RORO, River
- [ ] По умолчанию переключатель выключен (LOCODE not enabled)
- [ ] При включении LOCODE-режима активируется особая логика расчёта и отображения SRS
- [ ] В синтезе RS отображается признак «структура на базе LOCODE»

### REQ-RS-002 — Десять типов Sub Rate Sheet (SRS) для режима SEA FREIGHT на базе LOCODE

**Приоритет:** P0 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 2, 18


**Проверки:**
- [ ] From LOCODE to POL (Pre-carriage Type) — сегмент затрат Pre-carriage
- [ ] POL to POD (Freight, Surcharges Type) — сегмент затрат Freight
- [ ] From POD to LOCODE (Post-carriage Type) — сегмент затрат Post-carriage
- [ ] Origin LOCODE FLAT FEE (Export Customs Type) — id 9
- [ ] Destination LOCODE FLAT FEE (Import Customs Type) — id 18
- [ ] POLPOD LOCODE/COUNTRY (THC Origin/Destination structure type)
- [ ] Origin LOCODE/COUNTRY to POL (Origin charges structure type)
- [ ] Destination POD to LOCODE/COUNTRY (Destination charges structure type)
- [ ] Lead Time structure (From LOCODE to LOCODE)
- [ ] При создании SRS тип выбирается первым; SHORT NAME и COST SEGMENT предзаполняются автоматически

### REQ-RS-003 — Логика сборки Rate Sheet: пошаговый алгоритм поиска маршрута по LOCODE

**Приоритет:** P0 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 3–5, 58–64


**Проверки:**
- [ ] Шаг 1: определить LOCODE происхождения и назначения отправки
- [ ] Шаг 2: найти все Pre-carriage маршруты FROM LOCODE → POL и Post-carriage маршруты POD → TO LOCODE
- [ ] Шаг 3: построить все возможные пары POLPOD (lanes) из шагов 1–2
- [ ] Шаг 3.1: искать записи FREIGHT POLPOD по всем парам POLPOD
- [ ] Шаг 3.2: применять Export Custom по FROM LOCODE или FROM Country
- [ ] Шаг 3.3: применять Import Custom по TO LOCODE или TO Country
- [ ] Применять THC, Origin/Destination Charges по соответствующим сегментам
- [ ] Если начало/конец — PPL TYPE 1, POL/POD извлекаются напрямую из локации, без Pre/Post-carriage

### REQ-RS-004 — Приоритет LOCODE над Country при поиске в SRS

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 19–21, 29, 31, 33


**Проверки:**
- [ ] Если в строке указаны и LOCODE, и Country — использовать только LOCODE для поиска
- [ ] Country является менее точным критерием и применяется только при отсутствии LOCODE
- [ ] В структуре THC поддерживаются комбинации: POL/POD, POL/Country, Country/POD, Country/Country
- [ ] Приоритет гранулярности: POL-POD > POL-Country > Country-POD > Country-Country

### REQ-RS-005 — Валидация импорта данных SRS: обязательные и опциональные поля

**Приоритет:** P0 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 20, 22, 24, 26, 28, 30


**Проверки:**
- [ ] FROM LOCODE или FROM COUNTRY — обязательно (минимум одно из двух)
- [ ] TO LOCODE — обязательно; валюта проверяется по референциалу (ISO3)
- [ ] DGD: если пусто при импорте — заполнить как NO
- [ ] UN: если пусто — оставить пустым; если DGD=NO и UN заполнен — очистить UN
- [ ] Значение 0 = услуга БЕСПЛАТНАЯ; пустое поле = услуга НЕ ПОКРЫТА перевозчиком
- [ ] Проверку соответствия LOCODE стандарту не выполнять
- [ ] Rate per W/M и Min Fee — опциональны; строка без значений от MIN FEE до Internal Key не имеет смысла

### REQ-RS-006 — Правило округления W/M (Chargeable Weight) в SRS

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 80–82


**Проверки:**
- [ ] WM round = 1: округлять вверх до целого (2.1 → 3)
- [ ] WM round = 0.1: округлять вверх до одного знака после запятой (2.18 → 2.2)
- [ ] WM round = 0.01: округлять вверх до двух знаков (2.1885 → 2.19)
- [ ] Если WM round не указан — использовать точное значение W/M без округления
- [ ] Округлённый W/M умножается на Rate per W/M
- [ ] MIN FEE проверяется после расчёта: если результат < MIN FEE — применять MIN FEE

### REQ-RS-007 — Обработка опасных грузов (DGD/UN) в Rate Sheet

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 76–79


**Проверки:**
- [ ] На уровне RS — переключатель «Hazardous Goods accepted»; если NO — строки DGD=YES игнорируются
- [ ] DGD=YES без UN: SRS совместима со всеми кодами UN
- [ ] DGD=YES с одним UN: SRS валидна только для этого UN
- [ ] DGD=YES с несколькими UN: SRS валидна для каждого из указанных UN
- [ ] Если в SRS содержатся строки DGD=YES, а RS не помечен как Hazardous — RS не применяется для DGD-отправок

### REQ-RS-008 — Структура Lead Time в SRS: поля и правила заполнения

**Приоритет:** P2 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 14, 41


**Проверки:**
- [ ] Поля: From LOCODE, To LOCODE, LCL Lead Time (D2D), FCL Lead Time (D2D)
- [ ] Дополнительные поля: Free days POL, Free days POD, Shipping line (для отображения в tooltip)
- [ ] Значения Lead Time — только целые числа (INTEGER), десятичные не допускаются
- [ ] В первой фазе Lead Time отображается без указания POL/POD

### REQ-RS-009 — Правила RS для отправок с несколькими контейнерами

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 40–48


**Проверки:**
- [ ] Несколько контейнеров одного типа: результат умножается на количество
- [ ] Несколько типов контейнеров: RS должна покрывать все типы — иначе RS не применяется
- [ ] При нескольких типах: расчёт выполняется параллельно для каждого типа, результаты суммируются
- [ ] Группировка FCL: 20' — все ISO-типы 20/22; 40' — все ISO-типы 42/45/L5
- [ ] В правилах RS задаются MIN/MAX по весу (KGS) и объёму (M3) отдельно для 20' и 40'
- [ ] Для LCL задаются MIN/MAX по W/M и коэффициент CW (по умолчанию 1000 для SEA)

### REQ-RS-010 — Влияние инкотермов на применение сегментов затрат Rate Sheet (TMS-397)

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 49–55; User Guide _ Incoterm effect.txt


**Проверки:**
- [ ] При отправке DOOR-to-DOOR (Address → Address): обязательны Pre-carriage, Post-carriage, Freight
- [ ] Selling F (Address → PPL POL): обязателен только Pre-carriage; Freight, Post-carriage, Import Custom исключаются
- [ ] Selling C (Address → PPL POD): обязательны Pre-carriage + Freight; Post-carriage, Import Custom, Dest Charges исключаются
- [ ] Buying F (PPL POL → Address): обязательны Freight + Post-carriage; Pre-carriage, Export Custom, Origin Charges исключаются
- [ ] Buying C (PPL POD → Address): обязателен только Post-carriage; Pre-carriage, Freight, Origin THC и Export Custom исключаются
- [ ] В перспективе: автоматическое исключение сегментов затрат на основе инкотерма (INCOTERM epic)

### REQ-RS-011 — Shiptify Internal Key: маппинг колонок FCL на типы контейнеров

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 83


**Проверки:**
- [ ] Пользователь определяет SHIPTIFY INTERNAL KEY в заголовке колонки — маппинг на тип контейнера
- [ ] Колонки Internal Key всегда размещаются после RATE PER W/M
- [ ] Повторное использование одного и того же Internal Key в одном файле — отклонять с ошибкой «Same container used multiple times»
- [ ] Все заголовки приводить к UPPERCASE для исключения ошибок регистра и диакритики
- [ ] Значение в ячейке = стоимость за один контейнер данного типа

### REQ-RS-012 — Шаблон SRS: возможность скачать и загрузить формат

**Приоритет:** P2 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 15–16


**Проверки:**
- [ ] При первом создании SRS (данных нет) — кнопка GET TEMPLATE FORMAT для скачивания шаблона
- [ ] После загрузки данных — возможность скачать SRS вместе с данными
- [ ] Формат поддерживает разделители десятичных знаков «.» и «,»
- [ ] Значения могут содержать до 2 знаков после запятой

### REQ-RS-013 — Ретро-консолидация: API назначения Financial Group ID к отправкам

**Приоритет:** P0 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 6–7


**Проверки:**
- [ ] PUT /shipments/Financialconsolidation/{id} — назначить группу по Shipment ID
- [ ] PUT /shipment-requests/Financialconsolidation/{id} — назначить группу по SR ID
- [ ] Поддержка поиска по shipments[].id, internal_ref[].id и shipment-requests[].id
- [ ] Параметр recalculateRates (boolean) и RSselection (Shiptify / Cheapest) в теле запроса
- [ ] Если SR уже имеет CONSO ID — возвращать ошибку с инструкцией по удалению старого ID
- [ ] Если одинаковый CONSO ID + та же ссылка уже существуют — игнорировать строку без ошибки

### REQ-RS-014 — Ретро-консолидация: правила пересчёта ставок для финансовой группы

**Приоритет:** P0 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 9–12


**Проверки:**
- [ ] Все SR в группе должны иметь одинаковый CARRIER ID
- [ ] Если в группе присутствует Carrier Service — он должен быть одинаков для всех SR
- [ ] Суммировать все упаковочные листы группы и запустить расчёт RS на суммарный объём
- [ ] Проверять ограничения: entity, cargo types, logistics means, MIN/MAX Weight/CW/Volume/Linear Meter
- [ ] Группировать SR по географическим парам FROM/TO (SUB GROUP) и выполнять расчёт для каждой подгруппы
- [ ] Результат диспетчеризации: разбить итоговую стоимость обратно по SR согласно правилам dispatch (fallback — gross weight)
- [ ] POST /recalculate/FinancialConsolidation/{id} — отдельный endpoint для пересчёта без переназначения группы

### REQ-RS-015 — Ретро-консолидация: мутуализированная стоимость (Mutualized Cost)

**Приоритет:** P1 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 21–23, 29


**Проверки:**
- [ ] Исходная стоимость сохраняется как Initial Cost и не изменяется
- [ ] Пересчитанная стоимость фиксируется как Mutualized Cost (snapshot) и становится Validated Cost
- [ ] В комментарии к invoice line добавлять: «New price from retro consolidation (<Consolidation ID>)»
- [ ] При импорте GIE добавлять: «New price from retro consolidation (IMPORT <File name> by <user>)»
- [ ] Если пользователь вручную изменяет стоимость после консолидации — Mutualized Cost не меняется
- [ ] Округление при распределении: разницу от округления добавлять к одному SR (случайно при совпадении)
- [ ] Mutualized Cost отображается в Power Data Booking Tab и экспортируется в файл данных

### REQ-RS-016 — Ретро-консолидация: загрузка мутуализированных стоимостей через XLS

**Приоритет:** P2 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 25–28


**Проверки:**
- [ ] Настройка в BO: переключатель «Can upload harmonized cost xls» (по умолчанию NO) на уровне покупателя и перевозчика
- [ ] Формат файла: SR_ID, Value (2 знака), Currency (ISO3)
- [ ] Перевозчик может загружать только для SR, где он является назначенным перевозчиком
- [ ] Покупатель может загружать только для SR в рамках своего доступа (multi-account / Galaxy)
- [ ] Повторная загрузка для одного SR_ID: заменять значение последней загрузкой
- [ ] В UI добавить тип загрузки: EN «Mutualized Rates XLS» / FR «Coûts mutualisés XLS»

### REQ-RS-017 — Стратегии котирования (Quote Strategy) в CSW2

**Приоритет:** P1 | **Источник:** 2026 05 - QUOTE STRATEGY - Google Slides.txt, стр. 2–3


**Проверки:**
- [ ] Переключатель «Quote Strategies» в BO Advanced General Settings (по умолчанию NO)
- [ ] Standard Quote (Legacy): только поле Answer Before, ручной выбор победителя
- [ ] Buy-It-Now: Target Price + Answer Before; первый перевозчик ≤ Target Price побеждает мгновенно
- [ ] Hybrid: Target Price + Time till visible + Answer Before; цель скрыта, затем раскрывается как Buy-It-Now
- [ ] Live Reverse Auction: Reserve Price (опционально) + Answer Before; победитель — минимальная ставка на дедлайне
- [ ] Automated Sealed Bid: ставки скрыты; победитель — минимальная на дедлайне
- [ ] Если условия не выполнены к дедлайну — автоматика завершается, пользователь выбирает вручную

### REQ-RS-018 — Применение RS при отправке с нулевыми стоимостями и граничные условия

**Приоритет:** P1 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 44–45, 51


**Проверки:**
- [ ] 0 (ноль) = услуга БЕСПЛАТНАЯ — маршрут продолжает строиться
- [ ] Пустое поле = услуга НЕ ПОКРЫТА — может сделать весь RS невалидным для данного плеча
- [ ] Если RS от FRANCE до FRANCE — система не найдёт совпадение POLPOD; расчёт не выполняется (dummy protection)
- [ ] Если сущности не указаны в правилах RS — RS валиден для всех сущностей
- [ ] Если указана хотя бы одна сущность — RS валиден только для перечисленных сущностей

### REQ-TRACK-001 — Интеграция Container Tracking Service (Kpler Marine Traffic): активация

**Приоритет:** P0 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 3–6


**Проверки:**
- [ ] На уровне аккаунта покупателя: переключатель «Container Tracking» (по умолчанию NO)
- [ ] В старом BO: добавить активную интеграцию Marine Traffic / Kpler
- [ ] Для работы сервиса обязательны: активная интеграция + Container ID + компания с SCAC Code
- [ ] Настройка активации: уровень Shipper (обязательно), Carrier (опционально), BO Companies (опционально)
- [ ] Один credential для всей платформы (Shiptify — подписчик); включение/выключение по аккаунтам

### REQ-TRACK-002 — Container Tracking: поле Container ID и условия вызова Kpler API

**Приоритет:** P0 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 7–8


**Проверки:**
- [ ] Если Container Tracking = YES и Transport Mode = SEA FREIGHT — отображать поле Container ID
- [ ] Поле Container ID редактируемое; валидно для LCL и FCL
- [ ] Без Container ID вызов сервиса Kpler невозможен
- [ ] BL/BOL не используется вместо Container ID
- [ ] Для вызова Kpler обязательны: Container Tracking=YES + Container ID + SCAC Code
- [ ] Все вызовы сервиса логировать в отдельной таблице: container ID, SH ID, SR ID, shipper ID, user ID, timestamp

### REQ-TRACK-003 — Container Tracking: маппинг событий Kpler на Tracking Points Shiptify

**Приоритет:** P0 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 13–16


**Проверки:**
- [ ] STY0446 (Departure from Origin Port): использовать portOfLoading.departureDate
- [ ] STY0448 (Arrival at transit Port): использовать portsOfTransshipment[n].arrivalDate
- [ ] STY0451 (Departure from transit Port): использовать portsOfTransshipment[n].departureDate
- [ ] STY0364 (Arrival at Destination Port): использовать portOfDischarge.arrivalDate
- [ ] status=planned → ETD/ETA; status=actual → ATD/ATA
- [ ] При статусе planned: создать или обновить TP (replan); при actual — подтвердить TP
- [ ] В чат добавлять запись: «On the vessel <name> & Voyage <voyageNumber>»
- [ ] Kpler не влияет на STY00000 и STY99999

### REQ-TRACK-004 — Приоритет источников Tracking Points: перевозчик vs Kpler

**Приоритет:** P1 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 19–20


**Проверки:**
- [ ] Данные Carrier/Seller всегда имеют приоритет над данными Kpler
- [ ] Покупатель и продавец обновляют событие как сейчас — последний обновивший побеждает
- [ ] Событие Kpler всегда отображается для сравнения с событием Buyer/Seller
- [ ] Если перевозчик дал planned и Kpler дал planned — на основной timeline берётся событие перевозчика
- [ ] Если Kpler дал actual, а перевозчик не подтвердил — использовать данные Kpler
- [ ] Если оба дали actual — использовать данные перевозчика
- [ ] Разница между Kpler и Buyer/Seller > 12 ч: выделять оранжевым цветом

### REQ-TRACK-005 — API Tracking: поддержка UNLOCODE и IATA CODE в Tracking Points

**Приоритет:** P1 | **Источник:** 2024 12 - New version of API Tracking - Google Slides.txt, стр. 2–5


**Проверки:**
- [ ] POST /shipments/{id}/tracking-points принимает location в трёх форматах: {country/city/zip/address}, {UNLOCODE}, {IATACODE}
- [ ] UNLOCODE: искать в PPL-референциале по типу PPL и транспортному режиму SR
- [ ] IATA CODE: пока без ограничения по транспортному режиму; линковать к PPL AIRPORT
- [ ] IATA: экспорт → поле Location_Name = (Country ISO2) + AIRPORT NAME
- [ ] UNLOCODE: аналогичный подход к экспорту
- [ ] Использование LOCODE/IATA стабилизирует логику UPDATE vs CREATE (предотвращает создание дубликатов из-за изменения адреса)

### REQ-TRACK-006 — API Tracking: правила поведения POST/PUT/PATCH для Tracking Points

**Приоритет:** P0 | **Источник:** 2024 12 - New version of API Tracking - Google Slides.txt, стр. 7, 15–16


**Проверки:**
- [ ] POST с только PLANNED + ISO location → CREATE если не существует, UPDATE если существует
- [ ] POST с только PLANNED + не-ISO location → CREATE всегда
- [ ] POST с PLANNED + добавление ACTUAL → UPDATE существующего TP
- [ ] POST с ACTUAL + та же дата/время → ничего не делать (дубликат)
- [ ] POST с ACTUAL + изменённая дата/время → CREATE нового TP
- [ ] PATCH /shipments/{id}/tracking-points — обновить последний TP по STY CODE (STY CODE обязателен)
- [ ] PATCH /shipments/{id}/tracking-points/location — обновить только location по STY CODE

### REQ-TRACK-007 — Новая архитектура Tracking (2026): три экрана управления

**Приоритет:** P1 | **Источник:** 2026 04 - NEW TRACKING - Google Slides.txt, стр. 2


**Проверки:**
- [ ] Экран 1 — Setup Screen: настройка кодов событий, флаги исключений (exception)
- [ ] Экран 2 — Shipment Screen: внутреннее отображение tracking timeline для операторов
- [ ] Экран 3 — Public Shipment Tracking Page: отделить публичное от внутреннего
- [ ] Если setup не настроен — использовать текущий экран (обратная совместимость)
- [ ] Если setup настроен для конкретного режима (Air) — применять только для этого режима
- [ ] Если setup настроен на уровне покупателя — использовать настройки покупателя

### REQ-TRACK-008 — Новая архитектура Tracking: коды событий, группы и исключения

**Приоритет:** P2 | **Источник:** 2026 04 - NEW TRACKING - Google Slides.txt, стр. 3


**Проверки:**
- [ ] Возможность помечать каждый STY-код как exception (исключение) или нет
- [ ] Кнопка «Add Code» доступна только для кодов-исключений (exception=YES)
- [ ] Исключения нельзя добавлять в группу «misc» процессных событий
- [ ] Публичная сортировка: от последнего к первому; внутренняя — от первого к последнему

### REQ-TRACK-009 — Публичная страница отслеживания: UI-концепция и AI-функции

**Приоритет:** P2 | **Источник:** 2026 04 - NEW TRACKING - Google Slides.txt, стр. 7


**Проверки:**
- [ ] Map Visualization: визуальный UI Origin A → Destination B (географический контекст)
- [ ] Отображение Predicted ETA vs Original SLA date (AI/ML предсказание)
- [ ] Status Badge: «At Risk» / «On Time» с визуальной индикацией
- [ ] Кнопки: Share (поделиться) и Get Updates (подписка на обновления)
- [ ] Footprint «Powered by Shiptify» на публичной странице
- [ ] Public tracking link: https://www.marinetraffic.com/en/containers/track-shipment?id={shipmentId}

### REQ-TRACK-010 — Создание Transit Point и Tracking Point при инициализации Pre-carriage SRS

**Приоритет:** P2 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 75


**Проверки:**
- [ ] При транспортном режиме SEA FREIGHT и наличии Pre-carriage SRS создавать STY0446 (Departure from Origin Port) с POL как location
- [ ] Открытый вопрос: создавать ли STY0446, если нет данных ETD (даты)
- [ ] API POST TRANSIT POINT: создать endpoint для добавления транзитных точек
- [ ] Для каждого зарегистрированного адреса в системе — иметь возможность сопоставить LOCODE

### REQ-TRACK-011 — Ретро-консолидация: валидация статуса отправки при назначении группы

**Приоритет:** P1 | **Источник:** User Guide _ Retro Consolidation - Google Slides.txt, стр. 4–11


**Проверки:**
- [ ] Отклонять назначение группы, если отправка в статусе WAITING CONFIRMATION
- [ ] Для группировки допускаются только SR с одинаковым транспортным режимом
- [ ] Для группировки допускаются только SR с одинаковым перевозчиком
- [ ] Перевозчик должен иметь включённый флаг «финансовая консолидация разрешена» на уровне режима
- [ ] DELETE /shipments/Financialconsolidation/{id} и DELETE /shipment-requests/Financialconsolidation/{id} — удаление SR из группы

### REQ-TRACK-012 — Обработка ошибок API ретро-консолидации

**Приоритет:** P0 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 17; User Guide _ Retro Consolidation, стр. 4–10


**Проверки:**
- [ ] SR уже имеет CONSO ID → ошибка «SHIPMENT is already having a CONSO ID, remove and rerun»
- [ ] Разные Carrier ID в группе → ошибка «Carrier ID isn't the same for all references»
- [ ] Разные Carrier Service в группе → ошибка «Carrier service isn't the same for all references»
- [ ] Нет подходящего RS для консолидированного объёма → «NO RATES APPLIED TO CONSO ID»
- [ ] При пересчёте: ошибка dispatch → «Recalculated but error in dispatch, nothing done»
- [ ] Частичное отклонение (partial reject): реализовать в будущем; текущее поведение — отклонять полностью

### REQ-NOTIF-001 — Центр уведомлений: бизнес-лог на уровне аккаунта

**Приоритет:** P0 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 18, 20–24


**Проверки:**
- [ ] Создать таблицу бизнес-лога на уровне аккаунта, доступную через новую вкладку в ribbon
- [ ] Логи хранятся 2 недели
- [ ] Колонки лога: WHO (user, email), HOW (Manual/Import/API/Integration), WHAT (объект), WHY (Created/Updated/Cancelled/Deleted/Replanned/Validated/Declined), WHEN (дата/время), Object ID, Object Name
- [ ] Объекты логирования: BOOKING, SHIPMENT, SLOT, VISIT, TPT REQUEST, Freight Unit, CLAIM, INVOICE LINE, INVOICE ORDER, TM ORDER, DOCK
- [ ] Кликабельность: клик по Object ID → переход к объекту (при наличии доступа)
- [ ] Клик по строке → боковой модал с деталями: user, email, phone, payload (для API-ошибок), notified people

### REQ-NOTIF-002 — Фильтрация бизнес-лога уведомлений

**Приоритет:** P1 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 20


**Проверки:**
- [ ] Фильтр по Users (кто выполнил действие)
- [ ] Фильтр по States/Why (Created, Updated, Cancelled, Deleted, Replanned, Validated, Declined, ERROR)
- [ ] Фильтр по Object/What (Booking, Shipment, Slot, и т.д.)
- [ ] Поиск по ID или имени объекта
- [ ] Фильтр по How (Manual, Import, API)
- [ ] Фильтр по дате: день, неделя, диапазон; временные срезы: последний час, 2 ч, 4 ч
- [ ] Фильтр Notify: Nobody, ALL, Me, один или несколько получателей
- [ ] Magic filter (умный фильтр) с сохранением в памяти

### REQ-NOTIF-003 — Настройка уведомлений на уровне пользователя: роли и аккаунты

**Приоритет:** P1 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 4–5, 28, 32–33


**Проверки:**
- [ ] Настройка для роли BOOKER/CREATOR: уведомления по умолчанию включены
- [ ] Настройка как участник группы (team member): уведомления о действиях других бронировщиков
- [ ] Настройка на уровне ACCOUNT: подписка на события всего аккаунта
- [ ] Настройка как SPECTATOR аккаунта: только объект SHIPMENT (расширится позднее для SLOT/DOCK)
- [ ] Multi-account: настройки задаются отдельно для каждого аккаунта
- [ ] Примечание: Account 1 — уведомления для road; Account 2 — только для slot
- [ ] Кнопка «Copy settings» для переноса настроек между аккаунтами с похожей деятельностью

### REQ-NOTIF-004 — Каналы доставки уведомлений: In-App и Email

**Приоритет:** P1 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 7, 14, 29–30


**Проверки:**
- [ ] In-App: улучшенный bell-нотификатор с кликом для перехода к объекту
- [ ] Перенести выбор аккаунта в ribbon для отображения красной точки при multi-account
- [ ] Email: пользователь выбирает YES/NO; при YES настраивается частота отправки
- [ ] Режим SPOT: одно письмо на событие (текущее поведение)
- [ ] Digest: консолидация событий каждые 1/2/3/4/8 часов через CRON job
- [ ] Daily digest: реализовать с учётом таймзоны аккаунта (опционально)
- [ ] Если в период digest не было событий — письмо не отправлять

### REQ-NOTIF-005 — Digest-письмо: формат и структура

**Приоритет:** P2 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 30–31, 33


**Проверки:**
- [ ] Заголовки секций по бизнес-объектам: BOOKING, TRACKING, SLOT
- [ ] Каждая строка: <user> (<account>) (action) (element) at <date&time> <прямая ссылка на объект>
- [ ] Пример: «ERWAN (ERWAN QA) updated packing list at 17/09 15:21 SEE HERE»
- [ ] Разные категории могут иметь разную частоту digest внутри одного письма
- [ ] Пример: Created shipment (1h) + Shared Document (2h) → H2: оба события в одном digest
- [ ] Если у одного пользователя несколько подписок (BOOKER + ACCOUNT) — слать одно письмо, не дублировать

### REQ-NOTIF-006 — Vacation Mode и делегирование уведомлений

**Приоритет:** P2 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 6


**Проверки:**
- [ ] Пользователь может включить Vacation Mode — остановить получение уведомлений
- [ ] В vacation mode: возможность переадресовать уведомления коллеге-замещению
- [ ] Все события в любом случае остаются в бизнес-логе

### REQ-NOTIF-007 — Триггеры уведомлений: события Tracking Points

**Приоритет:** P1 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 5, 27, 32


**Проверки:**
- [ ] Подписка на все транспортные режимы или только на выбранные
- [ ] Подписка на диапазон STY-кодов (от/до)
- [ ] Если обновление location изменяет TP (create/replan) — уведомить только один раз
- [ ] Если update_location=YES + tracking=YES — одно уведомление, не два
- [ ] Алёрт: если Pickup или Delivery дата прошла, а статус всё ещё PLANNED — уведомить: «<Shipment Name> collect/delivery isn't confirmed yet but expected»

### REQ-NOTIF-008 — Уведомления Chat: интеграция с новой структурой чата (TD-359)

**Приоритет:** P1 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 35–36


**Проверки:**
- [ ] Чат создаётся на уровне каждого объекта (slot, shipment, booking, etc.) с одной или несколькими сторонами
- [ ] Настройка: notify in-app или по email для каждого чата по объекту
- [ ] Пользователь может /mute или /follow конкретный чат
- [ ] По умолчанию: notify in-app при уровне BOOKER (YES), GROUP (YES), ACCOUNT (NO)
- [ ] Уведомления из чата ретро-консолидации: назначение SR в группу, удаление, пересчёт с детализацией стоимостей

### REQ-NOTIF-009 — Уведомления: гранулярность на уровне отдельного объекта

**Приоритет:** P2 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 34


**Проверки:**
- [ ] На уровне каждого объекта: кнопка «Don't notify me anymore for this object» или «Notify me for this object»
- [ ] Переопределяет глобальные настройки уведомлений пользователя
- [ ] Аналог /mute /follow из Slack — применяется к конкретному чату/объекту

### REQ-NOTIF-010 — Приоритизация объектов для первой волны реализации уведомлений

**Приоритет:** P0 | **Источник:** 2025 09 - EPIC - Notification - Google Slides.txt, стр. 26, 38


**Проверки:**
- [ ] Первая волна: BOOKING, TRACKING, SLOT, CHAT (TD-359)
- [ ] Остальные объекты (INVOICE, CLAIM, и т.д.) — следующие итерации
- [ ] Бизнес-лог реализуется как первый шаг (slicing по SHIPMENT, SHIPMENT REQUEST, SLOTS)
- [ ] Вторым шагом — редизайн NOTIFICATION (app/mail/none) с расширенным выбором пользователя
- [ ] Финальный шаг — полноценная поддержка multi-account

### REQ-RS-019 — Правило Incoterm в ретро-консолидации: ограничения применения

**Приоритет:** P2 | **Источник:** User Guide _ Incoterm effect to Rate Sheet - Google Slides.txt, стр. 20


**Проверки:**
- [ ] Ретро-консолидация корректна только если все SR имеют одинаковый incoterm
- [ ] В текущей реализации incoterm как критерий консолидации не проверяется (ignored)
- [ ] В будущем: добавить проверку incoterm как обязательный критерий совместимости в ретро-консолидации

### REQ-RS-020 — Автозаполнение страны из LOCODE в настройках отправки

**Приоритет:** P2 | **Источник:** SEA FREIGHT _ RATE SHEET STRUCTURE - Google Slides.txt, стр. 38


**Проверки:**
- [ ] Если зарегистрирован Pre-carriage SRS (From LOCODE to POL) — извлекать DEPARTURE COUNTRY CODE из LOCODE
- [ ] Если зарегистрирован Post-carriage SRS (From POD to LOCODE) — извлекать DELIVERY COUNTRY CODE из LOCODE
- [ ] Автозаполнение из COUNTRY CODE в SRS AND из самого UNLOCODE

### REQ-TRACK-013 — Логирование использования Container Tracking Service (Kpler)

**Приоритет:** P1 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 8–9


**Проверки:**
- [ ] Каждый вызов Kpler API фиксировать в отдельной таблице
- [ ] Поля лога: container_id, SH_ID, SR_ID, shipper_id, user_id, timestamp
- [ ] Таблица доступна через BO для выгрузки статистики по аккаунтам
- [ ] Каждое изменение поля Container ID логировать в чате отправки
- [ ] Стоимость подписки: ~3–4$ за контейнер; лог необходим для биллинга

### REQ-TRACK-014 — Kpler API: создание tracking request и обработка ответа

**Приоритет:** P0 | **Источник:** 2024 08 - Sea Freight _ Container Tracking as a Service - Google Slides.txt, стр. 10, 12, 17


**Проверки:**
- [ ] POST запрос: referenceNumberType=container, referenceNumber=<Container ID>, scac=<SCAC CODE>, tags=[<shiptify ref>]
- [ ] Из ответа сохранить: trackingRequestId, shipmentId (Kpler), ссылку на tracking request
- [ ] Tags использовать для линковки с внутренней ссылкой Shiptify
- [ ] Перед POST: проверить (GET) — не существует ли уже container ID в статусе не-completed
- [ ] Публичный URL для пользователя: https://www.marinetraffic.com/en/containers/track-shipment?id={shipmentId}
- [ ] Баннер в интерфейсе: «Tracking of the container {id} by Kpler Marine Traffic» + ссылка на публичный трекинг

### REQ-TRACK-015 — Экспорт данных ретро-консолидации

**Приоритет:** P2 | **Источник:** 2025 06 - Retro Consolidation - Google Slides.txt, стр. 29–30, 32


**Проверки:**
- [ ] В data export добавить колонки в конце файла перед METADATA:
- [ ] BK MUTUALIZED COST
- [ ] BK MUTUALIZED CURRENCY
- [ ] CONSOLIDATED ID
- [ ] Mutualized savings = Sum(IC - MC, где MC > 0) по всем BKI в диапазоне дат
- [ ] Блок «Mutualisation savings» отображается только если значение > 0

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.11_checklist-rate-sheets`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632553571 · **repo:** `tms/shipments/11_checklist-rate-sheets.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

