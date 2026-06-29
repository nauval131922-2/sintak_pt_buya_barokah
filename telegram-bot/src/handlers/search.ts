import { Context } from 'grammy';
import { api } from '../utils/api';

export async function handleSearch(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text || '';

  if (!telegramId) return;

  const query = text.replace(/^\/cari(@\w+)?/i, '').trim();
  if (!query) {
      return ctx.reply(
        `🔎 Gunakan format:\n\n` +
        `/cari budi\n\n` +
        `Bot akan mencari semua karyawan aktif.`
      );
    }

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered || status.is_active !== 1) {
      return ctx.reply(`❌ Anda belum terdaftar atau belum disetujui. Gunakan /register`);
    }

    const result = await api.findKaryawan(query, undefined, 10);
    const items = result.data || [];

    if (items.length === 0) {
      return ctx.reply(`❌ Tidak ditemukan karyawan aktif dengan kata kunci "${query}".`);
    }

    const lines = items.map((item: any, index: number) => (
      `${index + 1}. ${item.nama_karyawan} — Absensi ${item.absensi || '-'}${item.posisi ? ` — ${item.posisi}` : ''}${item.department ? ` — ${item.department}` : ''}`
    ));

    await ctx.reply(
      `🔎 Hasil pencarian untuk "${query}":\n\n` +
      `${lines.join('\n')}\n\n` +
      `Untuk input realisasi, pakai field \`Absensi:\` atau \`Nama:\` di template /input.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[SEARCH] Error:', error);
    await ctx.reply(`❌ Gagal mencari karyawan: ${error.message}`);
  }
}
