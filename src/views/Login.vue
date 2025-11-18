<template>
  <div class="login-page">
    <!-- Background Pattern -->
    <div class="background-pattern"></div>

    <!-- Login Card -->
    <div class="login-card">
      <!-- Logo/Icon Section -->
      <div class="logo-section">
        <div class="logo-icon">🔥</div>
        <h1 class="app-name">FireTap</h1>
        <p class="app-tagline">Real-time Fire & Gas Detection Monitoring</p>
      </div>

      <!-- Welcome Message -->
      <div class="welcome-section">
        <h2 class="welcome-title">Welcome Back</h2>
        <p class="welcome-text">Sign in to monitor your devices and receive real-time alerts</p>
      </div>

      <!-- Sign In Button -->
      <button @click="loginWithGoogle" class="google-btn" :disabled="isLoading">
        <img
          v-if="!isLoading"
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
        />
        <div v-if="isLoading" class="spinner"></div>
        <span>{{ isLoading ? 'Signing in...' : 'Sign in with Google' }}</span>
      </button>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Footer Info -->
      <div class="footer-info">
        <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, provider } from "@/firebase";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";

const router = useRouter();
const errorMessage = ref('');
const isLoading = ref(false);

// Check for redirect result on mount
onMounted(async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("✅ User signed in via redirect:", result.user.email);
      router.push("/");
    }
  } catch (error) {
    console.error("❌ Redirect sign-in error:", error);
    errorMessage.value = 'Failed to complete sign in. Please try again.';
  }
});

async function loginWithGoogle() {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // Try popup first
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("✅ User signed in:", user.email);
    router.push("/");
  } catch (error) {
    console.error("❌ Popup failed:", error.code);
    
    // If popup fails, try redirect method instead
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request') {
      
      console.log("🔄 Switching to redirect method...");
      try {
        await signInWithRedirect(auth, provider);
        // User will be redirected, no need to handle result here
      } catch (redirectError) {
        console.error("❌ Redirect failed:", redirectError);
        errorMessage.value = 'Failed to sign in. Please try again.';
        isLoading.value = false;
      }
    } else {
      errorMessage.value = 'Failed to sign in. Please try again.';
      isLoading.value = false;
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  position: relative;
  padding: 24px;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 48px 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.app-name {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
}

.app-tagline {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.welcome-section {
  text-align: center;
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.welcome-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.google-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.google-btn:active {
  transform: translateY(0);
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-btn:disabled:hover {
  transform: none;
  border-color: #e5e7eb;
  background: white;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.google-btn img {
  width: 24px;
  height: 24px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  margin-bottom: 16px;
}

.footer-info {
  text-align: center;
  margin-top: 24px;
}

.footer-info p {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .login-card {
    padding: 40px 24px;
  }

  .logo-icon {
    font-size: 56px;
  }

  .app-name {
    font-size: 28px;
  }

  .welcome-title {
    font-size: 20px;
  }
}
</style>
