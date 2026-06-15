---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632160257
source_type: confluence
---
# Ответственные за модули, фичи и системы

Документ составлен на основе анализа git-истории репозиториев Shiptify:
`backend`, `frontend`, `frontend-mono`, `mini-apps`, `back-office`, `admin-app`.

**Методология:** для каждого модуля подсчитано количество коммитов на автора в соответствующих папках. Указаны 1–3 разработчика с наибольшим вкладом. Дата анализа: 2026-06-06.

> **Важно:** Таблица отражает исторический вклад в код. Текущая ответственность может отличаться — рекомендуется уточнить с тимлидом.

---

## TMS — Основное приложение (Backend + Frontend)

| Модуль / Фича | Ответственные | Репозиторий | Комментарий |
|---------------|--------------|-------------|-------------|
| **Booking / CSW Wizard** (создание заявок) | Evgeny Vasilevsky, Andrey Pankov, Jacob Popov | backend + frontend | Andrey Pankov — лидер UI (276 коммитов), Evgeny — backend |
| **Shipment Request (SR) / Quote Request (QR)** | Evgeny Vasilevsky, Andrey Pankov, Andrey Kachkin | backend + frontend | |
| **Tracking Points (TP)** | Andrey Pankov, Evgeny Vasilevsky | backend | Andrey Pankov — основной автор |
| **Invoicing / Pre-Invoice / Invoice** | Yaroslav Lipatov, Robert Sasimovich, Kate Lebedevich | backend | |
| **Claims (Претензии)** | Andrey Pankov | backend | Andrey Pankov — dominant (39 из 42 коммитов) |
| **Slots / Slotify (бэкенд)** | Kate Lebedevich, Robert Sasimovich, Yaroslav Lipatov | backend | Kate Lebedevich — лидер (151 коммит) |
| **Slots UI (фронтенд)** | Jacob Popov, Kate Lebedevich, Yaroslav Lipatov | frontend | Jacob Popov — лидер UI слотов |
| **Rate Sheets (тарифные листы)** | Roman Bugakov, Artem Kozel, Evgeny Vasilevsky | backend | |
| **Galaxy / Multi-Account** | Vlad Orpik, Evgeny Vasilevsky, Sergey Karpovich | backend + frontend | |
| **Milkrun / Freight Order** | Yaroslav Lipatov, Roman Bugakov, Evgeny Vasilevsky | backend | |
| **Master Location (ML / PML)** | Evgeny Vasilevsky, Yaroslav Lipatov, Roman Bugakov | backend | |
| **Grouping (группировка)** | Andrey Pankov, Andrey Kachkin | backend | |
| **Orders / Product Orders** | Evgeny Vasilevsky, Yaroslav Lipatov, Kate Lebedevich | backend | |
| **Templates / Routines** | Andrey Pankov, Artem Kozel, Sergey Karpovich | backend | |
| **Transport Requests (TR / Buy&Sell)** | Roman Bugakov, Evgeny Vasilevsky, Yaroslav Lipatov | backend | |
| **Public API** | Andrey Pankov, Evgeny Vasilevsky, Artem Kozel | backend | Andrey Pankov — лидер (696 коммитов в routes/api) |
| **Workers / Queue System (Kue)** | Artem Kozel, Evgeny Vasilevsky, Sergey Karpovich | backend | Artem Kozel — лидер workers (148 коммитов) |

---

## Интеграции с внешними сервисами

| Интеграция | Ответственные | Комментарий |
|-----------|--------------|-------------|
| **DHL** (основная, DISPOR, Express, FCA) | Egor Klenin, Sergey Karpovich, Roman Stelmashuk | Egor Klenin (eklenin) — лидер DHL (100 коммитов) |
| **Heppner (HPR)** | Artem Kozel, Evgeny Vasilevsky, Roman Bugakov | Artem Kozel — лидер (53 коммита) |
| **P44 / Shippeo** (трекинговые платформы) | Artem Kozel, Sergey Karpovich | Artem Kozel — лидер (44 коммита) |
| **SAP** | Artem Kozel, Egor Klenin, Sergey Karpovich | Artem Kozel + Egor Klenin |
| **EDI: DB Schenker, Calvacom, Teliae** | Sergey Karpovich, Artem Kozel, Egor Klenin | Sergey Karpovich — лидер EDI (110 коммитов) |
| **Интеграции (общая архитектура)** | Artem Kozel, Sergey Karpovich, Egor Klenin | Workers для всех интеграций |

