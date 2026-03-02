// src/js/alerts.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import * as AIEngine from './ai-engine.js';

// --- State ---
let emergencyContacts = [];
let alertHistory = [];
let currentAlertLevel = "safe";
let previousAlertLevel = "safe";
let sosActive = false;
let countdownTimer = null;
let countdownSeconds = 30;
let onAlertUICallback = null;
let onSOSCallback = null;
let currentUid = null;

export function init() {
    onAuthStateChanged(auth, user => {
        if (!user) return;
        currentUid = user.uid;
        _loadContactsFromFirestore();
    });
    AIEngine.onAlert(handleAIAlert);
}

function _loadContactsFromFirestore() {
    if (!currentUid) return;
    const contactsRef = collection(db, 'emergencyContacts', currentUid, 'contacts');
    const q = query(contactsRef, orderBy('addedAt'));

    onSnapshot(q, snapshot => {
        emergencyContacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, err => {
        console.warn('Firestore contacts error, falling back to localStorage', err);
        try { emergencyContacts = JSON.parse(localStorage.getItem('redcrest_contacts') || '[]'); } catch (e) { }
    });
}

export function addContact(name, phone, relationship) {
    const contact = {
        name, phone, relationship,
        addedAt: serverTimestamp(),
    };

    if (currentUid) {
        const contactsRef = collection(db, 'emergencyContacts', currentUid, 'contacts');
        return addDoc(contactsRef, contact);
    }

    const local = { id: Date.now().toString(36), ...contact, addedAt: new Date().toISOString() };
    emergencyContacts.push(local);
    _saveLocalFallback();
    return Promise.resolve(local);
}

export function removeContact(id) {
    if (currentUid) {
        const contactDoc = doc(db, 'emergencyContacts', currentUid, 'contacts', id);
        return deleteDoc(contactDoc);
    }

    emergencyContacts = emergencyContacts.filter(c => c.id !== id);
    _saveLocalFallback();
    return Promise.resolve();
}

export function getContacts() { return [...emergencyContacts]; }

function _saveLocalFallback() {
    localStorage.setItem('redcrest_contacts', JSON.stringify(emergencyContacts));
}

export function handleAIAlert(data) {
    const { anomalyScore, riskLevel, deviationLevel, deviationDistance, position, nearestSafe } = data;
    let alertLevel = "safe";
    const levels = ["safe", "caution", "warning", "danger"];
    const anomalyIdx = levels.indexOf(riskLevel);
    const deviationIdx = levels.indexOf(deviationLevel);
    alertLevel = levels[Math.max(anomalyIdx, deviationIdx)];

    if (alertLevel === currentAlertLevel && alertLevel === "safe") return;
    currentAlertLevel = alertLevel;

    const alert = {
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        level: alertLevel,
        anomalyScore,
        deviationDistance: Math.round(deviationDistance),
        position,
        nearestSafe,
        message: generateAlertMessage(alertLevel, anomalyScore, deviationDistance, nearestSafe),
    };

    alertHistory.unshift(alert);
    if (alertHistory.length > 50) alertHistory.pop();

    if (onAlertUICallback) onAlertUICallback(alert);

    const levelJustEscalated = alertLevel !== previousAlertLevel;
    previousAlertLevel = alertLevel;

    if (alertLevel === "safe" || alertLevel === "caution") {
        cancelSOSCountdown();
    } else if ((alertLevel === "warning" || alertLevel === "danger") && levelJustEscalated && !countdownTimer) {
        startSOSCountdown();
    }
}

function generateAlertMessage(level, score, deviation, nearestSafe) {
    const safeInfo = nearestSafe ? `Nearest safe point: ${nearestSafe.label} (${nearestSafe.distance}m)` : "";
    switch (level) {
        case "caution": return `⚠️ Moderate risk detected. Anomaly score: ${score}. ${safeInfo}`;
        case "warning": return `🚨 High risk detected. Score: ${score}. Deviation: ${Math.round(deviation)}m. Press SOS if you need help, or tap Cancel if you're safe. ${safeInfo}`;
        case "danger": return `🚨 Very high risk detected. Score: ${score}. A 30-second SOS countdown has started. Tap "I'M SAFE" to cancel if this is a false alarm. ${safeInfo}`;
        default: return `✅ Area is safe. Stay alert.`;
    }
}

export function startSOSCountdown() {
    if (sosActive || countdownTimer) return;
    countdownSeconds = 30;
    countdownTimer = setInterval(() => {
        countdownSeconds--;
        if (onAlertUICallback) {
            onAlertUICallback({
                level: "countdown",
                countdown: countdownSeconds,
                message: `🚨 High risk detected! Tap "I'M SAFE" to cancel. SOS sends in ${countdownSeconds}s.`,
            });
        }
        if (countdownSeconds <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            triggerSOS();
        }
    }, 1000);
}

export function cancelSOSCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        countdownSeconds = 30;
    }
}

export function triggerSOS(position) {
    sosActive = true;
    cancelSOSCountdown();
    const sosEvent = {
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        position: position || { lat: 17.385, lng: 78.4867 },
        contacts: [...emergencyContacts],
        status: "active",
    };
    const notifications = emergencyContacts.map(contact => ({
        to: contact.name,
        phone: contact.phone,
        message: `🆘 EMERGENCY from RedCrest! Your contact may be in danger. Last known location: ${sosEvent.position.lat.toFixed(4)}, ${sosEvent.position.lng.toFixed(4)}.`,
        status: "sent",
    }));
    sosEvent.notifications = notifications;
    if (onSOSCallback) onSOSCallback(sosEvent);
    alertHistory.unshift({
        level: "emergency",
        timestamp: sosEvent.timestamp,
        message: `🆘 SOS TRIGGERED — ${notifications.length} contacts alerted`,
        position: sosEvent.position,
    });
    return sosEvent;
}

export function cancelSOS() {
    sosActive = false;
    cancelSOSCountdown();
    currentAlertLevel = "safe";
}

export function onAlertUI(callback) { onAlertUICallback = callback; }
export function onSOS(callback) { onSOSCallback = callback; }
export function getAlertHistory() { return [...alertHistory]; }
export function getCurrentLevel() { return currentAlertLevel; }
export function isSosActive() { return sosActive; }
