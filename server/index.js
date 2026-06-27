require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const admin = require('firebase-admin');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Firebase Admin
// WARNING: You must download a serviceAccountKey.json from Firebase Console
// Project Settings -> Service Accounts -> Generate New Private Key
// Place the file in this 'server' directory.
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin. Did you download serviceAccountKey.json?', err.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Configure Web Push
webpush.setVapidDetails(
  process.env.SUBJECT || 'mailto:admin@manitattendance.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
console.log('✅ Web Push configured');

// 3. Helper to send push
async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid');
      // In production, you would delete this subscription from Firestore here
    } else {
      console.error('Error sending push notification', err);
    }
  }
}

// 4. CRON JOBS
// Helper to get today's day string (e.g. "Monday")
const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 🌅 MORNING NOTIFICATION (runs every day at 8:00 AM)
cron.schedule('0 8 * * *', async () => {
  console.log('Running morning push notifications job...');
  const todayName = getTodayName();

  try {
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const schedule = userData.schedule || {};
      const subjects = userData.subjects || [];
      const todayClassesIds = schedule[todayName] || [];

      // Skip if no classes today
      if (todayClassesIds.length === 0) continue;

      // Get Push Subscription
      const subDoc = await db.collection('pushSubscriptions').doc(userId).get();
      if (!subDoc.exists) continue; // User not subscribed to push
      
      const { subscription } = subDoc.data();

      // Check risk
      const atRisk = todayClassesIds.some(id => {
        const sub = subjects.find(s => s.id === id);
        if (!sub || sub.totalClasses === 0) return false;
        const pct = Math.round((sub.attended / sub.totalClasses) * 100);
        return pct < (sub.targetPct || 75);
      });

      const title = atRisk ? '🌅 Good Morning! Classes Today ⚠️' : `🌅 Good Morning! ${todayClassesIds.length} Classes Today`;
      const body = atRisk ? 'You have classes today and some are below target. Do not miss!' : 'You have classes scheduled today. Check the app.';

      await sendPush(subscription, {
        title,
        body,
        url: '/today',
        tag: 'morning-schedule'
      });
    }
  } catch (err) {
    console.error('Error in morning cron', err);
  }
});

// 🌙 EVENING NOTIFICATION (runs every day at 6:00 PM)
cron.schedule('0 18 * * *', async () => {
  console.log('Running evening push notifications job...');
  const todayName = getTodayName();
  const todayKey = getTodayKey();

  try {
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const schedule = userData.schedule || {};
      const history = userData.history || {};
      const todayClassesIds = schedule[todayName] || [];

      // Skip if no classes today
      if (todayClassesIds.length === 0) continue;

      const subDoc = await db.collection('pushSubscriptions').doc(userId).get();
      if (!subDoc.exists) continue;
      
      const { subscription } = subDoc.data();
      
      const todayHistory = history[todayKey] || {};
      const markedCount = Object.keys(todayHistory).length;
      
      if (markedCount < todayClassesIds.length) {
        // Did not mark all classes
        await sendPush(subscription, {
          title: '🌙 Please Mark Your Attendance!',
          body: `You still have ${todayClassesIds.length - markedCount} classes not marked for today.`,
          url: '/today',
          tag: 'evening-summary'
        });
      }
    }
  } catch (err) {
    console.error('Error in evening cron', err);
  }
});

app.get('/health', (req, res) => {
  res.send('Server is running and listening for crons.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
