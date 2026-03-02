// src/js/map.js
import L from 'leaflet';
import 'leaflet.heat';
import * as SafetyData from './data.js';
import * as AIEngine from './ai-engine.js';

let map = null;
let heatLayer = null;
let routePolyline = null;
let userMarker = null;
let safeZoneMarkers = [];
let deviationCircle = null;
let simulationInterval = null;
let simulationIndex = 0;
let currentRoute = null;
let heatmapVisible = false;

// --- Custom icons ---
const icons = {
    user: null,
    police: null,
    hospital: null,
    metro: null,
    market: null,
    danger: null,
};

export function init() {
    // Fix Leaflet paths - in Vite these would ideally come from imports or public/
    // For now assuming they stay in public/lib/ or relative to index.html
    L.Icon.Default.prototype.options.iconUrl = '/lib/marker-icon.png';
    L.Icon.Default.prototype.options.iconRetinaUrl = '/lib/marker-icon-2x.png';
    L.Icon.Default.prototype.options.shadowUrl = '/lib/marker-shadow.png';

    map = L.map("map", {
        center: [17.385, 78.4867],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
    }).addTo(map);

    L.control.attribution({ position: "bottomleft", prefix: false })
        .addAttribution('© <a href="https://carto.com/">CARTO</a>')
        .addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    createIcons();
    return map;
}

