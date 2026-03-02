# RedCrest — Node.js & Vite Migration Walkthrough

## Overview
RedCrest has been successfully migrated from a vanilla JavaScript project to a modern **Node.js environment using Vite**. This migration improves development speed, security (via environment variables), and scalability.

## Key Changes

### 1. Modern Project Structure
- **Vite Integration**: Initialized `package.json` with Vite and Firebase dependencies.
- **Source Organization**: Moved all logic to `src/js/` and styles to `src/css/`.
- **Static Assets**: Moved libraries (Leaflet, icons) to the `public/` directory for standard Vite serving.

### 2. ES Module Refactor
- All core modules (`ai-engine.js`, `alerts.js`, `map.js`, `data.js`) were refactored from IIFE patterns to **ES Modules** (`import`/`export`).
- Clean, decoupled architecture with a central `app.js` entry point.

### 3. Firebase & Security
- **Environment Variables**: Sensitive Firebase configuration is now stored in `.env` and accessed via `import.meta.env`.
- **Firebase Modular SDK**: Refactored `firebase-config.js` to use the modern modular Vite-compatible syntax.
- **Persistence**: Switched from `localStorage` to **Firebase Firestore** for authenticating users and storing emergency contacts securely.

### 4. UI/UX Polishing
- **Green Safezones**: Updated map markers for safe zones to a vibrant green color scheme with pulsing animations to provide positive reinforcement for users.
- **Live Dashboard**: Enhanced the live monitoring dashboard during journey simulations.

---

## How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Ensure the `.env` file contains your Firebase API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=...
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Verification Summary
- ✅ **ES Modules**: Verified all `import`/`export` statements are correctly linked.
- ✅ **Firebase Auth**: Tested login/registration flows with the new modular config.
- ✅ **Green Safezones**: Verified CSS and JS updates render green pulsing markers on the map.
- ✅ **Vite Build**: Structure is compatible with `npm run build` for production deployment.
- ✅ **Directory Clean-up**: Removed redundant root `js/` and `css/` folders.

---

## Technical Stack
- **Bundler**: Vite 5.x
- **Runtime**: Node.js
- **Frontend**: Vanilla JS (ES Modules)
- **Styling**: Vanilla CSS (Dark Glassmorphism)
- **Maps**: Leaflet.js
- **Database/Auth**: Firebase (Modular SDK)
