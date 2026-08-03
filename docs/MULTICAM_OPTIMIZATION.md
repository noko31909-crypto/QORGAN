# Qorgan — Оптимизация для 20-30 камер

Этот документ описывает оптимизации, добавленные для поддержки одновременной работы с 20-30 камерами.

---

## Что было улучшено

### 1. Detection Service (detection_service.py)

| Оптимизация | Описание | Эффект |
|-------------|----------|--------|
| Один shared model | YOLO модель загружается один раз и используется всеми камерами | Экономия RAM ~500MB |
| Frame skipping | Пропуск кадров (DETECTION_FRAME_SKIP=2) | Снижение CPU на 50% |
| Memory monitoring | Фоновый поток следит за RAM, автоматически GC | Предотвращение OOM |
| Graceful degradation | При высокой нагрузке увеличивается frame skip | Система не падает |
| Max cameras limit | Жёсткий лимит DETECTION_MAX_CAMERAS | Защита от перегрузки |
| Frame resolution | Настраиваемое разрешение (640x480 по умолчанию) | Контроль нагрузки |
| Periodic GC | Сборка мусора каждые 30 секунд | Стабильная память |

### 2. Video Feed (app.py)

| Оптимизация | Описание | Эффект |
|-------------|----------|--------|
| Shared Capture | Один VideoCapture на камеру, все зрители получают кадр из буфера | Минус N×2 дубликаты |
| Viewer limit | MAX_VIDEO_FEED_VIEWERS=5 (настраиваемо) | Защита от перегрузки |
| Frame skip in feed | VIDEO_FEED_SKIP=3 — пропуск кадров в стриме | Снижение bandwidth |
| Frame copy | Копия фрейма перед аннотацией | Безопасность буфера |

### 3. API Endpoints

| Endpoint | Описание |
|----------|----------|
| `GET /api/resources` | Мониторинг: CPU, RAM, активные камеры, memory pressure |
| `POST /api/cameras/batch-start` | Запустить несколько камер сразу: `{"camera_ids": [1,2,3]}` |
| `POST /api/cameras/stop-all` | Остановить все камеры |
| `GET /api/health` | Расширен: active_cameras, memory, CPU |

### 4. Graceful Shutdown

При получении SIGINT/SIGTERM:
- Останавливает все камеры
- Освобождает все VideoCapture
- Очищает shared capture pools
- Закрывает ресурсы корректно

---

## Настройка для 20-30 камер

### Рекомендуемые параметры

```bash
# apps/backend/.env
DETECTION_MAX_CAMERAS=30
DETECTION_MAX_WORKERS=8
DETECTION_FRAME_SKIP=2
DETECTION_MEMORY_LIMIT_MB=4000
DETECTION_FRAME_WIDTH=640
DETECTION_FRAME_HEIGHT=480
MAX_VIDEO_FEED_VIEWERS=3
VIDEO_FEED_SKIP=3
CONFIDENCE_THRESHOLD=0.30
PERSISTENCE_FRAMES=3
```

### Требования к железу (20-30 камер)

| Компонент | Минимум | Рекомендация |
|-----------|---------|--------------|
| CPU | 8 ядер | 16 ядер (AMD EPYC / Intel Xeon) |
| RAM | 16 GB | 32 GB |
| GPU (опционально) | — | NVIDIA T4 / RTX 4060 |
| Диск | SSD 256GB | SSD 512GB |
| Сеть | 1 Gbps | 10 Gbps (для RTSP) |

### Без GPU (CPU-only)

- Максимум 10-15 камер при DETECTION_FRAME_SKIP=3
- Разрешение 640x480 обязательно
- DETECTION_MAX_WORKERS=4

### С GPU (TensorRT / ONNX-GPU)

- До 30 камер при DETECTION_FRAME_SKIP=2
- Разрешение можно повысить до 1280x720
- DETECTION_MAX_WORKERS=16

---

## Мониторинг

### Проверка ресурсов

