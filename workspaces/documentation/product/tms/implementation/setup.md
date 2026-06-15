---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631931044
source_type: confluence
---
# Локальный запуск TMS

## Минимальные требования (железо)

| Ресурс | Минимум | Рекомендуется |
|--------|---------|--------------|
| RAM | 8 GB | 16 GB |
| CPU | 4 ядра | 8 ядер |
| Диск | 20 GB свободно | 50 GB SSD |
| OS | macOS / Linux / Windows (WSL2) | macOS / Linux |
| Node.js | >= 24.4.0 | LTS |
| Docker | >= 24.0 | latest |

---

## Способ 1: run-local (рекомендуемый)

Управляется через `just` (task runner). Поднимает все сервисы в Docker.

### Инструменты

```bash
# Установить just
brew install just          # macOS
scoop install just         # Windows
sudo snap install --edge just  # Linux

# Установить Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### Структура run-local

```
workspaces/run-local/
├── compose-core.yaml     ← PostgreSQL, Redis, (Kafka опционально)
├── compose-back.yaml     ← Backend, mini-apps, back-office, microservices
├── compose-front.yaml    ← Frontend proxy
├── .env                  ← переменные окружения
└── justfile              ← команды управления
```

### Запуск

```bash
cd workspaces/run-local

# 1. Инициализация (первый раз — скачивает дамп БД из S3)
just init-dev-env

# 2. Запустить core-сервисы (PostgreSQL + Redis)
just run core

# 3. Запустить backend
just start back

# 4. Запустить frontend (опционально)
just watch
```

### Порты после запуска

| Сервис | Хост-порт | Описание |
|--------|-----------|---------|
| Frontend (proxy) | **8080** | Основной UI → http://localhost:8080 |
| Backend API | **3000** | Backend proxy |
| Backend API (прямой) | **3013** | Express.js API |
| Worker | **3018** | Kue Worker |
| Debug API | 9229 | Node.js debugger |
| Debug Worker | 9230 | Worker debugger |
| PostgreSQL | **15432** | `postgres:linux@localhost:15432/shiptify_dev` |
| Redis | **16379** | `redis://localhost:16379` |
| Kafka console | 9080 | (если включён) |
| Minio API | 9000 | S3-совместимое хранилище |
| Minio console | 9001 | http://localhost:9001 |

### Переменные окружения

```env
# workspaces/run-local/.env (основные)
POSTGRES_MAIN_DB=shiptify_dev
POSTGRES_MAIN_USER=postgres
POSTGRES_MAIN_PASSWORD=linux
POSTGRES_MAIN_URL=postgresql://postgres:linux@postgres-main:5432/shiptify_dev

REDIS_MAIN_URL=redis://redis-main:6379/

# Опциональные сервисы
COMPOSE_KAFKA=        # оставить пустым чтобы отключить
COMPOSE_MINIO=        # оставить пустым чтобы отключить
```

---

## Способ 2: ручной запуск (без Docker для сервисов)

### Требования

```bash
# 1. PostgreSQL 16
brew install postgresql@16

# 2. Redis 6
brew install redis

# 3. Node.js через nvm
nvm install 24.4.0
nvm use 24.4.0
```

### Настройка Backend

```bash
cd workspaces/backend

# Установить зависимости
npm install

# Конфигурация (НЕ редактировать default.json!)
cp config/default.json config/local.json
# Отредактировать local.json:
```

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "shiptify_dev",
    "user": "postgres",
    "password": "your-password"
  },
  "redis": {
    "host": "127.0.0.1",
    "port": 6379
  }
}
```

### База данных

```bash
# Создать базу данных
psql -U postgres -c "CREATE DATABASE shiptify_dev;"

# Загрузить дамп (попросить у команды)
psql -h localhost -U postgres shiptify_dev < dump.sql

# Запустить миграции
cd workspaces/migrations
npm install
npm run migrate
```

### Запуск сервисов

```bash
# Terminal 1: API сервер
cd workspaces/backend
npm run dev          # порт 3013, без авто-перезагрузки
npm run dev:watch    # с авто-перезагрузкой (рекомендуется)
npm run dev:watch-debug  # + Node.js debugger (порт 9229)

# Terminal 2: Worker
npm run worker       # порт 3018
npm run worker:watch # с авто-перезагрузкой

# Terminal 3: Kue Dashboard (мониторинг очередей)
npm run kue-dashboard  # http://localhost:9128

# Terminal 4: Frontend
cd workspaces/frontend
npm install
npm run dev          # http://localhost:8080
```

---

## База данных: первичная настройка

```bash
# Проверить подключение
psql -h localhost -p 15432 -U postgres -d shiptify_dev

# Посмотреть таблицы
\dt

# Количество таблиц (~466)
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### Инструмент миграций

```
workspaces/migrations/
```

- Использует **Umzug v2.3.0**
- `npm run migrate` — применить все новые миграции
- `npm run migrate:undo` — откатить последнюю
- `npm run migrate:create` — создать новую

---

## Опциональные сервисы

| Сервис | Нужен для | Как включить |
|--------|-----------|-------------|
| Kafka | Микросервисы, события | `COMPOSE_KAFKA=kafka` в `.env` |
| Elasticsearch | Поиск (disabled по умолчанию) | Включить в `config/local.json` |
| Minio | S3 файлы локально | `COMPOSE_MINIO=minio` в `.env` |
| VictoriaLogs | Логи | Включить в `compose-core.yaml` |

---

## Проверка что всё работает

```bash
# API отвечает
curl http://localhost:3013/health

# Frontend отвечает
curl http://localhost:8080

# PostgreSQL
psql -h localhost -p 15432 -U postgres -c "SELECT 1"

# Redis
redis-cli -p 16379 ping  # → PONG

# Kue Dashboard
open http://localhost:9128
```

---

## Частые проблемы

| Проблема | Решение |
|---------|---------|
| `ECONNREFUSED 5432` | PostgreSQL не запущен. `just run core` или `brew services start postgresql@16` |
| `ECONNREFUSED 6379` | Redis не запущен. `brew services start redis` |
| `Error: Cannot find module` | `npm install` не выполнен |
| Migration failed | Проверить что БД существует: `psql -l` |
| Port 3013 already in use | `lsof -i :3013` → убить процесс |
| Node version mismatch | `nvm use 24.4.0` |

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.setup`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631931044 · **repo:** `tms/implementation/setup.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

