---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633143313
source_type: confluence
---
# Driver App — Мобильное приложение для водителя

## Назначение

Driver App — мобильно-ориентированная SPA для водителей грузовиков. Водитель получает ссылку (по SMS или email) и может без регистрации:
- Просматривать детали своей отгрузки и список точек маршрута
- Подтвердить прибытие в контрольную точку
- Предупредить об ожидаемой задержке, сдвинув плановое время
- Сфотографировать и загрузить CMR-документ

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн | `/driver/:driverToken/shipments/:shipmentId` |
| Аутентификация | `driverToken` — уникальный токен из БД, привязан к водителю. Сервер проверяет токен через middleware `loadDriver`, генерирует JWT и записывает его в cookie |
| Данные в `window` | `window.driverToken`, `window.shipmentId`, `window.currUser`, `window.carrier` — инжектируются сервером через EJS-шаблон `driver-app.ejs` |
| Устаревший маршрут | `/old-driver/:driverToken` — legacy-маршрут для старой версии приложения |

**Типичный сценарий:** основной TMS генерирует `driverToken`, TMS или автоматизация отправляет водителю SMS с ссылкой вида `https://app.shiptify.com/driver/abc123xyz/shipments/45678`.

## Тип пользователя

Водитель грузового транспорта. Не имеет аккаунта в Shiptify TMS. Работает с телефона.

## Экраны (state machine)

| Экран (`SCREENS`) | Описание |
|---|---|
| `SHIPMENT` | Главный экран: детали отгрузки, список контрольных точек, кнопка загрузки CMR |
| `TRACKING_POINT` | Детальный вид конкретной остановки: адрес, плановое и фактическое время |
| `TRACKING_POINT_PREVENT_DELAY` | Слайдер для выбора нового планового времени прибытия |
| `TRACKING_POINT_PREVENT_DELAY_CONFIRM` | Подтверждение перед сохранением задержки |
| `TRACKING_POINT_CONFIRM` | Подтверждение физического прибытия в точку |
| `CONFIRMED_VIEW` | Экран успеха с сообщением для грузоотправителя |
| `CMR_PICTURE_RESULT` | Превью фото перед загрузкой в систему |

## Ключевые действия и GraphQL-операции

| Действие | GraphQL-операция | Описание |
|---|---|---|
| Загрузка отгрузки | `query driverShipmentById(id, driverToken)` | Загружает полные данные: адреса, содержимое груза, список точек маршрута с адресами |
| Подтверждение прибытия | `mutation updateTrackingPoint(input)` | Записывает `realDate` и `realTime` в контрольную точку |
| Предупреждение о задержке | `mutation updateTrackingPoint(input)` | Обновляет `plannedDate` и `plannedTime` |
| Загрузка CMR | `mutation addAttachments(input)` | `att_type: 'cmr'`, `scope: 'tracking'`, файл предварительно загружается в S3 через presigned URL |

## Загрузка файлов (CMR)

Процесс состоит из двух шагов:
1. Браузер запрашивает `GET /opts/s3signedUrl?objectName=...&contentType=...` — сервер возвращает presigned S3 URL
2. Браузер делает `PUT` прямо на S3 с отображением прогресса через `XMLHttpRequest.upload.onprogress`
3. После успешной загрузки — вызов mutation `addAttachments` с URL файла

Файл называется `CMR.<extension>`, тип вложения — `cmr`, уровень доступа — `PUBLIC_ACCESS`.

## Поддерживаемые языки

17 языков: французский, английский, испанский, польский, итальянский, немецкий, португальский, румынский, словацкий, чешский, нидерландский, турецкий, русский, японский, китайский (мандаринский), корейский, тайский.

Язык определяется автоматически из браузера или выбирается вручную.

## Технический стек

- React 19 + Redux Toolkit 2
- Apollo Client 4 (`@apollo/client`)
- react-intl 7 (i18n)
- Webpack 5 + SWC
- SCSS

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.driver-app`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 633143313 · **repo:** `mini-apps/driver-app/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

