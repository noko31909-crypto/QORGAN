#!/usr/bin/env python3
"""
Скрипт для тестирования уведомлений об обнаружении оружия
"""
import cv2
import requests
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / 'apps' / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

from detection_service import DetectionService

# Конфигурация
API_URL = "http://127.0.0.1:5001/api"
TEST_IMAGE = str(ROOT_DIR / 'data' / 'results' / 'teste.jpg')
MODEL_PATH = str(ROOT_DIR / 'models' / 'best.onnx')

def test_detection_with_image():
    """Тест детекции на существующем изображении"""
    print("🔍 Загрузка модели YOLOv8...")
    detection_service = DetectionService(model_path=MODEL_PATH)
    
    print(f"📷 Загрузка изображения: {TEST_IMAGE}")
    frame = cv2.imread(TEST_IMAGE)
    
    if frame is None:
        print(f"❌ Ошибка: не удалось загрузить изображение {TEST_IMAGE}")
        return
    
    print("🔎 Запуск детекции...")
    results = detection_service.detect_single_frame(frame)
    
    if results:
        print(f"\n✅ ОБНАРУЖЕНО {len(results)} объектов:")
        for i, det in enumerate(results, 1):
            print(f"  {i}. {det['class_name']}: {det['confidence']:.2%} уверенности")
            print(f"     Координаты: {det['bbox']}")
        
        # Симуляция создания инцидента (как это делает backend)
        print("\n📱 Симуляция отправки уведомления...")
        print("   (В реальном приложении это создаст инцидент и отправит WebSocket уведомление)")
        
        # Показываем результат
        print(f"\n💬 Уведомление для охранников:")
        print(f"   🚨 Обнаружено оружие!")
        print(f"   📍 Камера: Test Camera")
        print(f"   ⏰ Время: сейчас")
        print(f"   🎯 Уверенность: {results[0]['confidence']:.2%}")
    else:
        print("❌ Оружие не обнаружено на изображении")

def test_api_status():
    """Проверка статуса API"""
    print("\n🌐 Проверка подключения к backend...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend работает!")
            data = response.json()
            print(f"   Статус: {data.get('status')}")
            print(f"   Модель: {data.get('model_status')}")
        else:
            print(f"⚠️ Backend ответил с кодом: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Backend не запущен! Запустите: python3 apps/backend/app.py")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

def simulate_camera_alert():
    """Симуляция алерта от камеры через API"""
    print("\n📹 Симуляция алерта от камеры...")
    
    # Сначала нужно зарегистрироваться и получить токен
    print("   (Для полного теста нужно войти в систему через приложение)")
    print("   (Этот тест показывает как работает детекция)")

if __name__ == "__main__":
    print("="*60)
    print("🔫 ТЕСТ СИСТЕМЫ ОБНАРУЖЕНИЯ ОРУЖИЯ")
    print("="*60)
    
    # 1. Проверяем API
    test_api_status()
    
    # 2. Тестируем детекцию
    print("\n" + "="*60)
    test_detection_with_image()
    
    print("\n" + "="*60)
    print("📱 Как протестировать в приложении:")
    print("="*60)
    print("""
1. Убедитесь что backend запущен:
    cd apps/backend && python3 app.py

2. Откройте мобильное приложение

3. Зарегистрируйтесь как охранник:
   - Email: guard@school.com
   - Password: password123
   - Role: Guard
   - School Code: SCH-1234

4. Перейдите в "School Safety" → "Cameras"

5. Запустите камеру (покажите изображение оружия)
   
   ИЛИ добавьте тестовую камеру через API:
   curl -X POST http://127.0.0.1:5001/api/cameras \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{"name": "Test Camera", "location": "Main Hall", "stream_url": "0"}'

6. Когда модель обнаружит оружие:
   - 🔴 Появится красный алерт в приложении
   - 📱 Придёт push-уведомление
   - 💾 Инцидент сохранится в базу данных
   - 🔔 WebSocket отправит уведомление всем охранникам

7. Проверьте уведомления в приложении (вкладка Notifications)
""")
    
    print("="*60)
    print("✅ Тест завершен!")
    print("="*60)
