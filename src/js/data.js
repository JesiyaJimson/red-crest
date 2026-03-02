// src/js/data.js

// --- Crime hotspot clusters (lat, lng, intensity 0-1) ---
export const crimeHotspots = [
    { lat: 17.4344, lng: 78.5013, intensity: 0.9, label: "Secunderabad Station Underpass" },
    { lat: 17.4380, lng: 78.4980, intensity: 0.75, label: "RPF Colony Back Road" },
    { lat: 17.4156, lng: 78.4095, intensity: 0.85, label: "Film Nagar Back Streets" },
    { lat: 17.4210, lng: 78.4050, intensity: 0.70, label: "Jubilee Hills Road 36 Extension" },
    { lat: 17.3616, lng: 78.4747, intensity: 0.95, label: "Charminar Back Lanes" },
    { lat: 17.3580, lng: 78.4810, intensity: 0.80, label: "Purani Haveli Stretch" },
    { lat: 17.4935, lng: 78.3990, intensity: 0.7, label: "KPHB Industrial Corridor" },
    { lat: 17.4870, lng: 78.4100, intensity: 0.65, label: "Kukatpally Bus Depot Area" },
    { lat: 17.3490, lng: 78.5510, intensity: 0.8, label: "LB Nagar Ring Road Underpass" },
    { lat: 17.3445, lng: 78.5600, intensity: 0.72, label: "Vanasthalipuram Outskirts" },
    { lat: 17.4680, lng: 78.5710, intensity: 0.68, label: "ECIL Cross Roads Night" },
    { lat: 17.2400, lng: 78.4290, intensity: 0.88, label: "Airport Approach Road (Night)" },
    { lat: 17.2570, lng: 78.4350, intensity: 0.60, label: "Shamshabad Village" },
    { lat: 17.4010, lng: 78.5610, intensity: 0.73, label: "Uppal Industrial Belt" },
    { lat: 17.3970, lng: 78.3880, intensity: 0.77, label: "Manikonda Lake Trail" },
];

// --- Safe zones: police stations, hospitals, metro stations, busy markets ---
export const safeZones = [
    { lat: 17.3850, lng: 78.4867, type: "police", label: "Abids Police Station", safety: 0.95 },
    { lat: 17.4400, lng: 78.4983, type: "police", label: "Secunderabad PS", safety: 0.90 },
    { lat: 17.4440, lng: 78.3490, type: "police", label: "Gachibowli PS", safety: 0.92 },
    { lat: 17.3610, lng: 78.4740, type: "police", label: "Charminar PS", safety: 0.88 },
    { lat: 17.4160, lng: 78.4563, type: "hospital", label: "Nizam's Institute (NIMS)", safety: 0.93 },
    { lat: 17.4480, lng: 78.3810, type: "hospital", label: "Continental Hospital", safety: 0.91 },
    { lat: 17.3870, lng: 78.4910, type: "hospital", label: "Osmania General Hospital", safety: 0.90 },
    { lat: 17.4275, lng: 78.4498, type: "metro", label: "Ameerpet Metro", safety: 0.97 },
    { lat: 17.3985, lng: 78.4690, type: "metro", label: "Nampally Metro", safety: 0.95 },
    { lat: 17.4425, lng: 78.3485, type: "metro", label: "Raidurg Metro", safety: 0.96 },
    { lat: 17.4380, lng: 78.5000, type: "metro", label: "Parade Ground Metro", safety: 0.94 },
    { lat: 17.4110, lng: 78.4410, type: "metro", label: "Punjagutta Metro", safety: 0.96 },
    { lat: 17.4440, lng: 78.4740, type: "market", label: "Secunderabad Clock Tower", safety: 0.85 },
    { lat: 17.3930, lng: 78.4890, type: "market", label: "Koti Womens College Area", safety: 0.88 },
    { lat: 17.4260, lng: 78.4530, type: "market", label: "Ameerpet Bustling Center", safety: 0.87 },
];

export const lightingZones = [
    { lat: 17.4275, lng: 78.4498, radius: 500, quality: 0.9, label: "Ameerpet Well-lit" },
    { lat: 17.4440, lng: 78.3490, radius: 600, quality: 0.85, label: "Gachibowli IT Corridor" },
    { lat: 17.4156, lng: 78.4095, radius: 400, quality: 0.3, label: "Film Nagar Dark Streets" },
    { lat: 17.3616, lng: 78.4747, radius: 300, quality: 0.4, label: "Old City Low Lighting" },
    { lat: 17.4935, lng: 78.3990, radius: 500, quality: 0.35, label: "KPHB Industrial Dark" },
    { lat: 17.2400, lng: 78.4290, radius: 800, quality: 0.2, label: "Airport Road Dark Stretch" },
];

