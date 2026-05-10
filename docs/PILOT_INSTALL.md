# Установка пилотной версии Qorgan после публикации на GitHub

Этот документ описывает, **что сделать на сервере**, если код лежит в GitHub и нужно развернуть **пилот в школе** (не демо для разработки).

Локальный быстрый запуск с демо-данными по-прежнему в [RUN_AND_TEST.md](RUN_AND_TEST.md). Для пилота используйте настройки ниже.

## Учебные центры: реальный запуск модели

Задайте **`QORGAN_PROFILE=centers`** (или `training` / `center`) — тогда по умолчанию:

- детекция **включена**, демо-сиды **выключены**;
- подмена «сломанной» камеры демо-роликом **запрещена**, пока явно не включите `ALLOW_DEMO_VIDEO_FALLBACK=1`;
- пустая БД **не** создаёт автоматически веб-камеру `0` — задайте **`BOOTSTRAP_CAMERA_STREAM`** (например `0` или `rtsp://...`) и при необходимости `DEFAULT_SCHOOL_CODE` в `apps/backend/.env` (шаблон: [`.env.example`](../apps/backend/.env.example)).

Запуск с подхватом `.env`: **`./scripts/start_centers.sh`**.

**Docker** (из корня репозитория):

```bash
cp apps/backend/.env.example apps/backend/.env
# заполните SECRET_KEY, CORS_ALLOWED_ORIGINS, WS_API_KEY, BOOTSTRAP_CAMERA_STREAM

docker compose up --build -d
```

Данные: volume `qorgan-db` (SQLite), `qorgan-detections` (сохранённые кадры). Проверка: `GET /api/health` — в ответе поля `profile`, `centers_deploy`, `detection.model_file_present`.

---

## 1. Что понадобится

| Требование | Зачем |
|------------|--------|
| Сервер или ПК (Linux/macOS), Python **3.9+** | Бэкенд и опционально детекция с камеры |
| Node.js **18+** и npm | Сборка веб-приложения (`apps/web`) |
| Домен и **HTTPS** (nginx, Caddy и т.п.) | Безопасный доступ из браузера школы; в production обязателен явный CORS |
| Файл модели `models/best.onnx` в репозитории | Детекция; при другом пути задайте `MODEL_PATH` |

---

## 2. Клонирование с GitHub

```bash
git clone https://github.com/<ваш-орг>/<ваш-репозиторий>.git
cd <ваш-репозиторий>
```

---

## 3. Установка зависимостей (один раз)

Из **корня** репозитория:

```bash
./scripts/setup.sh
```

Скрипт ставит Python-зависимости из `apps/backend/requirements.txt` и npm-пакеты из `apps/web`.

---

## 4. Пилотный school code

Перед регистрацией пользователей зафиксируйте **один код школы** (например `SCH-PILOT-01`). Все участники пилота вводят **один и тот же** код при создании аккаунта в приложении.

---

## 5. Переменные окружения бэкенда (обязательно для пилота)

Бэкенд: каталог `apps/backend`, точка входа `app.py`, порт по умолчанию **5001**.

| Переменная | Обязательность | Описание |
|------------|----------------|----------|
| `QORGAN_PROFILE` | Для учебных центров: **`centers`** | Включает разумные умолчания: детекция по умолчанию **on**, демо **off**, без автоподмены камеры демо-видео. |
| `APP_ENV` | Для пилота: **`production`** | Включает проверки: свой `SECRET_KEY` (≥32 символов) и явный `CORS_ALLOWED_ORIGINS`. |
| `SECRET_KEY` | Да | Случайная строка **не короче 32 символов** (подпись JWT). |
| `CORS_ALLOWED_ORIGINS` | Да | Origin веб-приложения, например `https://app.school.edu.kz`. Несколько значений — через **запятую** без пробелов или с пробелами по вашему окружению (как в коде: split по запятой). |
| `DEMO_SEED` | Для пилота: **`0`** | Отключает демо-аккаунт и демо-инциденты. С `QORGAN_PROFILE=centers` по умолчанию уже выключено. |
| `WS_API_KEY` | Настоятельно свой ключ | Должен **совпадать** с `VITE_WS_API_KEY` во фронте, иначе WebSocket не подключится. |
| `ENABLE_DETECTION` | С центрами по умолчанию **on** | Включает сервис детекции при старте. |
| `BOOTSTRAP_CAMERA_STREAM` | Рекомендуется при `centers` | Первая камера при пустой БД: `0`, `1`, или `rtsp://...`. |
| `DEFAULT_SCHOOL_CODE` | По желанию | Код организации для bootstrap-камеры (по умолчанию `SCH-1234`). |
| `MODEL_PATH` | По желанию | Путь к ONNX, если не `models/best.onnx` от корня репо. |
| `ALLOW_SIMULATE_WEAPON_ALERT` | Только учения | В `APP_ENV=production` эндпоинт симуляции алерта выключен, пока не задать `1`. |

