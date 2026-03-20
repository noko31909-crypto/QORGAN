#!/usr/bin/env python3
"""
Быстрый тест уведомлений об оружии
"""
import requests
import json

API_URL = "http://127.0.0.1:5001/api"

def test_weapon_alert():
    """Отправляет тестовое уведомление об обнаружении оружия"""
    print("Sending test weapon alert...")
    
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
            print("\nOK")
            print(f"   Incident ID: {data['incident_id']}")
            print(f"   Guards notified: {data['guards_notified']}")
            print("\nCheck the app: Notifications tab, School Safety.")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("Backend not running. Start: python3 apps/backend/app.py")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Test: weapon alert notification")
    print("=" * 60)
    test_weapon_alert()
    print("\nFull test: run backend, open app as Guard, run this script, check Notifications.")
    print("=" * 60)
