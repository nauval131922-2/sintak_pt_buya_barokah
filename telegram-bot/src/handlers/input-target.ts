import { Context, InlineKeyboard } from 'grammy';
import { api } from '../utils/api';

const BAGIAN = process.env.BAGIAN || 'SETTING';
const PER_PAGE = 5;

// ponytail: in-memory state
type TargetState = {
  state: 'browse' | 'select_date' | 'search_keyword' | 'waiting_template';
  targets?: any[];
  filteredTargets?: any[];
  page?: number;
  tgl?: string;
  filterKeyword?: string;
  selectedTarget?: any;
  status?: any;
  editPending?: Record<string, any>;
  searchType?: string;
  actionType?: 'edit' | 'tambah';
};

const targetStates = new Map<number, TargetState>();

function matchTarget(t: any, keyword: string): boolean {
  const keywords = keyword.toLowerCase().split(/\s+/).filter(k => k);
  const searchable = [
    t.nama_karyawan || '',
    t.jenis_pekerjaan || '',
    t.nama_order || '',
    t.no_order || ''
  ].join(' ').toLowerCase();
  return keywords.every(kw => searchable.includes(kw));
}

// ─── Command: /input_realisasi_by_target ─────────────────────────

export async function handleInputTargetCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered || status.is_active !== 1) {
      return ctx.reply('❌ Anda belum terdaftar atau belum disetujui. Gunakan /register');
    }

    const today = new Date().toISOString().split('T')[0];
    const bagian = status.bagian || BAGIAN;
    const result = await api.searchTargets(bagian, today, undefined, 50);

    if (!result.data.length) {
      targetStates.set(telegramId, { state: 'select_date', status, tgl: today });
      const keyboard = new InlineKeyboard()
        .text('📅 Cari Tanggal Lain', 'it_ganti_tgl')
        .row()
        .text('❌ Batal', 'it_batal');
      return ctx.reply(
        `📋 Tidak ada target untuk hari ini (${today}) di bagian ${bagian}.\n\n` +
        `Gunakan /input untuk membuat realisasi standalone baru.`,
        { reply_markup: keyboard }
      );
    }

    targetStates.set(telegramId, { state: 'browse', targets: result.data, filteredTargets: result.data, page: 0, tgl: today, status });
    await showTargetList(ctx, result.data, result.data, today, 0);
  } catch (err: any) {
    console.error('[INPUT_TARGET] Error:', err);
    await ctx.reply(`❌ Gagal memuat target: ${err.message}`);
  }
}

