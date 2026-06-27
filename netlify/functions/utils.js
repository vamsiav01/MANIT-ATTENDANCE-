import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';

let db = null;

export function getDb() {
  if (db) return db;

  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
      console.log('✅ Firebase Admin initialized');
    } catch (err) {
      console.error('❌ Failed to initialize Firebase Admin.', err.message);
      throw err;
    }
  }
  
  db = getFirestore();
  return db;
}

export function initWebPush() {
  webpush.setVapidDetails(
    process.env.SUBJECT || 'mailto:admin@manitattendance.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid');
      // Ideally delete it from DB, but we keep it simple here
    } else {
      console.error('Error sending push notification', err);
    }
  }
}
