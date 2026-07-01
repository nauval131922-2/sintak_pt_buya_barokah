import { Context } from 'grammy';
import { api } from '../utils/api';

export async function handleCariOrder(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text || '';

  if (!telegramId) return;

  const query = text.replace(/^\/cariorder(@\w+)?/i, '').trim();
  if (!query) {
    return ctx.reply(
      `🔎 Gunakan format:\n\n` +
      `/cariorder OP.001.SOPd\n\n` +
      `Bot akan mencari order berdasarkan no. SOPd atau nama order.`
    );
  }

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered || status.is_active !== 1) {
      return ctx.reply(`❌ Anda belum terdaftar atau belum disetujui. Gunakan /register`);
    }

    const result = await api.cariOrder(query, 10);
    const items = result.data || [];

    if (items.length === 0) {
      return ctx.reply(`❌ Tidak ditemukan order dengan kata kunci "${query}".`);
    }

    const lines = items.map((item: any, index: number) => (
      `${index + 1}. ${item.no_sopd} — ${item.nama_order || '-'}`
    ));

    await ctx.reply(
      `🔎 Hasil pencarian order untuk "${query}":\n\n` +
      `${lines.join('\n')}\n\n` +
      `Gunakan nomor order tersebut di field \`Order:\` template /input.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[CARIORDER] Error:', error);
    await ctx.reply(`❌ Gagal mencari order: ${error.message}`);
  }
}
