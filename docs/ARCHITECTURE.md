# Архитектура Qorgan

Система безопасности школы: детекция оружия/ножей в реальном времени, уведомления, карта эвакуации, SOS, первая помощь.

---

## Структура проекта

```
Qorgan/
├── apps/
│   ├── backend/                 # API и детекция
│   │   ├── app.py               # Flask + SocketIO, маршруты, БД
│   │   ├── detection_service.py # YOLO детекция с камер
│   │   ├── requirements.txt
│   │   └── instance/            # SQLite (school_safety.db)
│   └── mobile/                  # React Native (Expo) приложение
│       ├── App.tsx              # точка входа
│       ├── app.json             # конфиг Expo
│       ├── tsconfig.json
│       ├── package.json
│       ├── assets/              # иконки, splash-screen
│       └── src/
│           ├── screens/         # LoginScreen, HomeScreen, SosScreen, MapScreen,
│           │                    # NotificationsScreen, FirstAidScreen, LessonsScreen,
│           │                    # SchoolSafetyScreen, WelcomeScreen, SplashScreen
│           ├── context/         # AuthContext, ThreatContext
│           ├── navigation/      # AppNavigator
│           ├── services/        # api.ts, socket.ts, network.ts
│           ├── components/      # ScreenShell и переиспользуемые компоненты
│           ├── types.ts
│           └── theme.ts
├── docs/                        # Документация
│   ├── README.md                # Оглавление
│   ├── ARCHITECTURE.md          # этот файл
│   ├── RUN_AND_TEST.md          # Запуск и тесты
│   └── DETECTION_AND_APP_FLOW.md # Связка детекция → приложение
├── models/                      # YOLO-модель (best.onnx)
├── data/detection_images/       # Кадры с детекцией
├── scripts/
│   ├── setup.sh                 # Установка зависимостей
│   ├── start_app.sh             # Запуск backend + Expo
│   ├── test_alert.py            # Симуляция алерта об оружии
│   └── test_weapon_alert.py     # Тест детекции по одному изображению
├── tools/vision/                # Утилиты камера и детекция
│   ├── camera_test.py          # Только камера + YOLO, окно с боксами (без бэкенда)
│   ├── detecting-images.py     # Детекция по фото/видео (best.pt в data/runs/...)
│   └── preprocessing-images.py # Вспомогательный препроцессинг изображений
├── notebooks/                   # Jupyter (например graphs.ipynb)
├── data/
│   ├── detection_images/       # Кадры с срабатываниями (бэкенд)
│   └── results/               # Результаты tools/vision (например teste.jpg)
└── requirements.txt            # Python-зависимости (корень)
```

---

## Backend (apps/backend)

| Компонент | Назначение |
|-----------|------------|
| **app.py** | Маршруты API (auth, cameras, incidents, notifications), WebSocket (weapon_alert, sos_alert), колбэк детекции → инцидент + уведомления охранникам. |
| **detection_service.py** | Загрузка YOLO (best.onnx), цикл по кадрам с камеры, при срабатывании — вызов колбэка и сохранение кадра. |

**Профиль учебных центров:** переменная `QORGAN_PROFILE=centers` — детекция по умолчанию включена, демо-данные выключены, подмена камеры демо-роликом запрещена без `ALLOW_DEMO_VIDEO_FALLBACK=1`; первая камера задаётся через `BOOTSTRAP_CAMERA_STREAM` или API. См. `apps/backend/.env.example`, `docs/PILOT_INSTALL.md`, Docker в корне репозитория.

**Основные маршруты:**  
`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/cameras`, `GET /api/incidents`, `POST /api/incidents/sos`, `GET /api/notifications`, `PUT /api/notifications/<id>/read`, `GET /api/health`, `POST /api/test/simulate-weapon-alert` (в production отключён без `ALLOW_SIMULATE_WEAPON_ALERT=1`).

**Операционные маршруты (workflow/KPI):**
`PUT /api/incidents/<id>/status` (только guard), `GET /api/incidents/<id>/timeline`, `GET /api/metrics/summary`.

**События WebSocket:** `weapon_alert`, `sos_alert`.

---

## Mobile (apps/mobile)

Стек: **React Native 0.83 + Expo SDK 55 + TypeScript**.

| Область | Содержимое |
|---------|------------|
| **Экраны** | Splash → Welcome → Login/Register → Main (вкладки: Live, SOS, Map, Notifications). С главного экрана: School Safety (guard), First Aid, Lessons. |
| **Контексты** | AuthContext (токен, user), ThreatContext (текущая угроза по weapon_alert для карты и рекомендаций). |
| **Сервисы** | api.ts (HTTP к backend), socket.ts (WebSocket подписка на weapon_alert), network.ts (автоопределение IP хоста через Expo Constants). |

**Карта школы:** изображение `assets/images/school_map.png` (план эвакуации), при угрозе — маркер и блок «Что делать? Рекомендации».

---

## Поток данных: детекция → уведомление

1. Камера (0 или RTSP) → **detection_service** → YOLO по кадру.
2. При confidence ≥ 0.5 → колбэк **on_weapon_detected** в app.py.
3. Бэкенд: запись Incident, `socketio.emit('weapon_alert', ...)`, создание Notification для всех guard.
4. Приложение: по WebSocket показывается диалог; ThreatProvider обновляет точку на карте; раздел Notifications подтягивает список по API.

Подробнее: [DETECTION_AND_APP_FLOW.md](DETECTION_AND_APP_FLOW.md).

---

## Утилиты (tools/vision)

| Файл | Назначение |
|------|------------|
| **camera_test.py** | Тест только камеры и детекции: веб-камера → YOLO (`models/best.onnx`) → окно OpenCV с боксами. Запуск: `python3 tools/vision/camera_test.py`. Бэкенд не нужен. |
| **detecting-images.py** | Детекция по фото/видео; использует свой путь к модели (например `data/runs/detect/.../best.pt`) и сохраняет в `data/results/`. |
| **preprocessing-images.py** | Вспомогательный препроцессинг изображений для подготовки данных. |
