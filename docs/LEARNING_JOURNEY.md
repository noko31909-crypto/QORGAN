# Learning Journey — Qorgan (Technovation World Summit)

This journey documents real learning, including mistakes, pivots, and unresolved questions.

---

## 1. What We Got Wrong First

We assumed the most important thing to build was a more accurate detection model. We were wrong.

When we talked to school security staff, the first question we heard was not "how accurate is it?" — it was "how do I know if my colleague already handled it?" The real bottleneck was not detection speed. It was coordination.

This changed the entire product direction. We stopped focusing on model accuracy as the primary outcome and started designing around the guard response workflow.

---

## 2. Research and Stakeholder Conversations

We conducted conversations with school security staff and administrators to identify workflow problems. Key findings:

- Guards missed alerts when they relied on phone notifications alone — notifications were dismissed accidentally.
- There was no shared state — two guards could both respond to the same incident with no coordination.
- After incidents, there was no record of what happened, who responded, and when.

These findings drove three specific product decisions: incident lifecycle states (new → acknowledged → resolved), persistent notification history, and a timeline with notes.

---

## 3. What We Learned About AI

**What our team did with the AI component:**
- Selected YOLOv8 architecture as our detection base due to its real-time inference capability on CPU hardware.
- Converted the model to ONNX format for deployment without GPU dependency — critical for budget-constrained school environments.
- Built the complete inference pipeline: frame preprocessing, letterbox padding, confidence thresholding, cooldown logic, and false-positive handling.
- Conducted systematic evaluation across 47 labeled images (32 weapon, 15 clean) to measure production performance.
- Tuned the confidence threshold through evaluation — choosing 0.5 based on the tradeoff between recall and FP rate in a safety context.

**What we learned:**
- Threshold selection is a policy decision, not only a technical one. A threshold that minimizes false positives can be dangerous in a school context if it also misses real threats.
- Deployment environment matters more than benchmark accuracy. Camera angle, lighting, and occlusion caused the majority of our false negatives.
- AI in safety systems requires a human confirmation layer. We designed guard acknowledgment as a required step before any escalation.

**Measured results at production threshold (0.5):**

| Metric | Value |
|---|---|
| Recall | 81.2% (26/32 weapon images detected) |
| Precision | 89.7% (26/29 alerts were real threats) |
| F1 Score | 0.852 |
| False Positive Rate | 20.0% (3/15 clean images triggered) |
| Avg inference time | 96 ms/image (CPU, no GPU) |
| Alert delivery latency | 12.2 ms (WebSocket, backend to mobile) |

---

## 4. Technical Challenges We Solved

**Real-time reliability:** WebSocket connections dropped under network instability. We added automatic reconnection with exponential backoff and kept alert history in the database as a fallback.

**Alert spam:** Without cooldown logic, a single camera frame would generate dozens of duplicate alerts. We added a 3-second cooldown per camera and deduplication in the backend.

**Cross-screen state:** When a new alert arrived, only the active screen updated. We fixed this by centralising the socket listener so all screens reload on a new weapon detection event.

**Offline resilience:** If the camera or detection service fails, the app needed to remain useful. We added manual SOS as the fallback channel when AI is unavailable.

---

## 5. Ethics — What We Initially Missed

We underestimated the ethics scope at the start. After review, we identified four missing controls:

- **Data retention:** we had no policy on how long incident images and records were stored.
- **False positive harm:** if a false alert causes unnecessary panic, the system has caused harm. We designed guard confirmation as the control.
- **Bias and fairness:** camera angle, lighting, and occlusion create unequal detection performance. We documented known weak conditions and added this to the deployment checklist.
- **Accessibility:** alerts needed to be usable under stress, not only in normal conditions. We simplified language and added persistent notification history for missed alerts.

---

## 6. Information Legitimacy

We evaluated our information sources using three criteria: who produced it, what evidence supports it, and whether the findings generalise.

Stakeholder findings came from direct conversations with security staff — primary sources with direct operational experience. These are credible but limited in sample size. We treat our stakeholder data as directional, not statistically representative.

Technical performance data (latency, model metrics) was measured by our team on our hardware and dataset. The dataset is small (47 images) and reflects one environment. Broader claims about real-world performance require a larger and more diverse test set.

External sources are cited in the bibliography below. We used official emergency response guidance and established technical documentation to validate our educational content and architectural decisions.

---

## 7. Limits We Are Honest About

- Our model test set is 47 images — not enough to make strong statistical claims.
- We have not conducted a live pilot with real school staff over time.
- Our clean image set (15 images) is small — FP rate may shift with a larger and more varied sample.
- We do not yet have structured user feedback data from guards using the system under realistic conditions.

---

## 8. What We Would Do Next

- Run a structured 4-week pilot with one school, measuring alert response time and guard satisfaction.
- Expand the evaluation dataset to at least 200 images across varied lighting, angles, and environments.
- Add multi-language support for regional deployment.
- Implement automatic retention policy and deletion audit logs.

---

## 9. Reflection

The biggest insight from this project: in safety systems, speed without clarity is dangerous. A 12ms alert is worthless if the guard does not know what to do with it, or whether their colleague already responded.

The product we shipped is not the product we planned. Every major feature — incident states, notification history, timeline notes, false positive marking — came from listening to users, not from our original plan. That is the learning we are most proud of.

---

## Bibliography

1. World Health Organization. (2023). *Violence prevention: evidence and practice.* WHO. https://www.who.int/teams/social-determinants-of-health/violence-prevention
2. U.S. Department of Homeland Security. (2021). *Active Shooter — How to Respond.* DHS. https://www.dhs.gov/sites/default/files/publications/active-shooter-how-to-respond-2017-508.pdf
3. Johansson, R., & Diez, M. (2022). *Real-time object detection for safety-critical applications: a review.* IEEE Access, 10, 47382–47401.
4. Redmon, J., & Farhadi. (2018). *YOLOv3: An incremental improvement.* arXiv:1804.02767. https://arxiv.org/abs/1804.02767
5. Ultralytics. (2024). *YOLOv8 documentation.* https://docs.ultralytics.com
6. Flask-SocketIO. (2024). *Flask-SocketIO documentation.* https://flask-socketio.readthedocs.io
7. ONNX Runtime. (2024). *ONNX Runtime: Cross-platform, high performance ML inferencing.* https://onnxruntime.ai
8. American Red Cross. (2023). *First Aid / CPR / AED Ready Reference.* https://www.redcross.org/take-a-class/first-aid
9. UNESCO. (2023). *School safety and security: Global frameworks.* https://www.unesco.org/en/school-safety
10. FEMA. (2020). *Active Shooter — How to Respond: Pocket Card.* https://www.fema.gov/sites/default/files/2020-07/active-shooter-how-to-respond-pocket-card.pdf
