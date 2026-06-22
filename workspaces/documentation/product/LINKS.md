---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668738
source_type: confluence
---
# Links Registry — Реестр ссылок

Канонические URL, ID страниц Confluence, пути к репозиториям.

> Источник: Confluence 08_LINKS_REGISTRY (sync: 2026-05-31)

---

## Тестовые окружения

| Среда | URL | Назначение |
|-------|-----|-----------|
| **Milkrun stage** | https://app.blu.shiptify.com/milkrun | Основная среда для ручного тестирования Milkrun |
| **Tracking list** | https://app.blu.shiptify.com/tracking | Список перевозок (трекинг) |
| **Booking list** | https://app.blu.shiptify.com/booking | Список заявок |
| **Dock interface** | https://app.blu.shiptify.com/dock | Интерфейс Dock Manager |
| **Admin Panel** | https://admin.blu.shiptify.com | Административная панель |
| **Backend API** | https://back.blu.shipt.io | Backend API |

---

## Public API (Swagger / OpenAPI)

Публичный REST API, которым пользуются клиенты. Контракт — OpenAPI 3.0.2 (`public-api-docs/swagger/api.json`), сервис — `workspaces/public-api`. Справочник эндпоинтов в доке: [integrations/public-api/reference/README.md](integrations/public-api/reference/README.md).

`BLU`/`Flint` — **названия окружений** (стендов), не клиентов. Продакшн — на домене без поддомена.

| Окружение | Swagger UI | Назначение |
|-----------|-----------|-----------|
| **Прод** | https://api-docs.shiptify.com/ | продакшн (app: https://app.shiptify.com/) |
| **BLU** | https://api-docs.blu.shiptify.com/ | тест-стенд (app: https://app.blu.shiptify.com/) |
| **Flint** | https://api-docs.flint.shiptify.com/ | отдельное окружение |

Аутентификация: заголовок `Authorization: Api-Key <key>` (ключ на уровне user) + контекст аккаунта `x-account-id`.

---

## Confluence TD Space

### Page IDs (для автосинка)

| Страница | ID |
|---------|-----|
| Documentation (parent) | **589365250** |
| 00_INDEX | 589004819 |
| 01_PRODUCT_MAP | 589889538 |
| 02_ROLES_AND_ACCESS | 589037574 |
| 03_OBJECTS_STATES_TRANSITIONS | 589365259 |
| 04_USER_FLOWS | 588906512 |
| 05_GLOSSARY | 589889554 |
| 06_TESTCASES_INDEX | 589561861 |
| 07_AUTOTEST_MAP | 588972062 |
| 08_LINKS_REGISTRY | 589004835 |
| **TMS Внутренняя документация (новый root)** | **609583105** |

---

## Локальные пути (KB и тесты)

| Ресурс | Путь |
|--------|------|
| KB root | `/home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0` |
| Test cases JSON | `/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json` |
| UI Autotests root | `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests` |

---

## Ключевые файлы автотестов

| Файл | Фича |
|------|------|
| `smokeTest/creatingMilkrun.js` | Создание Milkrun |
| `smokeTest/updateLocation.js` | Обновление локации |
| `smokeTest/regenerationPDF.js` | Перегенерация PDF |
| `smokeTest/confirmTP.js` | Подтверждение Tracking Point |
| `smokeTest/requestInfoTP.js` | Запрос информации TP |
| `smokeTest/slotBookingByShipper.js` | Бронирование слота (Shipper) |
| `smokeTest/slotBookingByCarrier.js` | Бронирование слота (Carrier) |
| `smokeTest/addingSpectator.js` | Добавление Spectator |
| `smokeTest/addingFU.js` | Добавление Freight Unit |
| `rateSheets/usualRateSheets/countMilkrunRateSheet.js` | Расчёт цены Milkrun |
| `roles/mainShipper.js` | Роль Shipper (sessionStorage.removeItem) |
| `roles/mainCarrier.js` | Роль Carrier (sessionStorage.setItem 'ops') |

---

## Известные пробелы в Qase (MA-2026-05-25.json)

| Кейсы | Проблема | Статус |
|-------|---------|--------|
| 2826-2829 | Только заголовки, нет description/steps — Update location для Milkrun Delivery/Collect | Требует ручной проверки на milkrun stage |
| 1447 | Противоречие: заголовок "Blue milkrun block isn't hidden" vs expected "is hidden" | Требует ручной проверки |

---

## Синхронизационные скрипты

```bash
# Синхронизация старого KB в Confluence
python3 /home/user/.openclaw/workspace/scripts/confluence_sync_internal_kb.py \
  --page-id 589365250 \
  --root /home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0

python3 /home/user/.openclaw/workspace/scripts/confluence_pages_sync.py \
  --parent-id 589365250 \
  --root /home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0 \
  --space TD
```

---

## 🔗 Граф-метаданные
- **id:** `links`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631668738 · **repo:** `LINKS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

