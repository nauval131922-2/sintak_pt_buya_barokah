import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { telegram_id, telegram_username, nama_karyawan, bagian } = body;

    // Validasi field wajib
    if (!telegram_id || !nama_karyawan || !bagian) {
      return NextResponse.json({ 
        error: 'Field wajib: telegram_id, nama_karyawan, bagian' 
      }, { status: 400 });
    }

    // Validasi nama karyawan exist di employees
    const employeeCheck = await db.execute({
      sql: `SELECT name, position, employee_no, department 
            FROM employees 
            WHERE name = ? AND is_active = 1
            LIMIT 1`,
      args: [nama_karyawan]
    });

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Nama karyawan tidak ditemukan di database. Pastikan nama sesuai dengan data SINTAK.' 
      }, { status: 400 });
    }

    const employee = employeeCheck.rows[0] as any;

    // Cek apakah telegram_id sudah terdaftar
    const existingCheck = await db.execute({
      sql: `SELECT id, is_active FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [telegram_id]
    });

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0] as any;
      if (existing.is_active === 1) {
        return NextResponse.json({ 
          error: 'Telegram ID Anda sudah terdaftar dan aktif.' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: 'Permintaan registrasi Anda sedang menunggu persetujuan admin.' 
        }, { status: 400 });
      }
    }

    // Insert ke telegram_users dengan status pending (is_active = 0)
    await db.execute({
      sql: `INSERT INTO telegram_users (
        telegram_id, telegram_username, nama_karyawan, posisi, absensi, bagian, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      args: [
        telegram_id,
        telegram_username || null,
        employee.name,
        employee.position,
        employee.employee_no,
        bagian
      ]
    });

    // Log activity
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'INSERT',
        'telegram_users',
        0,
        `Request registrasi Telegram Bot dari ${employee.name} (@${telegram_username || telegram_id})`,
        JSON.stringify({ telegram_id, telegram_username, nama_karyawan: employee.name, bagian }),
        'telegram-bot'
      ]
    });

    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Permintaan registrasi telah dikirim ke admin. Tunggu persetujuan.'
    });

  } catch (error: any) {
    console.error('[API] register-request error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
