# School Safety App - Full Implementation

## 📱 Полное приложение для безопасности школы с детекцией оружия

Интеграция YOLOv8 системы детекции оружия с мобильным приложением для мониторинга и оповещения в реальном времени.

---

## 🏗️ Архитектура проекта

```
Weapons-and-Knives-Detector-with-YOLOv8/
├── apps/
│   ├── backend/               # Flask API Server
│   │   ├── app.py             # Main Flask application
│   │   ├── detection_service.py
│   │   ├── requirements.txt   # Python dependencies
│   │   └── instance/          # SQLite database
│   └── mobile/                # Flutter Mobile App
│       ├── lib/
│       │   ├── main.dart
│       │   ├── services/      # API & Socket services
│       │   ├── providers/     # State management
│       │   ├── screens/       # UI screens
│       │   └── theme/         # App theme
│       ├── pubspec.yaml
│       └── assets/
├── data/                      # Outputs, runs, detection images
├── docs/                      # Project documentation
├── logs/                      # Runtime logs
├── models/                    # YOLOv8 models
├── notebooks/                 # Research notebooks
├── scripts/                   # Helper scripts (setup/start/tests)
└── tools/vision/              # Research utilities
```

---

## 🚀 Установка и запуск

### 1. Backend (Flask API)

#### Установка зависимостей:

```bash
cd apps/backend
pip install -r requirements.txt
```

#### Запуск сервера:

```bash
python3 app.py
```

### 2. Mobile App (Flutter)

#### Установка зависимостей:

```bash
cd apps/mobile
flutter pub get
```

#### Настройка IP адреса:

**Важно!** Если вы тестируете на реальном устройстве, измените IP адрес в файлах:

**apps/mobile/lib/services/api_service.dart:**
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:5000/api';
```

**apps/mobile/lib/services/socket_service.dart:**
```dart
static const String serverUrl = 'http://YOUR_COMPUTER_IP:5000';
```

Чтобы узнать IP вашего компьютера:
- macOS/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig`

#### Запуск приложения:

```bash
flutter run
```

### Быстрый старт

```bash
./scripts/setup.sh
./scripts/start_app.sh
```

Или через VS Code:
1. Откройте `apps/mobile/lib/main.dart`
2. Нажмите F5 или Run > Start Debugging

---

## 📊 Функциональность

### Backend API Endpoints

#### Авторизация:
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему

#### Камеры и мониторинг:
- `GET /api/cameras` - Список камер
- `GET /api/detection/status` - Статус детекции

#### Инциденты:
- `GET /api/incidents` - История инцидентов
- `POST /api/incidents/sos` - Отправка SOS сигнала

#### Уведомления:
- `GET /api/notifications` - Список уведомлений
- `PUT /api/notifications/:id/read` - Отметить как прочитанное

#### WebSocket Events:
- `weapon_alert` - Оружие обнаружено
- `sos_alert` - SOS сигнал отправлен
- `subscribe_camera` - Подписка на камеру

### Mobile App Screens

#### 🔐 Авторизация:
- Splash Screen
- Welcome Screen
- Login (Email/Phone + School Code)
- Registration (Guard/Student)

#### 🏠 Главный экран:
- Dashboard с быстрым доступом
- Статистика за день
- Кнопки быстрого доступа к функциям

#### 🔒 School Safety (для охранников):
- Live видео с камер
- Детекция оружия в реальном времени
- Переключение настроек мониторинга
- Экстренные контакты

#### 🚨 SOS:
- Большая кнопка SOS с анимацией
- Автоматическая отправка геолокации
- Настройки экстренных служб
- Мгновенное оповещение охраны

#### 🗺️ Map:
- Карта школы
- Безопасные зоны
- Аварийные выходы
- Текущие алерты

#### 🔔 Notifications:
- История уведомлений
- Группировка по дате
- Типы: предупреждения, обновления, тревоги

#### 🏥 First Aid:
- Инструкции первой помощи
- Поиск по симптомам
- Пошаговые руководства

#### 📚 Lessons:
- Обучающие видео
- Правила безопасности
- Действия в ЧС

---

## 🔧 Интеграция YOLOv8 с приложением

### Как это работает:

1. **DetectionService** запускает детекцию на камерах
2. При обнаружении оружия:
   - Сохраняется кадр с детекцией
   - Создается запись в базе данных
   - Отправляется WebSocket уведомление
   - Создаются уведомления для всех охранников
