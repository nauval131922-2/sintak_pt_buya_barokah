import { Context, InlineKeyboard } from 'grammy';
import { api } from '../utils/api';

const BAGIAN = process.env.BAGIAN || 'SETTING';

// Store user state (waiting for nama)
const userStates = new Map<number, { state: string; data?: any }>();

export async function handleRegister(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));

    if (status.registered && status.is_active === 1) {
      return ctx.reply(
        `✅ *Anda sudah terdaftar dan aktif!*\n\n` +
        `👤 *Nama:* ${status.nama_karyawan}\n` +
        `🏭 *Bagian:* ${status.bagian}\n\n` +
        `Gunakan /input untuk melapor realisasi produksi.`,
        { parse_mode: 'Markdown' }
      );
    }

    if (status.registered && status.is_active === 0) {
      return ctx.reply(
        `⏳ Permintaan registrasi Anda sedang menunggu persetujuan admin.\n\n` +
        `Anda akan menerima notifikasi di Telegram jika sudah disetujui.`
      );
    }

    // Belum terdaftar
    await ctx.reply(
      `📝 *Pendaftaran SINTAK Bot - Bagian ${BAGIAN}*\n\n` +
      `Ketik *nama* Anda (bisa nama lengkap atau sebagian, misal: budi).`,
      { parse_mode: 'Markdown' }
    );

    userStates.set(telegramId, { state: 'waiting_nama' });

  } catch (error: any) {
    console.error('[REGISTER] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

export async function handleRegistrationInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text;

  if (!telegramId || !text) return;

  const userState = userStates.get(telegramId);
  if (!userState || userState.state !== 'waiting_nama') return;

  const namaKaryawan = text.trim();

  try {
    await ctx.reply('🔍 Memvalidasi nama karyawan...');

    const validation = await api.validateKaryawan(namaKaryawan);

    if (!validation.valid) {
      const suggestions = await api.findKaryawan(namaKaryawan, undefined, 8);
      const items = suggestions.data || [];

      if (items.length > 0) {
        const keyboard = new InlineKeyboard();
        for (const item of items) {
          const label = `${item.nama_karyawan} [${item.absensi}] ${item.posisi ? `(${item.posisi})` : ''}`;
          const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
          keyboard.text(truncatedLabel, `register_select:${item.nama_karyawan}`).row();
        }
        await ctx.reply(
          `❌ *"${namaKaryawan}"* tidak ditemukan.\n\nPilih nama Anda:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return;
      }

      await ctx.reply(
        `❌ *"${namaKaryawan}"* tidak ditemukan.\n\n` +
        `Ketik nama lain untuk mencari ulang, atau /register untuk membatalkan.`,
        { parse_mode: 'Markdown' }
      );
      userStates.set(telegramId, { state: 'waiting_nama', data: userState.data });
      return;
    }

    const result = await api.registerRequest({
      telegram_id: String(telegramId),
      telegram_username: ctx.from?.username,
      nama_karyawan: validation.nama_karyawan,
      bagian: BAGIAN
    });

    userStates.delete(telegramId);

    if (result.error) {
      return ctx.reply(`❌ ${result.error}`);
    }

    await ctx.reply(
      `✅ *Permintaan registrasi telah dikirim ke admin!*\n\n` +
      `*Data Anda:*\n` +
      `👤 *Nama:* ${validation.nama_karyawan}\n` +
      `📍 *Posisi:* ${validation.posisi}\n` +
      `🆔 *Absensi:* ${validation.absensi}\n` +
      `🏭 *Bagian:* ${BAGIAN}\n\n` +
      `⏳ Tunggu persetujuan admin.\n` +
      `Anda akan mendapat notifikasi di Telegram jika disetujui.`,
      { parse_mode: 'Markdown' }
    );

  } catch (error: any) {
    console.error('[REGISTER] Error:', error);
    await ctx.reply(`❌ Gagal mendaftar: ${error.message}`);
    userStates.delete(telegramId);
  }
}

export { userStates };

export async function handleRegisterCallback(ctx: Context) {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) return;
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const data = ctx.callbackQuery.data;
  if (!data.startsWith('register_select:')) return;

  const namaKaryawan = data.replace('register_select:', '');
  await ctx.answerCallbackQuery();

  try {
    const validation = await api.validateKaryawan(namaKaryawan);
    if (!validation.valid) {
      await ctx.reply(`❌ Nama "${namaKaryawan}" tidak valid. Gunakan /register untuk mencoba lagi.`);
      return;
    }

    const result = await api.registerRequest({
      telegram_id: String(telegramId),
      telegram_username: ctx.from?.username,
      nama_karyawan: validation.nama_karyawan,
      bagian: BAGIAN
    });

    userStates.delete(telegramId);

    if (result.error) {
      return ctx.reply(`❌ ${result.error}`);
    }

    await ctx.reply(
      `✅ *Permintaan registrasi telah dikirim ke admin!*\n\n` +
      `*Data Anda:*\n` +
      `👤 *Nama:* ${validation.nama_karyawan}\n` +
      `📍 *Posisi:* ${validation.posisi}\n` +
      `🆔 *Absensi:* ${validation.absensi}\n` +
      `🏭 *Bagian:* ${BAGIAN}\n\n` +
      `⏳ Tunggu persetujuan admin.\n` +
      `Anda akan mendapat notifikasi di Telegram jika disetujui.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[REGISTER_CALLBACK] Error:', error);
    await ctx.reply(`❌ Gagal mendaftar: ${error.message}`);
  }
}
