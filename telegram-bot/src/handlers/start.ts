import { Context } from 'grammy';

const BAGIAN = process.env.BAGIAN || 'SETTING';

export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  return ctx.reply(
    `👋 *Selamat datang di SINTAK Bot - Bagian ${BAGIAN}!*\n\n` +
    `Perintah yang tersedia:\n\n` +
    `*/register* - Daftar ke bot\n` +
    `*/input* - Input realisasi\n` +
    `*/input_realisasi_by_target* - Input realisasi ke target existing\n` +
    `*/history* - Lihat riwayat\n` +
    `*/help* - Bantuan`,
    { parse_mode: 'Markdown' }
  );
}
