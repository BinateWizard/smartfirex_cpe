/**
 * Background Alert Monitoring Service
 * Monitors Firebase RTDB for alert conditions and triggers notifications + vibrations
 * Works even when app is in background
 */

import { auth, rtdb, db } from '@/firebase'
import { ref as dbRef, onValue } from 'firebase/database'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

let monitoringActive = false
let deviceListeners = []
let vibrationInterval = null
let alertAudio = null

// Create emergency alarm sound using Web Audio API
function createAlertSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Create oscillators for siren effect
  const oscillator1 = audioContext.createOscillator()
  const oscillator2 = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  // Connect audio nodes
  oscillator1.connect(gainNode)
  oscillator2.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // Siren frequencies (alternating high/low)
  oscillator1.type = 'sine'
  oscillator2.type = 'sine'
  oscillator1.frequency.value = 800 // Hz
  oscillator2.frequency.value = 950 // Hz
  
  // Volume control
  // Set to full volume (1.0). Note: browser/device and OS may still limit output.
  gainNode.gain.value = 1.0 // 100% volume
  
  return { audioContext, oscillator1, oscillator2, gainNode }
}

// Start emergency alarm sound
function startAlertSound() {
  // Stop any existing sound
  stopAlertSound()
  
  try {
    alertAudio = createAlertSound()
    const { audioContext, oscillator1, oscillator2, gainNode } = alertAudio
    
    const currentTime = audioContext.currentTime
    
    // Create siren effect by modulating frequency
    const sirenInterval = 0.5 // seconds
    
    // Oscillator 1: sweep from 800 to 1000 Hz
    oscillator1.frequency.setValueAtTime(800, currentTime)
    for (let i = 0; i < 60; i++) { // 30 seconds of siren
      const time = currentTime + (i * sirenInterval)
      oscillator1.frequency.linearRampToValueAtTime(i % 2 === 0 ? 1000 : 800, time)
    }
    
    // Oscillator 2: opposite phase for fuller sound
    oscillator2.frequency.setValueAtTime(950, currentTime)
    for (let i = 0; i < 60; i++) {
      const time = currentTime + (i * sirenInterval)
      oscillator2.frequency.linearRampToValueAtTime(i % 2 === 0 ? 850 : 950, time)
    }
    
    // Pulse the volume for urgency (between full and slightly reduced)
    for (let i = 0; i < 60; i++) {
      const time = currentTime + (i * 0.25)
      // Pulse between 1.0 and 0.7 to keep strong output while avoiding harsh clipping
      gainNode.gain.setValueAtTime(i % 2 === 0 ? 1.0 : 0.7, time)
    }
    
    oscillator1.start(currentTime)
    oscillator2.start(currentTime)
    
    console.log('🔊 Emergency alarm sound started')
  } catch (error) {
    console.error('❌ Error starting alert sound:', error)
  }
}

function stopAlertSound() {
  if (alertAudio) {
    try {
      const { audioContext, oscillator1, oscillator2 } = alertAudio
      try { oscillator1.stop() } catch (_) { /* already stopped */ }
      try { oscillator2.stop() } catch (_) { /* already stopped */ }
      try { audioContext.close() } catch (_) { /* ignore close errors */ }
      alertAudio = null
      console.log('🔇 Emergency alarm sound stopped')
    } catch (error) {
      // Ensure cleanup
      alertAudio = null
    }
  }
}

// Request notification permission on startup
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission()
      console.log('📬 Notification permission:', permission)
      return permission === 'granted'
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      return false
    }
  }
  return Notification.permission === 'granted'
}

// Start continuous vibration pattern
function startAlertVibration() {
  if (!navigator.vibrate) return
  
  // Stop any existing vibration
  stopAlertVibration()
  
  // Strong alert pattern: [vibrate, pause, vibrate, pause]
  const pattern = [800, 400, 800, 1500]
  
  vibrationInterval = setInterval(() => {
    navigator.vibrate(pattern)
  }, 3500) // Total pattern duration
  
  navigator.vibrate(pattern) // Initial vibration
  console.log('📳 Background alert vibration started')
}

function stopAlertVibration() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval)
    vibrationInterval = null
  }
  if (navigator.vibrate) {
    navigator.vibrate(0)
  }
  console.log('🔕 Background alert vibration stopped')
}

// Stop all alert signals (sound + vibration)
function stopAllAlerts() {
  stopAlertSound()
  stopAlertVibration()
}

// Show system notification
function showAlertNotification(deviceName, message, vibrateAllowed = true) {
  if (Notification.permission !== 'granted') return

  const defaultVibrate = [800, 400, 800, 400, 800]
  const vibratePattern = vibrateAllowed ? defaultVibrate : []

  const notification = new Notification('🔥 SmartFireX Alert!', {
    body: `${deviceName}: ${message}`,
    icon: '/img/icons/android-chrome-192x192.png',
    badge: '/img/icons/android-chrome-192x192.png',
    vibrate: vibratePattern,
    requireInteraction: true, // Notification stays until user dismisses
    tag: 'smartfirex-alert', // Replace previous notifications
    data: { deviceName }
  })
  
  // Handle notification click
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
  
  console.log('📬 Alert notification shown:', deviceName)
}

