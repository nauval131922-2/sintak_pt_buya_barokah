import { Context } from 'grammy';
import { api } from '../utils/api';

const BAGIAN = process.env.BAGIAN || 'SETTING';

// Store user state (waiting for nama)
const userStates = new Map<number, { state: string; data?: any }>();

export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  const telegramUsername = ctx.from?.username;

  console.log('[START] Called for telegramId:', telegramId);

  if (!telegramId) {
    return ctx.reply('❌ Tidak dapat mengidentifikasi user.');
  }

  try {
    // Cek apakah user sudah terdaftar
    console.log('[START] Checking status...');
    const status = await api.checkStatus(String(telegramId));
    console.log('[START] Status:', status);

    if (status.registered && status.is_active === 1) {
      return ctx.reply(
        `✅ Anda sudah terdaftar!\n\n` +
        `👤 Nama: ${status.nama_karyawan}\n` +
        `🏭 Bagian: ${status.bagian}\n\n` +
        `Gunakan /input untuk melapor realisasi produksi.\n` +
        `Ketik /help untuk panduan.`
      );
    }

    if (status.registered && status.is_active === 0) {
      return ctx.reply(
        `⏳ Permintaan registrasi Anda sedang menunggu persetujuan admin.\n\n` +
        `Anda akan menerima notifikasi jika sudah disetujui.`
      );
    }

    // User belum terdaftar, mulai proses registrasi
    await ctx.reply(
      `👋 Selamat datang di SINTAK Bot - Bagian ${BAGIAN}!\n\n` +
      `Untuk menggunakan bot ini, silakan daftarkan diri Anda terlebih dahulu.\n\n` +
      `Ketik nama lengkap Anda sesuai dengan yang terdaftar di SINTAK:`
    );

    // Set user state to waiting for nama
    userStates.set(telegramId, { state: 'waiting_nama' });
    console.log('[START] User state set:', userStates.get(telegramId));

  } catch (error: any) {
    console.error('[START] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

export async function handleRegistrationInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const telegramUsername = ctx.from?.username;
  const text = ctx.message?.text;

  console.log('[REG INPUT] Received:', { telegramId, text });

  if (!telegramId || !text) {
    console.log('[REG INPUT] Missing telegramId or text');
    return;
  }

  const userState = userStates.get(telegramId);
  console.log('[REG INPUT] User state:', userState);
  
  if (!userState || userState.state !== 'waiting_nama') {
    console.log('[REG INPUT] No valid state, ignoring');
    return;
  }

  const namaKaryawan = text.trim();
  console.log('[REG INPUT] Processing nama:', namaKaryawan);

  try {
    // Validasi nama karyawan
    await ctx.reply('🔍 Memvalidasi nama karyawan...');
    
    console.log('[REG INPUT] Calling validateKaryawan...');
    const validation = await api.validateKaryawan(namaKaryawan);
    console.log('[REG INPUT] Validation result:', validation);

    if (!validation.valid) {
      await ctx.reply(
        `❌ Nama karyawan tidak ditemukan di database SINTAK.\n\n` +
        `Pastikan nama yang Anda ketik sesuai dengan data di SINTAK.\n\n` +
        `Ketik /start untuk mencoba lagi.`
      );
      userStates.delete(telegramId);
      return;
    }

    // Submit registrasi request
    const result = await api.registerRequest({
      telegram_id: String(telegramId),
      telegram_username: telegramUsername,
      nama_karyawan: validation.nama_karyawan,
      bagian: BAGIAN
    });

    await ctx.reply(
      `⏳ Permintaan registrasi Anda telah dikirim ke admin.\n\n` +
      `📋 Data Anda:\n` +
      `👤 Nama: ${validation.nama_karyawan}\n` +
      `📍 Posisi: ${validation.posisi}\n` +
      `🆔 Absensi: ${validation.absensi}\n` +
      `🏭 Bagian: ${BAGIAN}\n` +
      `📱 Username: @${telegramUsername || telegramId}\n\n` +
      `Anda akan menerima notifikasi jika sudah disetujui.`
    );

    // Clear user state
    userStates.delete(telegramId);

  } catch (error: any) {
    console.error('[REGISTRATION] Error:', error);
    await ctx.reply(
      `❌ Gagal mendaftar: ${error.message}\n\n` +
      `Ketik /start untuk mencoba lagi.`
    );
    userStates.delete(telegramId);
  }
}

// Export user states untuk diakses dari bot.ts
export { userStates };