async function showTargetList(ctx: Context, allTargets: any[], visibleTargets: any[], tgl: string, page: number) {
  const totalPages = Math.ceil(visibleTargets.length / PER_PAGE);
  if (page >= totalPages) page = totalPages - 1;
  if (page < 0) page = 0;
  const pageData = visibleTargets.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const keyboard = new InlineKeyboard();
  for (const t of pageData) {
    const sudahRealisasi = (t.no_order_2 && t.jenis_pekerjaan_2) || t.realisasi ? '✅ ' : '';
    const orderLabel = t.nama_order || '';
    const raw = `${sudahRealisasi}S${t.shift} | ${t.nama_karyawan} | ${t.jenis_pekerjaan || '-'}${orderLabel ? ' — ' + orderLabel : ''}`;
    keyboard.text(raw.length > 50 ? raw.slice(0, 49) + '…' : raw, `it_select:${t.id}`).row();
  }

  // Navigation
  if (totalPages > 1) {
    if (page > 0) keyboard.text('◀️', `it_page:${page - 1}`);
    keyboard.text(`${page + 1}/${totalPages}`, 'it_noop');
    if (page < totalPages - 1) keyboard.text('▶️', `it_page:${page + 1}`);
    keyboard.row();
  }
  keyboard.text('🔍 Cari', 'it_cari');
  keyboard.text('📅 Ganti Tanggal', 'it_ganti_tgl');
  keyboard.row();
  keyboard.text('❌ Batal', 'it_batal');

  const filterLabel = visibleTargets.length !== allTargets.length
    ? ` (filter: "${visibleTargets.length}/${allTargets.length}")` : '';
  await ctx.reply(
    `📋 *Target ${tgl}* — ${visibleTargets.length} data${filterLabel}:\n_(✅ = sudah ada realisasi)_`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
}

// ─── Callback handler ────────────────────────────────────────────

export async function handleInputTargetCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery?.data || '';
  const state = targetStates.get(telegramId);

  if (data === 'it_noop') return;

  if (data === 'it_batal') {
    targetStates.delete(telegramId);
    return ctx.reply('❌ Dibatalkan.');
  }

  if (data.startsWith('it_page:')) {
    if (!state?.filteredTargets) return;
    const page = Number(data.split(':')[1]);
    state.page = page;
    return showTargetList(ctx, state.targets || [], state.filteredTargets, state.tgl || '', page);
  }

  if (data === 'it_cari') {
    targetStates.set(telegramId, { ...state, state: 'search_keyword' });
    return ctx.reply(
      '🔍 Ketik nama karyawan, pekerjaan, atau order yang dicari:',
      { reply_markup: { force_reply: true } }
    );
  }

  if (data === 'it_reset_filter') {
    if (!state?.targets) return;
    state.filteredTargets = state.targets;
    state.page = 0;
    state.filterKeyword = undefined;
    return showTargetList(ctx, state.targets, state.filteredTargets, state.tgl || '', 0);
  }

  if (data === 'it_ganti_tgl') {
    targetStates.set(telegramId, { ...state, state: 'select_date', status: state?.status });
    return ctx.reply(
      '📅 Kirim tanggal yang ingin dicari (format: YYYY-MM-DD):',
      { reply_markup: { force_reply: true } }
    );
  }

  if (data.startsWith('it_select:')) {
    const id = Number(data.split(':')[1]);
    const target = await api.getTargetById(id);
    if (!target) {
      return ctx.reply('❌ Target tidak ditemukan. Mungkin sudah dihapus.');
    }
    const sudahRealisasi = (target.no_order_2 && target.jenis_pekerjaan_2) || target.realisasi;
    if (sudahRealisasi) {
      targetStates.set(telegramId, { ...state!, selectedTarget: target });
      const keyboard = new InlineKeyboard()
        .text('✏️ Edit data', `it_a:edit`)
        .text('➕ Tambah baru', `it_a:tambah`).row()
        .text('❌ Batal', 'it_batal');
      return ctx.reply(
        `Target sudah ada realisasi.\n\nApa yang ingin dilakukan?`,
        { reply_markup: keyboard }
      );
    }
    targetStates.set(telegramId, { ...state!, state: 'waiting_template', selectedTarget: target });
    return showTargetTemplate(ctx, target);
  }

  // Action after selecting target dengan realisasi
  if (data.startsWith('it_a:')) {
    const action = data.split(':')[1];
    const target = state?.selectedTarget;
    if (!target) return ctx.reply('❌ Sesi habis. Mulai ulang.');
    state.state = 'waiting_template';
    state.actionType = action === 'edit' ? 'edit' : 'tambah';
    targetStates.set(telegramId, state!);
    return showTargetTemplate(ctx, target);
  }

  // Correction callbacks (nama/order/pekerjaan)
  if (data.startsWith('it_pilih:')) {
    const parts = data.split(':');
    const type = parts[1];
    const value = parts.slice(2).join(':');
    if (!state?.editPending || !state.selectedTarget) return ctx.reply('❌ Sesi edit habis. Mulai ulang.');
    if (type === 'pekerjaan') state.editPending.jenis_pekerjaan_2 = value;
    else if (type === 'order') {
      if (value) {
        state.editPending.no_order_2 = value;
        const found = await api.cariOrder(value, 1);
        if (found.data.length > 0) state.editPending.nama_order_2 = found.data[0].nama_order;
      } else {
        // ponytail: "Lanjut manual" → clear no_order_2 (skip validasi), preserve nama_order_2 (order manual)
        const manualOrderName = state.editPending.no_order_2; // "Stock Design" dari template
        state.editPending.no_order_2 = '';
        state.editPending.nama_order_2 = manualOrderName;
      }
    }
    else if (type === 'nama') state.editPending.nama_karyawan = value;

    const saved = await validateAndSubmit(ctx, telegramId, state);
    if (saved) {
      state.editPending = undefined;
    }
    return;
  }

  if (data.startsWith('it_cari_lagi:')) {
    const type = data.split(':')[1];
    if (!state) return ctx.reply('❌ Sesi habis. Mulai ulang.');
    state.searchType = type;
    return ctx.reply(`🔍 Ketik kata kunci ${type === 'pekerjaan' ? 'pekerjaan' : type === 'order' ? 'order' : 'nama'} yang dicari:`);
  }

  if (data === 'it_tambah_ya') {
    const target = state?.selectedTarget;
    if (!target) return ctx.reply('❌ Data target hilang. Mulai ulang dengan /input_realisasi_by_target');
    // Clear per-submission fields supaya template mulai fresh
    state.selectedTarget = { ...target, realisasi: '', jam: '', kendala: '', keterangan: '' };
    state.actionType = 'tambah';
    targetStates.set(telegramId, { ...state!, state: 'waiting_template' });
    return showTargetTemplate(ctx, state.selectedTarget);
  }

  if (data === 'it_tambah_tidak') {
    targetStates.delete(telegramId);
    await ctx.answerCallbackQuery();
    return ctx.reply('✅ Selesai. Terima kasih!\n\nGunakan /input_realisasi_by_target untuk input target lain, atau /history untuk lihat riwayat.');
  }
}

