import { schedule } from '@netlify/functions';
import { getDb, initWebPush, sendPush } from './utils.js';

const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

export const handler = schedule('0 8 * * *', async (event) => {
  console.log('Running morning push notifications job...');
  
  try {
    const db = getDb();
    initWebPush();
    
    const todayName = getTodayName();
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const scheduleMap = userData.schedule || {};
      const subjects = userData.subjects || [];
      const todayClassesIds = scheduleMap[todayName] || [];

      // Skip if no classes today
      if (todayClassesIds.length === 0) continue;

      // Get Push Subscription
      const subDoc = await db.collection('pushSubscriptions').doc(userId).get();
      if (!subDoc.exists) continue; // User not subscribed to push
      
      const { subscription } = subDoc.data();
      if (!subscription) continue;

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

    return { statusCode: 200, body: 'Morning pushes triggered successfully.' };
  } catch (err) {
    console.error('Error in morning cron', err);
    return { statusCode: 500, body: err.message };
  }
});
