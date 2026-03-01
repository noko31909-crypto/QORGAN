
## 📁 архитектура

```
Weapons-and-Knives-Detector-with-YOLOv8/
├── apps/                      # Приложения
│   ├── backend/               # Flask API Server
│   │   ├── app.py             # Основное приложение API
│   │   ├── detection_service.py # YOLOv8 детектор
│   │   ├── requirements.txt
│   │   └── instance/          # SQLite база данных
│   └── mobile/                # Flutter мобильное приложение
│       ├── lib/               # Исходный код
│       ├── assets/            # Изображения, иконки
│       └── pubspec.yaml       # Зависимости
├── data/                      # Выходные и временные данные
│   ├── detection_images/      # Изображения с детекциями
│   ├── results/               # Результаты экспериментов
│   ├── runs/                  # Результаты обучения моделей
│   └── legacy/                # Старые файлы
├── docs/                      # Документация проекта
│   ├── FULL_APP_README.md     # Полная документация приложения
│   ├── APP_OVERVIEW.md        # Обзор приложения
│   ├── КРАТКАЯ_ИНСТРУКЦИЯ.md  # Быстрый старт (RU)
│   └── ТЕСТ_УВЕДОМЛЕНИЙ.md    # Инструкция по тестированию уведомлений
├── logs/                      # Логи приложений
├── models/                    # YOLOv8 модели (.onnx, .pt)
├── notebooks/                 # Jupyter ноутбуки для исследований
│   └── graphs.ipynb
├── scripts/                   # Вспомогательные скрипты
│   ├── setup.sh               # Установка зависимостей
│   ├── start_app.sh           # Запуск приложения
│   ├── test_alert.py          # Тест уведомлений
│   └── test_weapon_alert.py   # Тест детекции + уведомления
└── tools/vision/              # Утилиты компьютерного зрения
    ├── camera_test.py         # Тест веб-камеры
    ├── detecting-images.py    # Детекция на изображениях/видео
    └── preprocessing-images.py # Предобработка изображений (wavelet)
```

---

### ✅ Разделение ответственности для программы

- **apps/**: Автономные приложения (backend/mobile)
- **data/**: Все выходные данные изолированы
- **scripts/**: Скрипты развертывания и тестирования
- **tools/**: Исследовательские утилиты компьютерного зрения


---

##  старт

Все команды работают из корня репозитория:

### 1. Установка зависимостей

```bash
./scripts/setup.sh
```

### 2. Запуск приложения

```bash
./scripts/start_app.sh
```

### 3. Тестирование уведомлений

```bash
python3 scripts/test_alert.py
```

---

## 📚 Документация

Вся документация теперь в папке `docs/`:

- **[docs/FULL_APP_README.md](docs/FULL_APP_README.md)** - Полная документация приложения
- **[docs/КРАТКАЯ_ИНСТРУКЦИЯ.md](docs/КРАТКАЯ_ИНСТРУКЦИЯ.md)** - Быстрый старт на русском
- **[docs/ТЕСТ_УВЕДОМЛЕНИЙ.md](docs/ТЕСТ_УВЕДОМЛЕНИЙ.md)** - Инструкция по тестированию
- **[docs/APP_OVERVIEW.md](docs/APP_OVERVIEW.md)** - Обзор приложения

---

## Исследование и утилиты

### Тест камеры

```bash
python3 tools/vision/camera_test.py
```

### Детекция на изображениях

```bash
python3 tools/vision/detecting-images.py
```

### Предобработка изображений (wavelet)

```bash
python3 tools/vision/preprocessing-images.py
```

