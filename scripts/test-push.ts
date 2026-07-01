// Test script untuk trigger push notification manual
import { sendPushNotification } from '../src/lib/push';

async function testPush() {
  console.log('[TEST] Triggering push notification...');
  const result = await sendPushNotification(
    'Test Notification',
    'Ini test notifikasi push dari SINTAK',
    '/settings/telegram-users'
  );
  console.log('[TEST] Result:', result);
}

testPush();