3. Мобильное приложение:
   - Получает WebSocket событие
   - Показывает алерт пользователю
   - Обновляет список инцидентов

### Запуск детекции на камере:

```python
from pathlib import Path
from detection_service import DetectionService

base_dir = Path(__file__).resolve().parents[2]
service = DetectionService(model_path=str(base_dir / 'models' / 'best.onnx'))
service.set_detection_callback(on_weapon_detected)
service.start_camera_detection(
    camera_id='main_entrance',
    camera_source=0,  # 0 = webcam, or RTSP URL
    camera_location='Main Entrance'
)
```

---

## 🎨 Дизайн

### Цветовая схема:
- **Primary Purple**: `#7B2CBF`
- **Light Purple**: `#9D4EDD`
- **Accent Yellow**: `#FFC107`
- **Accent Pink**: `#FF006E`
- **Background**: `#F8F9FA`

### Типы аккаунтов:

#### 👮 Охранник (Guard):
- Доступ к камерам
- Просмотр всех инцидентов
- Управление безопасностью
- Получение всех алертов

#### 🎓 Ученик (Student):
- SOS кнопка
- Карта школы
- First Aid инструкции
- Обучающие материалы

---

## 📱 Тестирование

### Создание тестовых пользователей:

**Охранник:**
```json
{
  "email": "guard@school.com",
  "password": "password123",
  "role": "guard",
  "school_code": "SCH-1234"
}
```

**Ученик:**
```json
{
  "email": "student@school.com",
  "password": "password123",
  "role": "student",
  "school_code": "SCH-1234"
}
```

### Тестирование детекции:

1. Запустите backend: `python apps/backend/app.py`
2. Откройте камеру перед объектом, похожим на оружие
3. Система автоматически обнаружит и создаст алерт
4. Мобильное приложение получит уведомление

---

## 🔒 Безопасность

⚠️ **Важно для production:**

1. Измените `SECRET_KEY` в `apps/backend/app.py`
2. Используйте PostgreSQL вместо SQLite
3. Добавьте HTTPS
4. Настройте правильную CORS политику
5. Добавьте rate limiting
6. Используйте environment variables для конфигурации

---

## 📝 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "0123456789",
  "password": "password123",
  "role": "guard",  // or "student"
  "school_code": "SCH-1234",
  "cashier_code": "ABC123"  // optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "school_code": "SCH-1234"
}

Response:
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "guard"
  }
}
```

### Cameras
```http
GET /api/cameras
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "name": "Main Entrance Camera",
    "location": "Main Entrance",
    "stream_url": "0"
  }
]
```

### Send SOS
```http
POST /api/incidents/sos
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Emergency situation",
  "location": "Room 101",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

---

## 🐛 Troubleshooting

### Backend не запускается:
```bash
# Убедитесь что все зависимости установлены
pip install -r backend/requirements.txt

# Проверьте что модель существует
ls models/best.onnx
```

### Flutter ошибки:
```bash
# Очистите кэш
flutter clean
flutter pub get

# Обновите Flutter
flutter upgrade
```

### Не работает детекция:
1. Проверьте путь к модели в `apps/backend/app.py`
2. Убедитесь что камера доступна
3. Проверьте логи в консоли backend

### Приложение не подключается к серверу:
1. Проверьте IP адрес в `api_service.dart` и `socket_service.dart`
2. Убедитесь что backend запущен
3. Проверьте что устройство и компьютер в одной сети
4. Отключите firewall/antivirus временно для теста

---

## 📞 Контакты и поддержка

Этот проект является учебным и разработан для демонстрации интеграции YOLOv8 с мобильным приложением для обеспечения безопасности в учебных заведениях.

---

## 📄 License

MIT License - см. файл LICENSE

---

## 🎯 Дальнейшее развитие

### Возможные улучшения:
- [ ] Интеграция с реальными IP камерами
- [ ] Push-уведомления (Firebase Cloud Messaging)
- [ ] Запись видео инцидентов
- [ ] Панель администратора
- [ ] Аналитика и отчеты
- [ ] Интеграция с полицией/скорой помощью
- [ ] Мультиязычность
- [ ] Face recognition для доступа
- [ ] QR код для быстрого входа

---

**Приложение готово к тестированию! 🚀**
