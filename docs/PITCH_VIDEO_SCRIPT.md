# QORGAN — Pitch Video Script
# Technovation World Summit | Senior Division
# Duration: 4:00 | Language: English

Speakers: **Dilya (D)** · **Aidana (A)** · **Amira (Am)**

---

## [0:00–0:30] HOOK

*(Чёрный экран. Тишина. Звук школьного звонка.)*
*(Фото школьного коридора — пустой, спокойный.)*

**D** *(смотрит прямо в камеру)*:
> "January 2025.
> An 11th grader in Petropavlovsk, Kazakhstan
> walked into school with a gun.
> Two months later — a 15-year-old in Kulsary brought an axe.
> These are not distant tragedies.
> These happened in our country.
> In schools like ours."

*(Пауза. 2 секунды.)*

**D:**
> "The cameras were there.
> No one reacted in time.
> That is the problem we came here to solve."

---

## [0:30–1:10] ПРОБЛЕМА + ИССЛЕДОВАНИЕ

*(Инфографика: 1 охранник → стена из 40 экранов камер)*

**A:**
> "Every school in Kazakhstan has security cameras.
> But security cameras are not the same as security.
> One guard is expected to monitor between 20 and 80 feeds simultaneously.
> Research on human attention shows concentration drops
> significantly after just 15 to 20 minutes of screen monitoring.
> In the moment of a real threat — he may simply not see it."

**A:**
> "We spoke directly with school security staff and administrators
> to understand where the system breaks down.
> What we heard was consistent:
> guards missed alerts when notifications were accidentally dismissed.
> Two guards would respond to the same incident with no coordination —
> because there was no shared incident state.
> And after emergencies, there was no record of who responded, when, and what happened.
> The bottleneck is not the cameras.
> The bottleneck is everything that happens after detection."

*(На екрані: 3 pain points)*

**A:**
> "The U.S. Secret Service found that in 93 percent of targeted school attacks,
> someone knew about the threat beforehand.
> The information existed. The coordination did not."

---

## [1:10–1:25] SDG GOALS

**Am:**
> "This connects to three United Nations Sustainable Development Goals.
> SDG 3 — Good Health and Well-Being:
> faster response directly reduces physical harm.
> SDG 4 — Quality Education:
> children cannot learn in a place where they feel unsafe.
> SDG 16 — Peace and Strong Institutions:
> transparent incident logs and accountable response
> build the institutional trust that communities need."

---

## [1:25–2:10] РІШЕННЯ — Как работает QORGAN

*(Анімація: Camera → AI → Incident → Web alert)*

**D:**
> "We built QORGAN —
> an AI-powered threat detection and coordinated response system
> built specifically for schools."

**D:**
> "QORGAN connects to cameras already installed in the school —
> no new hardware required.
> Our AI model, built on the YOLOv8 architecture and deployed in ONNX format,
> analyzes every camera feed simultaneously, in real time,
> on standard CPU hardware — no expensive GPU needed."

**D:**
> "The moment it detects an object that looks like a weapon,
> the system automatically creates an incident,
> and delivers an alert to the guard's phone
> in 12.2 milliseconds via WebSocket.
> The notification shows: which camera, which location, confidence level.
> The guard confirms or dismisses — one tap.
> Every action is logged with a timestamp.
> The incident moves through a clear lifecycle:
> new → acknowledged → resolved.
> No confusion. No duplication. No missed response."

**D:**
> "And when AI is uncertain — guards and students have a manual SOS button.
> The app also includes emergency protocols:
> evacuation maps, first aid, and lockdown guidance.
> QORGAN does not replace the human.
> It gives the human the information they need
> to act before it is too late."

---

## [2:10–2:30] LIVE DEMO

*(Split screen: браузер + терминал з логами)*

**A:**
> "This is live. Watch."

*(Запускает симуляцию)*

> "Threat detected at Main Hall. Confidence: 95 percent.
> Alert delivered to the guard phone —
> 12 milliseconds from detection to notification.
> Guard acknowledges. Status: acknowledged.
> Timestamp logged. Incident timeline updated.
> That is the complete workflow — in under 10 seconds."

---

## [2:30–2:55] ITERATION + FIGMA + USER FEEDBACK

*(Показывает Figma — до и после)*

**Am:**
> "Before writing code, we designed the interface in Figma.
> Our first version had too many screens, too many options.
> We showed it to security staff from our pilot partner.
> The feedback was direct:
> 'In an emergency, I will not read menus.'
> So we rebuilt everything around one principle:
> the guard should never have to think about what to do next.
> One alert. One confirm button. One status.
> The user changed our product."

