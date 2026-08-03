# 🚀 Qorgan: Быстрый старт для НИШ (Nazarbayev Intellectual Schools)

Вы сейчас в НИШ и вам нужно установить систему прямо сейчас на месте. Вот пошаговая инструкция, как развернуть систему на сервере НИШ для **Windows**, **Linux** и **macOS**.

---

## Шаг 1: Подготовка сервера

Убедитесь, что на компьютере в НИШ установлено:
- **Операционная система:** Windows 10/11, Ubuntu 22.04, или macOS
- **Программы:** Python 3.10+ (с сайта python.org) и Node.js 18+ (с сайта nodejs.org)
- **Интернет-соединение** для клонирования кода
- **Подключение к камерам** (либо USB веб-камера, либо RTSP ссылки на IP-камеры НИШ)

---

## Шаг 2: Клонирование и установка

Выберите вашу операционную систему:

### 🪟 Windows (PowerShell / CMD)
```powershell
# 1. Скачиваем код
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN

# 2. Устанавливаем Python зависимости
pip install -r apps/backend/requirements.txt

# 3. Устанавливаем Node.js зависимости
npm install --prefix apps/web
```

### 🐧 Linux (Ubuntu / Terminal)
```bash
# 1. Скачиваем код
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN

# 2. Запускаем скрипт установки
./scripts/setup.sh
```

### 🍏 macOS (Terminal)
```bash
# 1. Скачиваем код
git clone https://github.com/noko31909-crypto/QORGAN.git
cd QORGAN

# 2. Запускаем скрипт установки (или вручную через pip и npm)
./scripts/setup.sh
```

---

## Шаг 3: Настройка переменных

Создайте файл настроек. Мы используем режим для учебных центров.

```bash
cp apps/backend/.env.multicam.example apps/backend/.env
```
Откройте файл `apps/backend/.env` в любом текстовом редакторе (Notepad, Nano, TextEdit) и вставьте:

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

---

## Шаг 4: Запуск системы

Откройте **два разных терминала** (или окна командной строки) и запустите:

### Терминал 1: Бэкенд (Сервер)

**Windows:**
```powershell
set QORGAN_PROFILE=centers
python apps/backend/app.py
```

**Linux / macOS:**
```bash
./scripts/start_centers.sh
```

Сервер запустится на порту `5001`.

### Терминал 2: Веб-интерфейс

В любом терминале (не закрывая первый):
```bash
cd apps/web
npm run dev -- --host 0.0.0.0
```

Веб-интерфейс запустится на порту `5173`.

---

## Шаг 5: Подключение и тестирование

1. Откройте браузер (Chrome, Edge, Safari) на ПК охранника в НИШ.
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

Отредактируйте файл `.env`, чтобы добавить RTSP ссылку при первом запуске:
```env
BOOTSTRAP_CAMERA_STREAM=rtsp://admin:password@192.168.1.100:554/stream
BOOTSTRAP_CAMERA_NAME=Вход в НИШ
BOOTSTRAP_CAMERA_LOCATION=Главный вход
```
Затем перезапустите сервер (Terминал 1).

---

## 🛑 Решение проблем

**Ошибка: Port 5001 is already in use**
- Windows: `netstat -ano | findstr :5001`, затем `taskkill /PID <PID> /F`
- Linux / macOS: `lsof -i :5001`, затем `kill -9 <PID>`

**Камера не открывается (Black screen)**
Убедитесь, что RTSP ссылка правильная и доступна с сервера НИШ. Проверьте через VLC плеер.

**Ошибка: ModuleNotFoundError**
```bash
cd apps/backend
pip install -r requirements.txt
```

---
*Документ подготовлен для пилота в НИШ.*
