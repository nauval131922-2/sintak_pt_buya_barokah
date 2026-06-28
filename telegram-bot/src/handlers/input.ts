import { Context } from 'grammy';
import { api } from '../utils/api';
import { parseRealisasiTemplate, validateRealisasiData } from '../utils/parser';
import { formatRealisasiSummary } from '../utils/formatter';

const BAGIAN = process.env.BAGIAN || 'SETTING';

// Store user state (waiting for template)
type ParsedRealisasiData = ReturnType<typeof parseRealisasiTemplate>;

type InputState = {
  state: 'waiting_template' | 'confirm_manual_order';
  pendingData?: ParsedRealisasiData;
};

const inputStates = new Map<number, InputState>();

export async function handleInputCommand(ctx: Context) {
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

    // Set state waiting for template
    inputStates.set(telegramId, { state: 'waiting_template' });

    await ctx.reply(
      `📝 Kirim template realisasi Anda:\n\n` +
      `Contoh:\n` +
      `\`\`\`\n` +
      `Nama: Nauval Gunawan\n` +
      `Tgl: 2026-06-26\n` +
      `Shift: 1\n` +
      `Order: SO-12345\n` +
      `Pekerjaan: Setting Mesin\n` +
      `Target: 100\n` +
      `Realisasi: 95\n` +
      `Kendala: -\n` +
      `\`\`\`\n\n` +
      `Field wajib: Tgl, Shift, Realisasi\n\n` +
      `Field Nama opsional untuk input atas nama karyawan lain. Cukup isi Nama saja, absensi otomatis terisi dari database.\n\n` +
      `Ketik /help untuk panduan lengkap.`,
      { parse_mode: 'Markdown' }
    );

  } catch (error: any) {
    console.error('[INPUT_CMD] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

export async function handleInputTemplate(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text;

  if (!telegramId || !text) return;

  const userState = inputStates.get(telegramId);
  const normalizedText = text.trim().toLowerCase();
  
  // Cek apakah text mengandung template (ada "Tgl:" dan "Shift:")
  const isTemplate = text.includes('Tgl:') && text.includes('Shift:');
  
  if (!userState && !isTemplate) return;

  if (userState?.state === 'confirm_manual_order') {
    try {
      const status = await api.checkStatus(String(telegramId));

      if (!status.registered || status.is_active !== 1) {
        inputStates.delete(telegramId);
        return ctx.reply(`❌ Anda belum terdaftar atau belum disetujui. Gunakan /start`);
      }

      if (normalizedText === 'lanjut') {
        if (!userState.pendingData) {
          inputStates.delete(telegramId);
          return ctx.reply(`❌ Data template sebelumnya tidak ditemukan. Kirim ulang template dengan /input.`);
        }

        await submitRealisasi(ctx, userState.pendingData, status);
        inputStates.delete(telegramId);
        return;
      }

      if (isTemplate) {
        inputStates.set(telegramId, { state: 'waiting_template' });
      } else {
        return ctx.reply(
          `⚠️ Balas dengan "lanjut" untuk tetap simpan order manual, atau kirim template baru untuk koreksi.`
        );
      }
    } catch (error: any) {
      console.error('[INPUT_CONFIRM] Error:', error);
      inputStates.delete(telegramId);
      return ctx.reply(`❌ Gagal memproses konfirmasi: ${error.message}`);
    }
  }

  let shouldClearState = true;

  try {
    // Cek user aktif
    const status = await api.checkStatus(String(telegramId));

    if (!status.registered || status.is_active !== 1) {
      return ctx.reply(`❌ Anda belum terdaftar atau belum disetujui. Gunakan /start`);
    }

    // Parse template
    const data = parseRealisasiTemplate(text);

    if (!data) {
      return ctx.reply(
        `❌ Format template tidak valid.\n\n` +
        `Pastikan minimal ada field:\n` +
        `• Tgl: YYYY-MM-DD\n` +
        `• Shift: 1/2/3\n` +
        `• Realisasi: (angka)\n\n` +
        `Ketik /help untuk melihat contoh.`
      );
    }

    // Validasi data
    const validation = validateRealisasiData(data);

    if (!validation.valid) {
      return ctx.reply(
        `❌ Data tidak valid:\n\n` +
        validation.errors.map(e => `• ${e}`).join('\n') +
        `\n\nPerbaiki dan kirim ulang.`
      );
    }

    // Validasi order jika diisi
    if (data.order) {
      await ctx.reply('🔍 Memvalidasi order...');
      
      try {
        const orderCheck = await api.validateOrder(data.order);
        if (!orderCheck.valid) {
          await ctx.reply(
            `⚠️ Order "${data.order}" tidak ditemukan di database.\n\n` +
            `Apakah Anda yakin ingin melanjutkan dengan order manual?\n\n` +
            `Ketik "lanjut" untuk tetap simpan, atau kirim template baru untuk koreksi.`
          );
          // Store data for confirmation
          inputStates.set(telegramId, { state: 'confirm_manual_order', pendingData: data });
          shouldClearState = false;
          return;
        }
      } catch (err) {
        console.error('[INPUT] Order validation error:', err);
      }
    }

    // Submit realisasi
    await submitRealisasi(ctx, data, status);

  } catch (error: any) {
    console.error('[INPUT_TEMPLATE] Error:', error);
    await ctx.reply(`❌ Gagal memproses template: ${error.message}`);
  } finally {
    if (shouldClearState) {
      inputStates.delete(telegramId);
    }
  }
}

async function submitRealisasi(ctx: Context, data: any, userStatus: any) {
  try {
    await ctx.reply('💾 Menyimpan data...');

    const payload = {
      telegram_id: String(ctx.from?.id),
      nama_karyawan: data.nama_karyawan || '',
      absensi: data.absensi || '',
      tgl: data.tgl,
      shift: data.shift,
      no_order_2: data.order || '',
      jenis_pekerjaan_2: data.pekerjaan || '',
      target: data.target || '',
      realisasi: data.realisasi,
      bahan_kertas: data.bahan || '',
      warna: data.warna || '',
      inscheet: data.inscheet || '',
      rijek: data.rijek || '',
      jml_plate: data.plate || '',
      jam: data.jam || '',
      kendala: data.kendala || '',
      keterangan: data.keterangan || ''
    };

    const result = await api.submitRealisasi(payload);

    if (result.success) {
      const summary = formatRealisasiSummary(result.data);
      await ctx.reply(summary);
    } else {
      throw new Error(result.error || 'Gagal menyimpan data');
    }

  } catch (error: any) {
    console.error('[SUBMIT] Error:', error);
    throw error;
  }
}

export { inputStates };