// Determine if data represents an alert condition
function isAlertCondition(data) {
  if (!data || typeof data !== 'object') return false
  
  // Normalize status information. If status explicitly signals 'alert' or 'safe', honor it.
  let statusStr = ''
  if (typeof data.status === 'string') statusStr = data.status.toLowerCase()
  else if (typeof data.status === 'object' && data.status?.state) statusStr = String(data.status.state).toLowerCase()

  if (statusStr) {
    if (statusStr === 'alert' || statusStr === 'unsafe') return true
    if (statusStr === 'safe' || statusStr === 'normal' || statusStr === 'idle') return false
  }

  // Check button state (highest priority)
  const buttonState = data.status?.state || 'idle'
  if (buttonState === 'alert') return true
  // Note: 'sprinkler' state is NOT an alert - it's a response action
  // Note: 'idle' state is safe
  
  // Check for sensor error
  if (data.sensorError === true) return true
  
  // Check for alarm
  if (data.lastType === 'alarm') return true
  
  // Check for critical gas
  if (data.gasStatus === 'critical' || data.gasStatus === 'detected') return true
  
  // Check messages
  if (data.message === 'help requested' || data.message === 'alarm has been triggered') return true
  
  // Check high smoke levels
  const smokeValue = data.smokeLevel || data.smoke || data.smokeAnalog || 0
  if (typeof smokeValue === 'number' && smokeValue > 1500) return true
  
  return false
}

// Monitor a single device for alerts
function monitorDevice(deviceId, deviceName) {
  const deviceRef = dbRef(rtdb, `devices/${deviceId}`)
  let lastAlertState = false
  
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    if (!snapshot.exists()) return
    
    const data = snapshot.val()
    const isAlert = isAlertCondition(data)
    
    // Alert state changed
    if (isAlert && !lastAlertState) {
      console.log('🚨 ALERT DETECTED:', deviceName, deviceId)
      
      // Start emergency alarm sound
      startAlertSound()
      
      // Start vibration
      startAlertVibration()
      
      // Show notification
      const buttonState = data.status?.state || ''
      let message = 'Emergency alert detected!'
      if (buttonState === 'alert') {
        message = 'Emergency button pressed (3s hold)'
      } else if (data.gasStatus === 'detected' || data.gasStatus === 'critical') {
        message = 'Critical gas levels detected'
      } else if (data.lastType === 'alarm') {
        message = 'Alarm triggered'
      } else if (data.smokeLevel > 1500) {
        message = 'High smoke levels detected'
      }
      
      showAlertNotification(deviceName, message)
      
    } else if (!isAlert && lastAlertState) {
      console.log('✅ Alert cleared:', deviceName, deviceId)
      
      // Stop all alerts (sound + vibration)
      stopAllAlerts()
      
      // Show cleared notification (no vibration)
      showAlertNotification(deviceName, 'Alert cleared - situation safe', false)
    }
    
    lastAlertState = isAlert
  })
  
  return unsubscribe
}

// Start monitoring all user devices
async function startMonitoring(userId) {
  if (monitoringActive) return
  
  try {
    console.log('🔍 Starting background alert monitoring for user:', userId)
    
    // Request notification permission
    await requestNotificationPermission()
    
    // Get user's devices from Firestore
    const q = query(
      collection(db, 'devices'),
      where('addedBy', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    
    // Set up listeners for each device
    deviceListeners = snapshot.docs.map(doc => {
      const data = doc.data()
      const deviceId = data.deviceId
      const deviceName = data.name || deviceId
      
      console.log('👀 Monitoring device:', deviceName, deviceId)
      return monitorDevice(deviceId, deviceName)
    })
    
    monitoringActive = true
    console.log(`✅ Background monitoring active for ${deviceListeners.length} devices`)
    
  } catch (error) {
    console.error('❌ Error starting background monitoring:', error)
  }
}

// Stop monitoring all devices
function stopMonitoring() {
  console.log('⏹️ Stopping background alert monitoring')
  
  // Unsubscribe from all device listeners
  deviceListeners.forEach(unsubscribe => unsubscribe())
  deviceListeners = []
  
  // Stop all alerts
  stopAllAlerts()
  
  monitoringActive = false
}

// Initialize monitoring when user logs in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in - start monitoring
    startMonitoring(user.uid)
  } else {
    // User logged out - stop monitoring
    stopMonitoring()
  }
})

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  stopMonitoring()
})

export { startMonitoring, stopMonitoring, stopAllAlerts }
