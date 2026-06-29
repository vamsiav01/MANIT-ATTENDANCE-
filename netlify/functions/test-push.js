import { getDb, initWebPush, sendPush } from './utils.js';

export const handler = async (event) => {
  console.log('Sending test push notification...');
  try {
    const db = getDb();
    initWebPush();
    
    const subSnapshot = await db.collection('pushSubscriptions').get();
    let sent = 0;
    
    for (const subDoc of subSnapshot.docs) {
      const { subscription } = subDoc.data();
      if (subscription) {
        await sendPush(subscription, {
          title: '🚨 Closed-App Test Working!',
          body: 'This notification was triggered from your Netlify server while the app was closed. Success!',
          url: '/',
          tag: 'test-push'
        });
        sent++;
      }
    }
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Test push sent to ${sent} devices.`,
        backend_project_id: sa.project_id || 'UNKNOWN'
      })
    };
  } catch (err) {
    console.error('Test push error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message,
        raw_env_start: process.env.FIREBASE_SERVICE_ACCOUNT ? process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 30) : 'MISSING',
        raw_env_end: process.env.FIREBASE_SERVICE_ACCOUNT ? process.env.FIREBASE_SERVICE_ACCOUNT.slice(-30) : 'MISSING'
      })
    };
  }
};
