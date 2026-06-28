import { Context } from 'grammy';
import { api } from '../utils/api';
import { formatHistoryList } from '../utils/formatter';

export async function handleHistory(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));

    if (!status.registered) {
      return ctx.reply(
        `❌ Anda belum terdaftar.\n\n` +
        `Gunakan /register untuk daftar.`
      );
    }

    if (status.is_active !== 1) {
      return ctx.reply(
        `⏳ Akun Anda belum disetujui admin.\n\n` +
        `Tunggu persetujuan terlebih dahulu.`
      );
    }

    await ctx.reply('🔍 Mengambil riwayat realisasi...');

    const result = await api.getAllHistory(10);

    const historyText = formatHistoryList(result.data, 'Riwayat Semua Realisasi Bot');
    await ctx.reply(historyText);

  } catch (error: any) {
    console.error('[HISTORY] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}
