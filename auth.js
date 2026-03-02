// auth.js
import { auth, db } from './src/js/firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInAnonymously,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function init() {
    onAuthStateChanged(auth, user => {
        if (user) window.location.replace('./');
    });

    bindEvents();
}

function bindEvents() {
    // Tab switching
    window.switchTab = (tab) => {
        const loginPanel = document.getElementById('panel-login');
        const regPanel = document.getElementById('panel-register');
        const loginTab = document.getElementById('tab-login');
        const regTab = document.getElementById('tab-register');

        if (tab === 'login') {
            loginPanel?.classList.add('active');
            regPanel?.classList.remove('active');
            loginTab?.classList.add('active');
            regTab?.classList.remove('active');
        } else {
            loginPanel?.classList.remove('active');
            regPanel?.classList.add('active');
            loginTab?.classList.remove('active');
            regTab?.classList.add('active');
        }
        clearErrors();
    };

    // Show/hide password
    window.togglePw = (id, btn) => {
        const inp = document.getElementById(id);
        if (!inp) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁️';
    };

    // Password strength
    const regPw = document.getElementById('reg-password');
    if (regPw) {
        regPw.addEventListener('input', (e) => checkStrength(e.target.value));
    }

    // Login
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    // Guest
    const guestBtn = document.querySelector('.btn-guest');
    if (guestBtn) {
        guestBtn.addEventListener('click', guestLogin);
    }

    // Register
    const regBtn = document.getElementById('btn-register');
    if (regBtn) {
        regBtn.addEventListener('click', handleRegister);
    }

    // Forgot
    const forgotBtn = document.querySelector('.forgot button');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', handleForgot);
    }

    // Enter key
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const active = document.querySelector('.form-panel.active')?.id;
        if (active === 'panel-login') handleLogin();
        if (active === 'panel-register') handleRegister();
    });
}

function handleLogin() {
    clearErrors();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;

    if (!email || !pw) { showError('login', 'Please fill in all fields.'); return; }

    setLoading('btn-login', true);

    signInWithEmailAndPassword(auth, email, pw)
        .catch(err => {
            setLoading('btn-login', false);
            showError('login', firebaseErrorMsg(err.code));
        });
}

function guestLogin() {
    setLoading('btn-login', true);
    signInAnonymously(auth)
        .catch(err => {
            setLoading('btn-login', false);
            showError('login', firebaseErrorMsg(err.code));
        });
}

function handleRegister() {
    clearErrors();
    const el = (id) => document.getElementById(id);
    const fname = el('reg-fname')?.value.trim();
    const lname = el('reg-lname')?.value.trim();
    const email = el('reg-email')?.value.trim();
    const phone = el('reg-phone')?.value.trim();
    const pw = el('reg-password')?.value;
    const confirm = el('reg-confirm')?.value;
    const terms = el('chk-terms')?.checked;

    if (!fname || !lname || !email || !phone || !pw || !confirm) {
        showError('reg', 'Please fill in all required fields.'); return;
    }
    if (pw !== confirm) { showError('reg', 'Passwords do not match.'); return; }
    if (!terms) { showError('reg', 'Please accept the Terms of Service.'); return; }

    console.log("🚀 Attempting to create account:", { fname, lname, email, phone });
    setLoading('btn-register', true);

    createUserWithEmailAndPassword(auth, email, pw)
        .then(cred => {
            console.log("✅ Auth success, saving to Firestore:", cred.user.uid);
            const uid = cred.user.uid;
            return setDoc(doc(db, "users", uid), {
                uid, fname, lname, email, phone,
                createdAt: serverTimestamp(),
            });
        })
        .then(() => {
            console.log("✅ Firestore save success!");
            setLoading('btn-register', false);
            document.getElementById('panel-register')?.classList.remove('active');
            document.getElementById('success-screen')?.classList.add('visible');
        })
        .catch(err => {
            console.error("❌ Registration error:", err);
            setLoading('btn-register', false);
            showError('reg', firebaseErrorMsg(err.code || err.message));
        });
}

function handleForgot() {
    const email = document.getElementById('login-email').value.trim() ||
        prompt('Enter your email address:');
    if (!email) return;
    sendPasswordResetEmail(auth, email)
        .then(() => alert(`✅ Password reset email sent to ${email}. Check your inbox.`))
        .catch(err => alert(`⚠️ ${firebaseErrorMsg(err.code)}`));
}

function checkStrength(pw) {
    const segs = ['s1', 's2', 's3', 's4'].map(id => document.getElementById(id));
    const label = document.getElementById('strength-label');
    if (!label) return;

    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const cls = ['', 'weak', 'fair', 'good', 'strong'];
    const names = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong 🔒'];
    segs.forEach((s, i) => { if (s) s.className = 'strength-seg' + (i < score ? ' ' + cls[score] : ''); });
    label.textContent = pw.length === 0 ? names[0] : (names[score] || 'Weak');
}

function showError(panel, msg) {
    const el = document.getElementById(panel + '-error');
    const txt = document.getElementById(panel + '-error-text');
    if (txt) txt.textContent = msg;
    if (el) el.classList.add('visible');
}

function clearErrors() {
    document.querySelectorAll('.msg').forEach(e => e.classList.remove('visible'));
}

function setLoading(btnId, on) {
    const b = document.getElementById(btnId);
    if (!b) return;
    b.disabled = on;
    b.classList.toggle('loading', on);
}

function firebaseErrorMsg(code) {
    const map = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait.',
        'auth/invalid-credential': 'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
}

window.goToApp = () => window.location.replace('./');

// Boot
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}
