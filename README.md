# Qorgan — School Safety System

## What is Qorgan?
Qorgan is a school safety platform built for real-time threat response. It helps schools detect possible weapons from camera feeds, alert security staff immediately, and guide coordinated action from the same mobile app.

The problem we solve is response delay. In many emergencies, seconds matter, but information is fragmented. Qorgan connects detection, alerting, and incident handling into one clear workflow.

## How it works
1. Camera streams are monitored by the detection service.
2. If a high-confidence weapon event is detected, Qorgan creates an incident.
3. Guards receive a real-time alert and a saved notification record.
4. The incident is tracked through statuses: new -> acknowledged -> resolved.
5. Guard teams use the app to coordinate actions, update status, and review incident timelines.

## Key features
- Real-time weapon alerting: camera detections trigger live alerts for guard users.
- Incident management workflow: every event is tracked as new, acknowledged, then resolved.
- Guard notification center: alerts are stored and can be marked/read in the app.
- School safety dashboard: live incident counts, unread alerts, detection status, and trend view.
- Response metrics: backend summary includes response KPIs such as P95 acknowledgment time.
- Timeline and notes: guards can add incident notes and review action history.
- False-positive handling: incidents can be flagged/unflagged for operational quality control.
- SOS flow: emergency alerts can be sent from mobile clients to backend.
- Map and guidance support: threat context and emergency guidance are available in-app.
- Demo seeding mode: reproducible demo data for competition presentation.

## ML Research
Qorgan includes wavelet preprocessing experiments to improve detection quality. The team compared multiple transforms (including Haar, Daubechies, and Symlet) and measured training/evaluation outputs in the project research pipeline.

Key result: Haar wavelet preprocessing improved mAP50 by +9.3% compared to the baseline setup. This gave more reliable detections and supported the decision to include wavelet-based preprocessing in the research workflow.

## Tech stack
- Backend: Python, Flask, Flask-SocketIO, SQLAlchemy, SQLite, JWT auth.
- Mobile: React Native (Expo) with TypeScript and React Navigation.
- ML: YOLO-based ONNX inference pipeline, camera/frame processing, wavelet preprocessing experiments.

## How to run
From the project root:

```bash
# 1) Install dependencies
./scripts/setup.sh

# 2) Start backend + mobile web app
./scripts/start_app.sh
```

Manual mode:

```bash
# Terminal 1: backend
cd apps/backend
ENABLE_DETECTION=1 DEMO_SEED=1 python3 app.py

# Terminal 2: mobile app
cd apps/mobile
npm install
npm run web
```

System proof check:

```bash
python3 scripts/prove_system.py
```

## Demo credentials
Guard demo account (seeded when DEMO_SEED=1):
- Email: demo.guard@qorgan.local
- Password: DemoPass123
- Role: guard
- School code: SCH-1234

## Project structure
- apps/backend: Flask API, incident workflow, notifications, metrics, and detection integration.
- apps/mobile: React Native app screens, navigation, and API/socket services.
- models: ONNX detection models.
- scripts: setup, startup, and test/proof scripts.
- tools/vision: standalone vision utilities (camera test, image/video detection, preprocessing).
- data: detection outputs, experiment artifacts, and result images.
- docs: architecture, flow, run/test notes, and competition support documents.
