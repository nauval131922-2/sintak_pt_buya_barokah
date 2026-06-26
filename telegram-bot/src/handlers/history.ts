import { Context } from 'grammy';
import { api } from '../utils/api';
import { formatHistoryList } from '../utils/formatter';

export async function handleHistory(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  try {
    // Cek user aktif
    const status = await api.checkStatus(String(telegramId));

    if (!status.registered) {
      return ctx.reply(
        `❌ Anda belum terdaftar.\n\n` +
        `Gunakan /start untuk registrasi terlebih dahulu.`
      );
    }

    if (status.is_active !== 1) {
      return ctx.reply(
        `⏳ Akun Anda belum disetujui admin.\n\n` +
        `Tunggu persetujuan terlebih dahulu.`
      );
    }

    await ctx.reply('🔍 Mengambil riwayat realisasi...');

    const result = await api.getHistory(String(telegramId), 10);

    if (!result.success) {
      throw new Error(result.error || 'Gagal mengambil riwayat');
    }

    const historyText = formatHistoryList(result.data);
    await ctx.reply(historyText);

  } catch (error: any) {
    console.error('[HISTORY] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}