function createIcons() {
    icons.user = L.divIcon({
        className: "user-marker",
        html: `<div class="user-marker-dot"><div class="user-marker-pulse"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    // Green safezones for positive reinforcement as requested
    const safeIconHTML = (emoji) => `<div class="safe-zone-marker-green">${emoji}</div>`;

    icons.police = L.divIcon({ className: "safe-icon-green", html: safeIconHTML("🚔"), iconSize: [28, 28], iconAnchor: [14, 14] });
    icons.hospital = L.divIcon({ className: "safe-icon-green", html: safeIconHTML("🏥"), iconSize: [28, 28], iconAnchor: [14, 14] });
    icons.metro = L.divIcon({ className: "safe-icon-green", html: safeIconHTML("🚇"), iconSize: [28, 28], iconAnchor: [14, 14] });
    icons.market = L.divIcon({ className: "safe-icon-green", html: safeIconHTML("🏪"), iconSize: [28, 28], iconAnchor: [14, 14] });
    icons.danger = L.divIcon({ className: "danger-icon", html: `<div class="danger-marker">⚠️</div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
}

export function toggleHeatmap() {
    heatmapVisible = !heatmapVisible;
    heatmapVisible ? showHeatmap() : hideHeatmap();
    return heatmapVisible;
}

export function showHeatmap() {
    const hour = new Date().getHours();
    const data = SafetyData.generateHeatmapData(hour);
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(data, {
        radius: 35, blur: 25, maxZoom: 15, max: 1.0,
        gradient: { 0.0: "#00ff88", 0.3: "#ffff00", 0.6: "#ff8800", 0.8: "#ff2200", 1.0: "#cc0000" },
    }).addTo(map);
    heatmapVisible = true;
}

export function hideHeatmap() {
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = null;
    heatmapVisible = false;
}

export function showSafeZones() {
    clearSafeZones();
    SafetyData.safeZones.forEach(zone => {
        const icon = icons[zone.type] || icons.market;
        const marker = L.marker([zone.lat, zone.lng], { icon })
            .bindPopup(`<b>${zone.label}</b><br>Type: ${zone.type}<br>Safety: ${Math.round(zone.safety * 100)}%`)
            .addTo(map);
        safeZoneMarkers.push(marker);
    });
}

export function clearSafeZones() {
    safeZoneMarkers.forEach(m => map.removeLayer(m));
    safeZoneMarkers = [];
}

export function displayRoute(routeKey) {
    clearRoute();
    const route = SafetyData.sampleRoutes[routeKey];
    if (!route) return null;
    currentRoute = route;
    const riskAssessment = AIEngine.assessRouteRisk(route.waypoints);
    const latlngs = route.waypoints.map(w => [w[0], w[1]]);

    L.polyline(latlngs, { color: "#ffffff20", weight: 8, lineCap: "round" }).addTo(map);
    const colors = { low: "#00ff88", moderate: "#ffaa00", high: "#ff3344" };
    routePolyline = L.polyline(latlngs, {
        color: colors[riskAssessment.overallLevel] || "#00ff88",
        weight: 5, lineCap: "round", dashArray: "12 6",
    }).addTo(map);

    L.marker(latlngs[0], { icon: L.divIcon({ className: "route-endpoint", html: `<div class="route-start">A</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map);
    L.marker(latlngs[latlngs.length - 1], { icon: L.divIcon({ className: "route-endpoint", html: `<div class="route-end">B</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map);
    map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
    AIEngine.setPlannedRoute(route.waypoints);
    return riskAssessment;
}

export function clearRoute() {
    if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
    map.eachLayer(layer => {
        if ((layer instanceof L.Polyline || layer instanceof L.CircleMarker) && layer !== routePolyline) {
            try { map.removeLayer(layer); } catch (e) { }
        }
    });
    currentRoute = null;
}

export function updateUserPosition(lat, lng) {
    if (userMarker) userMarker.setLatLng([lat, lng]);
    else userMarker = L.marker([lat, lng], { icon: icons.user }).addTo(map);

    const deviation = AIEngine.getDeviationFromRoute(lat, lng);
    const devLevel = AIEngine.getDeviationLevel(deviation);
    const devColors = { safe: "#00ff8840", caution: "#ffaa0060", warning: "#ff880080", danger: "#ff334490" };
    if (deviationCircle) map.removeLayer(deviationCircle);
    if (deviation > 50) {
        deviationCircle = L.circle([lat, lng], {
            radius: Math.min(deviation, 600), color: devColors[devLevel],
            fillColor: devColors[devLevel], fillOpacity: 0.2, weight: 2,
        }).addTo(map);
    }
}

export function startSimulation(routeKey, onUpdate) {
    stopSimulation();
    const route = SafetyData.sampleRoutes[routeKey];
    if (!route) return;
    currentRoute = route;
    AIEngine.setPlannedRoute(route.waypoints);
    simulationIndex = 0;
    const detailedPath = interpolateRoute(route.waypoints, 50);
    simulationInterval = setInterval(() => {
        if (simulationIndex >= detailedPath.length) { stopSimulation(); if (onUpdate) onUpdate({ finished: true }); return; }
        const point = detailedPath[simulationIndex];
        updateUserPosition(point[0], point[1]);
        const anomaly = AIEngine.updatePosition(point[0], point[1], Date.now());
        const deviation = AIEngine.getDeviationFromRoute(point[0], point[1]);
        if (onUpdate) onUpdate({ position: point, index: simulationIndex, total: detailedPath.length, anomaly, deviation: Math.round(deviation), deviationLevel: AIEngine.getDeviationLevel(deviation) });
        simulationIndex++;
    }, 800);
}

export function simulateDeviation(onUpdate) {
    if (!currentRoute) return;
    stopSimulation();
    const waypoints = currentRoute.waypoints;
    const midIdx = Math.floor(waypoints.length / 2);
    const mid = waypoints[midIdx];
    let nearestHotspot = SafetyData.crimeHotspots[0];
    let minDist = Infinity;
    SafetyData.crimeHotspots.forEach(h => {
        const d = SafetyData.haversine(mid[0], mid[1], h.lat, h.lng);
        if (d < minDist && d > 200) { minDist = d; nearestHotspot = h; }
    });
    const deviatedPath = [];
    for (let i = 0; i <= midIdx; i++) deviatedPath.push(waypoints[i]);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const lat = mid[0] + t * (nearestHotspot.lat - mid[0]) * 0.6;
        const lng = mid[1] + t * (nearestHotspot.lng - mid[1]) * 0.6;
        deviatedPath.push([lat, lng]);
    }
    const detailed = interpolateRoute(deviatedPath, 40);
    simulationIndex = 0;
    simulationInterval = setInterval(() => {
        if (simulationIndex >= detailed.length) { stopSimulation(); if (onUpdate) onUpdate({ finished: true }); return; }
        const point = detailed[simulationIndex];
        updateUserPosition(point[0], point[1]);
        map.panTo([point[0], point[1]], { animate: true });
        const anomaly = AIEngine.updatePosition(point[0], point[1], Date.now());
        const deviation = AIEngine.getDeviationFromRoute(point[0], point[1]);
        if (onUpdate) onUpdate({ position: point, index: simulationIndex, total: detailed.length, anomaly, deviation: Math.round(deviation), deviationLevel: AIEngine.getDeviationLevel(deviation), deviated: true });
        simulationIndex++;
    }, 600);
}

export function stopSimulation() {
    if (simulationInterval) { clearInterval(simulationInterval); simulationInterval = null; }
}

function interpolateRoute(waypoints, totalPoints) {
    const result = [];
    const segmentCount = waypoints.length - 1;
    const pointsPerSegment = Math.ceil(totalPoints / segmentCount);
    for (let i = 0; i < segmentCount; i++) {
        for (let j = 0; j < pointsPerSegment; j++) {
            const t = j / pointsPerSegment;
            const lat = waypoints[i][0] + t * (waypoints[i + 1][0] - waypoints[i][0]);
            const lng = waypoints[i][1] + t * (waypoints[i + 1][1] - waypoints[i][1]);
            result.push([lat + (Math.random() - 0.5) * 0.0003, lng + (Math.random() - 0.5) * 0.0003]);
        }
    }
    result.push(waypoints[waypoints.length - 1]);
    return result;
}

export function getMap() { return map; }
export function isHeatmapVisible() { return heatmapVisible; }
