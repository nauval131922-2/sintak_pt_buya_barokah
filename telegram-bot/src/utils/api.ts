import db from '../db';

const cleanNumberOrText = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  if (/^[0-9]+(\.[0-9]+)*$/.test(str)) {
    return Number(str.replace(/\./g, ''));
  }
  return str;
};

const SHIFT_JAM: Record<string, string> = {
  '1': '07:00-15:00',
  '2': '15:00-23:00',
  '3': '23:00-07:00'
};

export const api = {
  async validateKaryawan(nama: string) {
    const result = await db.execute({
      sql: `SELECT name, position, employee_no, department 
            FROM employees WHERE LOWER(name) = LOWER(?) AND is_active = 1 LIMIT 1`,
      args: [nama]
    });
    if (result.rows.length === 0) return { valid: false, message: 'Nama karyawan tidak ditemukan atau tidak aktif' };
    const e = result.rows[0] as any;
    return { valid: true, nama_karyawan: e.name, posisi: e.position, absensi: e.employee_no, department: e.department };
  },

  async findKaryawan(query: string, bagian?: string, limit: number = 10) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return { success: true, data: [] };

    const whereParts = ['is_active = 1', '(name LIKE ? OR employee_no LIKE ?)'];
    const args: any[] = [`%${trimmed}%`, `%${trimmed}%`];

    if (bagian) {
      whereParts.push('UPPER(department) = ?');
      args.push(String(bagian).trim().toUpperCase());
    }

    const result = await db.execute({
      sql: `SELECT name, position, employee_no, department
            FROM employees
            WHERE ${whereParts.join(' AND ')}
            ORDER BY CASE WHEN employee_no = ? THEN 0 WHEN name = ? THEN 1 ELSE 2 END, name ASC
            LIMIT ?`,
      args: [...args, trimmed, trimmed, limit]
    });

    return {
      success: true,
      data: result.rows.map((row: any) => ({
        nama_karyawan: row.name,
        posisi: row.position,
        absensi: row.employee_no,
        department: row.department,
      }))
    };
  },

  async registerRequest(data: { telegram_id: string; telegram_username?: string; nama_karyawan: string; bagian: string }) {
    const { telegram_id, telegram_username, nama_karyawan, bagian } = data;
    if (!telegram_id || !nama_karyawan || !bagian) {
      return { error: 'Field wajib: telegram_id, nama_karyawan, bagian' };
    }
    const emp = await db.execute({
      sql: `SELECT name, position, employee_no FROM employees WHERE name = ? AND is_active = 1 LIMIT 1`,
      args: [nama_karyawan]
    });
    if (emp.rows.length === 0) return { error: 'Nama karyawan tidak ditemukan di database' };
    const employee = emp.rows[0] as any;

    const existing = await db.execute({
      sql: `SELECT id, is_active FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [telegram_id]
    });
    if (existing.rows.length > 0) {
      const row = existing.rows[0] as any;
      if (row.is_active === 1) return { error: 'Telegram ID Anda sudah terdaftar dan aktif.' };
      return { error: 'Permintaan registrasi Anda sedang menunggu persetujuan admin.' };
    }

    await db.execute({
      sql: `INSERT INTO telegram_users (telegram_id, telegram_username, nama_karyawan, posisi, absensi, bagian, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 0)`,
      args: [telegram_id, telegram_username || null, employee.name, employee.position, employee.employee_no, bagian]
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES ('INSERT', 'telegram_users', 0, ?, ?, 'telegram-bot')`,
      args: [
        `Request registrasi Telegram Bot dari ${employee.name} (@${telegram_username || telegram_id})`,
        JSON.stringify(data)
      ]
    });

    // Trigger push notification via webhook (fire and forget)
    try {
      const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000';
      console.log('[WEBHOOK] Triggering push notification...');
      console.log('[WEBHOOK] URL:', `${webhookUrl}/api/telegram/register-webhook`);
      console.log('[WEBHOOK] Data:', { nama_karyawan: employee.name, bagian });
      
      fetch(`${webhookUrl}/api/telegram/register-webhook`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nama_karyawan: employee.name, bagian })
      }).then(async res => {
        console.log('[WEBHOOK] Response status:', res.status);
        const text = await res.text();
        console.log('[WEBHOOK] Response text:', text);
        try {
          const data = JSON.parse(text);
          console.log('[WEBHOOK] Response data:', data);
        } catch (e) {
          console.error('[WEBHOOK] Failed to parse JSON. First 200 chars:', text.substring(0, 200));
        }
      }).catch(err => {
        console.error('[WEBHOOK] Fetch error:', err.message);
      });
    } catch (err: any) {
      console.error('[WEBHOOK] Failed to trigger push notification:', err.message);
    }

    return { success: true, status: 'pending', message: 'Permintaan registrasi telah dikirim ke admin. Tunggu persetujuan.' };
  },

  async checkStatus(telegram_id: string) {
    const result = await db.execute({
      sql: `SELECT telegram_id, telegram_username, nama_karyawan, posisi, absensi, bagian, is_active
            FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [telegram_id]
    });
    if (result.rows.length === 0) return { registered: false, is_active: 0, message: 'User belum terdaftar' };
    const u = result.rows[0] as any;
    return { registered: true, is_active: u.is_active, nama_karyawan: u.nama_karyawan, posisi: u.posisi, absensi: u.absensi, bagian: u.bagian, telegram_username: u.telegram_username };
  },

  async validateAbsensi(absensi: string) {
    const result = await db.execute({
      sql: `SELECT name, position, employee_no FROM employees WHERE employee_no = ? AND is_active = 1 LIMIT 1`,
      args: [absensi]
    });
    if (result.rows.length === 0) return { valid: false, message: 'Absensi tidak ditemukan atau tidak aktif' };
    const e = result.rows[0] as any;
    return { valid: true, nama_karyawan: e.name, posisi: e.position, absensi: e.employee_no };
  },

  async validateOrder(no_order: string) {
    const result = await db.execute({
      sql: `SELECT no_sopd, nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
      args: [no_order]
    });
    if (result.rows.length === 0) return { valid: false, message: 'Order tidak ditemukan di database' };
    const o = result.rows[0] as any;
    return { valid: true, no_order: o.no_sopd, nama_order: o.nama_order };
  },

  async cariOrder(query: string, limit: number = 10) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return { success: true, data: [] };
    const result = await db.execute({
      sql: `SELECT no_sopd, nama_order FROM sopd
            WHERE no_sopd LIKE ? OR nama_order LIKE ?
            ORDER BY no_sopd DESC LIMIT ?`,
      args: [`%${trimmed}%`, `%${trimmed}%`, limit]
    });
    return { success: true, data: result.rows.map(r => r as any) };
  },

  async validatePekerjaan(name: string, category?: string) {
    const where = category ? 'LOWER(name) = LOWER(?) AND UPPER(category) = UPPER(?)' : 'LOWER(name) = LOWER(?)';
    const args: any[] = category ? [name, category] : [name];
    const result = await db.execute({
      sql: `SELECT name, category FROM master_pekerjaan_jurnal_produksi WHERE ${where} LIMIT 1`,
      args
    });
    if (result.rows.length === 0) return { valid: false };
    const r = result.rows[0] as any;
    return { valid: true, name: r.name, category: r.category };
  },

  async cariPekerjaan(query: string, category?: string, limit: number = 10) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return { success: true, data: [] };
    const where = category
      ? 'name LIKE ? AND UPPER(category) = UPPER(?)'
      : 'name LIKE ?';
    const args: any[] = category ? [`%${trimmed}%`, category] : [`%${trimmed}%`];
    const result = await db.execute({
      sql: `SELECT name, category FROM master_pekerjaan_jurnal_produksi
            WHERE ${where}
            ORDER BY name ASC LIMIT ?`,
      args: [...args, limit]
    });
    return { success: true, data: result.rows.map((r: any) => ({ name: r.name, category: r.category })) };
  },

  async submitRealisasi(data: any) {
    const { telegram_id, tgl, shift, no_order_2, jenis_pekerjaan_2, realisasi, nama_karyawan, absensi } = data;
    if (!telegram_id || !tgl || !shift || !realisasi) return { error: 'Field wajib: telegram_id, tgl, shift, realisasi' };

    const userCheck = await db.execute({
      sql: `SELECT id, nama_karyawan, posisi, absensi, bagian, is_active FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [telegram_id]
    });
    if (userCheck.rows.length === 0) return { error: 'User tidak terdaftar. Silakan registrasi terlebih dahulu.' };
    const user = userCheck.rows[0] as any;
    if (user.is_active !== 1) return { error: 'Akun Anda belum disetujui admin. Tunggu persetujuan terlebih dahulu.' };

    let targetEmployee = user;
    const requestedAbsensi = String(absensi || '').trim();
    const requestedNama = String(nama_karyawan || '').trim();
    if (requestedNama || (requestedAbsensi && requestedNama !== user.nama_karyawan)) {
      let employee: any = null;

      if (requestedNama) {
        const byName = await db.execute({
          sql: `SELECT name, position, employee_no, department FROM employees WHERE name = ? AND is_active = 1 LIMIT 1`,
          args: [requestedNama]
        });
        if (byName.rows.length === 0) {
          return { error: `Nama karyawan "${requestedNama}" tidak ditemukan atau tidak aktif.` };
        }
        employee = byName.rows[0] as any;
      }

      if (!employee && requestedAbsensi) {
        const byAbsensi = await db.execute({
          sql: `SELECT name, position, employee_no, department FROM employees WHERE employee_no = ? AND is_active = 1 LIMIT 1`,
          args: [requestedAbsensi]
        });
        if (byAbsensi.rows.length === 0) {
          return { error: `Absensi "${requestedAbsensi}" tidak ditemukan atau tidak aktif.` };
        }
        employee = byAbsensi.rows[0] as any;
      }

      if (!employee) {
        return { error: 'Karyawan target tidak ditemukan.' };
      }

      targetEmployee = {
        ...user,
        nama_karyawan: employee.name,
        posisi: employee.position,
        absensi: employee.employee_no,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(tgl + 'T00:00:00+07:00');
    const diffDays = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return { error: 'Tanggal terlalu jauh di masa lalu. Maksimal 7 hari ke belakang.' };
    if (diffDays < 0) return { error: 'Tanggal tidak boleh di masa depan.' };

    const defaultJam = SHIFT_JAM[String(shift)] || '';
    const cleanTarget = cleanNumberOrText(data.target);
    const cleanRealisasi = cleanNumberOrText(realisasi);
    const cleanInscheet = cleanNumberOrText(data.inscheet);
    const cleanRijek = cleanNumberOrText(data.rijek);
    const cleanJmlPlate = cleanNumberOrText(data.jml_plate);

    let namaOrder2 = data.nama_order_2 || '';
    if (no_order_2 && !namaOrder2) {
      const orderCheck = await db.execute({
        sql: `SELECT nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
        args: [no_order_2]
      });
      if (orderCheck.rows.length > 0) namaOrder2 = (orderCheck.rows[0] as any).nama_order || '';
    }
    if (!namaOrder2) namaOrder2 = data.nama_order_manual_2 || '';

    await db.execute({
      sql: `INSERT INTO jurnal_harian_produksi (
        posisi, absensi, tgl, shift, nama_karyawan, bagian,
        no_order, nama_order, jenis_pekerjaan, target,
        no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi,
        bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala,
        keterangan, nama_order_manual_2, is_manual_input, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        targetEmployee.posisi || '', targetEmployee.absensi || '', tgl, String(shift), targetEmployee.nama_karyawan, user.bagian,
        no_order_2 || '', namaOrder2, jenis_pekerjaan_2 || '', cleanTarget,
        no_order_2 || '', namaOrder2, jenis_pekerjaan_2 || '', cleanRealisasi,
        data.bahan_kertas || '', cleanJmlPlate, data.warna || '', cleanInscheet, cleanRijek,
        data.jam || defaultJam, data.kendala || '', data.keterangan || '', data.nama_order_manual_2 || null,
        'telegram-bot'
      ]
    });

    const lastId = await db.execute({ sql: `SELECT last_insert_rowid() as id`, args: [] });
    const newId = Number((lastId.rows[0] as any)?.id || 0);

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES ('INSERT', 'jurnal_harian_produksi', ?, ?, ?, ?)`,
      args: [
        newId,
        `Input realisasi via Telegram Bot oleh ${user.nama_karyawan}${targetEmployee.nama_karyawan !== user.nama_karyawan ? ` untuk ${targetEmployee.nama_karyawan}` : ''}`,
        JSON.stringify({ telegram_id, input_by: user.nama_karyawan, nama_karyawan: targetEmployee.nama_karyawan, tgl, shift, bagian: user.bagian, no_order: no_order_2, nama_order: namaOrder2, pekerjaan: jenis_pekerjaan_2, realisasi: cleanRealisasi }),
        `telegram-bot-${user.bagian.toLowerCase()}`
      ]
    });

    return {
      success: true, id: newId,
      data: {
        nama_karyawan: targetEmployee.nama_karyawan, tgl, shift, bagian: user.bagian,
        no_order: no_order_2, nama_order: namaOrder2, pekerjaan: jenis_pekerjaan_2,
        target: cleanTarget, realisasi: cleanRealisasi,
        input_by: user.nama_karyawan
      }
    };
  },

  async getHistory(telegram_id: string, limit: number = 10) {
    const userCheck = await db.execute({
      sql: `SELECT nama_karyawan FROM telegram_users WHERE telegram_id = ? AND is_active = 1 LIMIT 1`,
      args: [telegram_id]
    });
    if (userCheck.rows.length === 0) return { error: 'User tidak ditemukan atau belum disetujui' };
    const user = userCheck.rows[0] as any;

    const result = await db.execute({
      sql: `SELECT id, tgl, shift, bagian, nama_karyawan, no_order_2, nama_order_2, jenis_pekerjaan_2,
                   target, realisasi, bahan_kertas, warna, inscheet, rijek, jam, kendala,
                   created_at, updated_at, updated_by, deleted_at, deleted_by
            FROM jurnal_harian_produksi
            WHERE nama_karyawan = ?
              AND created_by LIKE 'telegram-bot%'
              AND tgl >= date('now', '-7 days')
            ORDER BY tgl DESC, id DESC
            LIMIT ?`,
      args: [user.nama_karyawan, limit]
    });

    const data = result.rows.map((row: any) => ({
      id: row.id, tgl: row.tgl, shift: row.shift, bagian: row.bagian, nama_karyawan: row.nama_karyawan,
      no_order: row.no_order_2, nama_order: row.nama_order_2, pekerjaan: row.jenis_pekerjaan_2,
      target: row.target, realisasi: row.realisasi, bahan_kertas: row.bahan_kertas,
      warna: row.warna, inscheet: row.inscheet, rijek: row.rijek, jam: row.jam, kendala: row.kendala,
      created_at: row.created_at, updated_at: row.updated_at, updated_by: row.updated_by,
      deleted_at: row.deleted_at, deleted_by: row.deleted_by
    }));

    return { success: true, nama_karyawan: user.nama_karyawan, data };
  },

  // Search JHP target rows (belum ada realisasi) by bagian + optional date
  async searchTargets(bagian: string, tgl?: string, namaKaryawan?: string, limit: number = 10) {
    const whereParts = ['deleted_at IS NULL', 'UPPER(bagian) = UPPER(?)'];
    const args: any[] = [bagian];

    if (tgl) { whereParts.push('tgl = ?'); args.push(tgl); }
    if (namaKaryawan) { whereParts.push('nama_karyawan LIKE ?'); args.push(`%${namaKaryawan}%`); }

    const result = await db.execute({
      sql: `SELECT id, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, target, realisasi,
                   no_order_2, jenis_pekerjaan_2
            FROM jurnal_harian_produksi
            WHERE ${whereParts.join(' AND ')}
            ORDER BY tgl DESC, shift ASC, nama_karyawan ASC
            LIMIT ?`,
      args: [...args, limit]
    });
    return { success: true, data: result.rows.map((r: any) => ({ ...r })) };
  },

  async getTargetById(id: number) {
    const result = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      args: [id]
    });
    if (result.rows.length === 0) return null;
    return result.rows[0] as any;
  },

  // UPDATE realisasi ke target existing
  async updateTargetRealisasi(id: number, data: any, updatedBy: string) {
    const { no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi, jam, kendala,
            bahan_kertas, warna, inscheet, rijek, jml_plate, keterangan, target } = data;

    const cleanNumber = (v: any) => {
      if (!v && v !== 0) return null;
      const str = String(v).trim();
      return /^[0-9]+(\.[0-9]+)*$/.test(str) ? Number(str.replace(/\./g, '')) : str;
    };

    // Sync target columns dari realisasi
    const orderCheck = no_order_2 ? await db.execute({
      sql: `SELECT nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`, args: [no_order_2]
    }) : null;
    const resolvedNamaOrder = orderCheck?.rows?.[0] ? (orderCheck.rows[0] as any).nama_order : (nama_order_2 || '');

    // ponytail: hanya update nama_order kalau ada no_order_2, preserve manual input
    const shouldUpdateNamaOrder = no_order_2 ? resolvedNamaOrder : null;
    // ponytail: target hanya update kalau ada nilainya, preserve existing kalau kosong
    const cleanTarget = cleanNumber(target);
    await db.execute({
      sql: `UPDATE jurnal_harian_produksi SET
              no_order_2 = ?, nama_order_2 = ?, jenis_pekerjaan_2 = ?,
              realisasi = ?, jam = ?, kendala = ?,
              bahan_kertas = ?, warna = ?, inscheet = ?, rijek = ?, jml_plate = ?,
              keterangan = ?,
              no_order = ?, 
              nama_order = COALESCE(?, nama_order), 
              jenis_pekerjaan = ?,
              target = COALESCE(?, target),
              updated_at = datetime('now'), updated_by = ?
            WHERE id = ?`,
      args: [
        no_order_2 || '', resolvedNamaOrder, jenis_pekerjaan_2 || '',
        cleanNumber(realisasi), jam || '', kendala || '',
        bahan_kertas || '', warna || '', cleanNumber(inscheet), cleanNumber(rijek), cleanNumber(jml_plate),
        keterangan || '',
        no_order_2 || '', shouldUpdateNamaOrder, jenis_pekerjaan_2 || '',
        cleanTarget,
        updatedBy, id
      ]
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES ('UPDATE', 'jurnal_harian_produksi', ?, ?, ?, ?)`,
      args: [id, `Update realisasi via Telegram Bot oleh ${updatedBy}`,
             JSON.stringify({ id, realisasi, no_order_2, pekerjaan: jenis_pekerjaan_2 }),
             `telegram-bot`]
    });

    return { success: true };
  },

  // INSERT baris realisasi tambahan (multi-realisasi) mengacu ke target existing
  async insertAdditionalRealisasi(targetRow: any, data: any, inputBy: string) {
    const { no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi, jam, kendala,
            bahan_kertas, warna, inscheet, rijek, jml_plate, keterangan, target } = data;

    const cleanNumber = (v: any) => {
      if (!v && v !== 0) return null;
      const str = String(v).trim();
      return /^[0-9]+(\.[0-9]+)*$/.test(str) ? Number(str.replace(/\./g, '')) : str;
    };

    const orderCheck = no_order_2 ? await db.execute({
      sql: `SELECT nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`, args: [no_order_2]
    }) : null;
    const resolvedNamaOrder = orderCheck?.rows?.[0] ? (orderCheck.rows[0] as any).nama_order : (nama_order_2 || '');

    // ponytail: target dari payload kalau ada, fallback ke target row asli
    const resolvedTarget = target !== undefined && target !== null && target !== ''
      ? cleanNumber(target)
      : (targetRow.target ?? cleanNumber(realisasi));

    await db.execute({
      sql: `INSERT INTO jurnal_harian_produksi (
              posisi, absensi, tgl, shift, nama_karyawan, bagian,
              no_order, nama_order, jenis_pekerjaan, target,
              no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi,
              bahan_kertas, warna, inscheet, rijek, jml_plate, jam, kendala,
              keterangan, is_manual_input, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        targetRow.posisi || '', targetRow.absensi || '', targetRow.tgl, targetRow.shift,
        targetRow.nama_karyawan, targetRow.bagian,
        no_order_2 || targetRow.no_order || '',
        resolvedNamaOrder || targetRow.nama_order || '',
        jenis_pekerjaan_2 || targetRow.jenis_pekerjaan || '',
        resolvedTarget,
        no_order_2 || '', resolvedNamaOrder, jenis_pekerjaan_2 || '',
        cleanNumber(realisasi),
        bahan_kertas || '', warna || '', cleanNumber(inscheet), cleanNumber(rijek), cleanNumber(jml_plate),
        jam || '', kendala || '', keterangan || '',
        `telegram-bot`
      ]
    });

    const lastId = await db.execute({ sql: `SELECT last_insert_rowid() as id`, args: [] });
    const newId = Number((lastId.rows[0] as any)?.id || 0);

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES ('INSERT', 'jurnal_harian_produksi', ?, ?, ?, ?)`,
      args: [newId, `Tambah realisasi via Telegram Bot oleh ${inputBy} (multi-realisasi dari target #${targetRow.id})`,
             JSON.stringify({ parent_id: targetRow.id, realisasi, no_order_2, pekerjaan: jenis_pekerjaan_2 }),
             `telegram-bot`]
    });

    return { success: true, id: newId };
  },

  async updateRealisasiField(id: number, data: any, updatedBy: string) {
    const cleanVal = (v: any) => {
      if (v === undefined || v === null || v === '') return '';
      const s = String(v).trim();
      return /^[0-9]+(\.[0-9]+)*$/.test(s) ? Number(s.replace(/\./g, '')) : s;
    };
    // Fetch before snapshot
    const before = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ? LIMIT 1`,
      args: [id]
    });
    const beforeRow = before.rows[0] as any;
    if (!beforeRow) return { error: 'Data tidak ditemukan' };

    const sets: string[] = [];
    const args: any[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (!['realisasi', 'target', 'jam', 'kendala', 'bahan_kertas', 'warna', 'inscheet', 'rijek', 'jml_plate', 'keterangan', 'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2', 'nama_karyawan', 'posisi', 'absensi'].includes(k)) continue;
      sets.push(`${k} = ?`);
      args.push(k === 'realisasi' || k === 'target' || k === 'inscheet' || k === 'rijek' || k === 'jml_plate' ? cleanVal(v) : v);
    }
    // Sync target fields from realisasi fields (web SINTAK behavior)
    const SYNC_MAP: Record<string, string> = { no_order_2: 'no_order', nama_order_2: 'nama_order', jenis_pekerjaan_2: 'jenis_pekerjaan' };
    for (const [from, to] of Object.entries(SYNC_MAP)) {
      if (data[from] !== undefined && data[from] !== null && data[from] !== '') {
        sets.push(`${to} = ?`);
        args.push(data[from]);
      }
    }
    if (sets.length === 0) return { error: 'Tidak ada field yang diubah' };
    sets.push('updated_at = CURRENT_TIMESTAMP', 'updated_by = ?');
    args.push(updatedBy, id);
    await db.execute({ sql: `UPDATE jurnal_harian_produksi SET ${sets.join(', ')} WHERE id = ?`, args });
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['UPDATE', 'jurnal_harian_produksi', id, `Edit data JHP #${id} oleh ${updatedBy}`, JSON.stringify({ before: beforeRow, after: data }), updatedBy]
    });
    return { success: true };
  },

  async softDeleteHistory(id: number, deletedBy: string) {
    const before = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ? LIMIT 1`,
      args: [id]
    });
    const beforeRow = before.rows[0] as any;
    await db.execute({
      sql: `UPDATE jurnal_harian_produksi SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`,
      args: [deletedBy, id]
    });
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['DELETE', 'jurnal_harian_produksi', id, `Hapus data JHP #${id} oleh ${deletedBy}`, JSON.stringify({ before: beforeRow }), deletedBy]
    });
    return { success: true };
  },

  async getAllHistory(limit: number = 20, days: number = 7) {
    const result = await db.execute({
      sql: `SELECT id, tgl, shift, bagian, nama_karyawan, no_order_2, nama_order_2, jenis_pekerjaan_2,
                   target, realisasi, bahan_kertas, warna, inscheet, rijek, jam, kendala,
                   created_at, updated_at, updated_by, deleted_at, deleted_by
            FROM jurnal_harian_produksi
            WHERE created_by LIKE 'telegram-bot%'
              AND tgl >= date('now', '-' || ? || ' days')
            ORDER BY tgl DESC, id DESC
            LIMIT ?`,
      args: [days, limit]
    });

    const data = result.rows.map((row: any) => ({
      id: row.id, tgl: row.tgl, shift: row.shift, bagian: row.bagian, nama_karyawan: row.nama_karyawan,
      no_order: row.no_order_2, nama_order: row.nama_order_2, pekerjaan: row.jenis_pekerjaan_2,
      target: row.target, realisasi: row.realisasi, bahan_kertas: row.bahan_kertas,
      warna: row.warna, inscheet: row.inscheet, rijek: row.rijek, jam: row.jam, kendala: row.kendala,
      created_at: row.created_at, updated_at: row.updated_at, updated_by: row.updated_by,
      deleted_at: row.deleted_at, deleted_by: row.deleted_by
    }));

    return { success: true, data };
  }
};
