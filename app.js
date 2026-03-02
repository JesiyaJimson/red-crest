// app.js
import './src/css/styles.css';
import 'leaflet/dist/leaflet.css';
import { auth, db } from './src/js/firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as MapController from './src/js/map.js';
import * as AlertSystem from './src/js/alerts.js';

let currentView = "home";
let selectedRoute = null;

export function init() {
    loadSession();
    MapController.init();
    AlertSystem.init();
    MapController.showSafeZones();

    bindNavigation();
    bindRouteControls();
    bindSOSButton();
    bindAlertSystem();
    bindContactsPanel();

    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000);

    setTimeout(() => {
        document.querySelector(".app-container")?.classList.add("loaded");
    }, 300);

    console.log("🛡️ RedCrest initialized (Node.js/Vite Entry)");
}

function loadSession() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            window.location.replace('./login.html');
            return;
        }

        const isGuest = user.isAnonymous;
        const uid = user.uid;

        if (isGuest) {
            _renderUserUI({ name: 'Guest', email: '', isGuest: true });
        } else {
            const userRef = doc(db, "users", uid);
            getDoc(userRef)
                .then(docSnap => {
                    const data = docSnap.exists() ? docSnap.data() : {};
                    const name = [data.fname, data.lname].filter(Boolean).join(' ') || user.email || 'User';
                    _renderUserUI({ name, email: user.email, isGuest: false });
                })
                .catch(() => {
                    _renderUserUI({ name: user.email || 'User', email: user.email, isGuest: false });
                });
        }
    });
}

