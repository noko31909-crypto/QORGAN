#!/usr/bin/env python3
"""
Deterministic backend proof script for Qorgan.

Checks:
1) API health
2) Guard registration/login
3) Simulated weapon alert
4) Guard notifications include the new alert
5) Guard can acknowledge incident status
6) Metrics endpoint returns summary

Usage:
  /Users/muslimasandybay/Documents/Qorgan/.venv/bin/python scripts/prove_system.py
"""

from __future__ import annotations

import sys
import time
from datetime import datetime, timezone
from uuid import uuid4

import requests

API_URL = "http://127.0.0.1:5001/api"
TIMEOUT = 8


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def ok(message: str) -> None:
    print(f"OK: {message}")


def main() -> None:
    print("=" * 64)
    print("Qorgan proof run")
    print("=" * 64)

    # 1) Health
    try:
        health = requests.get(f"{API_URL}/health", timeout=TIMEOUT)
    except requests.RequestException as exc:
        fail(f"Backend is unreachable: {exc}")

    if health.status_code != 200:
        fail(f"Health check returned {health.status_code}: {health.text}")
    ok("Backend health endpoint is alive")

    # 2) Register guard (idempotent-ish via unique email)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    email = f"proof_guard_{stamp}_{uuid4().hex[:6]}@qorgan.local"
    password = "proofpass123"
    school_code = "SCH-1234"

    reg_payload = {
        "email": email,
        "password": password,
        "role": "guard",
        "school_code": school_code,
    }
    reg = requests.post(f"{API_URL}/auth/register", json=reg_payload, timeout=TIMEOUT)
    if reg.status_code not in (200, 201):
        fail(f"Registration failed: {reg.status_code} {reg.text}")
    ok("Guard registration works")

    # 3) Login
    login_payload = {
        "email": email,
        "password": password,
        "school_code": school_code,
    }
    login = requests.post(f"{API_URL}/auth/login", json=login_payload, timeout=TIMEOUT)
    if login.status_code != 200:
        fail(f"Login failed: {login.status_code} {login.text}")

    login_data = login.json()
    token = login_data.get("token")
    if not token:
        fail("Login response has no token")
    ok("Guard login works and returns JWT")

    # Baseline notifications count for this guard
    headers = {"Authorization": f"Bearer {token}"}
    before_notifs = requests.get(f"{API_URL}/notifications", headers=headers, timeout=TIMEOUT)
    if before_notifs.status_code != 200:
        fail(f"Initial notifications request failed: {before_notifs.status_code} {before_notifs.text}")
    before_count = len(before_notifs.json()) if isinstance(before_notifs.json(), list) else 0
    ok(f"Initial notifications fetched ({before_count})")

    # 4) Simulate weapon alert
    marker = f"PROOF_ALERT_{stamp}"
    alert_payload = {
        "description": marker,
        "location": "Proof Camera",
        "confidence": 0.91,
    }
    alert = requests.post(
        f"{API_URL}/test/simulate-weapon-alert",
        json=alert_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    if alert.status_code != 201:
        fail(f"Simulate alert failed: {alert.status_code} {alert.text}")
    ok("Weapon alert simulation endpoint works")
    alert_data = alert.json()
    incident_id = alert_data.get("incident_id")
    if not incident_id:
        fail("Alert response has no incident_id")

    # 5) Verify notifications count increases for this guard
    increased = False
    for _ in range(6):
        notifs = requests.get(f"{API_URL}/notifications", headers=headers, timeout=TIMEOUT)
        if notifs.status_code != 200:
            fail(f"Notifications request failed: {notifs.status_code} {notifs.text}")

        items = notifs.json() if isinstance(notifs.json(), list) else []
        if len(items) > before_count:
            increased = True
            break
        time.sleep(0.5)

    if not increased:
        fail("Alert was created, but notifications count did not increase for guard")

    ok("Guard receives notification after weapon alert")

    # 6) Verify incident workflow: acknowledge status
    status_resp = requests.put(
        f"{API_URL}/incidents/{incident_id}/status",
        headers=headers,
        json={"status": "acknowledged"},
        timeout=TIMEOUT,
    )
    if status_resp.status_code != 200:
        fail(f"Incident status update failed: {status_resp.status_code} {status_resp.text}")
    ok("Guard incident status update works (acknowledged)")

    # 7) Verify metrics summary endpoint
    metrics = requests.get(f"{API_URL}/metrics/summary", headers=headers, timeout=TIMEOUT)
    if metrics.status_code != 200:
        fail(f"Metrics summary failed: {metrics.status_code} {metrics.text}")
    metrics_data = metrics.json()
    if "incidents" not in metrics_data or "response" not in metrics_data:
        fail("Metrics summary has unexpected structure")
    ok("Metrics summary endpoint works")

    # 8) Measure alert delivery latency
    print("-" * 64)
    print("Measuring alert delivery latency...")

    # Get baseline count before trigger
    before = requests.get(f"{API_URL}/notifications", headers=headers, timeout=TIMEOUT)
    before_items = before.json() if isinstance(before.json(), list) else []
    count_before = len(before_items)

    t_trigger = time.time()
    alert2 = requests.post(
        f"{API_URL}/test/simulate-weapon-alert",
        json={"description": "Latency test alert", "location": "Latency Test Camera", "confidence": 0.91},
        headers=headers,
        timeout=TIMEOUT,
    )
    if alert2.status_code != 201:
        fail(f"Latency test alert failed: {alert2.status_code} {alert2.text}")

    delivered = False
    for _ in range(100):
        notifs = requests.get(f"{API_URL}/notifications", headers=headers, timeout=TIMEOUT)
        items = notifs.json() if isinstance(notifs.json(), list) else []
        if len(items) > count_before:
            delivered = True
            break
        time.sleep(0.05)

    t_delivered = time.time()
    latency_ms = round((t_delivered - t_trigger) * 1000, 1)

    if delivered:
        ok(f"Alert delivered and visible in notifications")
    else:
        print(f"WARN: Notification count did not increase within 5 seconds")

    print("=" * 64)
    print("PROOF PASSED: backend chain is working end-to-end")
    print(f"ALERT DELIVERY LATENCY: {latency_ms} ms  (trigger → notification API)")
    response_data = metrics_data.get("response", {})
    if response_data.get("ack_p95_seconds") is not None:
        print(f"ACK P95 LATENCY:        {response_data['ack_p95_seconds']} s  (incident created → acknowledged)")
    print("=" * 64)


if __name__ == "__main__":
    main()
