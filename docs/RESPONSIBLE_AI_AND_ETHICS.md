# Responsible AI and Ethics (Qorgan)

Qorgan operates in a high-risk context (school safety). This document defines minimum safeguards required for responsible deployment.

## 1) Safety Principle
AI outputs are decision support only. Final action is always human-controlled by authorized staff.

## 2) Privacy and Data Governance
- Collect only data required for incident detection and response workflow.
- Store incident data with role-based access control.
- Apply clear retention windows and deletion procedures.
- Do not use student data for unrelated model training without explicit legal basis and consent requirements.

## 3) Bias and Fairness Risk
- Measure model performance across varied school environments (lighting, camera quality, occlusion).
- Track false positives and false negatives by scenario.
- Document known weak conditions and operational guidance.
- Retrain and re-evaluate before broader rollout.

## 4) False Positive / False Negative Harm Controls
- Require guard verification step before high-severity escalation.
- Provide structured incident statuses to prevent duplicate panic actions.
- Keep cooldown and deduplication logic to reduce alert spam.
- Maintain manual SOS channel when AI is uncertain or unavailable.

## 5) Accessibility
- High-contrast alert UI and readable typography.
- Simple language for high-stress scenarios.
- Multi-language support plan for local deployment contexts.
- Alert delivery through persistent notification history, not only transient popups.

## 6) Security Controls
- JWT-based auth with role restrictions.
- Strict API access for guard-only operational actions.
- Audit-friendly incident and status-change records.

## 7) Environmental Considerations
- Prefer efficient model deployment profiles for school infrastructure limits.
- Monitor compute usage per active camera and optimize inference load where possible.

## 8) Deployment Readiness Checklist
- Privacy policy approved by school administration.
- Incident response protocol reviewed by safety staff.
- User training completed for guard workflows.
- Fallback procedures documented for service/model failure.

## 9) Open Limitations
- Model performance can degrade in unseen environments.
- Camera quality variability affects detection reliability.
- Ethical acceptability depends on transparent governance, not only technical accuracy.
