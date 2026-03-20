# Qorgan

Система безопасности школы: **детекция оружия и ножей** с камер в реальном времени, **мгновенные уведомления** в приложении, карта эвакуации, SOS и рекомендации при угрозе.

---

## Стек

- **Backend:** Python 3.9+, Flask, Flask-SocketIO, SQLAlchemy (SQLite), YOLOv8 (Ultralytics) для детекции.
- **Mobile:** React Native (Expo + TypeScript), React Navigation, Socket.IO.
- **Модель:** YOLO в формате ONNX (`models/best.onnx`), обучена на датасете оружия/ножей.

---

## Быстрый старт

1. **Установка**
   ```bash
   ./scripts/setup.sh
   ```
   или вручную: `pip3 install -r requirements.txt` в корне и в `apps/backend`, `npm install` в `apps/mobile`.

2. **Запуск бэкенда** (порт 5001)
   ```bash
   cd apps/backend && python3 app.py
   ```
   При необходимости освободить порт: `lsof -ti :5001 | xargs kill`.

3. **Запуск приложения**
   ```bash
   cd apps/mobile && npm run web
   ```
   Откройте в браузере выданный localhost (откройте ссылку localhost, которую покажет Expo).

4. **Проверка уведомлений**
   - В приложении войдите под пользователем с ролью **Guard**.
   - В другом терминале: `python3 scripts/test_alert.py` — симуляция алерта; в приложении появится диалог и запись в «Уведомления».

5. **Только камера и детекция** (без бэкенда и приложения): `python3 tools/vision/camera_test.py` — откроется окно с видео и боксами; выход — **q**.

Подробная инструкция по запуску, тестам (в т.ч. с реальной камерой) и типичным ошибкам: **[docs/RUN_AND_TEST.md](docs/RUN_AND_TEST.md)**.

---

## Как получить приложение (скачать / установить)

Готового установочного файла в репозитории нет — приложение нужно **собрать** у себя на компьютере.

| Способ | Команда / действие |
|--------|---------------------|
| **В браузере** | `cd apps/mobile && npm run web` — в терминале появится ссылка (например `http://localhost:XXXX`). Откройте её в браузере — это и есть «скачать» в виде веб-версии. |
| **Android (APK-файл)** | `cd apps/mobile && npx expo run:android` (или настройте EAS Build для release APK/AAB). Перенесите его на телефон (почта, облако, USB) и установите (разрешите установку из неизвестных источников при запросе). |
| **На телефон по USB** | Подключите Android/iOS к компьютеру, включите отладку по USB (Android) или доверьте ПК (iOS), затем `cd apps/mobile && npm run android` — выберите устройство в списке; приложение установится и запустится. |

Перед сборкой: выполните `./scripts/setup.sh` (или `npm install` в `apps/mobile`). Для работы с бэкендом укажите ваш IP в `api_service.dart` и `socket_service.dart` (см. [docs/RUN_AND_TEST.md](docs/RUN_AND_TEST.md)).

---

## Структура репозитория

```
Qorgan/
├── apps/
│   ├── backend/           # Flask API, детекция YOLO, WebSocket
│   │   ├── app.py
│   │   ├── detection_service.py
│   │   └── requirements.txt
│   └── mobile/            # React Native приложение (карта, SOS, уведомления)
├── docs/                   # Документация
│   ├── README.md           # Оглавление
│   ├── ARCHITECTURE.md
│   ├── RUN_AND_TEST.md
│   └── DETECTION_AND_APP_FLOW.md
├── models/                 # Модель best.onnx (положить вручную)
├── scripts/
│   ├── setup.sh            # Установка зависимостей
│   ├── start_app.sh        # Запуск бэкенда + приложение
│   ├── test_alert.py       # Симуляция алерта (без детекции)
│   └── test_weapon_alert.py # Тест детекции по одному изображению
├── tools/vision/           # Утилиты для камеры и детекции
│   ├── camera_test.py      # Только камера + YOLO, окно с боксами (python3 tools/vision/camera_test.py)
│   ├── detecting-images.py # Детекция по фото/видео (свои пути к модели/результатам)
│   └── preprocessing-images.py # Препроцессинг изображений (wavelet и т.д.)
├── notebooks/              # Jupyter (например graphs.ipynb)
├── data/
│   ├── detection_images/   # Кадры с срабатываниями детекции (бэкенд)
│   └── results/            # Результаты из tools/vision (например teste.jpg)
├── requirements.txt
└── README.md
```

Подробная архитектура: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Основные возможности

- **Детекция с камеры:** при обнаружении оружия/ножа (порог уверенности ≥ 50%) бэкенд создаёт инцидент, шлёт событие по WebSocket и создаёт уведомления для охранников.
- **Приложение:** диалог «Оружие обнаружено» с любого экрана, список уведомлений, точка угрозы на карте школы и блок «Что делать? Рекомендации».
- **Карта:** план эвакуации в React Native MapView (можно подложить план как overlay) (зум/перемещение), при угрозе — маркер и подсказки.
- **SOS:** отправка алерта с геолокацией на бэкенд.
- **First Aid / Lessons:** справочники и уроки по безопасности (экран из главного меню).

---

## Документация

Вся документация в каталоге **[docs/](docs/)**:

- [docs/README.md](docs/README.md) — оглавление.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура проекта.
- [docs/RUN_AND_TEST.md](docs/RUN_AND_TEST.md) — запуск и тестирование.
- [docs/DETECTION_AND_APP_FLOW.md](docs/DETECTION_AND_APP_FLOW.md) — как детекция связана с уведомлениями в приложении.
- [docs/PITCH_SLIDES.md](docs/PITCH_SLIDES.md) — схема слайдов для питча и сдачи проекта.

---

## Датасет и модель

Датасет для обучения детектора: [Roboflow Weapon-2](https://universe.roboflow.com/joao-assalim-xmovq/weapon-2/dataset/2).  
Готовая модель в формате ONNX должна лежать в `models/best.onnx`; при её отсутствии бэкенд может не стартовать (детекция с камеры недоступна, симуляция алерта через `scripts/test_alert.py` по-прежнему работает при запущенном API).
