---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308402
source_type: confluence
---
# Implementation — Техническая реализация TMS

Документация для разработчиков о том, как система устроена изнутри: как запустить, что от чего зависит, схемы данных, диаграммы жизненного цикла.

## Разделы

| Раздел | Описание |
|--------|---------|
| [setup.md](setup.md) | Локальный запуск: Docker, переменные окружения, порты, требования к железу |
| [backend/](backend/README.md) | Node.js API + Worker: архитектура, сервисы, очереди, интеграции |
| [frontend/](frontend/README.md) | AngularJS + React: структура, сборка, микрофронтенды |
| [database/](database/README.md) | PostgreSQL: ER-модель, ключевые сущности, диаграммы жизненного цикла |
| [integrations/](integrations/README.md) | Внешние системы: 27 перевозчиков, SAP, HubSpot, P44, Shippeo |

## Технологический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Runtime | Node.js | >= 24.4.0 |
| API Framework | Express.js | 4.22.1 |
| ORM | Sequelize | 3.35.1 |
| Database | PostgreSQL | 16.4 |
| Cache / Queue | Redis | 6.2 |
| Queue library | Kue | 0.11.6 |
| Message broker | Kafka | (kafkajs 2.2.4) |
| Search | Elasticsearch | 7.13.0 |
| Storage | AWS S3 / Minio (local) | — |
| Frontend (legacy) | AngularJS | 1.8.3 |
| Frontend (modern) | React | 19 |
| Logging | Bunyan | — |

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631308402 · **repo:** `tms/implementation/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

