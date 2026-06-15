# 08_LINKS_REGISTRY.md

> Реестр ссылок (internal). Храним то, что нужно для работы/ревью/дебага.

## 1) Environments
- Test stage (milkrun focus): https://app.blu.shiptify.com/milkrun
  - полезные страницы для ручной проверки milkrun UI:
    - /milkrun (monitoring): https://app.blu.shiptify.com/milkrun
    - /tracking (list): https://app.blu.shiptify.com/tracking
    - /booking (list): https://app.blu.shiptify.com/booking
  - основной smoke flow: создание milkrun (2 shipments) + проверка blue milkrun block
  - сопутствующие флоу: spectator sharing / followers / FU (см. автотесты)

## 2) Confluence (TD space)
- Parent page (Documentation): **589365250** (автосинк из локального KB)
- Child pages (автосинк из локального KB):
  - 00_INDEX → 612204547
  - 01_PRODUCT_MAP → 612106277
  - 02_ROLES_AND_ACCESS → 612401186
  - 03_OBJECTS_STATES_TRANSITIONS → 612564996
  - 04_USER_FLOWS → 612040748
  - 05_GLOSSARY → 611942420
  - 06_TESTCASES_INDEX → 612335620
  - 07_AUTOTEST_MAP → 612040764
  - 08_LINKS_REGISTRY → 611418121

Last sync (manual log): **2026-06-05 14:39 Europe/Warsaw** (см. `progress.json` в KB).

### Milkrun-stage gaps (Qase export limitation)
- Qase export file `MA-2026-05-25.json`: у кейсов **2826–2829** (Update location for Delivery/Collect milkrun) в экспорте есть только titles (нет description/steps/expected). Значит, детали нужно брать из **Confluence TD** или фиксировать вручную на стенде.

## 3) Локальные источники
- KB root: `/home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0`
- Test cases export: `/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json`
  - быстрый способ достать релевантные кейсы: пройтись по `suites[*].suites[*]...cases[*]` и фильтровать по keyword (Milkrun/Spectator/Grouping/etc.)
- UI autotests: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests`

## 3.1) Test stage (milkrun focus)
- https://app.blu.shiptify.com/milkrun

## 4) Упоминания Confluence из test cases (нужно вычитать/перенести сюда)
- Elasticsearch mapping: https://shiptify.atlassian.net/wiki/spaces/TD/pages/243236865/Mapping

## 4.1) TD space: страницы, которые стоит «привязать» к KB (backlog)
> В этом разделе держим список страниц, которые уже встречались в артефактах (кейсы/комменты), но пока не встроены в структуру KB.

- Mapping (Elasticsearch): https://shiptify.atlassian.net/wiki/spaces/TD/pages/243236865/Mapping
- TODO: найти/добавить страницы по Milkrun monitoring modal, FU keys, Spectator access (по ключевым словам Milkrun/Freight Unit/Spectator) и привязать их в 03/04/05.
  - Подсказка из Qase export (MA-2026-05-25.json) для FU keys в milkrun:
    - 1417: *new keys under the cargos*
    - 1419: *created and existing keys under the cargos for milkrun*
    - 1421: *keys under every cargo after confirming carrier*
    - 1422: spectator: *no possibility to switch tabs except TP*
  - Qase ориентиры для поиска терминов в Confluence: 924/926/927/1055/1061 (banner+monitoring modal+routes) и 1417/1419/1421/1422 (FU keys + spectator ограничения), 1447 (spectator vs milkrun block).
- TODO: найти страницы по Crossdock / Transit via и описанию **MERGE IN A MILKRUN** toggle (кейсы 4141/4152) и привязать в 01/03/04.
- TODO: найти TD-страницы по **Show Milkrun** / Grouping enablement, чтобы связать feature-toggle 2004 с реальным admin flow и ролями shipper/carrier.

## 4.2) Qase-экспорт: Milkrun stage (под разбор)
Файл: `/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json`

### Как устроен JSON (важно для парсинга)
- Корневой ключ: `suites` (дерево suites → suites → cases).
- У кейсов важные поля: `id`, `title`, иногда `description`/`steps`/`expected_result` (но **для части milkrun-stage кейсов в экспорте этих полей нет**).

Мини-утилита для поиска кейса по id (пример):
```python
# pseudo
for suite in suites_tree:
  walk(suite):
    for case in suite.cases:
      if case.id in {916, 1417, 2826, ...}: print(case.id, case.title, suite_path)
