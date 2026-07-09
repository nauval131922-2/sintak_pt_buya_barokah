import { Context, InlineKeyboard } from 'grammy';
import { api } from '../utils/api';

// ponytail: list bagian hardcoded, add when new bagian needed
const BAGIAN_LIST = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI'];

// Store user state (waiting for nama or bagian)
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
      `📝 *Pendaftaran SINTAK Bot*\n\n` +
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
        // Store validation data for later
        userStates.set(telegramId, { state: 'waiting_nama', data: userState.data });
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

    // Nama valid, tanya bagian
    const keyboard = new InlineKeyboard();
    for (const bagian of BAGIAN_LIST) {
      keyboard.text(bagian, `register_bagian:${bagian}`).row();
    }

    userStates.set(telegramId, { 
      state: 'waiting_bagian', 
      data: { 
        nama_karyawan: validation.nama_karyawan,
        posisi: validation.posisi,
        absensi: validation.absensi
      }
    });

    await ctx.reply(
      `✅ *Nama ditemukan:*\n` +
      `👤 ${validation.nama_karyawan}\n` +
      `📍 ${validation.posisi}\n` +
      `🆔 ${validation.absensi}\n\n` +
      `🏭 *Pilih bagian Anda:*`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
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
  await ctx.answerCallbackQuery();

  // Handle nama selection
  if (data.startsWith('register_select:')) {
    const namaKaryawan = data.replace('register_select:', '');

    try {
      const validation = await api.validateKaryawan(namaKaryawan);
      if (!validation.valid) {
        await ctx.reply(`❌ Nama "${namaKaryawan}" tidak valid. Gunakan /register untuk mencoba lagi.`);
        return;
      }

      // Show bagian selection
      const keyboard = new InlineKeyboard();
      for (const bagian of BAGIAN_LIST) {
        keyboard.text(bagian, `register_bagian:${bagian}`).row();
      }

      userStates.set(telegramId, { 
        state: 'waiting_bagian', 
        data: { 
          nama_karyawan: validation.nama_karyawan,
          posisi: validation.posisi,
          absensi: validation.absensi
        }
      });

      await ctx.reply(
        `✅ *Nama ditemukan:*\n` +
        `👤 ${validation.nama_karyawan}\n` +
        `📍 ${validation.posisi}\n` +
        `🆔 ${validation.absensi}\n\n` +
        `🏭 *Pilih bagian Anda:*`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    } catch (error: any) {
      console.error('[REGISTER_CALLBACK] Error:', error);
      await ctx.reply(`❌ Gagal mendaftar: ${error.message}`);
    }
    return;
  }

  // Handle bagian selection
  if (data.startsWith('register_bagian:')) {
    const bagian = data.replace('register_bagian:', '');
    const userState = userStates.get(telegramId);

    if (!userState || userState.state !== 'waiting_bagian' || !userState.data) {
      await ctx.reply(`❌ Sesi habis. Gunakan /register untuk mulai ulang.`);
      return;
    }

    try {
      const result = await api.registerRequest({
        telegram_id: String(telegramId),
        telegram_username: ctx.from?.username,
        nama_karyawan: userState.data.nama_karyawan,
        bagian
      });

      userStates.delete(telegramId);

      if (result.error) {
        return ctx.reply(`❌ ${result.error}`);
      }

      await ctx.reply(
        `✅ *Permintaan registrasi telah dikirim ke admin!*\n\n` +
        `*Data Anda:*\n` +
        `👤 *Nama:* ${userState.data.nama_karyawan}\n` +
        `📍 *Posisi:* ${userState.data.posisi}\n` +
        `🆔 *Absensi:* ${userState.data.absensi}\n` +
        `🏭 *Bagian:* ${bagian}\n\n` +
        `⏳ Tunggu persetujuan admin.\n` +
        `Anda akan mendapat notifikasi di Telegram jika disetujui.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error: any) {
      console.error('[REGISTER_CALLBACK] Error:', error);
      await ctx.reply(`❌ Gagal mendaftar: ${error.message}`);
    }
  }
}
