#!/usr/bin/env python3
"""
Быстрый тест уведомлений об оружии
"""
import requests
import json

API_URL = "http://127.0.0.1:5001/api"

def test_weapon_alert():
    """Отправляет тестовое уведомление об обнаружении оружия"""
    print("🔫 Отправка тестового уведомления об оружии...")
    
    try:
        response = requests.post(
            f"{API_URL}/test/simulate-weapon-alert",
            json={
                "description": "Test Alert: Knife detected",
                "location": "Main Hall Camera #1",
                "confidence": 0.95
            },
            timeout=5
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"\n✅ Успешно!")
            print(f"   Инцидент ID: {data['incident_id']}")
            print(f"   Уведомлено охранников: {data['guards_notified']}")
            print(f"\n📱 Проверьте приложение:")
            print(f"   - Должно появиться уведомление")
            print(f"   - Откройте вкладку Notifications")
            print(f"   - Проверьте раздел School Safety")
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend не запущен!")
        print("   Запустите: python3 apps/backend/app.py")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    print("="*60)
    print("🚨 ТЕСТ УВЕДОМЛЕНИЙ ОБ ОРУЖИИ")
    print("="*60)
    print()
    
    test_weapon_alert()
    
    print("\n" + "="*60)
    print("📝 Инструкция для полного теста:")
    print("="*60)
    print("""
1️⃣  Убедитесь что backend запущен:
    python3 apps/backend/app.py

2️⃣  Откройте мобильное приложение

3️⃣  Войдите как охранник:
    Email: guard@school.com
    Password: password123
    
4️⃣  Запустите этот скрипт:
    python3 scripts/test_alert.py
    
5️⃣  В приложении увидите:
    🔔 Уведомление "Weapon Detected!"
    📱 Алерт в School Safety
    📋 Запись в списке инцидентов
    
6️⃣  Для теста реальной камеры:
    - Перейдите в School Safety
    - Выберите камеру
    - Покажите изображение с оружием
    - Модель автоматически обнаружит и отправит алерт
""")
    print("="*60)
