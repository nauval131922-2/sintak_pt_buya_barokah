import webpush from 'web-push';
import db from '@/lib/db';

const VAPID_PUBLIC_KEY = 'BGR9pZCmLIDbpXJG7Epd53mpac_BMToDQkhutZEvs4vR6VQpLDABLWRxhvcfbp0ZK-UC5T-luVxbqmfbVQSn2Ss';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'PNWffx27ANb_GvgQo_Y_H_O39OHBkeKx1zBH_Ds9nH8';

webpush.setVapidDetails(
  'mailto:admin@sintak.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function sendPushNotification(title: string, body: string, url?: string) {
  try {
    console.log('[PUSH] Starting sendPushNotification...');
    console.log('[PUSH] Title:', title);
    console.log('[PUSH] Body:', body);
    
    // Get all subscriptions
    const result = await db.execute({
      sql: `SELECT subscription FROM push_subscriptions`,
      args: []
    });

    console.log('[PUSH] Found subscriptions:', result.rows.length);

    const payload = JSON.stringify({
      title,
      body,
      tag: 'telegram-registration',
      data: { url: url || '/settings/telegram-users' }
    });

    console.log('[PUSH] Payload:', payload);

    // Send to all subscribed users
    const promises = result.rows.map(async (row: any, index: number) => {
      try {
        console.log(`[PUSH] Sending to subscription #${index + 1}...`);
        const subscription = JSON.parse(row.subscription);
        await webpush.sendNotification(subscription, payload);
        console.log(`[PUSH] ✅ Sent to subscription #${index + 1}`);
      } catch (err: any) {
        console.error(`[PUSH] ❌ Failed to send to subscription #${index + 1}:`, err.message);
        // Remove invalid subscription
        await db.execute({
          sql: `DELETE FROM push_subscriptions WHERE subscription = ?`,
          args: [row.subscription]
        });
      }
    });

    await Promise.all(promises);
    console.log('[PUSH] All notifications sent. Total:', result.rows.length);
    return { success: true, count: result.rows.length };
  } catch (error: any) {
    console.error('[PUSH] sendPushNotification error:', error);
    return { success: false, error: error.message };
  }
}
