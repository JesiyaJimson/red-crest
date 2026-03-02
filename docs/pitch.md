# RedCrest — Hackathon Pitch Script (2 Minutes)

---

## [SLIDE 1 — THE PROBLEM] *(15 seconds)*

**"Every 4 minutes, a woman in India faces a crime during travel."**

She checks Google Maps — it tells her the *fastest* route. But it doesn't tell her the *safest* route. It doesn't know that the shortcut through that underpass is pitch-dark at 9 PM. It doesn't know she's been standing still for 5 minutes in a zone with no footfall.

Navigation apps were built for **speed**. We built RedCrest for **safety**.

---

## [SLIDE 2 — THE SOLUTION] *(20 seconds)*

RedCrest is a **predictive AI-powered safety companion** for women travelers. It does three things that no existing app does:

1. **Dynamic Safety Heatmaps** — Real-time risk visualization that changes with time of day. Green zones, red zones, and everything in between — powered by crime data, lighting quality, and crowd density.

2. **Route Deviation Detection** — The moment you stray from your planned path, RedCrest notices. 100 meters off? Gentle alert. 500 meters in a danger zone at midnight? Emergency protocol.

3. **Behavioral Anomaly Scoring** — Our AI monitors movement patterns — sudden stops, erratic speed changes, U-turns — and calculates a composite risk score in real-time. It's like having a security analyst watching over you.

---

## [SLIDE 3 — LIVE DEMO] *(40 seconds)*

*[Open RedCrest on screen]*

Watch — I select a route. The app immediately color-codes it by risk. Let me toggle the safety heatmap — see those red zones? Those are based on real crime-pattern data, weighted for this hour.

Now I'll start a journey simulation. Watch the live dashboard — speed, heading, zone risk — all updating in real-time. The anomaly score is at 12. Safe.

Now I'll simulate a deviation — watch what happens as I move toward a danger zone...

*[Score climbs: 35... 55... 72...]*

Warning alert! And if I don't respond in 15 seconds — boom — SOS auto-triggers, my emergency contacts get my live location instantly.

---

## [SLIDE 4 — HOW IT WORKS] *(20 seconds)*

Under the hood, our anomaly scoring engine uses a **weighted composite algorithm** across five dimensions: speed variance, heading stability, stop duration, zone risk, and time-of-day. Each contributes to a 0-100 score.

Everything runs **completely on-device**. No cloud. No tracking. No data leaves the phone. Privacy isn't an afterthought — it's the architecture.

---

## [SLIDE 5 — SCALE & IMPACT] *(15 seconds)*

Right now this is an MVP. But the architecture is built to scale:

- **Phase 2**: Real GPS integration, live crime-data APIs, community crowd-sourced reports
- **Phase 3**: TensorFlow.js ML models trained on anonymized movement patterns
- **Phase 4**: Wearable integration — a shake of your wrist triggers SOS

Our target: **10 million women** protected by 2028.

---

## [SLIDE 6 — THE ASK] *(10 seconds)*

We're not building another panic button app. We're building the **first AI that predicts danger before it happens**.

RedCrest. Because every woman deserves a route home that's not just fast — but safe.

**Thank you.**

---

### Key Talking Points for Q&A

- **"How is this different from existing apps?"** — Existing apps are *reactive* (panic buttons). RedCrest is *predictive* (anomaly detection + route analysis).
- **"What about privacy?"** — Zero data leaves the device. No cloud, no tracking, no accounts.
- **"How accurate is it?"** — Our heatmap uses real crime-pattern distributions. The anomaly model uses established algorithms (Haversine distance, variance analysis, bearing computation).
- **"Revenue model?"** — Freemium: free for individuals, premium for ride-share companies and corporate employee safety programs.
- **"What's next?"** — Real GPS, community reporting, TensorFlow.js ML training, wearable SDK.
