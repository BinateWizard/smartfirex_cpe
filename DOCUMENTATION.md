# SmartFireX — Technical Flow & Architecture

This document describes the runtime flow of the SmartFireX application, the key data paths (Realtime Database & Firestore), the components involved, the function responsibilities and example payloads. Use this as a developer-oriented reference when debugging, extending, or documenting the system.

---

## 1. High-level user flow (sequence)

1. User signs in with Google (Firebase Auth) — session persists via Firebase SDK.
2. User opens the app (Home). The app reads the user's registered devices from Firestore.
3. User adds a device (Add Device modal): app validates the Device ID exists in RTDB, then writes a Firestore doc under `devices/{userId}_{deviceId}`.
4. Home shows the user's devices and subscribes (where appropriate) to RTDB to compute quick status summaries (BottomNav unread count, device list status).
5. User clicks a device → `DeviceDetail` view loads and subscribes to RTDB `/devices/{deviceId}` to show live readings, charts, banners and history.
6. Background alert monitor (`src/services/alertMonitor.js`) also subscribes to the user's devices and triggers local notifications, vibration and siren via WebAudio when alert conditions occur.
7. User can open `showMap` to view device markers from Firestore `coordinates` (fallback to legacy RTDB coords).
8. User may disconnect or delete a device — disconnect removes user's Firestore registration (`{userId}_{deviceId}`); delete attempts to remove RTDB device data as well (may require backend rules/permissions).

---

## 2. Data model and canonical storage

### Realtime Database (RTDB)
- Path: `/devices/{deviceId}`
- Purpose: Live sensor telemetry from the ESP32 device and optionally historical `readings` under each device node.

Common payload (example):

```json
{
  "timestamp": 1699999999999,
  "lastSeen": "2025-11-19T12:34:56.000Z",
  "smokeLevel": 1800,
  "smokeAnalog": 1800,
  "temperature": 28.3,
  "humidity": 54.1,
  "gasStatus": "normal", // or "detected" / "critical"
  "message": "", // e.g. "alarm has been triggered" or "help requested"
  "status": { "state": "idle" }, // or "alert" / "sprinkler"; sometimes a string
  "lastType": "alarm",
  "sensorError": false,
  "readings": {
    "r1": { "timestamp": 1699999900000, "smokeLevel": 1000, "temperature": 27 }
  }
}
```

Notes:
- Many codepaths check `smokeLevel`, `smoke` or `smokeAnalog` (legacy names) — code normalizes across these fields.
- `status` may be a string or object (e.g., `status.state`) depending on firmware/format.

### Firestore
- Collection: `devices`
- Document ID: `{userId}_{deviceId}` (composite key used to isolate user registrations)
- Document fields (typical):
  - `deviceId` (string)
  - `name` (string)
  - `coordinates` (object: `{ lat, lng, address }`) — set via `LocationPicker` in the UI
  - `location` (optional string fallback)
  - `addedBy` (user uid), `addedByEmail` (string)
  - `status` (string: e.g., `'Safe'`), `createdAt`, `updatedAt`

Example Firestore doc:

```json
{
  "deviceId": "DEVICE_001",
  "name": "Market Device 1",
  "coordinates": { "lat": 14.5995, "lng": 120.9842, "address": "Example address" },
  "status": "Safe",
  "addedBy": "userUid123",
  "addedByEmail": "user@example.com",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

---

## 3. Key components and responsibilities

- `src/main.js`
  - App initialization; waits for Firebase Auth to resolve before mounting app.
  - Imports background alert monitor (`src/services/alertMonitor.js`) so monitoring starts after mount.

- `src/firebase.js`
  - Exports `auth`, `provider`, `db` (Firestore) and `rtdb` (Realtime Database).

- Routing (`src/router/index.js`)
  - Routes: `/` (Home), `/device/:deviceId` (DeviceDetail), `/add-device`, `/debug`, `/map`, `/settings`, `/about`, `/notifications`.
  - Uses a navigation guard which redirects unauthenticated users to `/login` for routes with `meta.requiresAuth`.

- `src/views/HomeView.vue`
  - Lists user's registered devices (from Firestore) and shows quick stats (Safe/Alert counts).
  - Contains Add Device modal which verifies RTDB device existence before writing Firestore registration.
  - Launches `LocationPicker` for coordinates.

- `src/views/AddDevice.vue`
  - Form to add a device; checks RTDB `devices/{deviceId}` exists (`get`), then writes a Firestore doc at `devices/{userId}_{deviceId}`.

- `src/views/DeviceDetail.vue`
  - Subscribes to RTDB `devices/{deviceId}` using `onValue` and updates `latest` and `history` reactive state.
  - Implements `determineStatus`, `hasFireCondition`, `getSmokePercentage`, chart rendering (`Chart.js`), and UI banners.
  - Handles device management actions (disconnect/delete) which operate on Firestore and attempt RTDB removal.

- `src/services/alertMonitor.js`
  - Background monitor: queries user's Firestore `devices` collection to get `deviceId` list, then subscribes to RTDB `/devices/{deviceId}` for each to detect alert conditions.
  - Triggers Web Notifications, vibration (`navigator.vibrate`), and a WebAudio siren when an alert is first detected, and stops them when cleared.

- `src/components/BottomNav.vue`
  - Computes unread/alert badge by listening to RTDB for user's devices.

- `src/components/showMap.vue` & `src/components/LocationPicker.vue`
  - Map components using Leaflet. `showMap` reads Firestore `coordinates` (preferred) and RTDB fallback for legacy Lat/Lon.
  - `LocationPicker` writes coordinates back in the Add Device flow (emitted to the parent, stored in Firestore on registration).

- `src/components/Notification.vue` and `src/views/Notifications.vue`
  - Aggregate live and history alert events for display to the user.

---

## 4. Authentication flow (developer steps)

1. `src/main.js` calls `onAuthStateChanged(auth, ...)` and only mounts the Vue app after the first auth state resolution so initial navigation is valid.
2. `Login.vue` uses the Firebase Google provider (`signInWithPopup` or `signInWithRedirect`) to authenticate.
3. After login, components use `auth.currentUser` to access `uid` and `email`.
4. When writing device metadata, the Firestore document ID is constructed as `${currentUser.uid}_${deviceId}` — this enforces per-user device registration.

Security note: Firestore and RTDB security rules should rely on the same composite ID and `request.auth.uid` to confirm allowed writes/read. See recommended rules section below.

---

## 5. Runtime status detection & alert logic (summary)

Multiple places compute status using near-identical heuristics:
- `sensorError === true` → Alert
- `message === 'help requested'` or `'alarm has been triggered'` → Alert
- `lastType === 'alarm'` → Alert
- `gasStatus === 'detected' || 'critical'` → Alert
- `smokeAnalog/ smokeLevel` numeric > 1500 → Alert
- `status` field (if present and `'safe'`/`'normal'`) may override to Safe in some components

Centralized background monitoring uses the same checks and additionally triggers local UX actions (sound/vibration/notification).

---

## 6. Typical event sequences (detailed)

A. Add Device (user flow)
1. User opens Add Device modal (HomeView).
2. User enters `deviceId` and `name` and optional location.
3. App calls RTDB `get(ref(rtdb, 'devices/' + deviceId))` to confirm device exists.
4. If RTDB node exists, app writes Firestore doc at `devices/{userUid}_{deviceId}` with metadata (name, coordinates, status, addedBy, timestamps).
5. Home listens to Firestore and updates device list; BottomNav and other components compute status via RTDB subscriptions.

B. Device Detail Live View
1. User navigates to `/device/{deviceId}`.
2. `DeviceDetail.vue` sets up `onValue(dbRef(rtdb, 'devices/' + deviceId), callback)`.
3. `callback` normalizes payload into `latest` and `history` structures and calls `renderCharts()`.
4. UI shows status circle, banners if `hasFireCondition`, and history list; sensor errors and messages drive banner contents.

C. Alert Trigger & Background Actions
1. ESP32 sends a payload to RTDB which meets alert conditions (e.g., `smokeLevel > 1500`).
2. `alertMonitor` receives change via `onValue`, `isAlertCondition()` returns true.
3. When transition from non-alert → alert is detected, `startAlertSound()`, `startAlertVibration()`, and `showAlertNotification()` are invoked.
4. When RTDB changes again so `isAlertCondition()` returns false, `stopAllAlerts()` is called and a cleared notification is delivered.

---

## 7. Files / functions to inspect when changing behavior

- `src/services/alertMonitor.js` — background alert logic and OS/browser interaction (WebAudio, Notifications, vibration).
- `src/views/DeviceDetail.vue` — `fetchData()`, `determineStatus()`, `determineStatusFromButton()`, `hasFireCondition`, `renderCharts()`.
- `src/views/AddDevice.vue` — Add device verification and Firestore write using composite ID.
- `src/components/BottomNav.vue` — `watchDevicesForAlerts()` and `determineStatus()` used to compute unread counts.
- `src/components/showMap.vue` & `src/components/LocationPicker.vue` — mapping and coordinates handling.

---

## 8. Example quick debugging commands / checks

- Verify device exists in RTDB (from repo root machine with firebase-tools or console):

```powershell
# Using Firebase CLI (if authenticated to the project):
# This is conceptual — prefer using Firebase console for a quick view
# Or use the RTDB REST endpoint (requires auth token)
```

- Test adding a device: try the Add Device modal with a known `deviceId` and watch Firestore for `devices/{userUid}_{deviceId}` appearing.
- Use `DeviceDebug.vue` to check RTDB for a specific `deviceId`.

---

## 9. Recommended security rules (high-level)

- Firestore `devices` collection rules:
  - Allow reads for authenticated users to read only documents where `request.auth.uid == resource.data.addedBy` (or where the doc ID starts with `request.auth.uid + '_'`).
  - Allow writes for authenticated users when creating doc ID equals `${request.auth.uid}_${newData.deviceId}` and `newData.addedBy == request.auth.uid`.

- RTDB rules:
  - Devices write path should be limited to service accounts or the ESP32 auth method you use (if devices authenticate directly).
  - App clients should have read-only access to `/devices/{deviceId}` where necessary. If you allow deletions from clients, restrict to trusted roles or require additional checks.

Example Firestore rule snippet (concept):

```
match /databases/{database}/documents {
  match /devices/{docId} {
    allow read: if request.auth != null && docId.startsWith(request.auth.uid + '_');
    allow create: if request.auth != null
                  && docId == request.auth.uid + '_' + request.resource.data.deviceId
                  && request.resource.data.addedBy == request.auth.uid;
    allow update, delete: if request.auth != null && resource.data.addedBy == request.auth.uid;
  }
}
```

---

## 10. Testing checklist for changes

- Behavior tests:
  - Add a device that exists in RTDB and verify Firestore doc is created correctly.
  - Open DeviceDetail and confirm live updates show immediately after RTDB update.
  - Trigger an alert condition (simulate RTDB change) and confirm notification/vibration/sound (note browser limitations).
  - Clear an alert and verify sound/vibration stop and a cleared notification is shown.

- Edge cases:
  - RTDB payloads with `status` as string vs object; ensure `determineStatus` handles both.
  - Missing `smokeLevel` but `smokeAnalog` provided.
  - RTDB offline/empty node when adding a device — Add Device should show helpful error.

---

## 11. Next steps / optional artifacts I can generate for you

- Create an ASCII or PlantUML sequence diagram for the Add Device or Alert sequence.
- Commit `DOCUMENTATION.md` (this file is added to repo) and/or split sections into separate docs (security, alerts, dev-runbook).
- Produce a short README section for device firmware authors describing expected RTDB payload fields and examples.

---

If you want a specific sequence diagram (e.g., Add Device or Alert lifecycle) I can generate an ASCII or PlantUML diagram next. If you want further expansion of any section (security rules, code references or test scripts), tell me which and I will add it.