export const crowdPatterns = {
    commercial: [0.05, 0.03, 0.02, 0.02, 0.03, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.95, 0.85, 0.90, 0.95, 0.90, 0.85, 0.80, 0.70, 0.55, 0.35, 0.20, 0.12, 0.07],
    residential: [0.15, 0.10, 0.08, 0.05, 0.05, 0.10, 0.30, 0.50, 0.35, 0.20, 0.15, 0.15, 0.20, 0.15, 0.15, 0.20, 0.40, 0.60, 0.70, 0.60, 0.45, 0.35, 0.25, 0.18],
    industrial: [0.02, 0.02, 0.01, 0.01, 0.02, 0.05, 0.15, 0.40, 0.65, 0.70, 0.70, 0.65, 0.55, 0.65, 0.70, 0.65, 0.55, 0.40, 0.15, 0.05, 0.03, 0.02, 0.02, 0.02],
    transport: [0.10, 0.05, 0.03, 0.03, 0.08, 0.25, 0.60, 0.85, 0.75, 0.50, 0.40, 0.45, 0.50, 0.50, 0.55, 0.60, 0.75, 0.90, 0.80, 0.55, 0.30, 0.18, 0.12, 0.10],
};

export const sampleRoutes = {
    gachibowli_ameerpet: {
        name: "Gachibowli → Ameerpet",
        waypoints: [
            [17.4401, 78.3489], [17.4370, 78.3600], [17.4340, 78.3720], [17.4310, 78.3850],
            [17.4295, 78.3970], [17.4280, 78.4100], [17.4275, 78.4200], [17.4270, 78.4300],
            [17.4275, 78.4400], [17.4275, 78.4498],
        ],
        riskProfile: "moderate",
    },
    secunderabad_charminar: {
        name: "Secunderabad → Charminar",
        waypoints: [
            [17.4344, 78.5013], [17.4310, 78.4970], [17.4260, 78.4920], [17.4200, 78.4880],
            [17.4130, 78.4850], [17.4050, 78.4830], [17.3950, 78.4810], [17.3850, 78.4790],
            [17.3750, 78.4770], [17.3680, 78.4755], [17.3616, 78.4747],
        ],
        riskProfile: "high",
    },
    ameerpet_punjagutta: {
        name: "Ameerpet → Punjagutta",
        waypoints: [
            [17.4275, 78.4498], [17.4250, 78.4490], [17.4220, 78.4475], [17.4190, 78.4460],
            [17.4160, 78.4445], [17.4130, 78.4425], [17.4110, 78.4410],
        ],
        riskProfile: "low",
    },
};

export function generateHeatmapData(hour) {
    const points = [];
    const nightMultiplier = (hour >= 20 || hour < 5) ? 1.8 : (hour >= 17 || hour < 7) ? 1.3 : 1.0;
    crimeHotspots.forEach(hotspot => {
        const baseIntensity = hotspot.intensity * nightMultiplier;
        for (let i = 0; i < 8; i++) {
            const offsetLat = (Math.random() - 0.5) * 0.008;
            const offsetLng = (Math.random() - 0.5) * 0.008;
            const jitteredIntensity = Math.min(1.0, baseIntensity * (0.7 + Math.random() * 0.3));
            points.push([hotspot.lat + offsetLat, hotspot.lng + offsetLng, jitteredIntensity]);
        }
    });
    return points;
}

export function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getRiskAtPoint(lat, lng, hour) {
    let riskScore = 0;
    const nightMultiplier = (hour >= 20 || hour < 5) ? 2.0 : (hour >= 17 || hour < 7) ? 1.4 : 1.0;
    crimeHotspots.forEach(h => {
        const dist = haversine(lat, lng, h.lat, h.lng);
        if (dist < 1000) riskScore += h.intensity * (1 - dist / 1000) * nightMultiplier;
    });
    safeZones.forEach(s => {
        const dist = haversine(lat, lng, s.lat, s.lng);
        if (dist < 800) riskScore -= s.safety * (1 - dist / 800) * 0.5;
    });
    lightingZones.forEach(l => {
        const dist = haversine(lat, lng, l.lat, l.lng);
        if (dist < l.radius) {
            const lightFactor = l.quality * (1 - dist / l.radius);
            riskScore -= lightFactor * 0.3;
        }
    });
    return Math.max(0, Math.min(100, riskScore * 55));
}

export function getNearestSafeZone(lat, lng) {
    let nearest = null;
    let minDist = Infinity;
    safeZones.forEach(s => {
        const dist = haversine(lat, lng, s.lat, s.lng);
        if (dist < minDist) {
            minDist = dist;
            nearest = { ...s, distance: Math.round(dist) };
        }
    });
    return nearest;
}
