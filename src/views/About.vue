<template>
  <div class="about-container">
    <!-- Fixed Header -->
    <div class="header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="icon" />
      </button>
      <h1 class="title">About FireTap</h1>
      <div class="spacer"></div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- System Overview -->
      <section class="section">
        <h2 class="section-title">
          <Activity class="section-icon" />
          System Overview
        </h2>
        <p class="section-text">
          FireTap is a real-time fire and gas detection monitoring system designed for safety and early warning. 
          The system uses ESP32 microcontrollers with environmental sensors to monitor smoke, gas, temperature, 
          and humidity levels. Data is transmitted to Firebase in real-time, allowing you to monitor multiple 
          locations from your mobile device.
        </p>
      </section>

      <!-- How It Works -->
      <section class="section">
        <h2 class="section-title">
          <Cpu class="section-icon" />
          How It Works
        </h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Data Collection</h3>
              <p>ESP32 devices read sensor data every few seconds and send readings to Firebase Realtime Database.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Device Registration</h3>
              <p>Users add devices to their account by entering the Device ID and setting a location on the map.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Real-Time Monitoring</h3>
              <p>The app displays live sensor readings, alerts, and location-based device tracking.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Alerts & Notifications</h3>
              <p>When dangerous levels are detected, the system triggers alerts and shows "Alert" status.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Sensors -->
      <section class="section">
        <h2 class="section-title">
          <Thermometer class="section-icon" />
          Sensors & Components
        </h2>
        
        <div class="sensor-card">
          <h3 class="sensor-name">DHT11 Temperature & Humidity Sensor</h3>
          <p class="sensor-desc">
            Measures ambient temperature (0-50°C) and relative humidity (20-90%). 
            Used to detect environmental changes that may indicate fire conditions.
          </p>
        </div>

        <div class="sensor-card">
          <h3 class="sensor-name">MQ-2 Gas & Smoke Sensor</h3>
          <p class="sensor-desc">
            Detects combustible gases (LPG, propane, methane, hydrogen) and smoke particles. 
            Analog output ranges from 0-4095. Values above 1500 typically indicate dangerous levels.
          </p>
        </div>

        <div class="sensor-card">
          <h3 class="sensor-name">ESP32 Microcontroller</h3>
          <p class="sensor-desc">
            WiFi-enabled microcontroller that reads sensor data and transmits it to Firebase. 
            Supports real-time communication and can trigger local alarms.
          </p>
        </div>
      </section>

      <!-- Terminology -->
      <section class="section">
        <h2 class="section-title">
          <BookOpen class="section-icon" />
          Terminology
        </h2>
        
        <div class="term-list">
          <div class="term-item">
            <strong>Device ID:</strong>
            <span>Unique identifier for each ESP32 device (e.g., ESP32_001)</span>
          </div>
          <div class="term-item">
            <strong>Smoke Level:</strong>
            <span>Analog reading from MQ-2 sensor (0-4095). Higher values indicate more smoke/gas.</span>
          </div>
          <div class="term-item">
            <strong>Gas Status:</strong>
            <span>Binary status from MQ-2 sensor. "Detected" or "Clear" based on threshold.</span>
          </div>
          <div class="term-item">
            <strong>Alert Status:</strong>
            <span>System status: "Safe" (normal), "Alert" (danger detected), or "Offline" (no connection).</span>
          </div>
          <div class="term-item">
            <strong>RTDB:</strong>
            <span>Firebase Realtime Database - stores live sensor readings from ESP32 devices.</span>
          </div>
          <div class="term-item">
            <strong>Firestore:</strong>
            <span>Firebase Firestore - stores device registration info, locations, and metadata.</span>
          </div>
          <div class="term-item">
            <strong>Disconnect:</strong>
            <span>Removes device from your dashboard without deleting sensor data.</span>
          </div>
          <div class="term-item">
            <strong>Delete:</strong>
            <span>Permanently removes device from both your account and sensor history.</span>
          </div>
        </div>
      </section>

      <!-- Alert Conditions -->
      <section class="section">
        <h2 class="section-title">
          <AlertTriangle class="section-icon" />
          Alert Conditions
        </h2>
        <p class="section-text">The system triggers an "Alert" status when:</p>
        <ul class="condition-list">
          <li>Smoke level exceeds <strong>1500</strong> (analog reading from MQ-2)</li>
          <li>Device sends a message containing "alarm has been triggered"</li>
          <li>Device sends a message containing "help requested"</li>
          <li>Device explicitly sets status to "Alert"</li>
        </ul>
        <p class="section-text">
          When an alert is triggered, the device card turns red and appears in the Notifications view. 
          Check the device details immediately for current readings and location.
        </p>
      </section>

      <!-- References -->
      <section class="section">
        <h2 class="section-title">
          <ExternalLink class="section-icon" />
          References & Resources
        </h2>
        
        <div class="reference-list">
          <div class="reference-item">
            <strong>Firebase Documentation:</strong>
            <a href="https://firebase.google.com/docs" target="_blank" rel="noopener noreferrer">
              https://firebase.google.com/docs
            </a>
          </div>
          <div class="reference-item">
            <strong>ESP32 Documentation:</strong>
            <a href="https://docs.espressif.com/projects/esp-idf/en/latest/esp32/" target="_blank" rel="noopener noreferrer">
              https://docs.espressif.com/projects/esp-idf/
            </a>
          </div>
          <div class="reference-item">
            <strong>DHT11 Sensor Datasheet:</strong>
            <a href="https://www.mouser.com/datasheet/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf" target="_blank" rel="noopener noreferrer">
              DHT11 Technical Data
            </a>
          </div>
          <div class="reference-item">
            <strong>MQ-2 Sensor Datasheet:</strong>
            <a href="https://www.pololu.com/file/0J309/MQ2.pdf" target="_blank" rel="noopener noreferrer">
              MQ-2 Gas Sensor Technical Data
            </a>
          </div>
          <div class="reference-item">
            <strong>Device Setup Guide:</strong>
            <span>See DEVICE_SETUP.md in project repository for ESP32 configuration</span>
          </div>
        </div>
      </section>

      <!-- Architecture -->
      <section class="section">
        <h2 class="section-title">
          <Database class="section-icon" />
          System Architecture
        </h2>
        <p class="section-text">
          FireTap uses a dual-database architecture:
        </p>
        <div class="architecture-details">
          <div class="arch-item">
            <strong>Firebase Realtime Database (RTDB)</strong>
            <p>Stores live sensor readings at <code>/devices/{`{deviceId}`}</code>. ESP32 devices write directly to RTDB.</p>
          </div>
          <div class="arch-item">
            <strong>Cloud Firestore</strong>
            <p>Stores device registrations with location coordinates at <code>/devices/{`{userId}_{deviceId}`}</code>. 
            Allows multiple users to monitor the same physical device.</p>
          </div>
          <div class="arch-item">
            <strong>Progressive Web App (PWA)</strong>
            <p>Built with Vue 3, can be installed on mobile devices for offline access and push notifications.</p>
          </div>
        </div>
      </section>

      <!-- App Version -->
      <div class="app-info">
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Last Updated:</strong> December 2024</p>
        <p><strong>Built with:</strong> Vue 3, Firebase, Leaflet, Chart.js</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  Activity, 
  Cpu, 
  Thermometer, 
  BookOpen, 
  AlertTriangle, 
  ExternalLink,
  Database
} from 'lucide-vue-next';