async function showTargetTemplate(ctx: Context, target: any) {
  const sudah = (target.no_order_2 && target.jenis_pekerjaan_2) || target.realisasi ? `\n⚠️ _Sudah ada realisasi: ${target.realisasi || target.no_order_2}_` : '';
  const orderInfo = target.nama_order ? `\n📦 ${target.no_order || ''} — ${target.nama_order}` : (target.no_order ? `\n📦 ${target.no_order}` : '');
  const template = [
    `Nama: ${target.nama_karyawan || ''}`,
    `Tgl: ${target.tgl || ''}`,
    `Shift: ${target.shift || ''}`,
    `Order: ${target.no_order || target.nama_order || ''}`,
    `Pekerjaan: ${target.jenis_pekerjaan || ''}`,
    `Bahan Kertas: ${target.bahan_kertas || ''}`,
    `Jml. Plate: ${target.jml_plate || ''}`,
    `Warna: ${target.warna || ''}`,
    `Insheet: ${target.inscheet || ''}`,
    `Rijek: ${target.rijek || ''}`,
    `Jam Kerja: ${target.jam || ''}`,
    `Kendala: ${target.kendala || ''}`,
    `Keterangan: ${target.keterangan || ''}`,
    `Target: ${target.target || ''}`,
    `Realisasi: ${target.realisasi || ''}`,
  ].join('\n');

  await ctx.reply(
    `📌 *Target dipilih:*${sudah}${orderInfo}\n\n` +
    `Salin template di bawah, ubah field yang perlu, lalu kirim:\n` +
    `\`\`\`\n${template}\n\`\`\`\n\n` +
    `Atau kirim /batal untuk membatalkan.`,
    { parse_mode: 'Markdown' }
  );
}

// ─── Text handler ─────────────────────────────────────────────────

