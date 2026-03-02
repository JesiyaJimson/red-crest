# RedCrest — System Architecture

## Overview

RedCrest is a predictive AI-powered women safety travel application that uses real-time behavioral analysis, route monitoring, and dynamic safety mapping to protect women during travel.

```
┌─────────────────────────────────────────────────────┐
│                   REDCREST APP                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Map UI   │  │ Panels   │  │  Alert Overlays  │ │
│  │ (Leaflet) │  │ (Glass)  │  │  (SOS/Countdown) │ │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│        │              │                  │           │
│  ┌─────▼──────────────▼──────────────────▼─────────┐│
│  │              APP CONTROLLER (app.js)             ││
│  │   Navigation • Events • UI State • Simulation   ││
│  └───────┬──────────────┬──────────────┬───────────┘│
│          │              │              │             │
│  ┌───────▼─────┐ ┌──────▼──────┐ ┌────▼──────────┐ │
│  │   MAP.JS    │ │ AI-ENGINE   │ │  ALERTS.JS    │ │
│  │             │ │             │ │               │ │
│  │ • Leaflet   │ │ • Route Dev │ │ • Multi-level │ │
│  │ • Heatmap   │ │ • Anomaly   │ │ • SOS System  │ │
│  │ • Routes    │ │ • Risk Pred │ │ • Contacts    │ │
│  │ • Simulate  │ │ • Scoring   │ │ • Countdown   │ │
│  └───────┬─────┘ └──────┬──────┘ └────┬──────────┘ │
│          │              │              │             │
│  ┌───────▼──────────────▼──────────────▼───────────┐│
│  │            DATA ENGINE (data.js)                ││
│  │  Crime Hotspots • Safe Zones • Lighting         ││
│  │  Crowd Patterns • Sample Routes • Haversine     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## AI Pipeline

### 1. Route Deviation Detection

```
GPS Position ──► Point-to-Segment Distance ──► Threshold Check ──► Alert Level
                     │                              │
                     │  perpendicular distance       │  >100m = Caution
                     │  to nearest route segment     │  >300m = Warning
                     │                              │  >500m = Danger
                     ▼                              ▼
             Night Multiplier (2×)          Time-weighted risk
```

### 2. Behavioral Anomaly Scoring

```
Composite Score = Σ (weight × component_score)

┌─────────────┬────────┬──────────────────────────────────┐
│ Component   │ Weight │ What it measures                  │
├─────────────┼────────┼──────────────────────────────────┤
│ Speed       │ 0.20   │ Erratic speed changes, outliers   │
│ Heading     │ 0.15   │ Direction changes, U-turns         │
│ Stop        │ 0.25   │ Suspicious stops in unsafe areas   │
│ Zone        │ 0.25   │ Current location danger level      │
│ Time        │ 0.15   │ Time-of-day risk factor            │
└─────────────┴────────┴──────────────────────────────────┘

Score → Level:  0-30 = SAFE  |  30-60 = CAUTION  |  60-80 = WARNING  |  80+ = DANGER
```

### 3. Dynamic Safety Heatmap

```
Grid Risk Score = f(crime_proximity, safe_zone_proximity, lighting, time_of_day)

Crime Hotspots ──────┐
Safe Zones ──────────┤
Lighting Quality ────┼──► Weighted Risk Grid ──► Leaflet Heatmap Layer
Crowd Density ───────┤                             (green → red gradient)
Time of Day ─────────┘
```

## Scalability Roadmap

| Phase | Feature | Tech |
|-------|---------|------|
| **MVP** (Now) | Client-side AI, simulated data | Vanilla JS, Leaflet |
| **v2** | Real GPS, real crime data APIs | Node.js backend, MongoDB |
| **v3** | ML model training, TensorFlow.js | ONNX/TF.js, federated learning |
| **v4** | Community reporting, crowd-sourced | WebSocket, real-time DB |
| **v5** | Wearable integration, IoT | BLE, Wear OS SDK |

## Data Flow

```
User Input (route) ──► AI Risk Assessment ──► Route Display (risk-colored)
                                                     │
GPS Updates ──► Deviation Check ──┐                  │
               Anomaly Score ─────┼──► Alert Engine ──► Toast / Overlay / SOS
               Zone Risk ────────┘         │
                                          ▼
                               Emergency Contacts
                               (localStorage / SMS API)
```
