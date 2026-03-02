# RedCrest — Ethical Considerations

## 1. Privacy-First Architecture

- **All processing happens on-device.** No data is sent to external servers. GPS positions, anomaly scores, and route history remain exclusively on the user's device.
- **No location tracking.** RedCrest does not store historical location data beyond the current session. When the app is closed, movement history is purged from memory.
- **Emergency contact data** is stored only in the browser's `localStorage`, never transmitted unless an SOS is explicitly triggered.

## 2. No Demographic Profiling

- RedCrest does **not** collect, infer, or use demographic data (age, ethnicity, income, religion) in its risk calculations.
- Safety scores are based solely on **environmental factors** — crime data, lighting, crowd density, and time — never on the identity of the user or the people around them.
- This prevents the system from reinforcing racial or socioeconomic biases that plague many "safety" apps.

## 3. Data Transparency

- Every component of the anomaly score is **visible to the user** in real-time: speed, heading, stop duration, zone risk, and time risk.
- Users can see **exactly why** an alert was triggered — no black-box decisions.
- The safety heatmap source data (crime hotspots, safe zones) is open and inspectable.

## 4. Consent & Control

- **SOS is never automatic without warning.** The system always gives a 15-second countdown with a clear "I'M SAFE — CANCEL" button before escalating.
- Users **choose** their emergency contacts, what information to share, and can cancel SOS at any time.
- There is no "always-on surveillance." Monitoring only activates when the user starts a journey.

## 5. Handling False Positives & Negatives

| Concern | Mitigation |
|---------|------------|
| False alarm fatigue | Multi-level alerts (info → caution → warning → danger) prevent over-alerting |
| False sense of security | Scores are presented as "estimates" — never as guarantees |
| Score anxiety | UI design uses calming visuals; only escalates urgency when necessary |

## 6. Avoiding Surveillance Creep

- RedCrest is designed as a **self-protection tool**, not a tracking tool.
- No third party (employer, government, partner) can access the user's data through RedCrest.
- Future development must resist pressure to add:
  - Employer-mandated tracking
  - Government surveillance integration
  - Partner/family tracking without clear mutual consent

## 7. Inclusive Design

- The app uses **no gendered imagery** beyond its safety mission statement.
- UI is designed for **accessibility**: high-contrast dark mode, large touch targets (SOS button), clear typography.
- Safety data does not stigmatize specific neighborhoods — it presents risk factors neutrally.

## 8. Responsible AI Commitment

> RedCrest exists to **empower**, not to surveil. Every design decision prioritizes the user's autonomy, dignity, and right to privacy. We commit to transparency in our algorithms, user control over their data, and resistance to mission creep.