```

Также полезные smoke кейсы вокруг milkrun-стенда:
- 1341 / 4280 — Slot Booking (shipper / carrier)
- 2863 / 2866 / 2869 — Planning (displaying shipments / default ML / tabs)
- 4164 / 4165 — Spectator / PML user (Tracking-only access)
- 4423 — Adding FU (FU key under cargo in packing list)
- 4593 — Pick-up grouping (create group / assign to group)

Ключевые темы для milkrun-стенда:
- **Milkrun banner / related shipments block** ("This shipment belongs to a Milkrun with x steps... Click here...")
  - кейсы: 924/1055
- **List of milkrun addresses** — кейс 917
- **Tooltip for milkrun** — кейс 918
- **Milkrun monitoring modal** (opening + content) — кейсы 926/927
- **Spectator: milkrun block visibility** — кейс 1447 (в экспорте есть противоречие expected result)
- **Spectator: FU keys visibility** — кейс 1422 (keys are not displayed from spectators)
- **Spectator: multicontainers brothers access** — кейс 1442
- **FU keys in milkrun** — кейсы 1417/1419/1421
- **Create Milkrun via grouping page** — кейсы 2013/2014/2054 + toggle 4141

## 4.1) Быстрые ссылки на источники «как кликается»
- Autotest: creatingMilkrun: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/creatingMilkrun.js`
- Autotest: addingSpectator: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/addingSpectator.js`
- Autotest: milkrun rate sheet: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/rateSheets/usualRateSheets/countMilkrunRateSheet.js`
- Autotest: slot booking (shipper): `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/slotBookingByShipper.js`
- Autotest: slot booking (carrier): `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/slotBookingByCarrier.js`
- Autotest: confirm TP: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/confirmTP.js`
- Autotest: request info TP: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/requestInfoTP.js`
- Autotest: grouping (departure/arrival/shipment): `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/grouping.js`
- Autotest: pick-up grouping: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/pickUpGrouping.js`
- Autotest: grouping export (.xlsx): `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/export/exportGrouping/exportGrouping.js`
- Autotest: planning: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/planning.js`
- Autotest: update location (PU/DEL modals): `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/updateLocation.js`
- Autotest: transport order regeneration / PDF versioning: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests/smokeTest/regenerationPDF.js`

## 8) Confluence TD: что искать дальше (milkrun stage)

Быстрые ссылки на поиск по TD (ручной ресёрч для закрытия TBD):
- Milkrun monitoring modal: https://shiptify.atlassian.net/wiki/search?spaces=TD&text=Milkrun%20monitoring%20modal
- Related shipments banner ("This shipment belongs to a Milkrun"): https://shiptify.atlassian.net/wiki/search?spaces=TD&text=%22This%20shipment%20belongs%20to%20a%20Milkrun%22
- FU keys / Freight Unit keys: https://shiptify.atlassian.net/wiki/search?spaces=TD&text=%22Freight%20Unit%22%20keys
- Update location milkrun: https://shiptify.atlassian.net/wiki/search?spaces=TD&text=Update%20location%20Milkrun
- MERGE IN A MILKRUN: https://shiptify.atlassian.net/wiki/search?spaces=TD&text=%22MERGE%20IN%20A%20MILKRUN%22
- Milkrun & FTL (suite 274): https://shiptify.atlassian.net/wiki/search?spaces=TD&text=%22Milkrun%20%26%20FTL%22
- Packing list BK level / PSH level: https://shiptify.atlassian.net/wiki/search?spaces=TD&text=%22packing%20list%22%20BK%20level%20PSH

Ключевые слова для поиска страниц/спек (чтобы закрыть TBD в KB):
- **Milkrun monitoring modal** / "This shipment belongs to a Milkrun" / **related shipments**
- **Update location milkrun** (кейсы Qase 2826–2829: Update Pick-up/Delivery location of Delivery/Collect milkrun)
- **Freight Unit keys** / **FU keys** / "keys under cargos" (кейсы 1417/1419/1421/1422)
- **Spectator milkrun** / "milkrun block" (кейс 1447: ambiguity title vs expected)
- **MERGE IN A MILKRUN** (кроссдок / transit via, кейсы 4141/4152)

## 5) Скрипты синхронизации Confluence
- Parent sync:
  - `python3 /home/user/.openclaw/workspace/scripts/confluence_sync_internal_kb.py --page-id 589365250 --title "Documentation" --root /home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0`
- Child pages sync:
  - `python3 /home/user/.openclaw/workspace/scripts/confluence_pages_sync.py --parent-id 589365250 --root /home/user/.openclaw/workspace/shiptify/knowledge-base/internal/1.0 --space TD`

## 6) Test stage / окружение
- Milkrun stage (TMS-only): https://app.blu.shiptify.com/milkrun

## 7) QA источники (локально)
- Экспорт тест-кейсов (Qase): `/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json`
  - smoke / milkrun / spectator / freight unit ключевые кейсы:
    - **1625** Creating Milkrun
    - **4423** Adding FU
    - **4164** Spectator