---

## DOCK — Dock Management (Слоты и склад)

| Модуль / Фича | Ответственные | Репозиторий | Комментарий |
|---------------|--------------|-------------|-------------|
| **Slotify (мини-приложение, фронтенд)** | Jacob Popov, Sergey Karpovich, Evgeny Vasilevsky | mini-apps | Jacob Popov — лидер Slotify UI |
| **Driver App** | Maksimik, Sergey Karpovich, Jacob Popov | mini-apps | Maksimik — основной разработчик Driver App |
| **Carrier Portal** | Maksimik, Jacob Popov, Sergey Karpovich | mini-apps | |
| **Planning / Dock Dashboard** | Kate Lebedevich, Robert Sasimovich, Yaroslav Lipatov | backend + frontend | |

---

## Back-Office (`back.blu.shipt.io`)

| Модуль / Фича | Ответственные | Комментарий |
|---------------|--------------|-------------|
| **Back-Office (вся система)** | Evgeny Vasilevsky, Roman Bugakov, Sergey Karpovich | Evgeny Vasilevsky — лидер BO (418 коммитов) |
| **Sales Accounts / CRM / ToPo** | Evgeny Vasilevsky, Jacob Popov, Vlad Orpik | |
| **BON Notifications** | Evgeny Vasilevsky, Roman Bugakov | |
| **Billing Accounts / MRR** | Evgeny Vasilevsky, Igor Fedoseev | |

---

## Admin-App (`admin.blu.shiptify.com`)

| Модуль / Фича | Ответственные | Комментарий |
|---------------|--------------|-------------|
| **Admin-App (вся система)** | Andrey Pankov, Sergey Karpovich, Artem Kozel | Andrey Pankov — лидер (369 коммитов) |
| **Управление аккаунтами** | Andrey Pankov, Artem Kozel, Andrey Kachkin | |
| **Управление интеграциями** | Egor Klenin, Vasili Manko, Yaroslav Lipatov | |
| **Словари (Dictionary)** | Andrey Pankov, Sergey Karpovich, Evgeny Vasilevsky | |

---

## Ключевые разработчики — общий профиль

| Имя | Основные зоны ответственности |
|-----|-------------------------------|
| **Evgeny Vasilevsky** | TMS core, Back-Office, Orders, Master Location, общая архитектура |
| **Andrey Pankov** | CSW/Booking UI+API, Tracking Points, Claims, Templates, Public API, Admin |
| **Jacob Popov** | Slots UI, Slotify (mini-app), Back-Office, Shipment UI |
| **Sergey Karpovich** | EDI интеграции, Mini-apps (Slotify/Carrier), Workers |
| **Artem Kozel** | Интеграции (Heppner, P44, SAP, Workers), Rate Sheets, Admin |
| **Kate Lebedevich** | Slots/Slotify backend, Invoicing, Planning |
| **Yaroslav Lipatov** | Invoicing, Slots, Milkrun, Orders, Transport Requests |
| **Roman Bugakov** | Rate Sheets, Transport Requests, Back-Office, Workers |
| **Egor Klenin** (eklenin) | DHL интеграции, SAP, EDI |
| **Andrey Kachkin** | Booking API, Public API, Grouping |
| **Robert Sasimovich** | Slots/Slotify, Invoicing |
| **Vlad Orpik** | Galaxy, Back-Office |
| **Maksimik** | Driver App, Carrier Portal |
| **Igor Fedoseev** | Back-Office, Billing |

---

## Что требует уточнения

| Область | Статус |
|---------|--------|
| Frontend-mono (React) — разбивка по фичам | Требует отдельного анализа |
| Customs App (mini-apps) | Требует уточнения |
| Quick Shipment (mini-apps) | Требует уточнения |
| Текущая ответственность (не историческая) | Уточнить с тимлидом |
| Фичи, разработанные внешними подрядчиками | Требует уточнения |

---

## 🔗 Граф-метаданные
- **id:** `responsible-people`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632160257 · **repo:** `RESPONSIBLE-PEOPLE.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