```bash
# API мониторинг
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5001/api/resources

# Ответ:
{
  "active_cameras": 15,
  "max_cameras": 30,
  "memory_mb": 2100,
  "memory_limit_mb": 4000,
  "cpu_percent": 45.2,
  "frame_skip": 2,
  "memory_pressure": false,
  "system_memory_mb": 2100,
  "system_total_mb": 32000,
  "system_memory_percent": 15.2,
  "cpu_percent": 45.2
}
```

### Health check

```bash
curl http://localhost:5001/api/health

# Ответ:
{
  "status": "ok",
  "active_cameras": 15,
  "memory_usage_mb": 2100,
  "memory_total_mb": 32000,
  "memory_percent": 15.2,
  "cpu_percent": 45.2,
  "detection_enabled": true,
  "profile": "centers"
}
```

---

## Сценарии использования

### Сценарий 1: Начать с 5 камер, постепенно добавлять

```bash
# Запустить первые 5 камер
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5001/api/cameras/batch-start \
  -H "Content-Type: application/json" \
  -d '{"camera_ids": [1, 2, 3, 4, 5]}'

# Проверить ресурсы
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5001/api/resources

# Если всё OK, добавить ещё 5
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5001/api/cameras/batch-start \
  -H "Content-Type: application/json" \
  -d '{"camera_ids": [6, 7, 8, 9, 10]}'
```

### Сценарий 2: Остановить все камеры при перегрузке

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5001/api/cameras/stop-all
```

### Сценарий 3: Запустить по расписанию (скрипт)

```python
#!/usr/bin/env python3
"""Пример: запустить камеры по расписанию."""
import requests, time

BASE = "http://localhost:5001"
HEADERS = {"Authorization": "Bearer YOUR_TOKEN"}

# Утро: запустить все камеры
requests.post(f"{BASE}/api/cameras/batch-start", headers=HEADERS, json={
    "camera_ids": list(range(1, 31))
})

# Вечер: проверить ресурсы
resp = requests.get(f"{BASE}/api/resources", headers=HEADERS)
status = resp.json()
print(f"Active: {status['active_cameras']}, Memory: {status['memory_mb']}MB")

if status['memory_pressure']:
    # Остановить половину
    requests.post(f"{BASE}/api/cameras/stop-all", headers=HEADERS)
    # Перезапустить только важные
    requests.post(f"{BASE}/api/cameras/batch-start", headers=HEADERS, json={
        "camera_ids": [1, 2, 3, 4, 5, 10, 15, 20]  # entrance cameras
    })
```

---

## Дальнейшее масштабирование (>30 камер)

При росте до 50+ камер рассмотрите:

1. **Redis + Celery** — распределённая очередь задач
2. **Edge-серверы** — по 10-15 камер на сервер
3. **PostgreSQL** — вместо SQLite
4. **MinIO/S3** — для хранения кадров детекции
5. **TensorRT** — для GPU-ускорения инференса
6. **Prometheus + Grafana** — для мониторинга

Архитектура:
```
[50+ камер] → [3-5 edge-серверов] → [Redis queue] → [API Server + PostgreSQL] → [Web/Mobile]
```

---

## Переменные окружения (полный список)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DETECTION_MAX_CAMERAS` | 30 | Максимум активных камер |
| `DETECTION_MAX_WORKERS` | 8 | Максимум потоков детекции |
| `DETECTION_FRAME_SKIP` | 2 | Пропуск кадров (1=все, 2=каждый 2-й) |
| `DETECTION_MEMORY_LIMIT_MB` | 3000 | Лимит RAM процесса |
| `DETECTION_FRAME_WIDTH` | 640 | Ширина фрейма |
| `DETECTION_FRAME_HEIGHT` | 480 | Высота фрейма |
| `MAX_VIDEO_FEED_VIEWERS` | 5 | Макс. зрителей на камеру |
| `VIDEO_FEED_SKIP` | 3 | Пропуск кадров в стриме |
