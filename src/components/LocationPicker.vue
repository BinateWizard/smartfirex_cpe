<template>
  <div class="location-picker-overlay" @click="handleOverlayClick">
    <div class="location-picker-modal" @click.stop>
      <div class="modal-header">
        <h2>Set Device Location</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="location-actions">
          <button @click="useMyLocation" class="btn-primary" :disabled="gettingLocation">
            <MapPin class="btn-icon" />
            {{ gettingLocation ? 'Getting location...' : 'Use My Current Location' }}
          </button>
          <p class="help-text">Or click anywhere on the map to set location</p>
        </div>
        
        <div class="map-wrapper">
          <div id="location-picker-map"></div>
        </div>
        
        <div v-if="selectedLocation" class="location-info">
          <div class="info-row">
            <span class="info-label">Latitude:</span>
            <span class="info-value">{{ selectedLocation.lat.toFixed(6) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Longitude:</span>
            <span class="info-value">{{ selectedLocation.lng.toFixed(6) }}</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="btn-secondary">Cancel</button>
        <button @click="confirmLocation" class="btn-primary" :disabled="!selectedLocation">
          Confirm Location
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineEmits } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-vue-next'

const emit = defineEmits(['close', 'confirm'])

let map = null
let marker = null
const selectedLocation = ref(null)
const gettingLocation = ref(false)

function close() {
  emit('close')
}

function handleOverlayClick() {
  close()
}

function confirmLocation() {
  if (selectedLocation.value) {
    emit('confirm', selectedLocation.value)
    close()
  }
}

function useMyLocation() {
  gettingLocation.value = true
  
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setLocation(lat, lng)
        map.setView([lat, lng], 16)
        gettingLocation.value = false
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please click on the map to set location.')
        gettingLocation.value = false
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  } else {
    alert('Geolocation is not supported by your browser')
    gettingLocation.value = false
  }
}

// Removed: Address geocoding no longer needed

function setLocation(lat, lng) {
  console.log('📍 Location clicked:', lat, lng)
  
  selectedLocation.value = {
    lat,
    lng,
    address: null
  }
  
  // Remove old marker
  if (marker) {
    console.log('🗑️ Removing old marker')
    map.removeLayer(marker)
  }
  
  // Create custom icon with bounce animation
  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pin bounce-in">📍</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  })
  
  // Add new marker
  marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map)
  console.log('✅ Marker placed at:', lat, lng)
}

onMounted(() => {
  console.log('🗺️ Initializing location picker map')
  
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    // Initialize map centered on NCR Philippines as fallback
    map = L.map('location-picker-map', {
      cursor: 'crosshair'
    }).setView([14.5995, 120.9842], 13)
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    
    // Force map to recalculate size after render
    setTimeout(() => {
      map.invalidateSize()
      console.log('🔄 Map size invalidated and refreshed')
    }, 100)
    
    // Change cursor style to indicate clickable
    const mapContainer = document.getElementById('location-picker-map')
    if (mapContainer) {
      mapContainer.style.cursor = 'crosshair'
      console.log('✅ Cursor style set to crosshair')
    }
    
    // Add click handler to map
    map.on('click', (e) => {
      console.log('🖱️ Map clicked at:', e.latlng)
      setLocation(e.latlng.lat, e.latlng.lng)
    })
    
    console.log('✅ Map initialized and click handler attached')
    
    // Try to get user's location and center map
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          console.log('📍 Centering map on user location:', lat, lng)
          map.setView([lat, lng], 16)
        },
        (error) => {
          console.warn('⚠️ Could not get user location, using NCR fallback:', error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    }
  }, 50)
  
  console.log('✅ Map initialized and click handler attached')
  
  // Try to get user's location on mount
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        map.setView([lat, lng], 16)
      },
      () => {
        // Silently fail, keep default view
      },
      { timeout: 3000 }
    )
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.location-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.location-picker-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  color: #111827;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.location-actions {
  margin-bottom: 16px;
}

.btn-primary {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.help-text {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}

.map-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

#location-picker-map {
  height: 400px;
  width: 100%;
  cursor: crosshair;
}

.location-info {
  margin-top: 16px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  font-size: 14px;
}

.info-value {
  color: #6b7280;
  font-size: 14px;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Custom marker styling */
:deep(.custom-marker) {
  background: none;
  border: none;
}

.marker-pin {
  font-size: 40px;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: bounce 1s ease-in-out infinite;
}

.marker-pin.bounce-in {
  animation: bounce-in 0.5s ease-out, bounce 1s ease-in-out infinite 0.5s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0) translateY(-20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .location-picker-overlay {
    padding: 0;
  }
  
  .location-picker-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  #location-picker-map {
    height: 300px;
  }
}
</style>
