# Qorgan Business Canvas

## 1) Problem
- Schools face delayed emergency response due to disconnected systems.
- Guards and administrators lack one shared, real-time incident view.
- Post-incident review is weak without structured response logs.

**Evidence:** The U.S. Secret Service National Threat Assessment Center (2023) found that in 93% of targeted school attacks, other students knew beforehand — highlighting that detection and coordination gaps are real and measurable.

---

## 2) Customer Segments
- **Primary economic buyer:** school administration and district-level safety leads.
- **Primary daily user:** school guards and security staff.
- **Secondary stakeholders:** teachers, students, parents, local authorities.

**Beachhead market:** Private schools in Central Asia (Kazakhstan, Uzbekistan) — higher budget flexibility, lower procurement friction than public sector.

---

## 3) Unique Value Proposition
> "Qorgan gives schools a real-time coordinated response workflow — from AI-assisted detection to acknowledged, resolved, and logged incident — in one mobile app, deployable without enterprise infrastructure."

---

## 4) Solution
- AI-assisted weapon detection from camera feeds (YOLO + ONNX, CPU-only).
- Real-time guard alerting via WebSocket — measured 12ms delivery latency.
- Incident lifecycle tracking: new → acknowledged → resolved.
- Notification history, timeline, and operational notes for accountability.
- Manual SOS for students and manual escalation when AI is uncertain.
- Educational emergency protocols for students (Run/Hide/Fight, CPR, evacuation).

---

## 5) Channels
- Direct pilot outreach to private schools and school networks.
- Safety-focused partnerships with local education authorities.
- Demonstration-based sales with principals and safety leads.
- Referral from pilot schools to peer institutions.

---

## 6) Revenue Streams

| Tier | Price (USD/year) | Cameras | Users |
|---|---|---|---|
| Starter | $1,200 | Up to 4 | Up to 20 |
| School | $2,800 | Up to 12 | Unlimited |
| District | $6,000+ | Unlimited | Unlimited + SLA |

- One-time setup and onboarding: $500–$800 per school.
- Optional annual training package: $300/year.

**Unit economics:** School tier at $2,800/year with $600 onboarding = $3,400 first-year revenue per customer. Estimated COGS (infra + support) = ~$800/year. Gross margin: ~71%.

---

## 7) Market Size

- **Kazakhstan:** ~7,500 schools. Even 1% adoption at School tier = $210,000 ARR.
- **Central Asia total** (KZ + UZ + KG): ~35,000 schools.
- **Global school security software market:** $3.1 billion in 2023, growing at 12% CAGR (MarketsandMarkets, 2023).
- **SAM (Central Asia, private schools with budgets):** ~$15M addressable at current pricing.

---

## 8) Competitive Positioning

| Feature | Qorgan | ZeroEyes (USA) | Omnilert (USA) | Manual CCTV |
|---|---|---|---|---|
| AI weapon detection | ✅ | ✅ | ✅ | ❌ |
| Mobile guard workflow | ✅ | ❌ | ✅ | ❌ |
| Incident lifecycle (ack/resolve) | ✅ | ❌ | ❌ | ❌ |
| Student SOS | ✅ | ❌ | ❌ | ❌ |
| CPU-only (no GPU required) | ✅ | ❌ | ❌ | — |
| Est. annual price (school) | $2,800 | $20,000+ | $15,000+ | $0 (labour only) |
| Available in Central Asia | ✅ | ❌ | ❌ | ✅ |

**Key differentiator:** ZeroEyes and Omnilert are US-enterprise products, priced and regulated for that market. Qorgan is designed for school environments in markets where those products are unavailable, unaffordable, or not compliant with local data requirements.

---

## 9) Key Metrics
- p95 alert delivery latency: **12.2ms** ✓
- p95 acknowledgment time: **0.02s** ✓
- Pilot-to-paid conversion rate (target): 60%
- Annual school retention (target): 85%
- False-positive rate: **20%** — mitigated by human confirmation step

---

## 10) Unfair Advantage
- Guard-first workflow design based on school response use cases — not adapted from enterprise security.
- Unified incident state and timeline focused on coordination quality, not just detection.
- Built for CPU-only deployment — no GPU, no cloud lock-in, runs on existing school infrastructure.
- **Planned:** data-driven model improvement from validated pilot environments.

---

## 11) Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Slow procurement in education | Pilot contracts with clear 30-day success metrics |
| Legal/trust concerns from false positives | Human confirmation layer; FP rate disclosed upfront |
| High onboarding effort | Standardised deployment checklist; remote setup support |
| Privacy and data concerns | Local data storage option; role-based access; retention policy |
| Single-founder/team scaling | Modular codebase; API-first backend allows partner integrations |

---

## 12) Traction Goals (12 Months)
- Month 1–3: 1 pilot school, measuring alert response time and guard satisfaction.
- Month 4–6: Convert pilot to paid. Onboard 2 additional schools.
- Month 7–12: 5 paying schools, $14,000 ARR, first district conversation.