const router = useRouter();

const goBack = () => {
  router.push('/');
};
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #fee2e2, #fef2f2, #ffffff);
  padding-bottom: 80px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon {
  width: 24px;
  height: 24px;
}

.title {
  flex: 1;
  text-align: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.spacer {
  width: 40px;
}

.content {
  padding: 80px 1rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #dc2626;
}

.section-text {
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.section-text:last-child {
  margin-bottom: 0;
}

/* Steps */
.steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.step-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.step-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Sensors */
.sensor-card {
  background: #f9fafb;
  border-left: 3px solid #dc2626;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.sensor-card:last-child {
  margin-bottom: 0;
}

.sensor-name {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.sensor-desc {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Terminology */
.term-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.term-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.term-item strong {
  color: #dc2626;
  font-size: 0.95rem;
}

.term-item span {
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Alert Conditions */
.condition-list {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #4b5563;
}

.condition-list li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.condition-list strong {
  color: #dc2626;
  font-weight: 600;
}

/* References */
.reference-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.reference-item strong {
  color: #1f2937;
  font-size: 0.95rem;
}

.reference-item a {
  color: #dc2626;
  text-decoration: none;
  font-size: 0.9rem;
  word-break: break-all;
}

.reference-item a:hover {
  text-decoration: underline;
}

.reference-item span {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Architecture */
.architecture-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.arch-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.arch-item strong {
  display: block;
  color: #1f2937;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.arch-item p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.arch-item code {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #dc2626;
}

/* App Info */
.app-info {
  text-align: center;
  padding: 1.5rem;
  color: #9ca3af;
  font-size: 0.85rem;
}

.app-info p {
  margin: 0.25rem 0;
}

.app-info strong {
  color: #6b7280;
}

/* Responsive */
@media (max-width: 640px) {
  .content {
    padding: 70px 0.75rem 1rem;
  }

  .section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
}
</style>