Дополнительно для настройки чувствительности (см. `apps/backend/app.py`): `CONFIDENCE_THRESHOLD`, `ALERT_COOLDOWN_SECONDS`, `PERSISTENCE_FRAMES`, `MIN_BBOX_AREA_RATIO`, `MAX_BBOX_AREA_RATIO`.

Пример запуска (подставьте свои значения):

```bash
cd apps/backend
export QORGAN_PROFILE=centers
export APP_ENV=production
export SECRET_KEY='замените_на_длинную_случайную_строку_минимум_32_символа'
export CORS_ALLOWED_ORIGINS='https://ваш-домен-приложения'
export WS_API_KEY='замените_на_секрет'
export BOOTSTRAP_CAMERA_STREAM=0
python3 app.py
```

Для постоянной работы удобнее оформить те же переменные в `systemd` unit, `docker-compose` или `.env` с загрузкой перед стартом.

---

## 6. HTTPS и прокси

Браузер школы должен открывать приложение по **HTTPS**. Обычная схема:

1. Поднять бэкенд на `127.0.0.1:5001`.
2. Настроить **reverse proxy** (nginx/Caddy): снаружи `https://api.ваш-домен` → внутрь `http://127.0.0.1:5001`.
3. В `CORS_ALLOWED_ORIGINS` указать **точный** origin фронта (схема + хост + порт, если не 443).

База данных пилота по умолчанию: SQLite-файл `apps/backend/instance/school_safety.db`. Делайте резервные копии этого файла.

---

## 7. Сборка и развёртывание веб-приложения

В каталоге `apps/web` **до** `npm run build` создайте файл `.env` (не коммитьте секреты в GitHub — добавьте `.env` в `.gitignore`, если его там ещё нет):

```bash
VITE_API_BASE_URL=https://api.ваш-домен/api
VITE_SOCKET_URL=https://api.ваш-домен
VITE_WS_API_KEY=тот_же_секрет_что_WS_API_KEY_на_бэкенде
```

Сборка:

```bash
cd apps/web
npm install
npm run build
```

Статика появится в `apps/web/dist`. Раздавайте её через nginx (или другой веб-сервер) по URL, который вы указали в `CORS_ALLOWED_ORIGINS`.

---

## 8. Первые пользователи

1. Откройте в браузере URL веб-приложения.
2. **Create account** / регистрация: email, пароль (как минимум 8 символов — см. правила API), роль **Guard** для охраны, **school code** пилота.
3. Демо-логин из документации (`demo.guard@qorgan.local`) **не создаётся**, если `DEMO_SEED=0`.

---

## 9. Проверка работоспособности

```bash
curl -s https://api.ваш-домен/api/health
```

Ожидается JSON со `status: ok`.

При запущенном локально бэкенде (для отладки) можно использовать сценарий из корня:

```bash
python3 scripts/prove_system.py
```

(скрипт ожидает API на `http://127.0.0.1:5001/api` — при пилоте за HTTPS подставьте свой URL или проверяйте через браузер и ручные действия).

---

## 10. Детекция с камерой

- Запускайте бэкенд с `ENABLE_DETECTION=1`.
- На сервере с камерой выдайте ОС разрешение на камеру для процесса Python (или настройте RTSP — в зависимости от вашей интеграции в `detection_service.py`).
- Кадры срабатываний по умолчанию сохраняются в `data/detection_images/` (от корня репозитория).

После пары дней пилота при необходимости меняйте `CONFIDENCE_THRESHOLD` и `ALERT_COOLDOWN_SECONDS`, чтобы снизить шум от ложных срабатываний.

---

## 11. Чего не делать в пилоте

- Не использовать для школы скрипт `./scripts/start_app.sh` «как есть»: в нём включены **`DEMO_SEED=1`** и демо-режим — это для разработки.
- Не публиковать в GitHub реальные `SECRET_KEY`, `WS_API_KEY` и продакшен-`.env`.
- Не оставлять открытым без ограничений тестовый эндпоинт симуляции алерта в публичном интернете без решения команды (см. `RUN_AND_TEST.md`).

---

## 12. Связанные документы

| Документ | Содержание |
|----------|------------|
| [RUN_AND_TEST.md](RUN_AND_TEST.md) | Локальный запуск, демо-аккаунт, пошаговая проверка функций |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектура, API, сокеты |
| [RESPONSIBLE_AI_AND_ETHICS.md](RESPONSIBLE_AI_AND_ETHICS.md) | Чеклист перед развёртыванием в школе |

---

## Краткий чеклист

1. `git clone` → `./scripts/setup.sh`  
2. Задать `APP_ENV=production`, `SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `DEMO_SEED=0`, `WS_API_KEY`  
3. HTTPS + прокси на порт 5001  
4. `.env` в `apps/web` → `npm run build` → раздать `dist`  
5. Зарегистрировать охрану с общим **school code**  
6. Бэкапы `instance/school_safety.db`  
7. При необходимости: `ENABLE_DETECTION=1` и настройка порогов
