import webpush from 'web-push';
import db from '@/lib/db';

const VAPID_PUBLIC_KEY = 'BGR9pZCmLIDbpXJG7Epd53mpac_BMToDQkhutZEvs4vR6VQpLDABLWRxhvcfbp0ZK-UC5T-luVxbqmfbVQSn2Ss';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Fail-closed: tanpa VAPID_PRIVATE_KEY, pengiriman push dinonaktifkan (fallback publik dihapus)
if (!VAPID_PRIVATE_KEY) {
  console.error('[PUSH] VAPID_PRIVATE_KEY tidak diset — push dinonaktifkan.');
}

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@sintak.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(title: string, body: string, url?: string) {
  if (!VAPID_PRIVATE_KEY) return { success: false, error: 'VAPID_PRIVATE_KEY tidak diset' };
  try {
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

    // Bound fan-out: batch 10 konkuren + cap 500 subscript — cegah thundering-herd
    const subs = result.rows.slice(0, 500);
    let sent = 0;
    for (let i = 0; i < subs.length; i += 10) {
      const batch = subs.slice(i, i + 10);
      await Promise.all(batch.map(async (row: any) => {
        try {
          const subscription = JSON.parse(row.subscription);
          await webpush.sendNotification(subscription, payload);
          sent++;
        } catch (err: any) {
          // Hapus subscription invalid
          await db.execute({
            sql: `DELETE FROM push_subscriptions WHERE subscription = ?`,
            args: [row.subscription]
          });
        }
      }));
    }
    return { success: true, count: sent };
  } catch (error: any) {
    console.error('[PUSH] sendPushNotification error:', error);
    return { success: false, error: error.message };
  }
}
