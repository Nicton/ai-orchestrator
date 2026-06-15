---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631046215
source_type: confluence
---
# Онбординг в Shiptify TMS — Видео-руководство

Документация основана на серии видео-инструктажей, записанных QA-инженерами команды. Видео охватывают весь продукт от базовых операций до технических деталей интеграций.

> Автор видео: Ярик (QA-тестировщик). Версия: staging "Blu" (app.blu.shiptify.com)

---

## Навигация

| Файл | Что внутри | Видео |
|------|-----------|-------|
| [01_main-app-walkthrough.md](01_main-app-walkthrough.md) | Основной флоу: Booking, SR→SH, QR, Multi-container, Templates, Routines | Part 1 |
| [02_features-deep-dive.md](02_features-deep-dive.md) | FO/Milkrun, FU, Grouping, My Site, Planning, Invoicing, Multivision, Spectators, Bookers, PML | Part 2 |
| [03_admin-backoffice.md](03_admin-backoffice.md) | Admin App, Back-Office, Galaxy, Public API, Terms of Service | Part 3 |
| [04_mini-apps.md](04_mini-apps.md) | Shared Templates, Slotify, Airport Screens, Driver App, Public Tracking Page, Carrier Token Page, Jobs | Part 4 |
| [05_slotify-algorithm.md](05_slotify-algorithm.md) | Алгоритм слотов: capacity, fixed time, interval, docks, Reception/Expedition | Part 4 (детали) |
| [06_integrations-technical.md](06_integrations-technical.md) | Архитектура интеграций, workers, очереди, active_integrations таблица | MKV |

---

## Ключевые термины (из видео)

| Термин | Определение (из уст QA) |
|--------|------------------------|
| **Blu** | Staging окружение — app.blu.shiptify.com |
| **CSW** | Create Shipment Wizard — модалка создания букинга |
| **Booking / BK** | Заявка на перевозку (до и после подтверждения) |
| **SR** | Shipment Request — созданный букинг (до подтверждения) |
| **SH** | Shipment — подтверждённая перевозка (после confirm) |
| **QR** | Quote Request — запрос к нескольким перевозчикам |
| **FO** | Freight Order — то же, что Milkrun (несколько точек) |
| **FU** | Freight Unit — ключ для отслеживания груза в FO |
| **ML** | Master Location — склад с настроенными слотами |
| **PML** | Public Master Location — ML с галочкой "Visible by Community" |
| **RTB** | Ready to Book — черновик с заполненными всеми полями |
| **Draft** | Черновик с минимально заполненными полями |
| **Reception** | Прибытие на склад (Delivery направление) |
| **Expedition** | Отправка со склада (Pickup направление) |
| **Book & Slot** | Функционал Carrier для создания шипментов на ML |
| **Airport Screen** | Slotify Statuses — экран для телевизора на складе |
| **PTP** | Public Tracking Page — публичная страница трекинга |
| **CTP** | Carrier Token Page — редко используемое мини-приложение |

---

## Окружения

| Окружение | URL | Описание |
|-----------|-----|---------|
| **Production** | app.shiptify.com | Боевой сервер |
| **Staging (Blu)** | app.blu.shiptify.com | Тестовый стенд (используется QA) |
| **Admin** | admin.blu.shiptify.com | Административная панель |
| **Back-Office** | back.blu.shipt.io | Инструмент для менеджеров |
| **API Docs** | apidog.shiptify.com | Документация Public API |

---

## 🔗 Граф-метаданные
- **id:** `onboarding`
- **type:** overview · **domain:** Back-Office · **status:** implemented
- **confluence:** 631046215 · **repo:** `onboarding/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

