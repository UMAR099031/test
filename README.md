# Okurmen Exams (HTML/CSS/JS)

Полноценная веб‑платформа для онлайн‑экзаменов с:
- разовым входом ученика по коду (JWT)
- прохождением экзамена **только 1 раз**
- автоподсчётом и сохранением результатов
- админ‑панелью (таблица результатов, поиск/фильтр, блокировка, удаление)

## Структура
- `frontend/` — адаптивный UI (HTML/CSS/JS)
- `backend/` — Node.js + Express + MongoDB + JWT

## Требования
- Node.js 18+

## Запуск (локально)
- Backend env:
- файл уже создан: `backend/.env`
- при желании отредактируй `JWT_SECRET`

3) Установка и старт backend:
```bash
cd backend
npm.cmd install
npm.cmd run dev
```

4) Открой сайт:
- `http://localhost:5000`

Backend отдаёт `frontend/` как статику, поэтому отдельный запуск фронтенда не нужен.

## Хранилище данных (без MongoDB)
Данные сохраняются в JSON‑файл:
- `backend/db/data.json`

## Доступы админа
По умолчанию (из `backend/.env`):
- login: `admin`
- password: `admin12345`

Админ создаётся автоматически при старте сервера (если такого логина ещё нет).

## Важно про «1 раз»
- На фронтенде кнопка «Начать» блокируется, если экзамен уже пройден.
- На бэкенде стоит жёсткая проверка и уникальный индекс на результат (`userId + examType`), повторная отправка вернёт `409` и сообщение **"Вы уже прошли этот экзамен"**.

## Разовый вход ученика по коду
- Админ в админ‑панели нажимает **«Сгенерировать коды»** и раздаёт коды ученикам.
- Ученик на странице входа выбирает вкладку **«Ученик (код)»**, вводит имя/фамилию и код.
- Каждый код можно использовать только один раз (повторный вход по коду вернёт ошибку).

## API (кратко)
- `POST /api/auth/register` `{name,surname,login,password}`
- `POST /api/auth/login` `{login,password}`
- `POST /api/auth/code-login` `{name,surname,code}`
- `GET /api/auth/me` (Bearer token)
- `GET /api/exams` (Bearer token)
- `GET /api/exams/:type` (Bearer token)
- `POST /api/exams/:type/submit` `{answers:number[]}` (Bearer token)
- `GET /api/results/my` (Bearer token)
- `GET /api/results/my/:examType` (Bearer token)

Админ:
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/block` `{isBlocked:boolean}`
- `GET /api/admin/results?examType=html|css|js&q=...`
- `DELETE /api/admin/results/:id`
- `POST /api/admin/codes` `{count}`
- `GET /api/admin/codes`
- `PATCH /api/admin/codes/:code/disable` `{isDisabled}`
