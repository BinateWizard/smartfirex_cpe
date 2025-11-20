const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp(); } catch (e) {}
const rtdb = admin.database();
const firestore = admin.firestore();

// Helper: detect transition into alert (similar logic used client-side)
function isAlertData(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.sensorError === true) return true;
  if (data.message === 'help requested' || data.message === 'alarm has been triggered') return true;
  if (data.lastType === 'alarm') return true;
  const gas = (data.gasStatus || '').toLowerCase();
  if (['critical','detected'].includes(gas)) return true;
  const smokeValue = data.smokeLevel ?? data.smoke ?? data.smokeAnalog ?? 0;
  if (typeof smokeValue === 'number' && smokeValue > 1500) return true;
  const buttonState = data.status && data.status.state;
  if (buttonState === 'alert') return true;
  return false;
}

exports.createStatusCardOnAlert = functions.database.ref('/devices/{deviceId}')
  .onWrite(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    if (!after) return null;

    const wasAlert = isAlertData(before);
    const isAlert = isAlertData(after);
    if (!isAlert || wasAlert) return null; // only on transition into alert

    const deviceId = context.params.deviceId;
    const cardRef = rtdb.ref(`/devices/${deviceId}/statusHistory`).push();
    const now = Date.now();
    await cardRef.set({
      timestamp: now,
      deviceId,
      message: after.message || 'Alert triggered',
      gasStatus: after.gasStatus || 'normal',
      smokeLevel: after.smokeLevel ?? after.smoke ?? after.smokeAnalog ?? 0,
      temperature: after.temperature ?? null,
      humidity: after.humidity ?? null,
      type: 'alert'
    });

    // Trim to last 5
    const historySnap = await rtdb.ref(`/devices/${deviceId}/statusHistory`).once('value');
    const items = historySnap.val() || {};
    const entries = Object.entries(items).map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.timestamp - a.timestamp);
    const toDelete = entries.slice(5);
    await Promise.all(toDelete.map(entry => rtdb.ref(`/devices/${deviceId}/statusHistory/${entry.id}`).remove()));

    return null;
  });

// New: Firestore notifications per user on alert transitions
exports.createNotificationsOnAlert = functions.database.ref('/devices/{deviceId}')
  .onWrite(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    if (!after) return null;
    const wasAlert = isAlertData(before);
    const isAlert = isAlertData(after);
    if (!isAlert || wasAlert) return null;

    const deviceId = context.params.deviceId;

    // Query all device registrations to know which users to notify
    const deviceDocsSnap = await firestore.collection('devices').where('deviceId', '==', deviceId).get();
    if (deviceDocsSnap.empty) return null;

    const now = admin.firestore.Timestamp.now();
    const batch = firestore.batch();

    deviceDocsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const userId = data.addedBy;
      const notifRef = firestore.collection('notifications').doc();
      batch.set(notifRef, {
        userId,
        deviceId,
        deviceName: data.name || deviceId,
        type: 'alert',
        title: 'Alert Triggered',
        message: after.message || 'An alert was detected',
        createdAt: now,
        read: false,
        gasStatus: after.gasStatus || 'normal',
        smokeLevel: after.smokeLevel ?? after.smoke ?? after.smokeAnalog ?? 0,
        temperature: after.temperature ?? null,
        humidity: after.humidity ?? null
      });
    });

    await batch.commit();
    return null;
  });

// Optional: offline registration notification - invoked via HTTPS callable
exports.notifyOfflineRegistration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  const { deviceId, deviceName } = data || {};
  if (!deviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'deviceId required');
  }
  const now = admin.firestore.Timestamp.now();
  await firestore.collection('notifications').add({
    userId: context.auth.uid,
    deviceId,
    deviceName: deviceName || deviceId,
    type: 'offline',
    title: 'Device Registered (Offline)',
    message: 'Device added without live data. Awaiting first signal.',
    createdAt: now,
    read: false
  });
  return { status: 'ok' };
});
