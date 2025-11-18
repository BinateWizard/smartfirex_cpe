# FireTap Copilot Instructions

## Project Overview
FireTap is a Progressive Web App (PWA) for real-time fire and gas detection monitoring from ESP32 devices. Built with Vue 3 + Firebase (Firestore + Realtime Database).

**Key Architecture**: 
- **Firestore** (`db`): User accounts, device registrations (user-specific), **device metadata including static location coordinates**
- **Realtime Database** (`rtdb`): Live sensor readings from ESP32 devices (`/devices/{deviceId}`)
- **Multi-user device support**: Same physical device can be registered by multiple users
- **Document ID pattern**: Firestore uses `{userId}_{deviceId}` as document ID for user isolation
- **Two-step device flow**: ESP32 pushes data to RTDB → User registers device in Firestore with location picker → App displays real-time dashboard
- **Location architecture**: Device locations stored in Firestore as `coordinates: { lat, lng, address }`, NOT in ESP32 firmware or RTDB. Users set location via interactive map picker during registration.

## Critical Patterns

### Device Ownership & Isolation
Each user maintains their own device registry. Document IDs use composite key `{userId}_{deviceId}`:
```javascript
// Adding device (AddDevice.vue)
const currentUser = auth.currentUser;
const userDeviceRef = doc(db, 'devices', `${currentUser.uid}_${deviceId}`);

// Querying devices (HomeView.vue)
const q = query(
  collection(db, "devices"),
  where("addedBy", "==", currentUser.uid),
  orderBy("updatedAt", "desc")
);
```

**Important**: When routing to device details, use `device.deviceId` (actual ESP32 ID), not `device.id` (composite doc ID). The detail view reconstructs the composite ID internally.

### Firebase Dual Database Pattern
Always import both databases from `@/firebase`:
```javascript
import { db, rtdb } from '@/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'      // Firestore
import { ref as dbRef, onValue, get } from 'firebase/database' // RTDB
```

**Pattern**: Use `ref as dbRef` to avoid conflicts with Vue's `ref`. RTDB paths are `/devices/{deviceId}` with readings structure like:
```javascript
{ timestamp, smokeLevel, temperature, humidity, gasStatus, message, status }
```

### Authentication Flow
Auth state resolved BEFORE Vue mounts (see `src/main.js`):
```javascript
onAuthStateChanged(auth, () => {
  if (!appMounted) {
    app.use(router).mount('#app')
    appMounted = true
  }
})
```

Router guards redirect unauthenticated users to `/login`. All routes except `/login` have `meta: { requiresAuth: true }`.

### Device Status Determination
Status logic in `BottomNav.vue` and device views:
```javascript
function determineStatus(data) {
  if (!data) return 'Safe'
  if (data.message === 'help requested' || data.message === 'alarm has been triggered') return 'Alert'
  const smokeValue = data.smokeLevel ?? data.smoke ?? 0
  if (typeof smokeValue === 'number' && smokeValue > 1500) return 'Alert'
  if (data.status) return data.status
  return 'Safe'
}
```

### Real-Time Listeners Pattern
Use `onValue` for live RTDB updates. Always clean up listeners in `onUnmounted`:
```javascript
const unsubscribe = onValue(dbRef(rtdb, `devices/${deviceId}`), (snapshot) => {
  const data = snapshot.val()
  // Update reactive state
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
```

### Component Structure
- **Views** (`src/views/`): Page-level components with routing
- **Components** (`src/components/`): Reusable UI (BottomNav, InstallPrompt, showMap)
- **Composition API**: All components use `<script setup>` syntax
- **Icons**: Lucide icons registered globally in `main.js` (Home, User) or imported per-component

### PWA Configuration
PWA settings in `vue.config.js`:
- Theme: `#dc2626` (red for fire safety)
- Display: `standalone`, `portrait` orientation
- Icons: Multiple sizes in `public/img/icons/` including maskable variants
- Service worker registered via `registerServiceWorker.js`

## Development Workflow

### Run Dev Server
```bash
npm run serve
```
Runs on `http://localhost:8080` with hot reload.

### Build for Production
```bash
npm run build
```
Output in `dist/`. Can deploy to Firebase Hosting.

### Firebase Console Access
- **Realtime Database**: https://console.firebase.google.com/project/firetap-f2bcd/database/data
- **Firestore**: Check device registrations in `/devices` collection
- Project ID: `firetap-f2bcd`

### Device Testing
Use `/debug` route (`DeviceDebug.vue`) to test device connections without registration. See `DEVICE_SETUP.md` for ESP32 troubleshooting.

## Common Tasks

### Adding New Device Fields
1. Update ESP32 to send new field in RTDB payload
2. Update `DeviceDetail.vue` to display field (uses Chart.js for trends visualization)
3. Optional: Store field in Firestore device doc (`HomeView.vue` modal)

### Setting Device Locations
Locations are set via `LocationPicker.vue` component (not hardcoded in ESP32):
1. User clicks "Set Location" button in add device modal
2. LocationPicker opens with interactive Leaflet map
3. User clicks map or uses "Use My Current Location" button
4. Component reverse geocodes coordinates to get address (via Nominatim OSM API)
5. Coordinates stored in Firestore as `coordinates: { lat, lng, address }`
6. Map view (`showMap.vue`) reads locations from Firestore, overlays real-time status from RTDB

### Creating New Views
1. Add file to `src/views/`
2. Register route in `src/router/index.js`:
```javascript
{ path: "/new-page", name: "new-page", component: NewPage, meta: { requiresAuth: true } }
```
3. Add navigation in `BottomNav.vue` or drawer menu (`HomeView.vue`)

### Working with Notifications
- Unread badge in `BottomNav.vue` counts devices in "Alert" status
- Alert determined by `determineStatus()` logic checking RTDB live data
- Notifications view (`Notifications.vue`) shows alert history

### Styling Conventions
- Alert colors: `#dc2626` (red), `#f59e0b` (amber/warning)
- Safe colors: `#10b981` (green)
- Cards: `.device-card`, `.sensor-item`, `.form-card`
- Mobile-first design with fixed headers and bottom navigation

## File Reference
- **Firebase config**: `src/firebase.js` (contains API keys - already public in client code)
- **Auth logic**: `src/main.js`, `src/router/index.js`
- **Device registration**: `src/views/AddDevice.vue` (validates RTDB before Firestore, uses composite ID)
- **Live dashboard**: `src/views/DeviceDetail.vue` (real-time sensor monitoring, reconstructs composite ID)
- **Map integration**: `src/components/showMap.vue` (Leaflet)
- **Security rules**: `firestore.rules` (user isolation via regex on doc ID), `database.rules.json`
