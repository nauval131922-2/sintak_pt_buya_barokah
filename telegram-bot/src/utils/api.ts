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
            FROM employees WHERE name = ? AND is_active = 1 LIMIT 1`,
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

  async validateOrder(no_order: string) {
    const result = await db.execute({
      sql: `SELECT no_sopd, nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
      args: [no_order]
    });
    if (result.rows.length === 0) return { valid: false, message: 'Order tidak ditemukan di database' };
    const o = result.rows[0] as any;
    return { valid: true, no_order: o.no_sopd, nama_order: o.nama_order };
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

    const inputDate = new Date(tgl + 'T12:00:00');
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return { error: 'Tanggal terlalu jauh di masa lalu. Maksimal 7 hari ke belakang.' };
    if (diffDays < 0) return { error: 'Tanggal tidak boleh di masa depan.' };

    const defaultJam = SHIFT_JAM[String(shift)] || '';
    const cleanTarget = cleanNumberOrText(data.target);
    const cleanRealisasi = cleanNumberOrText(realisasi);
    const cleanInscheet = cleanNumberOrText(data.inscheet);
    const cleanRijek = cleanNumberOrText(data.rijek);
    const cleanJmlPlate = cleanNumberOrText(data.jml_plate);

    let namaOrder2 = data.nama_order_manual_2 || data.nama_order_2 || '';
    if (no_order_2 && !namaOrder2) {
      const orderCheck = await db.execute({
        sql: `SELECT nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
        args: [no_order_2]
      });
      if (orderCheck.rows.length > 0) namaOrder2 = (orderCheck.rows[0] as any).nama_order || '';
    }

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
        no_order_2 || '', namaOrder2, jenis_pekerjaan_2 || '', cleanTarget || cleanRealisasi,
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
        target: cleanTarget || cleanRealisasi, realisasi: cleanRealisasi,
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
                   target, realisasi, bahan_kertas, warna, inscheet, rijek, jam, kendala, created_at
            FROM jurnal_harian_produksi
            WHERE nama_karyawan = ? AND deleted_at IS NULL
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
      warna: row.warna, inscheet: row.inscheet, rijek: row.rijek, jam: row.jam, kendala: row.kendala, created_at: row.created_at
    }));

    return { success: true, nama_karyawan: user.nama_karyawan, data };
  },

  async getAllHistory(limit: number = 20) {
    const result = await db.execute({
      sql: `SELECT id, tgl, shift, bagian, nama_karyawan, no_order_2, nama_order_2, jenis_pekerjaan_2,
                   target, realisasi, bahan_kertas, warna, inscheet, rijek, jam, kendala, created_at
            FROM jurnal_harian_produksi
            WHERE deleted_at IS NULL
              AND created_by LIKE 'telegram-bot%'
              AND tgl >= date('now', '-7 days')
            ORDER BY tgl DESC, id DESC
            LIMIT ?`,
      args: [limit]
    });

    const data = result.rows.map((row: any) => ({
      id: row.id, tgl: row.tgl, shift: row.shift, bagian: row.bagian, nama_karyawan: row.nama_karyawan,
      no_order: row.no_order_2, nama_order: row.nama_order_2, pekerjaan: row.jenis_pekerjaan_2,
      target: row.target, realisasi: row.realisasi, bahan_kertas: row.bahan_kertas,
      warna: row.warna, inscheet: row.inscheet, rijek: row.rijek, jam: row.jam, kendala: row.kendala, created_at: row.created_at
    }));

    return { success: true, data };
  }
};
