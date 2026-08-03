# Qorgan — Полная инструкция по запуску на компьютере

Этот документ содержит пошаговую инструкцию для запуска Qorgan на вашем компьютере. Поддерживаются **Windows**, **macOS** и **Linux**.

---

## 1. Требования

| Компонент | Версия | Зачем |
|-----------|--------|-------|
| Python | 3.9+ | Бэкенд (Flask) и ML-детекция (YOLO) |
| Node.js | 18+ | Web-приложение (React + Vite) |
| npm | 8+ | Управление пакетами фронтенда |
| Git | любой | Клонирование репозитория |
| Браузер | Chrome / Firefox / Safari | Просмотр веб-приложения |
| Камера (опционально) | USB / RTSP | Реальная детекция оружия |

### Как проверить версии

```bash
python3 --version    # должно быть 3.9+
node --version       # должно быть 18+
npm --version
git --version
```

**Windows:** скачайте Python с [python.org](https://www.python.org/downloads/) и Node.js с [nodejs.org](https://nodejs.org/).

**macOS:** используйте Homebrew:
```bash
brew install python3 node
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm git
```

---

## 2. Клонирование репозитория

```bash
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN
```

---

## 3. Установка зависимостей

### 3.1 Автоматическая установка (рекомендуется)

```bash
./scripts/setup.sh
```

Этот скрипт автоматически установит:
- Python-зависимости для бэкенда (Flask, YOLO, OpenCV, ONNX Runtime)
- npm-пакеты для веб-приложения (React, Vite, TypeScript)

### 3.2 Ручная установка (если скрипт не сработал)

**Бэкенд:**
```bash
cd apps/backend
pip3 install -r requirements.txt
cd ../..
```

**Веб-приложение:**
```bash
cd apps/web
npm install
cd ../..
```

---

## 4. Запуск (2 терминала)

### Терминал 1 — Бэкенд (Python/Flask + ML-детекция)

```bash
cd apps/backend
ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py
```

Ожидается вывод: `Running on http://0.0.0.0:5001`

**Параметры запуска:**

| Переменная | Значение | Описание |
|-----------|----------|----------|
| `ENABLE_DETECTION=1` | 1 или 0 | Включить/выключить ML-детекцию |
| `DEMO_SEED=1` | 1 или 0 | Создать демо-данные (аккаунт, инциденты) |
| `CONFIDENCE_THRESHOLD` | 0.30–0.50 | Порог уверенности детекции (по умолчанию 0.35) |
| `PERSISTENCE_FRAMES` | 2–3 | Кол-во кадров для подтверждения детекции |
| `ALERT_COOLDOWN_SECONDS` | 10 | Минимальный интервал между алертами (сек) |
| `PORT` | 5001 | Порт бэкенда |

**Пример с настройками:**
```bash
ENABLE_DETECTION=1 DEMO_SEED=1 CONFIDENCE_THRESHOLD=0.30 PERSISTENCE_FRAMES=3 python3 app.py
```

### Терминал 2 — Веб-приложение (React)

```bash
cd apps/web
npm run dev -- --host 0.0.0.0
```

Ожидается вывод: `Local: http://localhost:5173/`

Откройте этот адрес в браузере.

---

## 5. Демо-аккаунт для входа

При запуске с `DEMO_SEED=1` автоматически создаётся аккаунт:

| Поле | Значение |
|------|----------|
| Email | `demo.guard@qorgan.local` |
| Пароль | `DemoPass123` |
| Роль | guard |
| School code | `SCH-1234` |

### Как зарегистрировать нового пользователя

1. Откройте `http://localhost:5173`
2. Нажмите **Create a new account**
3. Заполните: Email, пароль (мин. 8 символов), School code (`SCH-1234`), Role → **Guard**
4. Нажмите **Register**

---

## 6. Подключение камеры

### 6.1 USB-камера (самый простой способ)

При запуске с `DEMO_SEED=1` автоматически создаётся камера с источником `0` (первая USB-камера компьютера).

В интерфейсе нажмите **Start** рядом с камерой — запустится детекция.

### 6.2 На macOS — разрешение на камеру

**Системные настройки** → **Конфиденциальность и безопасность** → **Камера** → включите доступ для **Terminal** (или **iTerm**, **VS Code Terminal**).

### 6.3 RTSP-камера (сетевая камера)

Измените `stream_url` камеры в базе данных или через API. Формат:
```
rtsp://192.168.1.100:554/stream1
```

### 6.4 Тест камеры без бэкенда

```bash
python3 tools/vision/camera_test.py
```

Откроется окно с камерой. Нажмите **q** для выхода.

---

## 7. Управление камерами (новая функция)

После входа как **Guard** откройте страницу **School Safety**. Там появится:

1. **Список камер** — каждая камера с кнопками **Start** / **Stop**
2. **Статус** — зелёный `● ON` или серый `○ OFF`
3. **Селектор** — нажмите на имя камеры чтобы выбрать её для просмотра

### API-эндпоинты (для разработчиков)

```bash
# Получить статус всех камер
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5001/api/cameras/status

# Запустить детекцию на камере ID=1
curl -X POST -H "Authorization: Bearer <TOKEN>" http://localhost:5001/api/cameras/1/start

# Остановить детекцию на камере ID=1
curl -X POST -H "Authorization: Bearer <TOKEN>" http://localhost:5001/api/cameras/1/stop
```

---

## 8. Проверка работы

### 8.1 Health check

```bash
curl http://127.0.0.1:5001/api/health
```

Ожидается: `{"message":"School Safety API is running","status":"ok"}`

### 8.2 Симуляция алерта об оружии

```bash
curl -X POST http://127.0.0.1:5001/api/test/simulate-weapon-alert \
  -H "Content-Type: application/json" \
  -d '{"description":"Test: Knife detected","location":"Main Hall","confidence":0.95}'
```

### 8.3 Полная проверка системы

```bash
python3 scripts/prove_system.py
```

---

## 9. Docker (альтернативный запуск)

Если у вас установлен Docker, можно запустить всё в одном контейнере:

### 9.1 Настройка .env

```bash
cp apps/backend/.env.example apps/backend/.env
```

Отредактируйте `apps/backend/.env`:
```
QORGAN_PROFILE=centers
APP_ENV=production
SECRET_KEY=ваша_случайная_строка_минимум_32_символа
WS_API_KEY=ваш_секретный_ключ
BOOTSTRAP_CAMERA_STREAM=0
```

### 9.2 Запуск

```bash
docker compose up --build -d
```

### 9.3 Проверка

```bash
curl http://127.0.0.1:5001/api/health
```

---

## 10. Решение проблем

### Бэкенд не запускается

```bash
# Ошибка: модуль не найден
pip3 install -r apps/backend/requirements.txt --force-reinstall

# Ошибка: порт занят
lsof -ti :5001 | xargs kill   # macOS/Linux
netstat -ano | findstr :5001 # Windows → taskkill /PID <PID> /F
```

### Веб-приложение не подключается к бэкенду

Создайте файл `apps/web/.env`:
```
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### Камера не открывается

- **Windows:** запустите Terminal от имени администратора
- **macOS:** дайте разрешение в Системных настройках → Конфиденциальность → Камера
- **Linux:** добавьте пользователя в группу `video`: `sudo usermod -aG video $USER`

### Ошибка ONNX / Ultralytics

```bash
pip3 install --upgrade ultralytics onnx onnxruntime
```

### Медленная детекция

- Запустите на GPU: `pip3 install ultralytics[onnx-gpu]`
- Уменьшите разрешение: `CONFIDENCE_THRESHOLD=0.30`
- Используйте модель поменьше: замените `best.onnx` на `yolov8n.onnx`

---

## 11. Структура проекта

```
QORGAN/
├── apps/
│   ├── backend/          # Flask API + ML-детекция
│   │   ├── app.py        # Главный файл (маршруты, WebSocket, инициализация)
│   │   ├── detection_service.py  # YOLO детекция (per-camera threads)
│   │   ├── requirements.txt       # Python зависимости
│   │   └── .env.example          # Шаблон переменных окружения
│   ├── web/              # React веб-приложение
│   │   ├── src/          # Исходный код (страницы, компоненты, сервисы)
│   │   ├── package.json  # npm зависимости
│   │   └── .env          # Переменные фронтенда (создать вручную)
│   └── mobile/           # Expo React Native мобильное приложение
├── models/               # ONNX модели детекции
│   ├── best.onnx         # Основная модель (knife, pistol, rifle, axe, ...)
│   └── ...
├── scripts/              # Скрипты запуска и тестирования
├── tools/vision/         # Утилиты для работы с камерой
├── data/                 # Сохранённые кадры детекции
├── docs/                 # Документация
├── docker-compose.yml    # Docker конфигурация
└── Dockerfile            # Docker образ
```

---

## 12. Краткая шпаргалка

```bash
# Клонирование
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN

# Установка (один раз)
./scripts/setup.sh

# Запуск (2 терминала)
# Терминал 1:
cd apps/backend && ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py

# Терминал 2:
cd apps/web && npm run dev -- --host 0.0.0.0

# Войти: demo.guard@qorgan.local / DemoPass123
# Открыть: http://localhost:5173
```
