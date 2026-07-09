import { Context, InlineKeyboard } from 'grammy';
import { api } from '../utils/api';
import { formatDate, formatNumber } from '../utils/formatter';

const PER_PAGE = 5;

// ponytail: inline state, one map to rule them all
const historyStates = new Map<number, { data: any[]; page?: number; editingId?: number; editing?: boolean; editPending?: Record<string, any>; searchType?: string; days?: number }>();

export async function handleHistory(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered) return ctx.reply('❌ Anda belum terdaftar. Gunakan /register');
    if (status.is_active !== 1) return ctx.reply('⏳ Akun Anda belum disetujui admin.');

    // Show filter options
    const keyboard = new InlineKeyboard()
      .text('7 hari', 'hist_filter:7').text('14 hari', 'hist_filter:14').row()
      .text('30 hari', 'hist_filter:30').text('60 hari', 'hist_filter:60');

    await ctx.reply(
      '📊 *Filter Riwayat Realisasi*\n\nPilih rentang waktu:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } catch (error: any) {
    console.error('[HISTORY] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

async function showHistoryList(ctx: Context, data: any[], page: number = 0, days: number = 7) {
  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pageData = data.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const globalStart = page * PER_PAGE;

  const lines = pageData.map((item, i) => {
    const statusIcon = item.deleted_at ? '🗑️' : item.updated_by && item.updated_by !== 'telegram-bot' ? '✏️' : '📄';
    const orderShort = item.nama_order ? (item.nama_order) : item.no_order || '-';
    return `${globalStart + i + 1}. ${statusIcon} ${item.nama_karyawan || '-'} | ${formatDate(item.tgl)} S${item.shift}\n   ${item.pekerjaan || '-'} — ${orderShort} = ${item.realisasi ? formatNumber(item.realisasi) : '-'}`;
  });

  const keyboard = new InlineKeyboard();
  for (let r = 0; r < pageData.length; r += 5) {
    const chunk = pageData.slice(r, r + 5);
    chunk.forEach((_, i) => {
      const localIdx = r + i;
      keyboard.text(String(globalStart + localIdx + 1), `hist_select:${globalStart + localIdx}`);
    });
    keyboard.row();
  }
  // Navigation
  if (totalPages > 1) {
    if (page > 0) keyboard.text('◀️', `hist_page:${page - 1}`);
    keyboard.text(`${page + 1}/${totalPages}`, 'hist_tutup');
    if (page < totalPages - 1) keyboard.text('▶️', `hist_page:${page + 1}`);
    keyboard.row();
  }
  keyboard.text('❌ Tutup', 'hist_tutup');

  await ctx.reply(
    `📊 *Riwayat Realisasi* (${days} hari)\n\n${lines.join('\n')}\n━━━━━━━━━━━━\nTap nomor untuk detail:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
}

async function showDetail(ctx: Context, item: any) {
  const percentage = item.target && item.realisasi
    ? Math.round((item.realisasi / item.target) * 100) : null;
  const statusBadge = item.deleted_at
    ? `🗑️ *DIHAPUS* ${item.deleted_by ? `oleh ${item.deleted_by}` : ''}`
    : item.updated_by && item.updated_by !== 'telegram-bot'
      ? `✏️ *Diedit* ${item.updated_by}` : '';

  const text = `
${statusBadge}
👤 *${item.nama_karyawan || '-'}*
📅 ${formatDate(item.tgl)} | Shift ${item.shift} | 🏭 ${item.bagian}
📦 ${item.no_order || '-'} ${item.nama_order ? `— ${item.nama_order}` : ''}
⚙️ ${item.pekerjaan || '-'}
🎯 Target: ${item.target ? formatNumber(item.target) : '-'}
✔️ Realisasi: ${item.realisasi ? formatNumber(item.realisasi) : '-'}${percentage ? ` (${percentage}%)` : ''}
${item.jam ? `⏰ Jam: ${item.jam}` : ''}
${item.kendala ? `⚠️ Kendala: ${item.kendala}` : ''}
${item.bahan_kertas ? `📄 Bahan: ${item.bahan_kertas}` : ''}
${item.warna ? `🎨 Warna: ${item.warna}` : ''}
  `.trim();

  const keyboard = new InlineKeyboard();
  if (!item.deleted_at) {
    keyboard.text('✏️ Edit', `hist_edit:${item.id}`);
    keyboard.text('🗑️ Hapus', `hist_hapus:${item.id}`);
    keyboard.row();
  }
  keyboard.text('🔙 Kembali', 'hist_back');

  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
}

export async function handleHistoryCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const data = ctx.callbackQuery?.data || '';
  const state = historyStates.get(telegramId);

  if (data.startsWith('hist_filter:')) {
    await ctx.answerCallbackQuery();
    const days = Number(data.split(':')[1]);
    try {
      await ctx.reply(`🔍 Mengambil riwayat ${days} hari terakhir...`);
      const result = await api.getAllHistory(50, days);
      if (!result.data.length) {
        return ctx.reply(`📊 Belum ada riwayat realisasi dalam ${days} hari terakhir.`);
      }
      historyStates.set(telegramId, { data: result.data, page: 0, days });
      await showHistoryList(ctx, result.data, 0, days);
    } catch (error: any) {
      console.error('[HISTORY] Error:', error);
      await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
    return;
  }

  if (data === 'hist_back') {
    await ctx.answerCallbackQuery();
    if (state) await showHistoryList(ctx, state.data, state.page || 0, state.days);
    return;
  }
  if (data === 'hist_tutup') {
    historyStates.delete(telegramId);
    await ctx.answerCallbackQuery();
    return ctx.reply('🔒 Riwayat ditutup. Ketik /history untuk melihat kembali.');
  }

  if (data.startsWith('hist_page:')) {
    if (!state) return ctx.answerCallbackQuery({ text: 'Sesi history sudah ditutup.' });
    await ctx.answerCallbackQuery();
    const page = Number(data.split(':')[1]);
    state.page = page;
    return showHistoryList(ctx, state.data, page, state.days);
  }

  if (data.startsWith('hist_select:')) {
    await ctx.answerCallbackQuery();
    const globalIdx = Number(data.split(':')[1]);
    const item = state?.data?.[globalIdx];
    if (!item) return ctx.reply('❌ Data tidak ditemukan.');
    return showDetail(ctx, item);
  }

  if (data.startsWith('hist_hapus:')) {
    await ctx.answerCallbackQuery();
    const id = Number(data.split(':')[1]);
    // Confirm
    const keyboard = new InlineKeyboard()
      .text('✅ Ya, hapus', `hist_hapus_confirm:${id}`).row()
      .text('❌ Batal', 'hist_back');
    return ctx.reply('⚠️ Yakin ingin menghapus data ini?', { reply_markup: keyboard });
  }

  if (data.startsWith('hist_hapus_confirm:')) {
    await ctx.answerCallbackQuery();
    const id = Number(data.split(':')[1]);
    try {
      const status = await api.checkStatus(String(telegramId));
      const deletedBy = status?.nama_karyawan || 'telegram-bot';
      await api.softDeleteHistory(id, deletedBy);
      await ctx.reply('✅ Data berhasil dihapus.');
      // Refresh state
      const result = await api.getAllHistory(50, state?.days || 7);
      historyStates.set(telegramId, { data: result.data, page: 0, days: state?.days || 7 });
      await showHistoryList(ctx, result.data, 0, state?.days || 7);
    } catch (err: any) {
      await ctx.reply(`❌ Gagal menghapus: ${err.message}`);
    }
    return;
  }

  if (data.startsWith('hist_edit_pilih:')) {
    await ctx.answerCallbackQuery();
    const parts = data.split(':');
    const type = parts[1]; // 'pekerjaan', 'order', or 'nama'
    const value = parts.slice(2).join(':');
    if (!state?.editPending || !state.editingId) return ctx.reply('❌ Sesi edit habis. Coba lagi.');
    if (type === 'pekerjaan') {
      state.editPending.jenis_pekerjaan_2 = value;
    } else if (type === 'order') {
      state.editPending.no_order_2 = value;
      const found = await api.cariOrder(value, 1);
      if (found.data.length > 0) state.editPending.nama_order_2 = found.data[0].nama_order;
    } else if (type === 'nama') {
      state.editPending.nama_karyawan = value;
    }
    const status = await api.checkStatus(String(telegramId));
    const saved = await validateEditAndSave(ctx, telegramId, state, state.editPending, status);
    if (saved) {
      state.editPending = undefined;
      state.editing = false;
      const result = await api.getAllHistory(50, state.days || 7);
      state.data = result.data;
      state.page = 0;
      await showHistoryList(ctx, result.data, 0, state.days || 7);
    }
    return;
  }

  if (data.startsWith('hist_edit_lanjut:')) {
    await ctx.answerCallbackQuery();
    const type = data.split(':')[1];
    if (!state?.editPending || !state.editingId) return ctx.reply('❌ Sesi edit habis. Coba lagi.');
    const updatedBy = 'telegram-bot';
    try {
      await api.updateRealisasiField(state.editingId, state.editPending, updatedBy);
      await ctx.reply('✅ Data berhasil diupdate.');
      state.editPending = undefined;
      state.editing = false;
      const result = await api.getAllHistory(50, state.days || 7);
      state.data = result.data;
      state.page = 0;
      await showHistoryList(ctx, result.data, 0, state.days || 7);
    } catch (err: any) {
      await ctx.reply(`❌ Gagal update: ${err.message}`);
    }
    return;
  }

  if (data.startsWith('hist_edit_cari:')) {
    await ctx.answerCallbackQuery();
    const type = data.split(':')[1];
    if (!state) return ctx.reply('❌ Sesi habis. Coba /history lagi.');
    state.searchType = type;
    return ctx.reply(`🔍 Ketik kata kunci ${type === 'pekerjaan' ? 'pekerjaan' : type === 'order' ? 'order' : 'nama'} yang dicari:`);
  }

  if (data.startsWith('hist_edit:')) {
    await ctx.answerCallbackQuery();
    const id = Number(data.split(':')[1]);
    const item = state?.data?.find((d: any) => d.id === id);
    if (!item) return ctx.reply('❌ Data tidak ditemukan.');
    // Simpan edit state
    historyStates.set(telegramId, { ...state!, editingId: id, editing: true });
    const template = [
      `Nama: ${item.nama_karyawan || ''}`,
      `Tgl: ${item.tgl || ''}`,
      `Shift: ${item.shift || ''}`,
      `Order: ${item.no_order || ''}`,
      `Pekerjaan: ${item.pekerjaan || ''}`,
      item.bahan_kertas ? `Bahan Kertas: ${item.bahan_kertas}` : 'Bahan Kertas:',
      item.jml_plate ? `Jml. Plate: ${item.jml_plate}` : 'Jml. Plate:',
      item.warna ? `Warna: ${item.warna}` : 'Warna:',
      item.inscheet ? `Insheet: ${item.inscheet}` : 'Insheet:',
      item.rijek ? `Rijek: ${item.rijek}` : 'Rijek:',
      `Jam Kerja: ${item.jam || ''}`,
      item.kendala ? `Kendala: ${item.kendala}` : 'Kendala:',
      item.keterangan ? `Keterangan: ${item.keterangan}` : 'Keterangan:',
      `Target: ${item.target || ''}`,
      `Realisasi: ${item.realisasi || ''}`,
    ].join('\n');
    return ctx.reply(
      `✏️ *Edit Data*\n\nSalin template di bawah, ubah field yang perlu, lalu kirim:\n` +
      `\`\`\`\n${template}\n\`\`\`\n\n` +
      `Atau kirim /batal untuk membatalkan.`,
      { parse_mode: 'Markdown' }
    );
  }
}

export async function handleHistoryText(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const text = ctx.message?.text || '';
  const state = historyStates.get(telegramId);
  if (!state || !state.editing) return;

  if (text === '/batal') {
    historyStates.delete(telegramId);
    return ctx.reply('❌ Dibatalkan.');
  }

  // Handle "cari lagi" search mode
  const searchType = state.searchType;
  if (searchType) {
    state.searchType = undefined;
    const keyword = text.trim();
    if (!keyword) return ctx.reply('❌ Ketik kata kunci yang dicari.');

    try {
      const status = await api.checkStatus(String(telegramId));
      let suggestions: any = { data: [] };

      if (searchType === 'pekerjaan') {
        const bagianCategory = status?.bagian;
        suggestions = await api.cariPekerjaan(keyword, bagianCategory, 10);
      } else if (searchType === 'order') {
        suggestions = await api.cariOrder(keyword, 10);
      } else if (searchType === 'nama') {
        suggestions = await api.findKaryawan(keyword, undefined, 10);
      }

      if (suggestions.data.length === 0) {
        return ctx.reply(`❌ Tidak ditemukan hasil untuk "${keyword}". Ketik kata kunci lain atau /batal.`);
      }

      const keyboard = new InlineKeyboard();
      for (const s of suggestions.data) {
        let label: string, value: string;
        if (searchType === 'pekerjaan') {
          label = `${s.name} — ${s.category}`;
          value = s.name;
          const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
          keyboard.text(truncatedLabel, `hist_edit_pilih:pekerjaan:${value}`).row();
        } else if (searchType === 'order') {
          label = s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd;
          value = s.no_sopd;
          keyboard.text(label.length > 50 ? label.slice(0, 49) + '…' : label, `hist_edit_pilih:order:${value}`).row();
        } else if (searchType === 'nama') {
          label = s.absensi ? `${s.nama_karyawan} [${s.absensi}] (${s.posisi})` : s.nama_karyawan;
          value = s.nama_karyawan;
          const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
          keyboard.text(truncatedLabel, `hist_edit_pilih:nama:${value}`).row();
        }
      }
      return ctx.reply('Pilih yang benar:', { reply_markup: keyboard });
    } catch (err: any) {
      return ctx.reply(`❌ Gagal mencari: ${err.message}`);
    }
  }

  const parsed = parseEditTemplate(text);
  if (Object.keys(parsed).length === 0) {
    return ctx.reply('❌ Tidak ada field yang dikenali. Contoh: `Realisasi: 100`', { parse_mode: 'Markdown' });
  }

  try {
    const status = await api.checkStatus(String(telegramId));
    const saved = await validateEditAndSave(ctx, telegramId, state!, parsed, status);
    if (saved) {
      historyStates.delete(telegramId);
      const result = await api.getAllHistory(50, state?.days || 7);
      historyStates.set(telegramId, { data: result.data, page: 0, days: state?.days || 7 });
      await showHistoryList(ctx, result.data, 0, state?.days || 7);
    }
  } catch (err: any) {
    await ctx.reply(`❌ Gagal update: ${err.message}`);
  }
}

async function validateEditAndSave(
  ctx: Context, telegramId: number, state: NonNullable<ReturnType<typeof historyStates.get>>,
  data: any, status: any
): Promise<boolean> {
  // Validasi pekerjaan
  if (data.jenis_pekerjaan_2) {
    const bagianCategory = status?.bagian;
    const found = await api.validatePekerjaan(data.jenis_pekerjaan_2, bagianCategory);
    if (!found.valid) {
      const suggestions = await api.cariPekerjaan(data.jenis_pekerjaan_2, bagianCategory, 15);
      if (suggestions.data.length > 0) {
        const keyboard = new InlineKeyboard();
        for (const s of suggestions.data) {
          keyboard.text(`${s.name} — ${s.category}`, `hist_edit_pilih:pekerjaan:${s.name}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'hist_edit_cari:pekerjaan');
        state.editPending = data;
        await ctx.reply(
          `❌ Pekerjaan *"${data.jenis_pekerjaan_2}"* tidak ditemukan.\n\nPilih yang benar:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return false;
      }
      await ctx.reply(
        `❌ Pekerjaan *"${data.jenis_pekerjaan_2}"* tidak ditemukan.\nKetik nama pekerjaan yang dicari:`,
        { parse_mode: 'Markdown' }
      );
      state.editPending = data;
      state.searchType = 'pekerjaan';
      return false;
    }
  }

  // Validasi order
  if (data.no_order_2) {
    const orderCheck = await api.validateOrder(data.no_order_2);
    if (orderCheck.valid) {
      data.nama_order_2 = orderCheck.nama_order;
    } else {
      let suggestions = await api.cariOrder(data.no_order_2, 20);
      if (suggestions.data.length === 0) {
        const parts = data.no_order_2.split('.');
        if (parts.length > 2) {
          const broader = parts.slice(0, -1).join('.');
          suggestions = await api.cariOrder(broader, 20);
        }
      }
      if (suggestions.data.length > 0) {
        const keyboard = new InlineKeyboard();
        for (const s of suggestions.data) {
          const label = s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd;
          keyboard.text(label.length > 50 ? label.slice(0, 49) + '…' : label, `hist_edit_pilih:order:${s.no_sopd}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'hist_edit_cari:order');
        keyboard.text('✍️ Lanjut manual', 'hist_edit_pilih:order:');
        state.editPending = data;
        await ctx.reply(
          `❌ Order *"${data.no_order_2}"* tidak ditemukan.\n\nPilih order, cari lagi, atau lanjut manual:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
      } else {
        const keyboard = new InlineKeyboard()
          .text('✍️ Lanjut manual', 'hist_edit_pilih:order:').row()
          .text('🔍 Cari Lagi', 'hist_edit_cari:order');
        state.editPending = data;
        await ctx.reply(
          `❌ Order *"${data.no_order_2}"* tidak ditemukan.\n\nCari lagi atau lanjut manual:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        state.searchType = 'order';
      }
      return false;
    }
  }

  // Validasi nama
  if (data.nama_karyawan) {
    const valid = await api.validateKaryawan(data.nama_karyawan);
    if (!valid.valid) {
      const suggestions = await api.findKaryawan(data.nama_karyawan, undefined, 10);
      if (suggestions.data.length > 0) {
        const keyboard = new InlineKeyboard();
        for (const s of suggestions.data) {
          const label = s.absensi ? `${s.nama_karyawan} [${s.absensi}] (${s.posisi})` : s.nama_karyawan;
          const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
          keyboard.text(truncatedLabel, `hist_edit_pilih:nama:${s.nama_karyawan}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'hist_edit_cari:nama');
        state.editPending = data;
        await ctx.reply(
          `❌ Nama *"${data.nama_karyawan}"* tidak ditemukan.\n\nPilih yang benar:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return false;
      }
      await ctx.reply(
        `❌ Nama *"${data.nama_karyawan}"* tidak ditemukan.\nKetik nama karyawan yang dicari:`,
        { parse_mode: 'Markdown' }
      );
      state.editPending = data;
      state.searchType = 'nama';
      return false;
    }
    data.nama_karyawan = valid.nama_karyawan;
    if (valid.posisi) data.posisi = valid.posisi;
    if (valid.absensi) data.absensi = valid.absensi;
  }

  // All valid → save
  const updatedBy = status?.nama_karyawan || 'telegram-bot';
  if (!state.editingId) {
    historyStates.delete(telegramId);
    await ctx.reply('❌ Data edit tidak ditemukan. Mulai ulang dengan /history');
    return false;
  }
  await api.updateRealisasiField(state.editingId, data, updatedBy);
  await ctx.reply('✅ Data berhasil diupdate.');
  return true;
}

function parseEditTemplate(text: string) {
  const fields: Record<string, string> = {};
  const patterns: [RegExp, string][] = [
    [/^realisasi:[ \t]*(.+)$/im, 'realisasi'],
    [/^target:[ \t]*(.+)$/im, 'target'],
    [/^jam:[ \t]*(.+)$/im, 'jam'],
    [/^kendala:[ \t]*(.+)$/im, 'kendala'],
    [/^bahan(?:[ \t]+kertas)?:[ \t]*(.+)$/im, 'bahan_kertas'],
    [/^warna:[ \t]*(.+)$/im, 'warna'],
    [/^inscheet:[ \t]*(.+)$/im, 'inscheet'],
    [/^rijek:[ \t]*(.+)$/im, 'rijek'],
    [/^plate:[ \t]*(.+)$/im, 'jml_plate'],
    [/^keterangan:[ \t]*(.+)$/im, 'keterangan'],
    [/^pekerjaan:[ \t]*(.+)$/im, 'jenis_pekerjaan_2'],
    [/^order:[ \t]*(.+)$/im, 'no_order_2'],
    [/^nama:[ \t]*(.+)$/im, 'nama_karyawan'],
  ];
  for (const [regex, key] of patterns) {
    const m = text.match(regex);
    if (m) fields[key] = m[1].trim();
  }
  return fields;
}

export { historyStates };
