// src/js/ai-engine.js
import * as SafetyData from './data.js';

// --- Configuration ---
export const CONFIG = {
    deviation: {
        cautionThreshold: 100,   // meters
        warningThreshold: 300,
        dangerThreshold: 500,
    },
    anomaly: {
        weights: {
            speed: 0.20,
            heading: 0.15,
            stop: 0.25,
            zone: 0.25,
            time: 0.15,
        },
        thresholds: {
            safe: 30,
            caution: 60,
            warning: 80,
        },
    },
    movement: {
        normalSpeedRange: [1.0, 16.0],  // m/s (~3.6 - 57.6 km/h)
        maxNormalHeadingChange: 45,       // degrees per update
        suspiciousStopDuration: 180,     // seconds (3 min)
    },
};

// --- State ---
let plannedRoute = [];
let positionHistory = [];
let currentAnomalyScore = 0;
let currentDeviationDistance = 0;
let currentRiskLevel = "safe";
let lastUpdateTime = null;
let alertCallbacks = [];

// ==========================================
// 1. ROUTE DEVIATION DETECTION
// ==========================================

export function setPlannedRoute(waypoints) {
    plannedRoute = waypoints.map(w => ({ lat: w[0], lng: w[1] }));
    positionHistory = [];
    currentDeviationDistance = 0;
}

export function getDeviationFromRoute(lat, lng) {
    if (plannedRoute.length < 2) return 0;

    let minDist = Infinity;

    for (let i = 0; i < plannedRoute.length - 1; i++) {
        const dist = pointToSegmentDistance(
            { lat, lng },
            plannedRoute[i],
            plannedRoute[i + 1]
        );
        minDist = Math.min(minDist, dist);
    }

    currentDeviationDistance = minDist;
    return minDist;
}

export function getDeviationLevel(distance) {
    if (distance >= CONFIG.deviation.dangerThreshold) return "danger";
    if (distance >= CONFIG.deviation.warningThreshold) return "warning";
    if (distance >= CONFIG.deviation.cautionThreshold) return "caution";
    return "safe";
}

// Perpendicular distance from point to line segment (in meters)
function pointToSegmentDistance(point, segStart, segEnd) {
    const d = SafetyData.haversine(segStart.lat, segStart.lng, segEnd.lat, segEnd.lng);
    if (d === 0) return SafetyData.haversine(point.lat, point.lng, segStart.lat, segStart.lng);

    const t = Math.max(0, Math.min(1, (
        (point.lat - segStart.lat) * (segEnd.lat - segStart.lat) +
        (point.lng - segStart.lng) * (segEnd.lng - segStart.lng)
    ) / (
            (segEnd.lat - segStart.lat) ** 2 + (segEnd.lng - segStart.lng) ** 2
        )));

    const projLat = segStart.lat + t * (segEnd.lat - segStart.lat);
    const projLng = segStart.lng + t * (segEnd.lng - segStart.lng);

    return SafetyData.haversine(point.lat, point.lng, projLat, projLng);
}

// ==========================================
// 2. BEHAVIORAL ANOMALY SCORING
// ==========================================

export function updatePosition(lat, lng, timestamp) {
    const now = timestamp || Date.now();
    const entry = { lat, lng, time: now, speed: 0, heading: 0 };

    if (positionHistory.length > 0) {
        const prev = positionHistory[positionHistory.length - 1];
        const dt = (now - prev.time) / 1000; // seconds
        const dist = SafetyData.haversine(prev.lat, prev.lng, lat, lng);

        entry.speed = dt > 0 ? dist / dt : 0;
        entry.heading = bearing(prev.lat, prev.lng, lat, lng);
    }

    positionHistory.push(entry);
    if (positionHistory.length > 100) positionHistory.shift();

    lastUpdateTime = now;
    return calculateAnomalyScore(lat, lng, now);
}

function calculateAnomalyScore(lat, lng, timestamp) {
    const hour = new Date(timestamp).getHours();
    const W = CONFIG.anomaly.weights;

    // 1. Speed Anomaly (0-100)
    const speedScore = calculateSpeedAnomaly();

    // 2. Heading Anomaly (0-100) — erratic direction changes
    const headingScore = calculateHeadingAnomaly();

    // 3. Stop Anomaly (0-100) — suspicious stops in unsafe areas
    const stopScore = calculateStopAnomaly(lat, lng);

    // 4. Zone Risk (0-100) — current location danger level
    const zoneScore = SafetyData.getRiskAtPoint(lat, lng, hour);

    // 5. Time Risk (0-100) — time of day factor
    const timeScore = calculateTimeRisk(hour);

    // Composite score
    currentAnomalyScore = Math.round(
        W.speed * speedScore +
        W.heading * headingScore +
        W.stop * stopScore +
        W.zone * zoneScore +
        W.time * timeScore
    );

    currentAnomalyScore = Math.max(0, Math.min(100, currentAnomalyScore));

    // Determine risk level
    const T = CONFIG.anomaly.thresholds;
    if (currentAnomalyScore >= T.warning) currentRiskLevel = "danger";
    else if (currentAnomalyScore >= T.caution) currentRiskLevel = "warning";
    else if (currentAnomalyScore >= T.safe) currentRiskLevel = "caution";
    else currentRiskLevel = "safe";

    // Fire alerts
    fireAlerts({
        anomalyScore: currentAnomalyScore,
        riskLevel: currentRiskLevel,
        deviationDistance: currentDeviationDistance,
        deviationLevel: getDeviationLevel(currentDeviationDistance),
        components: { speedScore, headingScore, stopScore, zoneScore, timeScore },
        position: { lat, lng },
        nearestSafe: SafetyData.getNearestSafeZone(lat, lng),
    });

    return {
        score: currentAnomalyScore,
        level: currentRiskLevel,
        components: {
            speed: Math.round(speedScore),
            heading: Math.round(headingScore),
            stop: Math.round(stopScore),
            zone: Math.round(zoneScore),
            time: Math.round(timeScore),
        },
    };
}

