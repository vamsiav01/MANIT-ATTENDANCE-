import { schedule } from '@netlify/functions';
import { getDb, initWebPush, sendPush } from './utils.js';

const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const handler = schedule('0 18 * * *', async (event) => {
  console.log('Running evening push notifications job...');
  
  try {
    const db = getDb();
    initWebPush();
    
    const todayName = getTodayName();
    const todayKey = getTodayKey();
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const scheduleMap = userData.schedule || {};
      const history = userData.history || {};
      const todayClassesIds = scheduleMap[todayName] || [];

      // Skip if no classes today
      if (todayClassesIds.length === 0) continue;

      const subDoc = await db.collection('pushSubscriptions').doc(userId).get();
      if (!subDoc.exists) continue;
      
      const { subscription } = subDoc.data();
      if (!subscription) continue;
      
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

    return { statusCode: 200, body: 'Evening pushes triggered successfully.' };
  } catch (err) {
    console.error('Error in evening cron', err);
    return { statusCode: 500, body: err.message };
  }
});
