# Pitch Deck (Judge-Ready)

This version is structured for high-scoring Technovation judging: specific, evidence-first, and non-generic.

---

## Slide 1 - Title
- Qorgan: School Emergency Response in Under 10 Seconds
- Team name, country, contact
- One-line value: "AI-assisted detection + guard workflow + real-time coordination"

---

## Slide 2 - Problem (with evidence)
- In school emergencies, the first minute is critical.
- Current process is fragmented: camera feed, phone calls, and manual reporting are disconnected.
- Result: delayed acknowledgment, unclear ownership, and inconsistent response.
- Add 1 local/regional safety statistic and source.

Judge check: if no source is shown, this slide is weak.

---

## Slide 3 - Users and Pain
- Primary users: school guards and administrators.
- Secondary users: teachers and students (for guidance/SOS only).
- Pain points from interviews:
  1) "I do not know if another guard already reacted."
  2) "Alerts come from too many channels."
  3) "There is no reliable timeline after incidents."

Add interview count and date range on slide footer.

---

## Slide 4 - Solution
- Camera event is analyzed by model.
- If confidence threshold is met:
  - incident is created,
  - guards receive live alert,
  - response status is tracked (new -> acknowledged -> resolved),
  - timeline is stored for review.
- Human-in-the-loop rule: AI suggests, guard confirms action.

---

## Slide 5 - Live Demo Flow
- Show a 30-45 second end-to-end demo:
  1) trigger event,
  2) guard receives alert,
  3) guard acknowledges,
  4) incident appears in timeline.
- Display measured times on screen:
  - detection-to-alert latency,
  - alert-to-acknowledge latency.

Judge check: timing proof beats feature lists.

---

## Slide 6 - Technology and Why
- Model: YOLO-based ONNX inference for practical real-time processing.
- Backend: Flask + SocketIO for low-latency state updates.
- Mobile: React Native for a single guard interface.
- Why this stack:
  - deployable in budget-limited schools,
  - supports real-time event workflows,
  - easy to pilot with existing camera infrastructure.

---

## Slide 7 - Validation and Iteration
- What we tested:
  - alert delivery reliability,
  - acknowledgment workflow clarity,
  - false-positive handling.
- What changed after tests:
  - global alert visibility across screens,
  - notification persistence,
  - incident timeline and notes.
- Add one "before vs after" metric.

---

## Slide 8 - Responsible AI and Safety
- Data minimization and role-based access.
- Retention policy and deletion process.
- False-positive protocol (manual verification before escalation).
- Accessibility support plan (readable alerts, clear language, high-contrast UI).
- Bias risk statement and test plan by environment conditions.

Judge check: safety AI without ethics controls gets penalized.

---

## Slide 9 - Market and Competition
- Buyer: school administration/district safety office.
- Alternatives:
  1) camera + human monitoring only,
  2) disconnected emergency tools,
  3) expensive enterprise systems.
- Qorgan differentiation:
  - one workflow from detection to closure,
  - affordable pilot path,
  - guard-first response UX.

Use a named-competitor comparison if available.

---

## Slide 10 - Business Model
- B2B annual subscription per school, tiered by number of cameras.
- Pilot strategy:
  - low-risk pilot with clear success metrics,
  - convert to annual plan on KPI achievement.
- Revenue is institutional (no ads, no student monetization).

---

## Slide 11 - Financial Reality
- Show conservative assumptions:
  - deployment/support cost per school,
  - infrastructure cost per active school,
  - expected sales cycle duration.
- Include risk factors:
  - procurement delays,
  - compliance requirements,
  - onboarding burden.

Judge check: optimistic margins without risk modeling are not credible.

---

## Slide 12 - Impact Goals (12 months)
- Pilot schools onboarded.
- p95 alert latency target.
- p95 acknowledgment time target.
- User trust score target from guard/admin surveys.
- False-positive reduction target per model iteration.

---

## Slide 13 - Ask
- Ask for one specific partnership:
  - pilot with X schools for Y months.
- Required support:
  - school access,
  - safety mentor review,
  - operational feedback loop.
- Pilot success criteria must be listed.

---

## Slide 14 - Closing
- "Qorgan does not replace people. It gives schools faster, clearer coordination when seconds matter."
- Contact and demo link.

---

## Final Pitch Checklist
- One real statistic with source in problem slide.
- One real user quote from interview evidence.
- One timed demo with visible stopwatch.
- One metric-driven ask.
- One ethics slide with concrete controls.