export async function handleInputTargetText(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || '';
  const state = targetStates.get(telegramId);
  if (!state) return;

  // Cancel
  if (text === '/batal') {
    targetStates.delete(telegramId);
    return ctx.reply('❌ Dibatalkan.');
  }

  // Search keyword
  if (state.state === 'search_keyword') {
    const keyword = text.trim();
    if (!keyword) return ctx.reply('❌ Ketik kata kunci yang dicari.');

    state.filteredTargets = state.targets?.filter(t => matchTarget(t, keyword)) || [];
    state.page = 0;
    state.filterKeyword = keyword;
    state.state = 'browse';

    if (state.filteredTargets.length === 0) {
      return ctx.reply(`❌ Tidak ditemukan target yang cocok dengan "${keyword}".`);
    }

    return showTargetList(ctx, state.targets || [], state.filteredTargets, state.tgl || '', 0);
  }

  // Date input
  if (state.state === 'select_date') {
    const tgl = text.trim();
    // Validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      return ctx.reply('❌ Format tanggal salah. Gunakan format YYYY-MM-DD (contoh: 2026-06-29)');
    }

    try {
      const status = await api.checkStatus(String(telegramId));
      const result = await api.searchTargets(status.bagian || BAGIAN, tgl, undefined, 50);

      if (result.data.length === 0) {
        const keyboard = new InlineKeyboard()
          .text('📅 Cari Tanggal Lain', 'it_ganti_tgl').row()
          .text('❌ Batal', 'it_batal');
        return ctx.reply(`📭 Tidak ada target untuk tanggal ${tgl}.`, { reply_markup: keyboard });
      }

      targetStates.set(telegramId, {
        state: 'browse',
        targets: result.data,
        filteredTargets: result.data,
        page: 0,
        tgl,
        status
      });

      return showTargetList(ctx, result.data, result.data, tgl, 0);
    } catch (error: any) {
      console.error('[INPUT_TARGET_DATE] Error:', error);
      return ctx.reply(`❌ Gagal memuat target: ${error.message}`);
    }
  }

  // Correction search mode
  if (state.searchType && state.state === 'waiting_template') {
    const searchType = state.searchType;
    const keyword = text.trim();
    if (!keyword) return ctx.reply('❌ Ketik kata kunci yang dicari.');

    try {
      let suggestions: any = { data: [] };
      if (searchType === 'pekerjaan') {
        const bagianCategory = state.status?.bagian || BAGIAN;
        suggestions = await api.cariPekerjaan(keyword, bagianCategory, 10);
      } else if (searchType === 'order') {
        suggestions = await api.cariOrder(keyword, 10);
      } else if (searchType === 'nama') {
        suggestions = await api.findKaryawan(keyword, undefined, 10);
      }

      if (suggestions.data.length === 0) {
        // Jangan clear searchType — biar input berikutnya masih diarahkan ke search
        return ctx.reply(`❌ Tidak ditemukan hasil untuk "${keyword}". Ketik kata kunci lain.`);
      }

      state.searchType = undefined; // hanya clear setelah suggestions ditampilkan
      const keyboard = new InlineKeyboard();
      for (const s of suggestions.data) {
        let label: string, value: string;
        if (searchType === 'pekerjaan') {
          label = `${s.name} — ${s.category}`; value = s.name;
        } else if (searchType === 'order') {
          label = s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd;
          value = s.no_sopd;
        } else {
          label = s.absensi ? `${s.nama_karyawan} [${s.absensi}] (${s.posisi})` : s.nama_karyawan;
          value = s.nama_karyawan;
        }
        keyboard.text(label.length > 50 ? label.slice(0, 49) + '…' : label, `it_pilih:${searchType}:${value}`).row();
      }
      return ctx.reply('Pilih yang benar:', { reply_markup: keyboard });
    } catch (err: any) {
      return ctx.reply(`❌ Gagal mencari: ${err.message}`);
    }
  }

  // Template input
  if (state.state === 'waiting_template') {
    const parsed = parseTargetTemplate(text);
    if (Object.keys(parsed).length === 0) {
      return ctx.reply('❌ Tidak ada field yang dikenali. Salin template yang dikirim bot, ubah field yang perlu, lalu kirim.');
    }

    state.editPending = { ...state.selectedTarget, ...parsed };

    const saved = await validateAndSubmit(ctx, telegramId, state);
    if (saved) {
      state.editPending = undefined;
    }
    return;
  }

  // Fallback: user di state browse atau lainnya kirim text random
  if (state.state === 'browse') {
    return ctx.reply('ℹ️ Gunakan tombol di atas untuk navigasi, atau /batal untuk keluar.');
  }
}

// ─── Validation & Submit ─────────────────────────────────────────