function calculateSpeedAnomaly() {
    if (positionHistory.length < 3) return 0;
    const recent = positionHistory.slice(-5);
    const speeds = recent.map(p => p.speed).filter(s => s > 0);
    if (speeds.length < 2) return 0;

    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((a, s) => a + (s - avg) ** 2, 0) / speeds.length;
    const stdDev = Math.sqrt(variance);

    // High variance = erratic movement
    const erraticScore = Math.min(100, (stdDev / avg) * 100);

    // Too slow or too fast
    const [minNormal, maxNormal] = CONFIG.movement.normalSpeedRange;
    const currentSpeed = speeds[speeds.length - 1];
    let speedOutlier = 0;
    if (currentSpeed < minNormal && currentSpeed > 0.1) speedOutlier = 30;
    if (currentSpeed > maxNormal) speedOutlier = 60;

    return Math.min(100, erraticScore * 0.6 + speedOutlier * 0.4);
}

function calculateHeadingAnomaly() {
    if (positionHistory.length < 4) return 0;
    const recent = positionHistory.slice(-6);
    let totalChange = 0;
    let uTurns = 0;

    for (let i = 1; i < recent.length; i++) {
        const change = Math.abs(recent[i].heading - recent[i - 1].heading);
        const normalized = change > 180 ? 360 - change : change;
        totalChange += normalized;
        if (normalized > 150) uTurns++;
    }

    const avgChange = totalChange / (recent.length - 1);
    const headingScore = Math.min(100, (avgChange / CONFIG.movement.maxNormalHeadingChange) * 40);
    const uTurnPenalty = uTurns * 30;

    return Math.min(100, headingScore + uTurnPenalty);
}

function calculateStopAnomaly(lat, lng) {
    if (positionHistory.length < 3) return 0;
    const recent = positionHistory.slice(-10);

    // Check if essentially stopped
    let stoppedDuration = 0;
    for (let i = recent.length - 1; i >= 1; i--) {
        if (recent[i].speed < 0.5) {
            stoppedDuration += (recent[i].time - recent[i - 1].time) / 1000;
        } else {
            break;
        }
    }

    if (stoppedDuration < 30) return 0;

    // Longer stop = higher anomaly, especially in risky areas
    const hour = new Date().getHours();
    const zoneRisk = SafetyData.getRiskAtPoint(lat, lng, hour);
    const durationFactor = Math.min(1, stoppedDuration / CONFIG.movement.suspiciousStopDuration);

    return Math.min(100, durationFactor * 50 + zoneRisk * 0.5);
}

function calculateTimeRisk(hour) {
    if (hour >= 23 || hour < 4) return 90;
    if (hour >= 20) return 65;
    if (hour >= 18) return 40;
    if (hour < 6) return 70;
    if (hour < 8) return 25;
    return 10;
}

function bearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
        Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ==========================================
// 3. PREDICTIVE RISK ASSESSMENT
// ==========================================

export function assessRouteRisk(waypoints) {
    const hour = new Date().getHours();
    let totalRisk = 0;
    const segmentRisks = [];

    for (let i = 0; i < waypoints.length; i++) {
        const risk = SafetyData.getRiskAtPoint(waypoints[i][0], waypoints[i][1], hour);
        totalRisk += risk;
        segmentRisks.push({
            point: waypoints[i],
            risk: Math.round(risk),
            label: risk > 60 ? "High Risk" : risk > 30 ? "Moderate" : "Safe",
        });
    }

    const avgRisk = totalRisk / waypoints.length;
    const maxRisk = Math.max(...segmentRisks.map(s => s.risk));

    return {
        averageRisk: Math.round(avgRisk),
        maxRisk,
        overallLevel: avgRisk > 60 ? "high" : avgRisk > 30 ? "moderate" : "low",
        segments: segmentRisks,
    };
}

// ==========================================
// ALERT SYSTEM INTEGRATION
// ==========================================

export function onAlert(callback) {
    alertCallbacks.push(callback);
}

function fireAlerts(data) {
    alertCallbacks.forEach(cb => cb(data));
}

// Accessors for state
export function getAnomalyScore() { return currentAnomalyScore; }
export function getRiskLevel() { return currentRiskLevel; }
export function getDeviationDistance() { return currentDeviationDistance; }
export function getHistory() { return [...positionHistory]; }
