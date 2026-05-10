# Technical Video Script — Qorgan (3.5 минуты)
# Точный текст — слова для каждой участницы

Участницы: **A** и **B** (замените на свои имена)

---

## [0:00–0:30] Обзор системы

**A:**
> "Hi, I'm [имя], and this is Qorgan — a real-time school safety system.
> I'll walk you through exactly how it works under the hood."

**B:**
> "The system is built as a pipeline.
> A camera stream goes into the detection service.
> The model runs inference on every frame.
> If a weapon is found — the backend creates an incident,
> sends a live alert over WebSocket,
> and the guard receives it on their phone.
> Let's show you each part."

*(На экране: диаграмма — Camera → detection_service.py → app.py → WebSocket → Web)*

---

## [0:30–1:10] Живое демо

**A:**
> "You can see the backend is running right now on port 5001.
> The detection service is active — it loaded our YOLO model from models/best.onnx.
> We're going to trigger a weapon detection event now."

*(Запускает в терминале: `python3 scripts/test_alert.py`)*

**B:**
> "Look at the backend log — it says: weapon_detected, confidence 0.95, location Main Hall.
> And here on the phone — the red alert just appeared.
> That is a live WebSocket event, not a pre-recorded screen.
> The incident is saved in the database with status: new."

*(Показывает браузер и лог рядом)*

**A:**
> "Now the guard opens the app and taps Acknowledge.
> The backend updates the status from new to acknowledged —
> and logs this action with a timestamp in the incident timeline.
> Every status change is recorded. Nothing is lost."

*(Показывает как статус меняется на браузере)*

---

## [1:10–1:55] AI Pipeline

**B:**
> "Now let me show you the detection code directly.
> This is detection_service.py — the file that runs inference on every camera frame."

*(Открывает detection_service.py в редакторе)*

**A:**
> "Here is the core logic.
> We call self.model on the frame — that is our YOLO model loaded in ONNX format.
> For every detected bounding box, we read the confidence score.
> If confidence is greater than or equal to 0.5 — the threshold we chose —
> the detection moves forward."

*(Показывает строки 142–144)*

**B:**
> "Why 0.5 as the threshold?
> Because in a school safety context, missing a real weapon —
> a false negative — is more dangerous than sending a false alarm.
> So we tuned the threshold toward higher recall.
> We measured: at threshold 0.5, recall is 81.2%.
> That means we catch 26 out of 32 weapon images."

**A:**
> "When a detection passes the threshold,
> the system builds a payload with: camera ID, location, class name,
> confidence score, a bounding box, and a saved image of the frame.
> This payload is sent to the on_weapon_detected callback in app.py."

*(Показывает строки 162–175)*

**B:**
> "Inside on_weapon_detected, the backend first runs deduplication.
> If a weapon_detected incident for this school already exists
> within the last 4 seconds — it skips.
> This prevents alert storms from the same camera.
> If the event is new — it creates a database record,
> emits weapon_alert over WebSocket to all connected clients,
> and creates a notification for every guard in that school.
> All in one transaction."

*(Показывает строки 845–895 в app.py)*

---

## [1:55–2:35] Итерации и тесты

**A:**
> "We didn't get this right the first time.
> Here are three real problems we hit, and how we fixed them."

*(Показывает таблицу на слайде)*

| Сценарий | Ожидали | Получили | Что исправили |
|---|---|---|---|
| 1 камера, 30 fps | 1 алерт на событие | 30+ алертов в секунду | Cooldown 3 секунды в detection_service.py, строка 120 |
| Guard на другом экране | Alert везде | Alert только на HomeScreen | Перенесли socket listener в ThreatContext |
| Guard закрыл приложение | Notification сохранена | После переоткрытия не видна | Загружаем notifications из API при каждом входе |

**B:**
> "The first problem was alert spam.
> Without a cooldown, one camera at 30 frames per second
> created 30 incidents every second.
> We added a 3-second cooldown per camera.
> You can see it in detection_service.py, line 120:
> detection_cooldown equals 3."

**A:**
> "The second problem was screen isolation.
> If a guard was on the Map screen when an alert arrived,
> nothing happened — the alert was only handled on HomeScreen.
> We moved the WebSocket listener into ThreatContext,
> so every screen in the app reacts to a weapon_alert event."

**B:**
> "And we wrote a test script for each fix.
> scripts/test_weapon_alert.py runs detection on a single image
> and verifies the confidence score, class name, and payload structure."

---

## [2:35–3:05] Пользовательское тестирование

**A:**
> "We tested the app with three school staff members —
> two with security roles, and one administrator.
> None of them had seen the product before."

**B:**
> "We found two critical problems.
> First: guards missed alerts when their phone screen was off.
> The popup appeared and disappeared — they never saw it.
> We added persistent notification history.
> Even if you miss the live alert,
> it stays in the Notifications tab until you read it."

**A:**
> "Second: after acknowledging an alert,
> guards didn't know if a colleague had already responded.
> We added incident status — new, acknowledged, resolved —
> visible to every guard on that school in real time."

**B:**
> "We are honest about the limits of this test.
> Three people is not statistically significant.
> Our next step is a structured 4-week pilot with one school,
> measuring real guard response times and collecting structured feedback."

---

## [3:05–3:35] Риски и следующие шаги

**A:**
> "The current model was evaluated on 47 images:
> 32 with weapons, 15 clean.
> Recall: 81.2%. Precision: 89.7%. F1 score: 0.852.
> False positive rate: 20% — 3 out of 15 clean images triggered an alert.
> Every alert requires guard confirmation before any action is taken.
> That human-in-the-loop step is our main control for false positives."

**B:**
> "Two known technical risks.
> First: 47 images is too small to make strong claims about real-world performance.
> We need at least 200 images across varied lighting, camera angles, and environments.
> Second: deployment variability.
> A low-quality school camera will produce worse results than our test setup.
> We documented both of these in the deployment checklist."

**A:**
> "Our next three milestones:
> one — expand the evaluation dataset to 200 images with diverse conditions.
> Two — add a per-camera false positive rate monitor in the dashboard.
> Three — run a live pilot and measure real guard response times
> against our 60-second acknowledgment target."

**B:**
> "Qorgan works today as a complete system.
> Backend, detection pipeline, and web app are connected and tested.
> What we need next is real-world validation.
> Thank you."

---

## Чеклист перед съёмкой

- [ ] Бэкенд запущен, лог терминала виден на экране записи
- [ ] Браузер с открытым Qorgan показывает главный экран
- [ ] Во время демо — показать ЛОГ и браузер одновременно (split screen или рядом)
- [ ] Таблица с 3 проблемами готова как слайд
- [ ] Код открыт в редакторе: detection_service.py строки 120, 142–175 и app.py строки 845–895
- [ ] Говорите медленно — судьи слушают технические детали внимательно
- [ ] Хронометраж: 3:30 максимум