async function validateAndSubmit(ctx: Context, telegramId: number, state: TargetState): Promise<boolean> {
  const data = state.editPending!;
  const target = state.selectedTarget!;
  const updatedBy = state.status?.nama_karyawan || 'telegram-bot';

  // Validasi nama
  if (data.nama_karyawan) {
    const valid = await api.validateKaryawan(data.nama_karyawan);
    if (!valid.valid) {
      const suggestions = await api.findKaryawan(data.nama_karyawan, undefined, 10);
      const keyboard = new InlineKeyboard();
      if (suggestions.data.length > 0) {
        for (const s of suggestions.data) {
          const label = s.absensi ? `${s.nama_karyawan} [${s.absensi}] (${s.posisi})` : s.nama_karyawan;
          const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
          keyboard.text(truncatedLabel, `it_pilih:nama:${s.nama_karyawan}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'it_cari_lagi:nama');
      }
      state.searchType = 'nama';
      state.state = 'waiting_template';
      await ctx.reply(
        `❌ Nama *"${data.nama_karyawan}"* tidak ditemukan.\n\n` +
        (suggestions.data.length > 0 ? 'Pilih yang benar:' : 'Ketik nama karyawan yang dicari:'),
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return false;
    }
    data.nama_karyawan = valid.nama_karyawan;
    if (valid.posisi) data.posisi = valid.posisi;
    if (valid.absensi) data.absensi = valid.absensi;
  }

  // Validasi order
  if (data.no_order_2) {
    const orderCheck = await api.validateOrder(data.no_order_2);
    if (!orderCheck.valid) {
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
          keyboard.text(label.length > 50 ? label.slice(0, 49) + '…' : label, `it_pilih:order:${s.no_sopd}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'it_cari_lagi:order');
        keyboard.text('✍️ Lanjut manual', 'it_pilih:order:');
        state.searchType = 'order';
        state.state = 'waiting_template';
        await ctx.reply(
          `❌ Order *"${data.no_order_2}"* tidak ditemukan.\n\nPilih order, cari lagi, atau lanjut manual:`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return false;
      }
      const keyboard = new InlineKeyboard()
        .text('✍️ Lanjut manual', 'it_pilih:order:').row()
        .text('🔍 Cari Lagi', 'it_cari_lagi:order');
      state.searchType = 'order';
      state.state = 'waiting_template';
      await ctx.reply(
        `❌ Order *"${data.no_order_2}"* tidak ditemukan.\n\nKetik kata kunci atau lanjut manual:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return false;
    }
    data.nama_order_2 = orderCheck.nama_order;
  }

  // Validasi pekerjaan
  if (data.jenis_pekerjaan_2) {
    const bagianCategory = state.status?.bagian || BAGIAN;
    const found = await api.validatePekerjaan(data.jenis_pekerjaan_2, bagianCategory);
    if (!found.valid) {
      const suggestions = await api.cariPekerjaan(data.jenis_pekerjaan_2, bagianCategory, 15);
      const keyboard = new InlineKeyboard();
      if (suggestions.data.length > 0) {
        for (const s of suggestions.data) {
          keyboard.text(`${s.name} — ${s.category}`, `it_pilih:pekerjaan:${s.name}`).row();
        }
        keyboard.text('🔍 Cari Lagi', 'it_cari_lagi:pekerjaan');
        state.searchType = 'pekerjaan';
        state.state = 'waiting_template';
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
      state.searchType = 'pekerjaan';
      state.state = 'waiting_template';
      return false;
    }
    data.jenis_pekerjaan_2 = found.name;
  }

  // Submit
  const insertNew = state.actionType === 'tambah';
  try {
    const payload = {
      no_order_2: data.no_order_2 || '',
      nama_order_2: data.nama_order_2 || '',
      jenis_pekerjaan_2: data.jenis_pekerjaan_2 || '',
      target: data.target || target.target || '',
      realisasi: data.realisasi || '',
      jam: data.jam || '',
      kendala: data.kendala || '',
      bahan_kertas: data.bahan_kertas || '',
      warna: data.warna || '',
      inscheet: data.inscheet || '',
      rijek: data.rijek || '',
      jml_plate: data.jml_plate || '',
      keterangan: data.keterangan || '',
    };

    if (!insertNew) {
      await api.updateTargetRealisasi(target.id, payload, updatedBy);
    } else {
      await api.insertAdditionalRealisasi(target, payload, updatedBy);
    }

    // Update selectedTarget supaya "tambah realisasi lain" pakai data terakhir
    state.selectedTarget = {
      ...target,
      nama_karyawan: data.nama_karyawan || target.nama_karyawan,
      no_order: data.no_order_2 || target.no_order,
      nama_order: data.nama_order_2 || target.nama_order,
      jenis_pekerjaan: data.jenis_pekerjaan_2 || target.jenis_pekerjaan,
      posisi: data.posisi || target.posisi,
      absensi: data.absensi || target.absensi,
      realisasi: data.realisasi || target.realisasi,
      bahan_kertas: data.bahan_kertas || target.bahan_kertas,
      warna: data.warna || target.warna,
      inscheet: data.inscheet || target.inscheet,
      rijek: data.rijek || target.rijek,
      jml_plate: data.jml_plate || target.jml_plate,
    };
    // Clear searchType setelah submit berhasil
    state.searchType = undefined;

    const tglFormatted = (() => {
      const d = new Date(data.tgl || target.tgl || new Date().toISOString().split('T')[0]);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    })();
    const bagian = state.status?.bagian || BAGIAN;
    const targetVal = data.target || target.target || '-';
    const realVal = data.realisasi || '-';
    let pctStr = '';
    const tNum = Number(targetVal), rNum = Number(realVal);
    if (tNum > 0 && !isNaN(rNum)) pctStr = ` (${Math.round((rNum / tNum) * 100)}%)`;

    const lines = [
      `✅ *Data realisasi berhasil disimpan!*`,
      ``,
      `📊 *Ringkasan:*`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 Nama      : ${data.nama_karyawan || target.nama_karyawan || '-'}`,
      `📅 Tanggal   : ${tglFormatted}`,
      `⏰ Shift     : ${target.shift || '-'}`,
      `🏭 Bagian    : ${bagian}`,
      `📦 Order     : ${data.no_order_2 || target.no_order || '-'}`,
      `⚙️ Pekerjaan : ${data.jenis_pekerjaan_2 || target.jenis_pekerjaan || '-'}`,
      `🎯 Target    : ${targetVal}`,
      `✔️ Realisasi : ${realVal}${pctStr}`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `Gunakan /history untuk melihat riwayat.`,
    ].join('\n');

    const keyboard = new InlineKeyboard()
      .text('➕ Ya, tambah realisasi lain', 'it_tambah_ya').row()
      .text('✅ Tidak, selesai', 'it_tambah_tidak');

    await ctx.reply(lines, { parse_mode: 'Markdown', reply_markup: keyboard });
    return true;
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menyimpan: ${err.message}`);
    return false;
  }
}

// ─── Parser ──────────────────────────────────────────────────────

function parseTargetTemplate(text: string) {
  const fields: Record<string, string> = {};
  const patterns: [RegExp, string][] = [
    [/^realisasi:[ \t]*(.+)$/im, 'realisasi'],
    [/^jam(?:[ \t]+kerja)?:[ \t]*(.+)$/im, 'jam'],
    [/^kendala:[ \t]*(.+)$/im, 'kendala'],
    [/^bahan(?:[ \t]+kertas)?:[ \t]*(.+)$/im, 'bahan_kertas'],
    [/^warna:[ \t]*(.+)$/im, 'warna'],
    [/^ins(?:che|h)eet:[ \t]*(.+)$/im, 'inscheet'],
    [/^rijek:[ \t]*(.+)$/im, 'rijek'],
    [/^(?:jml[.\s]+)?plate:[ \t]*(.+)$/im, 'jml_plate'],
    [/^keterangan:[ \t]*(.+)$/im, 'keterangan'],
    [/^pekerjaan:[ \t]*(.+)$/im, 'jenis_pekerjaan_2'],
    [/^order:[ \t]*(.+)$/im, 'no_order_2'],
    [/^nama:[ \t]*(.+)$/im, 'nama_karyawan'],
    [/^target:[ \t]*(.+)$/im, 'target'],
  ];
  for (const [regex, key] of patterns) {
    const m = text.match(regex);
    if (m) fields[key] = m[1].trim();
  }
  return fields;
}

export { targetStates };
