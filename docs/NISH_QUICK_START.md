# 🚀 Qorgan: Быстрый старт для НИШ (Nazarbayev Intellectual Schools)

Вы сейчас в НИШ и вам нужно установить систему прямо сейчас. Вот пошаговая инструкция, как развернуть систему на сервере НИШ.

---

## Шаг 1: Подготовка сервера

Убедитесь, что на сервере (ПК) в НИШ установлено:
- **Ubuntu 22.04** (или macOS, если вы используете Mac)
- **Интернет-соединение** для клонирования кода
- **Подключение к камерам** (либо USB веб-камера, либо RTSP ссылки на IP-камеры НИШ)

---

## Шаг 2: Клонирование и установка

Откройте терминал на сервере в НИШ и выполните:

```bash
# 1. Скачиваем код
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN

# 2. Устанавливаем все зависимости (Python + Node.js)
./scripts/setup.sh
```

---

## Шаг 3: Настройка переменных

Создайте файл настроек. Мы используем режим для учебных центров.

```bash
cp apps/backend/.env.multicam.example apps/backend/.env
nano apps/backend/.env
```

**Вставьте в файл следующие настройки:**

```env
QORGAN_PROFILE=centers
APP_ENV=production
SECRET_KEY=nish_super_secret_key_12345678901234567890
CORS_ALLOWED_ORIGINS=*
DEMO_SEED=0
WS_API_KEY=nish_websocket_secret
ENABLE_DETECTION=1
DEFAULT_SCHOOL_CODE=NISH-PILOT-01

# Настройки для 30 камер
DETECTION_MAX_CAMERAS=30
DETECTION_MAX_WORKERS=8
DETECTION_FRAME_SKIP=2
DETECTION_MEMORY_LIMIT_MB=4000
DETECTION_FRAME_WIDTH=640
DETECTION_FRAME_HEIGHT=480
```
*(Сохраните файл: Ctrl+O, Enter, Ctrl+X)*

---

## Шаг 4: Запуск системы

Запустите бэкенд-сервер:

```bash
./scripts/start_centers.sh
```

Сервер запустится на порту `5001`.

Откройте **второй терминал** и запустите веб-интерфейс:

```bash
cd apps/web
npm run dev -- --host 0.0.0.0
```

---

## Шаг 5: Подключение и тестирование

1. Откройте браузер на ПК охранника в НИШ.
2. Перейдите по адресу: `http://localhost:5173` (или IP сервера:5173, если заходите с другого ПК).
3. Нажмите **"Create account"** (Создать аккаунт).
   - Email: `guard@nish.local`
   - Пароль: `NishGuard123`
   - Role: **Guard**
   - School Code: `NISH-PILOT-01`
4. Войдите в систему.
5. Перейдите в раздел **School Safety**.
6. Вы увидите список камер. **Нажмите Start** напротив той камеры, которую хотите мониторить.

---

## Шаг 6: Добавление реальных камер НИШ

Если вам нужно подключить IP-камеры НИШ (RTSP), вам нужно зарегистрировать их в базе данных.

Вы можете сделать это через Python-скрипт или консоль. Самый простой способ — вручную через код (если баз данных еще нет):

Отредактируйте файл `.env`, чтобы добавить RTSP ссылку при первом запуске:
```env
BOOTSTRAP_CAMERA_STREAM=rtsp://admin:password@192.168.1.100:554/stream
BOOTSTRAP_CAMERA_NAME=Вход в НИШ
BOOTSTRAP_CAMERA_LOCATION=Главный вход
```
И перезапустите сервер.

---

## 🛑 Решение проблем

**Ошибка: Port 5001 is already in use**
```bash
lsof -i :5001
kill -9 <PID>
```

**Камера не открывается (Black screen)**
Убедитесь, что RTSP ссылка правильная и доступна с сервера НИШ. Проверьте через VLC плеер.

**Ошибка: ModuleNotFoundError**
```bash
cd apps/backend
pip3 install -r requirements.txt
```

---
*Документ подготовлен для пилота в НИШ.*
