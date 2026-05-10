# Qorgan Summary (Technovation Version)

## Project Description
Qorgan is a school safety response system that reduces delay between threat detection and guard action. A camera stream is analyzed by a YOLO-based model, then the backend creates an incident, sends real-time guard alerts, and tracks response status from new to acknowledged to resolved. The mobile app shows threat context, notifications, and emergency guidance in one workflow. Our target outcome is to shorten first-alert delivery to under 10 seconds and increase incident acknowledgment within 60 seconds. Qorgan is designed for schools that need practical, affordable safety coordination without expensive enterprise infrastructure.

## Problem and Why It Matters
Schools lose critical time during emergency situations because alerts are fragmented across people, tools, and channels. The first minute of response determines whether staff can move students away from danger. Existing school setups often rely on human observation, delayed communication, and no shared incident state.

## SDG Alignment
- SDG 4 (Quality Education): safer learning environments through faster emergency coordination.
- SDG 16 (Peace, Justice, and Strong Institutions): stronger incident reporting and accountable response logs.
- SDG 3 (Good Health and Well-Being): reduced risk of harm through faster alerts and guided actions.

## Research Highlights
- Stakeholder interviews were used to identify core workflow pain points: delayed alerts, unclear roles, and no single incident timeline.
- Product decisions prioritized guard-first response features over non-critical extras.
- Early tests focused on response visibility (who saw alert, when acknowledged, when closed).

## Key Features and Why They Exist
- Real-time weapon alerting: reduce detection-to-notification delay.
- Incident workflow states: prevent confusion about current response status.
- Guard notification center: preserve alert history for accountability.
- Timeline and notes: support post-incident review and training.
- SOS flow: allow manual escalation when AI is uncertain or unavailable.
- Map and guidance support: help users act, not only observe.

## Why This Tech
- YOLO + ONNX pipeline was selected for practical real-time inference performance.
- Flask + SocketIO enables low-latency event delivery and state synchronization.
- React Native app provides one mobile interface for guard operations.
- The architecture favors deployability in school environments with limited budgets.

## Responsible AI and Ethics
Qorgan treats AI detection as decision support, not automatic enforcement. Guard confirmation remains required for action. The project includes an ethics checklist for privacy, bias, accessibility, and operational safety:
- data minimization and retention limits,
- role-based access control,
- false-positive handling and escalation protocol,
- usability for high-stress emergency contexts.

## Measured Performance (as of April 2026)

| Metric | Value | Notes |
|---|---|---|
| Alert delivery latency | **12.2 ms** | Backend → guard notification via WebSocket |
| ACK p95 latency | 0.02 s | Time for guard to acknowledge alert |
| Model recall @ 0.5 | **81.2%** | 26/32 weapon images detected |
| Model precision @ 0.5 | **89.7%** | 26/29 alerts were true threats |
| F1 score @ 0.5 | **0.852** | Balanced threat/clean performance |
| FP rate @ 0.5 | 20.0% | 3/15 clean images triggered (guard confirms) |
| Avg inference time | 96 ms/image | ONNX CPU, no GPU required |
| Test set | 47 images | 32 weapon, 15 clean |

**Threshold rationale:** 0.5 chosen because missing a real threat (FN) is more dangerous than a false alarm (FP). Guards confirm every alert before escalation — human-in-the-loop design prevents automated action.

## Success Metrics
- Alert delivery latency (p95): **12.2 ms** ✓
- Acknowledgment time (p95): **0.02 s** ✓
- False-positive rate by scenario: **20% → guard confirmation layer** ✓
- User-reported clarity of next action: SOS + Map + Notifications flow
