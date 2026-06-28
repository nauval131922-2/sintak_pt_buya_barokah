import { Context } from 'grammy';
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
        `✅ Anda sudah terdaftar dan aktif!\n\n` +
        `👤 Nama: ${status.nama_karyawan}\n` +
        `🏭 Bagian: ${status.bagian}\n\n` +
        `Gunakan /input untuk melapor realisasi produksi.`
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
      `📝 Pendaftaran SINTAK Bot - Bagian ${BAGIAN}\n\n` +
      `Ketik nama lengkap Anda sesuai database SINTAK:`
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
      await ctx.reply(
        `❌ Nama karyawan tidak ditemukan di database.\n\n` +
        `Pastikan nama sesuai data SINTAK.\n\n` +
        `Gunakan /register untuk mencoba lagi.`
      );
      userStates.delete(telegramId);
      return;
    }

    const result = await api.registerRequest({
      telegram_id: String(telegramId),
      telegram_username: ctx.from?.username,
      nama_karyawan: validation.nama_karyawan,
      bagian: BAGIAN
    });

    await ctx.reply(
      `✅ Permintaan registrasi telah dikirim ke admin!\n\n` +
      `📋 Data Anda:\n` +
      `👤 Nama: ${validation.nama_karyawan}\n` +
      `📍 Posisi: ${validation.posisi}\n` +
      `🆔 Absensi: ${validation.absensi}\n` +
      `🏭 Bagian: ${BAGIAN}\n\n` +
      `⏳ Tunggu persetujuan admin.\n` +
      `Anda akan mendapat notifikasi di Telegram jika disetujui.`
    );

    userStates.delete(telegramId);

  } catch (error: any) {
    console.error('[REGISTER] Error:', error);
    await ctx.reply(`❌ Gagal mendaftar: ${error.message}`);
    userStates.delete(telegramId);
  }
}

export { userStates };
