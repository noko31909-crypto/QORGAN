# Как запустить весь проект и протестировать все функции

Пошаговая инструкция: установка, запуск бэкенда и web app, проверка каждой функции.

---

## Требования

- **Python 3.9+** (для бэкенда)
- **Node.js 18+** и **npm** (для web app)
- Современный браузер: Chrome, Safari или Firefox

---

## 1. Один раз: установка

### 1.1 Зависимости бэкенда

```bash
cd apps/backend
pip3 install -r requirements.txt
cd ../..
```

### 1.2 Зависимости web app

```bash
cd apps/web
npm install
cd ../..
```

### 1.3 Если backend и web app запускаются на разных хостах

Web app по умолчанию подключается к backend на том же хосте. Если нужно указать адрес вручную, создайте файл `.env` в `apps/web/`:

```bash
# apps/web/.env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### 1.4 Модель детекции

Модель `models/best.onnx` уже находится в репозитории. Если бэкенд не видит модель — укажите путь явно через переменную `MODEL_PATH`.

---

## 2. Запуск проекта

### Вариант A: один скрипт

```bash
./scripts/start_app.sh
```

### Вариант B: вручную в двух терминалах

**Терминал 1 — бэкенд:**

```bash
cd apps/backend
ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py
```

Должно появиться: `Running on http://0.0.0.0:5001`.

Если порт занят:
```bash
lsof -ti :5001 | xargs kill
```

**Терминал 2 — web app:**

```bash
cd apps/web
npm run dev -- --host 0.0.0.0
```

Откройте адрес, который Vite покажет в терминале, обычно `http://localhost:5173`.

---

## 3. Проверка, что бэкенд жив

```bash
curl http://127.0.0.1:5001/api/health
```

Ожидается: `{"message":"School Safety API is running","status":"ok"}`.

---

## 4. Демо-аккаунт

При запуске с `DEMO_SEED=1` автоматически создаётся тестовый аккаунт:

| Поле | Значение |
|---|---|
| Email | demo.guard@qorgan.local |
| Пароль | DemoPass123 |
| Роль | guard |
| School code | SCH-1234 |

---

## 5. Тестирование функций

### 5.1 Регистрация и вход

1. В web app: **Create a new account**.
2. Заполните: Email, пароль (минимум 8 символов), **School code** (`SCH-1234`), **Role** — Guard или Student.
3. Или войдите через демо-аккаунт.

**Проверка:** главный экран с карточками (Live, SOS, Map, Notifications).

### 5.2 SOS

1. Вкладка **SOS** → большая красная кнопка.
2. Диалог подтверждения → подтвердить.

**Проверка:** диалог об отправке, в логах бэкенда — инцидент типа `sos_alert`.

### 5.3 Симуляция алерта об оружии (без камеры)

```bash
python3 scripts/test_alert.py
```

Или вручную:
```bash
curl -X POST http://127.0.0.1:5001/api/test/simulate-weapon-alert   -H "Content-Type: application/json"   -d '{"description":"Test: Knife detected","location":"Main Hall","confidence":0.95}'
```

**Проверка в web app:**
- Красный диалог «Оружие обнаружено»
- Вкладка **Map** — красный маркер и баннер «Опасность: Main Hall»
- Вкладка **Notifications** — новая запись

### 5.4 Детекция с реальной камеры

1. Запустите бэкенд с `ENABLE_DETECTION=1`.
2. На macOS разрешите доступ к камере: **Системные настройки → Конфиденциальность → Камера → Terminal**.
3. Направьте камеру на фото оружия или ножа.
4. При confidence ≥ 0.5 сработает алерт.

Cooldown между алертами: **3 секунды**. Кадры сохраняются в `data/detection_images/`.

Только тест камеры без бэкенда:
```bash
python3 tools/vision/camera_test.py
```
Выход: клавиша **q**.

### 5.5 Карта и рекомендации

Вкладка **Map** после симуляции алерта:
- Красный маркер угрозы
- Баннер «Опасность: …»
- Кнопка **«Что делать? Рекомендации»** → список советов

### 5.6 First Aid и Lessons

Главный экран → карточки **First Aid** / **Lessons**.

- First Aid: поиск по симптомам, список процедур (CPR, Control Bleeding и др.), детали при нажатии.
- Lessons: поиск по видео, список уроков (Fire Safety, Lockdown и др.).

### 5.7 School Safety (для охранников)

Войдите как Guard → карточка **School Safety**.

Показывает: список камер, статусы инцидентов, кнопки Ambulance/Police, шкала безопасности. При weapon_alert — обновление данных.

### 5.8 Уведомления

Вкладка **Notifications**:
- Список алертов после симуляции
- Нажатие на запись → пометить как прочитанное

---

## 6. Шпаргалка по командам

```bash
# Установка (один раз)
./scripts/setup.sh

# Запуск всего
./scripts/start_app.sh

# Или вручную:
# Терминал 1 — бэкенд
cd apps/backend && ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py

# Терминал 2 — web app
cd apps/web && npm run dev -- --host 0.0.0.0

# Проверка бэкенда
curl http://127.0.0.1:5001/api/health

# Симуляция алерта
python3 scripts/test_alert.py

# Проверка системы
python3 scripts/prove_system.py
```

---

## 7. Сводная таблица функций

| Функция | Где тестировать | Как проверить |
|---|---|---|
| Регистрация / вход | Welcome → Create account / Log in | Переход на главный экран |
| SOS | Вкладка SOS, красная кнопка | Диалог об отправке |
| Алерт об оружии | `scripts/test_alert.py` или curl | Диалог + запись в Notifications |
| Карта угрозы | Map после алерта | Красный маркер, баннер |
| Рекомендации | Map → «Что делать?» | Список советов открывается |
| First Aid / Lessons | Главный экран → карточки | Списки и детали работают |
| School Safety | Вход как Guard → карточка | Экран с камерами и статусами |
| Уведомления | Вкладка Notifications | Список после алерта, отметка прочитано |
| Камера + детекция | ENABLE_DETECTION=1 + камера | Алерт при обнаружении оружия |
| Только камера (тест) | `python3 tools/vision/camera_test.py` | Окно с боксами, выход — q |
