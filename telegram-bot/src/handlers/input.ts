import { Context, InlineKeyboard } from 'grammy';
import { api } from '../utils/api';
import { parseRealisasiTemplate, validateRealisasiData } from '../utils/parser';
import { formatRealisasiSummary } from '../utils/formatter';

type ParsedRealisasiData = ReturnType<typeof parseRealisasiTemplate>;
type CorrectionStep = 'nama' | 'order' | 'pekerjaan' | 'cari_order' | 'cari_nama' | 'cari_pekerjaan';

type InputState = {
  state: 'waiting_template' | CorrectionStep;
  pendingData?: ParsedRealisasiData;
  corrections?: Partial<ParsedRealisasiData>;
};

const inputStates = new Map<number, InputState>();

const SHIFT_JAM: Record<string, string> = {
  '1': '07:00-15:00',
  '2': '15:00-23:00',
  '3': '23:00-07:00'
};

// ─── Main ────────────────────────────────────────────────────────

export async function handleInputCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered) return ctx.reply('❌ Anda belum terdaftar.\n\nGunakan /register untuk registrasi terlebih dahulu.');
    if (status.is_active !== 1) return ctx.reply('⏳ Akun Anda belum disetujui admin.\n\nTunggu persetujuan terlebih dahulu.');

    inputStates.set(telegramId, { state: 'waiting_template' });

    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();
    const monthRoman = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()+1];
    await ctx.reply(
      `📝 Kirim template realisasi Anda:\n\n` +
      `Contoh:\n` +
      `\`\`\`\n` +
      `Nama: Budi\n` +
      `Tgl: ${today}\n` +
      `Shift: 1\n` +
      `Order: OP.001.SOPd.${monthRoman}.${year}\n` +
      `Pekerjaan: Print\n` +
      `Bahan Kertas:\n` +
      `Jml. Plate:\n` +
      `Warna:\n` +
      `Insheet:\n` +
      `Rijek:\n` +
      `Jam Kerja:\n` +
      `Kendala:\n` +
      `Keterangan:\n` +
      `Target: 100\n` +
      `Realisasi: 95\n` +
      `\`\`\`\n\n` +
      `📋 *Field wajib:* Nama, Tgl, Shift, Order, Pekerjaan, Target, Realisasi\n\n` +
      `💡 *Tips:*\n` +
      `• Jam Kerja kosong? Otomatis sesuai Shift: 1→07:00–15:00, 2→15:00–23:00, 3→23:00–07:00\n` +
      `• Nama bisa nama lengkap atau sebagian (contoh: \`budi\`)\n\n` +
      `Ketik /help untuk panduan lengkap.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[INPUT_CMD] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

// ─── Template Handler ────────────────────────────────────────────

export async function handleInputTemplate(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text;
  if (!telegramId || !text) return;

  const userState = inputStates.get(telegramId);
  const normalizedText = text.trim().toLowerCase();
  const isTemplate = text.includes('Tgl:') && text.includes('Shift:');
  if (!userState && !isTemplate) return;

  // Handle "lanjut" for manual order
  if (userState?.state === 'order' && normalizedText === 'lanjut') {
    try {
      const status = await api.checkStatus(String(telegramId));
      if (!status.registered || status.is_active !== 1) {
        inputStates.delete(telegramId);
        return ctx.reply('❌ Anda belum terdaftar atau belum disetujui. Gunakan /register');
      }
      const data = { ...userState.pendingData, ...userState.corrections } as any;
      if (!data.tgl) {
        inputStates.delete(telegramId);
        return ctx.reply('❌ Data template tidak ditemukan. Kirim ulang dengan /input.');
      }
      await submitRealisasi(ctx, data, status);
      inputStates.delete(telegramId);
    } catch (error: any) {
      console.error('[INPUT_LANJUT] Error:', error);
      inputStates.delete(telegramId);
      return ctx.reply(`❌ Gagal memproses: ${error.message}`);
    }
    return;
  }

  // In correction step but not a template → tell user
  if (userState && ['nama', 'pekerjaan', 'order'].includes(userState.state) && !isTemplate && normalizedText !== 'lanjut') {
    return ctx.reply('Tap pilihan di atas, atau kirim template baru dengan /input.');
  }

  // Restart if new template sent while in correction
  if (userState && isTemplate) {
    inputStates.set(telegramId, { state: 'waiting_template' });
  }

  let shouldClearState = true;

  // Handle search states — user typed a keyword
  const searchStates: Record<string, { apiFn: (q: string, l: number, opts?: any) => Promise<any>; prefix: string; parentState: CorrectionStep; labelField: string; labelExtra?: string }> = {
    cari_order: { apiFn: (q, l) => api.cariOrder(q, l), prefix: 'input_order', parentState: 'order', labelField: 'no_sopd', labelExtra: 'nama_order' },
    cari_nama: { apiFn: (q, l) => api.findKaryawan(q, undefined, l), prefix: 'input_nama', parentState: 'nama', labelField: 'nama_karyawan', labelExtra: 'absensi' },
    cari_pekerjaan: { apiFn: (q, l, opts) => api.cariPekerjaan(q, opts?.bagian, l), prefix: 'input_pekerjaan', parentState: 'pekerjaan', labelField: 'name', labelExtra: 'category' },
  };

  const searchCfg = searchStates[userState?.state as string];
  if (searchCfg) {
    shouldClearState = false;
    inputStates.delete(telegramId);
    try {
      const status = await api.checkStatus(String(telegramId));
      const results = await searchCfg.apiFn(text, 5, { bagian: status?.bagian });
      if (results.data.length > 0) {
        const keyboard = new InlineKeyboard();
        for (const r of results.data) {
          const primary = r[searchCfg.labelField] || '';
          const extra = searchCfg.labelExtra ? (r[searchCfg.labelExtra] ? ` — ${r[searchCfg.labelExtra]}` : '') : '';
          const rawLabel = primary + extra;
          keyboard.text(rawLabel.length > 50 ? rawLabel.slice(0, 49) + '…' : rawLabel, `${searchCfg.prefix}:${primary}`).row();
        }
        keyboard.text('Cari Lagi', `${searchCfg.prefix}:search_again`);
        keyboard.text('Batal', `${searchCfg.prefix}:lanjut`);
        await ctx.reply(`🔍 Ditemukan ${results.data.length}. Pilih, atau cari lagi:`, { reply_markup: keyboard });
        inputStates.set(telegramId, { state: searchCfg.parentState, pendingData: userState!.pendingData, corrections: userState!.corrections });
      } else {
        await ctx.reply('Tidak ditemukan. Coba kata kunci lain, atau kirim template baru.');
        inputStates.set(telegramId, { state: searchCfg.parentState, pendingData: userState!.pendingData, corrections: userState!.corrections });
      }
    } catch (err) {
      console.error(`[${searchCfg.prefix.toUpperCase()}_SEARCH] Error:`, err);
      await ctx.reply('Gagal mencari. Kirim template baru.');
    }
    return;
  }

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered || status.is_active !== 1) {
      return ctx.reply('❌ Anda belum terdaftar atau belum disetujui. Gunakan /register');
    }

    const data = parseRealisasiTemplate(text);
    if (!data) {
      return ctx.reply(
        `❌ Format template tidak valid.\n\n` +
        `*Field wajib:*\n` +
        `• Tgl: YYYY-MM-DD\n` +
        `• Shift: 1/2/3\n` +
        `• Nama: atau Absensi:\n` +
        `• Order:\n` +
        `• Pekerjaan:\n` +
        `• Target: (angka)\n` +
        `• Realisasi: (angka)\n\n` +
        `Ketik /help untuk contoh.`,
        { parse_mode: 'Markdown' }
      );
    }

    const validation = validateRealisasiData(data);
    if (!validation.valid) {
      return ctx.reply(
        `❌ Data tidak valid:\n\n` +
        validation.errors.map(e => `• ${e}`).join('\n') +
        `\n\nPerbaiki dan kirim ulang.`,
        { parse_mode: 'Markdown' }
      );
    }

    // Run validation chain: nama → order → pekerjaan → submit
    const flowResult = await runCorrectionFlow(ctx, telegramId, data, {}, status);
    if (flowResult === 'continue') shouldClearState = false;

  } catch (error: any) {
    console.error('[INPUT_TEMPLATE] Error:', error);
    await ctx.reply(`❌ Gagal memproses template: ${error.message}`);
  } finally {
    if (shouldClearState) inputStates.delete(telegramId);
  }
}

// ─── Correction Flow ─────────────────────────────────────────────

type CorrectionResult = 'continue' | 'submitted';

async function runCorrectionFlow(
  ctx: Context, telegramId: number,
  data: ParsedRealisasiData, corrections: Partial<ParsedRealisasiData>,
  status: any
): Promise<CorrectionResult> {
  const merged = { ...data, ...corrections } as any;

  // 1. Validate nama / absensi
  const namaCheck = await validateNama(merged, ctx, telegramId, data, corrections);
  if (namaCheck === 'waiting') return 'continue';

  // 2. Validate order
  const orderCheck = await validateOrder(merged, ctx, telegramId, data, corrections, status);
  if (orderCheck === 'waiting') return 'continue';

  // 3. Validate pekerjaan
  const pekerjaanCheck = await validatePekerjaan(merged, ctx, telegramId, data, corrections, status);
  if (pekerjaanCheck === 'waiting') return 'continue';

  // All valid → submit
  inputStates.delete(telegramId);
  await submitRealisasi(ctx, merged, status);
  return 'submitted';
}

// ─── Nama Validation ─────────────────────────────────────────────

async function validateNama(
  merged: any, ctx: Context, telegramId: number,
  data: ParsedRealisasiData, corrections: Partial<ParsedRealisasiData>
): Promise<'ok' | 'waiting'> {
    if (merged.nama_karyawan) {
    const emp = await api.validateKaryawan(merged.nama_karyawan);
    if (emp.valid) {
      merged.nama_karyawan = emp.nama_karyawan;
      return 'ok';
    }
    const suggestions = await api.findKaryawan(merged.nama_karyawan, undefined, 15);
    if (suggestions.data.length > 0) {
      const keyboard = new InlineKeyboard();
      for (const s of suggestions.data) {
        const label = `${s.nama_karyawan} [${s.absensi}] (${s.posisi})`;
        const truncatedLabel = label.length > 50 ? label.slice(0, 49) + '…' : label;
        keyboard.text(truncatedLabel, `input_nama:${s.nama_karyawan}`).row();
      }
      keyboard.text('Cari Lagi', 'input_nama:search_again');
      await ctx.reply(
        `❌ Nama *"${merged.nama_karyawan}"* tidak ditemukan.\n\nPilih nama yang benar:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      inputStates.set(telegramId, { state: 'nama', pendingData: data, corrections });
      return 'waiting';
    }
    await ctx.reply(
      `❌ Nama *"${merged.nama_karyawan}"* tidak ditemukan.\nKetik nama karyawan yang dicari:`,
      { parse_mode: 'Markdown' }
    );
    inputStates.set(telegramId, { state: 'cari_nama', pendingData: data, corrections });
    return 'waiting';
  }

  if (merged.absensi) {
    const emp = await api.validateAbsensi(merged.absensi);
    if (emp.valid) return 'ok';
    const suggestions = await api.findKaryawan(merged.absensi, undefined, 15);
    if (suggestions.data.length > 0) {
      const keyboard = new InlineKeyboard();
      for (const s of suggestions.data) {
        keyboard.text(`${s.nama_karyawan} [${s.absensi}] (${s.posisi})`, `input_nama:${s.nama_karyawan}`).row();
      }
      keyboard.text('Cari Lagi', 'input_nama:search_again');
      await ctx.reply(
        `❌ Absensi *"${merged.absensi}"* tidak ditemukan.\n\nPilih nama yang benar:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      inputStates.set(telegramId, { state: 'nama', pendingData: data, corrections });
      return 'waiting';
    }
    await ctx.reply(
      `❌ Absensi *"${merged.absensi}"* tidak ditemukan.`,
      { parse_mode: 'Markdown' }
    );
    return 'ok';
  }

  return 'ok';
}

// ─── Order Validation ────────────────────────────────────────────

async function validateOrder(
  merged: any, ctx: Context, telegramId: number,
  data: ParsedRealisasiData, corrections: Partial<ParsedRealisasiData>,
  status: any
): Promise<'ok' | 'waiting'> {
  // ponytail: skip validasi kalau manual order (prefix MANUAL:)
  if (!merged.order || merged.order === '-' || merged.order.startsWith('MANUAL:')) {
    if (merged.order?.startsWith('MANUAL:')) {
      merged.order = merged.order.replace('MANUAL:', ''); // strip prefix
    }
    return 'ok';
  }

  const orderCheck = await api.validateOrder(merged.order);
  if (orderCheck.valid) {
    merged.nama_order = orderCheck.nama_order;
    return 'ok';
  }

  let suggestions = await api.cariOrder(merged.order, 5);
  // ponytail: if no results, try broader search by stripping last segment
  if (suggestions.data.length === 0) {
    const parts = merged.order.split('.');
    if (parts.length > 2) {
      const broader = parts.slice(0, -1).join('.');
      suggestions = await api.cariOrder(broader, 5);
    }
  }
  if (suggestions.data.length > 0) {
    const keyboard = new InlineKeyboard();
    for (const s of suggestions.data) {
      const label = `${s.no_sopd}${s.nama_order ? ` — ${s.nama_order}` : ''}`;
      keyboard.text(label.length > 50 ? label.slice(0, 49) + '…' : label, `input_order:${s.no_sopd}`).row();
    }
    keyboard.text('Cari Lagi', 'input_order:search_again');
    keyboard.text('Lanjut manual', 'input_order:manual');
    await ctx.reply(
      `❌ Order *"${merged.order}"* tidak ditemukan.\n\nPilih order yang benar:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
    inputStates.set(telegramId, { state: 'order', pendingData: data, corrections });
    return 'waiting';
  }

  const keyboard = new InlineKeyboard();
  keyboard.text('Cari Lagi', 'input_order:search_again');
  keyboard.text('Lanjut manual', 'input_order:manual');
  await ctx.reply(
    `❌ Order *"${merged.order}"* tidak ditemukan.\nCari ulang atau lanjut manual:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
  inputStates.set(telegramId, { state: 'cari_order', pendingData: data, corrections });
  return 'waiting';
}

// ─── Pekerjaan Validation ────────────────────────────────────────

async function validatePekerjaan(
  merged: any, ctx: Context, telegramId: number,
  data: ParsedRealisasiData, corrections: Partial<ParsedRealisasiData>,
  status: any
): Promise<'ok' | 'waiting'> {
  if (!merged.pekerjaan) return 'ok';

  const bagianCategory = status.bagian;
  const found = await api.validatePekerjaan(merged.pekerjaan, bagianCategory);
  if (found.valid) {
    merged.pekerjaan_nama = found.name;
    return 'ok';
  }

  // ponytail: suggestions broader, tampilkan nama + kategori biar jelas
  const suggestions = await api.cariPekerjaan(merged.pekerjaan, bagianCategory, 15);
  if (suggestions.data.length > 0) {
    const keyboard = new InlineKeyboard();
    for (const s of suggestions.data) {
      keyboard.text(`${s.name} — ${s.category}`, `input_pekerjaan:${s.name}`).row();
    }
    keyboard.text('Cari Lagi', 'input_pekerjaan:search_again');
    await ctx.reply(
      `❌ Pekerjaan *"${merged.pekerjaan}"* tidak ditemukan.\n\nPilih atau cari lagi:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
    inputStates.set(telegramId, { state: 'pekerjaan', pendingData: data, corrections });
    return 'waiting';
  }

  const keyboard = new InlineKeyboard();
  keyboard.text('Cari Pekerjaan', 'input_pekerjaan:search');
  await ctx.reply(
    `❌ Pekerjaan *"${merged.pekerjaan}"* tidak ditemukan.\nKetik nama pekerjaan yang dicari:`,
    { parse_mode: 'Markdown' }
  );
  inputStates.set(telegramId, { state: 'cari_pekerjaan', pendingData: data, corrections });
  return 'waiting';
}

// ─── Callback Handler ────────────────────────────────────────────

export async function handleInputCorrectionCallback(ctx: Context) {
  if (!ctx.callbackQuery?.data || !ctx.from?.id) return;
  const telegramId = ctx.from.id;
  const data = ctx.callbackQuery.data;

  await ctx.answerCallbackQuery();

  const userState = inputStates.get(telegramId);
  if (!userState || !userState.pendingData) {
    await ctx.reply('❌ Sesi input sudah kedaluwarsa. Kirim template baru dengan /input.');
    return;
  }

  try {
    const status = await api.checkStatus(String(telegramId));
    if (!status.registered || status.is_active !== 1) {
      inputStates.delete(telegramId);
      return;
    }

    const corrections = { ...(userState.corrections || {}) };

    const searchable = [
      { prefix: 'input_nama', state: 'cari_nama' as CorrectionStep, prompt: '🔍 Ketik nama karyawan yang dicari:' },
      { prefix: 'input_order', state: 'cari_order' as CorrectionStep, prompt: '🔍 Ketik kata kunci order (no. SOPd atau nama order):' },
      { prefix: 'input_pekerjaan', state: 'cari_pekerjaan' as CorrectionStep, prompt: '🔍 Ketik nama pekerjaan yang dicari:' },
    ];

    for (const s of searchable) {
      if (data.startsWith(s.prefix + ':')) {
        const value = data.replace(s.prefix + ':', '');
        if (value === 'lanjut') {
          await submitRealisasi(ctx, { ...userState.pendingData, ...corrections }, status);
          inputStates.delete(telegramId);
          return;
        }
        if (value === 'search' || value === 'search_again') {
          inputStates.set(telegramId, { state: s.state, pendingData: userState.pendingData, corrections });
          await ctx.reply(s.prompt);
          return;
        }
        if (value === 'manual') {
          // ponytail: manual order, prefix MANUAL: untuk skip validasi
          corrections.order = 'MANUAL:' + (userState.pendingData.order || '');
        } else if (s.prefix === 'input_nama') {
          corrections.nama_karyawan = value;
          corrections.absensi = '';
        } else if (s.prefix === 'input_order') {
          corrections.order = value;
        } else if (s.prefix === 'input_pekerjaan') {
          corrections.pekerjaan = value;
        }
        break;
      }
    }
    // If no prefix matched, return
    if (!searchable.some(s => data.startsWith(s.prefix + ':'))) return;

    // Continue chain
    await runCorrectionFlow(ctx, telegramId, userState.pendingData, corrections, status);

  } catch (error: any) {
    console.error('[INPUT_CALLBACK] Error:', error);
    await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
}

// ─── Submit ──────────────────────────────────────────────────────

async function submitRealisasi(ctx: Context, data: any, userStatus: any) {
  // ponytail: check apakah order valid di DB atau manual
  const isManualOrder = data.order && data.order !== '-' ? !(await api.validateOrder(data.order)).valid : false;
  
  const payload = {
    telegram_id: String(ctx.from?.id),
    nama_karyawan: data.nama_karyawan || '',
    absensi: data.absensi || '',
    tgl: data.tgl,
    shift: data.shift,
    no_order_2: isManualOrder ? '' : (data.order && data.order !== '-' ? data.order : ''),
    nama_order_manual_2: isManualOrder ? data.order : '',
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
    await ctx.reply(formatRealisasiSummary(result.data), { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`❌ Gagal menyimpan: ${result.error}`);
  }
}

export { inputStates };