function _renderUserUI({ name, email, isGuest }) {
    const initial = name.charAt(0).toUpperCase();

    const greetEl = document.getElementById('user-greeting');
    if (greetEl) greetEl.textContent = `Hi, ${name.split(' ')[0]}`;

    const cardEl = document.getElementById('user-card');
    if (cardEl) {
        cardEl.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <div class="user-meta">
                <div class="user-name">${name}</div>
                <div class="user-email">${email || 'Anonymous session'}</div>
            </div>
            <span class="user-badge ${isGuest ? 'guest' : 'member'}">${isGuest ? 'Guest' : 'Member'}</span>
        `;
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-logout';
        logoutBtn.innerHTML = '🚪 Sign Out';
        logoutBtn.addEventListener('click', logout);
        cardEl.insertAdjacentElement('afterend', logoutBtn);
    }
}

function logout() {
    if (!confirm('Sign out of RedCrest?')) return;
    signOut(auth).then(() => window.location.replace('./login.html'));
}

function bindNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const view = btn.dataset.view;
            switchView(view);
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

    switch (view) {
        case "home":
            document.getElementById("panel-home")?.classList.add("active");
            break;
        case "navigate":
            document.getElementById("panel-navigate")?.classList.add("active");
            break;
        case "alerts":
            document.getElementById("panel-alerts")?.classList.add("active");
            renderAlertHistory();
            break;
        case "profile":
            document.getElementById("panel-profile")?.classList.add("active");
            renderContacts();
            break;
    }
}

function bindRouteControls() {
    const routeSelect = document.getElementById("route-select");
    if (routeSelect) {
        routeSelect.addEventListener("change", (e) => {
            const key = e.target.value;
            if (key) {
                selectedRoute = key;
                const assessment = MapController.displayRoute(key);
                updateRouteInfo(assessment);
                document.getElementById("sim-controls")?.classList.add("visible");
            } else {
                MapController.clearRoute();
                document.getElementById("sim-controls")?.classList.remove("visible");
                const infoEl = document.getElementById("route-info");
                if (infoEl) infoEl.innerHTML = "";
            }
        });
    }

    const heatBtn = document.getElementById("btn-heatmap");
    if (heatBtn) {
        heatBtn.addEventListener("click", () => {
            const visible = MapController.toggleHeatmap();
            heatBtn.classList.toggle("active", visible);
            heatBtn.innerHTML = visible ? "🔥 Hide Heatmap" : "🔥 Safety Heatmap";
        });
    }

    const simBtn = document.getElementById("btn-simulate");
    if (simBtn) {
        simBtn.addEventListener("click", () => {
            if (!selectedRoute) return;
            simBtn.disabled = true;
            simBtn.textContent = "⏳ Simulating...";
            document.getElementById("live-dashboard")?.classList.add("visible");

            MapController.startSimulation(selectedRoute, (update) => {
                if (update.finished) {
                    simBtn.disabled = false;
                    simBtn.textContent = "▶ Start Journey";
                    return;
                }
                updateLiveDashboard(update);
            });
        });
    }

    const devBtn = document.getElementById("btn-deviate");
    if (devBtn) {
        devBtn.addEventListener("click", () => {
            document.getElementById("live-dashboard")?.classList.add("visible");
            MapController.simulateDeviation((update) => {
                if (update.finished) return;
                updateLiveDashboard(update);
            });
        });
    }

    const stopBtn = document.getElementById("btn-stop");
    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            MapController.stopSimulation();
            const startBtn = document.getElementById("btn-simulate");
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = "▶ Start Journey";
            }
        });
    }
}

function updateRouteInfo(assessment) {
    const el = document.getElementById("route-info");
    if (!el || !assessment) return;

    const levelColors = { low: "#00ff88", moderate: "#ffaa00", high: "#ff3344" };
    const levelLabels = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" };

    el.innerHTML = `
        <div class="route-assessment">
            <div class="risk-badge" style="background:${levelColors[assessment.overallLevel]}20;color:${levelColors[assessment.overallLevel]}">
                ${levelLabels[assessment.overallLevel]}
            </div>
            <div class="risk-stats">
                <span>Avg Risk: <b>${assessment.averageRisk}</b></span>
                <span>Max Risk: <b>${assessment.maxRisk}</b></span>
            </div>
        </div>
    `;
}

function updateLiveDashboard(update) {
    const dashboard = document.getElementById("live-dashboard");
    if (!dashboard) return;

    const { anomaly, deviation, deviationLevel } = update;
    const score = anomaly.score;
    const level = anomaly.level;
    const comp = anomaly.components;

    const levelColors = { safe: "#00ff88", caution: "#ffaa00", warning: "#ff8800", danger: "#ff3344" };
    const color = levelColors[level] || "#00ff88";

    dashboard.innerHTML = `
        <div class="dashboard-header">
            <span class="dash-label">LIVE MONITORING</span>
            <span class="dash-score" style="color:${color}">${score}</span>
        </div>
        <div class="score-bar-container">
            <div class="score-bar" style="width:${score}%;background:${color}"></div>
        </div>
        <div class="dash-components">
            <div class="comp"><span>Speed</span><span>${comp.speed}</span></div>
            <div class="comp"><span>Heading</span><span>${comp.heading}</span></div>
            <div class="comp"><span>Stop</span><span>${comp.stop}</span></div>
            <div class="comp"><span>Zone</span><span>${comp.zone}</span></div>
            <div class="comp"><span>Time</span><span>${comp.time}</span></div>
        </div>
        <div class="dash-deviation" style="color:${levelColors[deviationLevel]}">
            Route Deviation: ${deviation}m (${deviationLevel.toUpperCase()})
        </div>
        <div class="dash-progress">
            Step ${update.index + 1} / ${update.total}
        </div>
    `;
}

function bindSOSButton() {
    const sosBtn = document.getElementById("btn-sos");
    if (sosBtn) {
        sosBtn.addEventListener("click", () => {
            if (AlertSystem.isSosActive()) {
                AlertSystem.cancelSOS();
                hideSOSOverlay();
            } else {
                showSOSOverlay();
            }
        });
    }

    const confirmBtn = document.getElementById("sos-confirm");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const pos = { lat: 17.385, lng: 78.4867 };
            AlertSystem.triggerSOS(pos);
        });
    }

    const cancelBtn = document.getElementById("sos-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            AlertSystem.cancelSOS();
            hideSOSOverlay();
        });
    }
}

function showSOSOverlay() {
    const overlay = document.getElementById("sos-overlay");
    if (overlay) overlay.classList.add("active");
}

function hideSOSOverlay() {
    const overlay = document.getElementById("sos-overlay");
    if (overlay) overlay.classList.remove("active");
}

function bindAlertSystem() {
    AlertSystem.onAlertUI((alert) => {
        showToastAlert(alert);
        if (alert.level === "countdown") {
            showCountdownOverlay(alert.countdown);
        }
    });

    AlertSystem.onSOS((sosEvent) => {
        showSOSConfirmation(sosEvent);
    });
}

function showToastAlert(alert) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${alert.level}`;
    toast.innerHTML = `
        <div class="toast-icon">${getAlertIcon(alert.level)}</div>
        <div class="toast-message">${alert.message}</div>
        <button class="toast-close">✕</button>
    `;

    toast.querySelector('.toast-close')?.addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

function showCountdownOverlay(seconds) {
    let overlay = document.getElementById("countdown-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "countdown-overlay";
        overlay.className = "countdown-overlay";
        document.body.appendChild(overlay);
    }
    overlay.classList.add("active");
    overlay.innerHTML = `
        <div class="countdown-content">
            <div class="countdown-number">${seconds}</div>
            <div class="countdown-text">High risk detected. Are you safe?</div>
            <div class="countdown-subtext">SOS will be sent if you don't respond.</div>
            <button class="btn-cancel-countdown">
                ✅ I'M SAFE — CANCEL
            </button>
        </div>
    `;
    overlay.querySelector('.btn-cancel-countdown')?.addEventListener('click', () => {
        AlertSystem.cancelSOSCountdown();
        overlay.classList.remove('active');
    });
}

function showSOSConfirmation(sosEvent) {
    hideSOSOverlay();
    const overlay = document.getElementById("sos-overlay");
    if (overlay) {
        overlay.classList.add("active");
        overlay.innerHTML = `
            <div class="sos-active-screen">
                <div class="sos-pulse-ring"></div>
                <div class="sos-icon">🆘</div>
                <h2>SOS ACTIVATED</h2>
                <p>${sosEvent.notifications.length} emergency contact(s) alerted</p>
                <div class="sos-contacts-notified">
                    ${sosEvent.notifications.map(n => `
                        <div class="notified-contact">
                            <span>📱 ${n.to}</span>
                            <span class="status-sent">✓ Sent</span>
                        </div>
                    `).join("")}
                </div>
                <p class="sos-location">📍 Location shared: ${sosEvent.position.lat.toFixed(4)}, ${sosEvent.position.lng.toFixed(4)}</p>
                <button class="btn-cancel-sos">
                    CANCEL SOS
                </button>
            </div>
        `;
        overlay.querySelector('.btn-cancel-sos')?.addEventListener('click', () => {
            AlertSystem.cancelSOS();
            overlay.classList.remove('active');
            restoreSOSOverlay();
        });
    }
}

function restoreSOSOverlay() {
    const overlay = document.getElementById("sos-overlay");
    if (overlay) {
        overlay.innerHTML = `
            <div class="sos-confirm-screen">
                <div class="sos-icon-large">🆘</div>
                <h2>Trigger Emergency SOS?</h2>
                <p>This will alert all your emergency contacts with your current location.</p>
                <div class="sos-actions">
                    <button id="sos-confirm" class="btn-sos-confirm">
                        YES — SEND SOS
                    </button>
                    <button id="sos-cancel" class="btn-sos-cancel">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        overlay.querySelector('#sos-confirm')?.addEventListener('click', () => {
            AlertSystem.triggerSOS({ lat: 17.385, lng: 78.4867 });
        });
        overlay.querySelector('#sos-cancel')?.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }
}

function getAlertIcon(level) {
    const icons = { safe: "✅", caution: "⚡", warning: "🚨", danger: "🚨", countdown: "⏱️", emergency: "🆘" };
    return icons[level] || "ℹ️";
}

function renderAlertHistory() {
    const el = document.getElementById("alert-history-list");
    if (!el) return;

    const history = AlertSystem.getAlertHistory();
    if (history.length === 0) {
        el.innerHTML = `<div class="empty-state">No alerts yet. Start a journey to see safety monitoring.</div>`;
        return;
    }

    el.innerHTML = history.map(a => `
        <div class="alert-item alert-${a.level}">
            <div class="alert-icon">${getAlertIcon(a.level)}</div>
            <div class="alert-body">
                <div class="alert-msg">${a.message}</div>
                <div class="alert-time">${new Date(a.timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join("");
}

function bindContactsPanel() {
    const addBtn = document.getElementById("btn-add-contact");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const name = document.getElementById("contact-name").value.trim();
            const phone = document.getElementById("contact-phone").value.trim();
            const rel = document.getElementById("contact-rel").value;
            if (!name || !phone) return;
            AlertSystem.addContact(name, phone, rel);
            document.getElementById("contact-name").value = "";
            document.getElementById("contact-phone").value = "";
            renderContacts();
        });
    }
}

function renderContacts() {
    const el = document.getElementById("contacts-list");
    if (!el) return;

    const contacts = AlertSystem.getContacts();
    if (contacts.length === 0) {
        el.innerHTML = `<div class="empty-state">No emergency contacts. Add one above.</div>`;
        return;
    }

    el.innerHTML = contacts.map(c => `
        <div class="contact-card">
            <div class="contact-info">
                <div class="contact-name">${c.name}</div>
                <div class="contact-phone">${c.phone}</div>
                <div class="contact-rel">${c.relationship}</div>
            </div>
            <button class="btn-remove-contact" data-id="${c.id}">✕</button>
        </div>
    `).join("");

    el.querySelectorAll('.btn-remove-contact').forEach(btn => {
        btn.addEventListener('click', () => {
            AlertSystem.removeContact(btn.dataset.id);
            renderContacts();
        });
    });
}

function updateTimeDisplay() {
    const el = document.getElementById("current-time");
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
}

// Boot
if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", init);
}