**Am:**
> "And we already have our first real-world commitment.
> One educational center in [город] has agreed to be our pilot partner.
> They will deploy and test QORGAN in real conditions —
> measuring alert response time and guard satisfaction.
> This is not a plan. This is already happening."

---

## [2:55–3:15] ПОЧЕМУ QORGAN — Конкуренты

*(Сравнительная таблица на экране)*

**A:**
> "Existing solutions were not built for schools like ours.
> ZeroEyes and Omnilert — AI weapon detection systems from the US —
> cost over 15,000 to 20,000 dollars per year,
> are not available in Central Asia,
> and do not include a web guard workflow.
> Standard CCTV just records — zero reaction.
> QORGAN is the only solution that combines
> AI detection, real-time guard alerting,
> incident lifecycle tracking, student SOS,
> and emergency guidance —
> in one web app,
> at a price schools can actually afford,
> running on hardware they already have."

---

## [3:15–3:40] БИЗНЕС + ФИНАНСИ

*(Фінансова інфографіка)*

**D:**
> "Our model is SaaS — annual subscription by camera capacity.
> Starter plan: 1,200 dollars per year for up to 4 cameras.
> School plan: 2,800 dollars per year for up to 12 cameras.
> District plan: 6,000 dollars and above.
> First-year revenue per school including onboarding: approximately 3,400 dollars.
> Estimated gross margin: 71 percent."

**D:**
> "The market is real and growing.
> The global school security software market is 3.1 billion dollars,
> growing at 12 percent annually.
> In Kazakhstan alone — 7,500 schools.
> One percent adoption at School tier
> means 210,000 dollars in annual recurring revenue.
> Central Asia total: 35,000 schools.
> Serviceable addressable market: 15 million dollars."

**D:**
> "Our 12-month roadmap:
> months 1 to 3 — one pilot school, measuring response time and satisfaction.
> Months 4 to 6 — convert to paid, onboard two more schools.
> Months 7 to 12 — five paying schools, 14,000 dollars ARR,
> first district-level conversation."

---

## [3:40–4:00] ЗАКЛЮЧЕННЯ

*(Три участниці разом в кадрі)*

**Am:**
> "QORGAN is not just a product."

**A:**
> "It is the alert that reaches the guard
> before the threat reaches the students."

**D:**
> "Because sometimes —
> one missed camera
> is one life that cannot be brought back."

*(Пауза. 2 секунди.)*

**Всі три:**
> "We are QORGAN.
> Thank you."

*(Логотип QORGAN. Тишина.)*

---

## РУБРИКА — всі 6 пунктів закриті ✅

| Критерій Technovation | Де в скрипті | Дані |
|---|---|---|
| Проблема + важливість + SDG | 0:00–1:25 | Реальні випадки КЗ, Secret Service 93% |
| Дослідження з методологією | 0:30–1:10 | Розмови з охоронцями, 3 конкретні висновки |
| 1-2 ключові фічі + доказ | 1:25–2:30 | 12.2ms латентність, live demo |
| Чому ця технологія краща | 2:55–3:15 | vs ZeroEyes $20K, vs Omnilert $15K |
| Реальний користувач + фідбек | 2:30–2:55 | Figma итерація, пілотний партнер |
| Бізнес модель + фінансовий план | 3:15–3:40 | $2,800/school, 71% margin, $15M SAM |

---

## ЩО ПОКАЗУВАТИ НА ЕКРАНІ

| Час | Слайд / Відео |
|---|---|
| 0:00–0:30 | Чорний екран → фото школи → заголовки новин КЗ |
| 0:30–1:10 | 1 охоронець / 40 камер → 3 pain points |
| 1:10–1:25 | Іконки SDG 3, 4, 16 |
| 1:25–2:10 | Схема: Camera → YOLO ONNX → WebSocket → Web |
| 2:10–2:30 | Split screen: браузер + термінал з логами |
| 2:30–2:55 | Figma before/after + фото пілотного центру |
| 2:55–3:15 | Таблиця: QORGAN vs ZeroEyes vs Omnilert vs CCTV |
| 3:15–3:40 | Тиєри $1,200 / $2,800 / $6,000 → $15M SAM |
| 3:40–4:00 | Три учасниці → логотип |

---

## ЧЕКЛИСТ ПЕРЕД ЗЙОМКОЮ

- [ ] Вставити реальне число людей в опитуванні
- [ ] Вставити назву / місто пілотного центру
- [ ] Figma скрини (до і після редизайну) готові
- [ ] Порівняльна таблиця готова як слайд
- [ ] Браузер с открытым Qorgan + бекенд запущено для live demo
- [ ] Split screen налаштовано (браузер + лог терміналу)
- [ ] Всі три учасниці в кадрі на фінальній сцені
- [ ] Хронометраж: 4:00 максимум
