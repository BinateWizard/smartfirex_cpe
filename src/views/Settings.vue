<template>
  <div class="settings-page">
    <div class="settings-header">
      <button @click="$router.back()" class="back-btn" aria-label="Back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <h1 class="settings-title">Settings</h1>
      <div class="header-spacer"></div>
    </div>

    <div class="settings-content">
      <!-- Account Section -->
      <div class="settings-section">
        <h2 class="section-title">👤 Account</h2>
        <div class="settings-card">
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ userEmail }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User ID:</span>
            <span class="info-value">{{ userId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Created:</span>
            <span class="info-value">{{ accountCreated }}</span>
          </div>
        </div>
      </div>

      <!-- Devices Section -->
      <div class="settings-section">
        <h2 class="section-title">📱 Devices</h2>
        <div class="settings-card">
          <div class="info-row">
            <span class="info-label">Total Devices:</span>
            <span class="info-value">{{ deviceCount }}</span>
          </div>
          <button class="secondary-btn" @click="$router.push('/')">
            Manage Devices
          </button>
        </div>
      </div>

      <!-- App Info Section -->
      <div class="settings-section">
        <h2 class="section-title">ℹ️ About</h2>
        <div class="settings-card">
          <div class="info-row">
            <span class="info-label">App Version:</span>
            <span class="info-value">1.0.0</span>
          </div>
          <div class="info-row">
            <span class="info-label">Firebase Project:</span>
            <span class="info-value">firetap-f2bcd</span>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section">
        <h2 class="section-title danger">⚠️ Danger Zone</h2>
        <div class="settings-card danger-card">
          <p class="danger-description">Sign out from your account. You'll need to log in again to access your devices.</p>
          <button @click="logout" class="logout-btn">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signOut } from "firebase/auth"
import { auth, db } from "@/firebase"
import { useRouter } from "vue-router"
import { ref, onMounted } from "vue"
import { collection, query, where, getDocs } from "firebase/firestore"

const router = useRouter()
const userEmail = ref('')
const userId = ref('')
const accountCreated = ref('')
const deviceCount = ref(0)

onMounted(async () => {
  const currentUser = auth.currentUser
  if (currentUser) {
    userEmail.value = currentUser.email || 'N/A'
    userId.value = currentUser.uid
    
    // Format account creation date
    if (currentUser.metadata.creationTime) {
      const date = new Date(currentUser.metadata.creationTime)
      accountCreated.value = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Get device count
    try {
      const q = query(
        collection(db, 'devices'),
        where('addedBy', '==', currentUser.uid)
      )
      const snapshot = await getDocs(q)
      deviceCount.value = snapshot.size
    } catch (error) {
      console.error('Error getting device count:', error)
    }
  }
})

async function logout() {
  try {
    await signOut(auth)
    router.push("/login")
  } catch (err) {
    console.error("Logout failed:", err.message)
    alert('Failed to sign out. Please try again.')
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f9fafb;
  padding-bottom: 80px;
}

.settings-header {
  background: #dc2626;
  color: white;
  padding: 16px 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.back-btn svg {
  width: 24px;
  height: 24px;
}

.settings-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.header-spacer {
  width: 40px;
}

.settings-content {
  max-width: 400px;
  margin: 0 auto;
  padding: 80px 24px 24px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.section-title.danger {
  color: #dc2626;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.danger-card {
  border-color: #fecaca;
  background: #fef2f2;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #111827;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.secondary-btn {
  width: 100%;
  margin-top: 12px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #dc2626;
  color: #dc2626;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #dc2626;
  color: white;
}

.danger-description {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.5;
}

.logout-btn {
  width: 100%;
  background: #dc2626;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.logout-btn:active {
  transform: translateY(0);
}
</style>
