import { Bot } from 'grammy';

// ponytail: Map stores last activity timestamp per user. Simple approach, grows unbounded but clears on restart. Add periodic cleanup if memory matters.
const userActivity = new Map<number, number>();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit

export function updateActivity(telegramId: number) {
  userActivity.set(telegramId, Date.now());
}

function isSessionExpired(telegramId: number): boolean {
  const lastActivity = userActivity.get(telegramId);
  if (!lastActivity) return false;
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

export async function checkSessionTimeout(
  bot: Bot,
  telegramId: number,
  clearStates: () => void
): Promise<boolean> {
  if (!isSessionExpired(telegramId)) {
    updateActivity(telegramId);
    return false;
  }

  // Session expired
  clearStates();
  userActivity.delete(telegramId);

  try {
    await bot.api.sendMessage(
      telegramId,
      '⏱️ Sesi Anda telah berakhir karena tidak aktif selama 30 menit.\n\n' +
      'Silakan mulai ulang dengan:\n' +
      '• /input - Input realisasi baru\n' +
      '• /input_realisasi_by_target - Input ke target existing\n' +
      '• /history - Lihat riwayat'
    );
  } catch (err) {
    console.error('[SESSION] Failed to send timeout notification:', err);
  }

  return true;
}

export function startSessionCleanup(bot: Bot, clearAllStates: () => void) {
  // ponytail: periodic cleanup every 15 min to prevent Map from growing unbounded
  setInterval(() => {
    const now = Date.now();
    for (const [telegramId, lastActivity] of userActivity.entries()) {
      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        clearAllStates();
        userActivity.delete(telegramId);
        
        bot.api.sendMessage(
          telegramId,
          '⏱️ Sesi Anda telah berakhir karena tidak aktif selama 30 menit.\n\n' +
          'Silakan mulai ulang dengan:\n' +
          '• /input - Input realisasi baru\n' +
          '• /input_realisasi_by_target - Input ke target existing\n' +
          '• /history - Lihat riwayat'
        ).catch(() => {}); // silent fail
      }
    }
  }, 15 * 60 * 1000);
}
