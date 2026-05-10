#!/usr/bin/env python3
"""
Quick test for weapon alert notifications.

This script logs in as a guard user first, then calls
/api/test/simulate-weapon-alert with Bearer token auth.
"""
import os
import requests

API_URL = os.getenv("QORGAN_API_URL", "http://127.0.0.1:5001/api")
DEMO_EMAIL = os.getenv("QORGAN_DEMO_EMAIL", "demo.guard@qorgan.local")
DEMO_PASSWORD = os.getenv("QORGAN_DEMO_PASSWORD", "DemoPass123")
DEMO_SCHOOL_CODE = os.getenv("QORGAN_DEMO_SCHOOL_CODE", "SCH-1234")


def login_guard() -> str:
    """Log in demo guard and return JWT token."""
    response = requests.post(
        f"{API_URL}/auth/login",
        json={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "school_code": DEMO_SCHOOL_CODE,
        },
        timeout=8,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Login failed: {response.status_code} {response.text}")

    body = response.json() or {}
    token = body.get("token") or body.get("access_token")
    if not token:
        raise RuntimeError(f"Token missing in login response: {body}")
    return token


def test_weapon_alert():
    """Send a test weapon-detection notification as an authorized guard."""
    print("Sending test weapon alert...")

    try:
        token = login_guard()
        response = requests.post(
            f"{API_URL}/test/simulate-weapon-alert",
            json={
                "description": "Test Alert: Knife detected",
                "location": "Main Hall Camera #1",
                "confidence": 0.95,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )

        if response.status_code == 201:
            data = response.json()
            print("\nOK")
            print(f"   Incident ID: {data.get('incident_id')}")
            print(f"   Guards notified: {data.get('guards_notified')}")
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
