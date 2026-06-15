# Внутренняя документация ShiptiFy (TMS) — v1.0

> Статус: в работе. Канонический язык: **русский** (для ревью). После ревью — перевод на EN/FR.

## Источники данных (по приоритету факта)
1) Jira (эпики/истории/комменты) — источник «почему/зачем» и дорожной карты.
2) Confluence (TD space) — существующие решения/термины/договорённости.
3) Test cases JSON: `MA-2026-05-25.json` — источник «что система делает» с точки зрения проверок.
4) AutoTest Repository: `main-app-automation` — источник «как пройти флоу» и какие элементы реально существуют в UI.
5) Код (позже) — финальная верификация реализации.

## Быстрая навигация
- 01_PRODUCT_MAP.md — карта продукта (объекты, модули, границы TMS)
- 02_ROLES_AND_ACCESS.md — роли/персоны и матрица доступа
- 03_OBJECTS_STATES_TRANSITIONS.md — сущности + состояния + переходы (state machine)
- 04_USER_FLOWS.md — end-to-end флоу (happy path + ветки)
- 05_GLOSSARY.md — аббревиатуры/термины
- 06_TESTCASES_INDEX.md — индекс test cases → модули/флоу
- 07_AUTOTEST_MAP.md — индекс autotests → флоу/страницы
- 08_LINKS_REGISTRY.md — реестр ссылок (Jira/Confluence/UI/видео)

## Область (phase 1)
Только **TMS (Transport Management System)**. Стартовая точка: тестовый стенд `https://app.blu.shiptify.com/milkrun`.
