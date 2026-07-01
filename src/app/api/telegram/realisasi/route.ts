import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const cleanNumberOrText = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  // Cek jika murni angka dengan titik sebagai pemisah ribuan
  if (/^[0-9]+(\.[0-9]+)*$/.test(str)) {
    return Number(str.replace(/\./g, ''));
  }
  return str;
};

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { telegram_id, tgl, shift, no_order_2, jenis_pekerjaan_2, realisasi } = body;

    // Validasi field wajib
    if (!telegram_id || !tgl || !shift || !realisasi) {
      return NextResponse.json({ 
        error: 'Field wajib: telegram_id, tgl, shift, realisasi' 
      }, { status: 400 });
    }

    // Cek user aktif
    const userCheck = await db.execute({
      sql: `SELECT id, nama_karyawan, posisi, absensi, bagian, is_active
            FROM telegram_users
            WHERE telegram_id = ?
            LIMIT 1`,
      args: [telegram_id]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User tidak terdaftar. Silakan registrasi terlebih dahulu.' 
      }, { status: 403 });
    }

    const user = userCheck.rows[0] as any;

    if (user.is_active !== 1) {
      return NextResponse.json({ 
        error: 'Akun Anda belum disetujui admin. Tunggu persetujuan terlebih dahulu.' 
      }, { status: 403 });
    }

    // Validasi tanggal (max 7 hari backdate)
    const inputDate = new Date(tgl + 'T12:00:00');
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return NextResponse.json({ 
        error: 'Tanggal terlalu jauh di masa lalu. Maksimal 7 hari ke belakang.' 
      }, { status: 400 });
    }

    if (diffDays < 0) {
      return NextResponse.json({ 
        error: 'Tanggal tidak boleh di masa depan.' 
      }, { status: 400 });
    }

    // Tentukan jam kerja berdasarkan shift
    const SHIFT_JAM: Record<string, string> = {
      '1': '07:00-15:00',
      '2': '15:00-23:00',
      '3': '23:00-07:00'
    };
    const defaultJam = SHIFT_JAM[String(shift)] || '';

    // Clean numbers
    const cleanTarget = cleanNumberOrText(body.target);
    const cleanRealisasi = cleanNumberOrText(realisasi);
    const cleanInscheet = cleanNumberOrText(body.inscheet);
    const cleanRijek = cleanNumberOrText(body.rijek);
    const cleanJmlPlate = cleanNumberOrText(body.jml_plate);

    // Tentukan nama_order_2 (dari manual atau dari data order)
    let namaOrder2 = body.nama_order_manual_2 || body.nama_order_2 || '';
    
    // Jika no_order_2 diisi, ambil nama_order dari sopd jika belum ada
    if (no_order_2 && !namaOrder2) {
      const orderCheck = await db.execute({
        sql: `SELECT nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
        args: [no_order_2]
      });
      if (orderCheck.rows.length > 0) {
        namaOrder2 = (orderCheck.rows[0] as any).nama_order || '';
      }
    }

    // Insert ke jurnal_harian_produksi
    await db.execute({
      sql: `INSERT INTO jurnal_harian_produksi (
        posisi, absensi, tgl, shift, nama_karyawan, bagian,
        no_order, nama_order, jenis_pekerjaan, target,
        no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi,
        bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala,
        keterangan, nama_order_manual_2, is_manual_input, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        user.posisi || '',
        user.absensi || '',
        tgl,
        String(shift),
        user.nama_karyawan,
        user.bagian,
        no_order_2 || '',  
        namaOrder2,
        jenis_pekerjaan_2 || '',
        cleanTarget,  
        no_order_2 || '',
        namaOrder2,
        jenis_pekerjaan_2 || '',
        cleanRealisasi,
        body.bahan_kertas || '',
        cleanJmlPlate,
        body.warna || '',
        cleanInscheet,
        cleanRijek,
        body.jam || defaultJam,
        body.kendala || '',
        body.keterangan || '',
        body.nama_order_manual_2 || null,
        'telegram-bot'
      ]
    });

    // Ambil ID row yang baru diinsert
    const lastIdResult = await db.execute({ 
      sql: `SELECT last_insert_rowid() as id`, 
      args: [] 
    });
    const newId = Number((lastIdResult.rows[0] as any)?.id || 0);

    // Log activity
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'INSERT',
        'jurnal_harian_produksi',
        newId,
        `Input realisasi via Telegram Bot oleh ${user.nama_karyawan}`,
        JSON.stringify({
          telegram_id,
          tgl,
          shift,
          bagian: user.bagian,
          no_order: no_order_2,
          nama_order: namaOrder2,
          pekerjaan: jenis_pekerjaan_2,
          realisasi: cleanRealisasi
        }),
        `telegram-bot-${user.bagian.toLowerCase()}`
      ]
    });

    return NextResponse.json({
      success: true,
      id: newId,
      data: {
        nama_karyawan: user.nama_karyawan,
        tgl,
        shift,
        bagian: user.bagian,
        no_order: no_order_2,
        nama_order: namaOrder2,
        pekerjaan: jenis_pekerjaan_2,
        target: cleanTarget,
        realisasi: cleanRealisasi
      }
    });

  } catch (error: any) {
    console.error('[API] realisasi error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
