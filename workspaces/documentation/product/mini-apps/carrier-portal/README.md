---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632062083
source_type: confluence
---
# Carrier Portal — Портал бронирования для перевозчика

## Назначение

Carrier Portal — публичная форма бронирования, через которую перевозчик может создать заявку на перевозку (Transport Request / Booking) от имени грузоотправителя. Страница содержит калькулятор стоимости в реальном времени, основанный на ценовых правилах (`costRules`) конкретного перевозчика.

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн | `/carrier/:token` |
| Аутентификация | `token` — уникальный carrier-токен. Сервер передаёт его напрямую в `window.token` через `carrier-app.ejs`. JWT не генерируется — Apollo Client использует токен как Bearer в заголовке |
| Данные в `window` | `window.token` |

**Типичный сценарий:** грузоотправитель настраивает страницу перевозчика в TMS и отправляет ссылку своему партнёру-перевозчику. Перевозчик открывает ссылку и заполняет форму — без создания аккаунта.

## Тип пользователя

Перевозчик (транспортная компания) — партнёр грузоотправителя. Нет аккаунта в Shiptify.

## Структура интерфейса

| Состояние | Компонент | Описание |
|---|---|---|
| Форма бронирования (по умолчанию) | `Sidebar` + `Form` | Левая панель с информацией о маршруте и ценой; правая — форма заполнения |
| Успешная отправка | `ThankYou` (route: `thanks`) | Экран подтверждения после создания бронирования |

## Поля формы

- Название отгрузки
- Адрес отправки / назначения (Google Places + поиск по адресам грузоотправителя)
- Даты и время отправки/прибытия (с диапазонами, валидируемыми против рабочих часов перевозчика `from_time_start/end`, `dest_time_start/end`)
- Режим перевозки (по умолчанию: Road)
- Типы и количество груза + специфика
- Общий вес
- Email заявителя
- Инструкции
- Рассчитанная цена (отображается автоматически по ценовым правилам `costRules`)

## Валидация

- Временные ограничения рабочих часов (`hour_range`, `from_time_start/end`, `dest_time_start/end`)
- Проверка ZIP-кода получателя по списку `available_zip_codes` из `carrierRule`
- Обязательность типа груза и ненулевого количества
- Формат email через `EMAIL_PATTERN`

## GraphQL-операции

| Операция | Тип | Назначение |
|---|---|---|
| `carrier` | query | Идентификация перевозчика: id, name, logo |
| `carrierPage` | query | Параметры страницы: ценовые правила (`carrierRule`), рабочие часы, duration |
| `shipmentModes` | query | Список режимов перевозки |
| `shipmentSpecificities` | query | Список специфик груза |
| `shipmentRequestContentTypes` | query | Типы содержимого груза |
| `addresses(shipper_id, str)` | query | Поиск по адресам грузоотправителя |
| `googlePlacesDetails(place_id)` | query | Детали адреса из Google Places |
| `newBooking(input)` | mutation | Создание бронирования / заявки на перевозку |
| `newAddress(input)` | mutation | Добавление нового адреса (при необходимости) |

## Поддерживаемые языки

17 языков (те же, что в Driver App): FR, EN, ES, PL, IT, DE, PT, RO, SK, CS, NL, TR, RU, JA, ZH, KO, TH.

## Технический стек

- React 19 + Redux Toolkit 2
- Apollo Client 4
- react-intl 7
- react-day-picker 9 (выбор дат)
- Webpack 5 + SWC
- SCSS

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.carrier-portal`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 632062083 · **repo:** `mini-apps/carrier-portal/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

