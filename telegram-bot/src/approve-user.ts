import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env dari root SINTAK
dotenv.config({ path: path.join(__dirname, '../../.env') });

const db = createClient({
  url: `file:${path.join(__dirname, '../../database_dev.sqlite')}`
});

async function approveUser(telegram_id: string) {
  try {
    console.log(`\n🔍 Mencari user dengan Telegram ID: ${telegram_id}...`);

    // Cari user
    const result = await db.execute({
      sql: `SELECT id, telegram_id, telegram_username, nama_karyawan, bagian, is_active
            FROM telegram_users
            WHERE telegram_id = ?
            LIMIT 1`,
      args: [telegram_id]
    });

    if (result.rows.length === 0) {
      console.error('❌ User tidak ditemukan!');
      console.log('\nPastikan user sudah melakukan /start di bot.');
      process.exit(1);
    }

    const user = result.rows[0] as any;

    console.log('\n📋 Data User:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Telegram ID: ${user.telegram_id}`);
    console.log(`   Username: @${user.telegram_username || '-'}`);
    console.log(`   Nama: ${user.nama_karyawan}`);
    console.log(`   Bagian: ${user.bagian}`);
    console.log(`   Status: ${user.is_active === 1 ? '✅ Aktif' : '⏳ Pending'}`);

    if (user.is_active === 1) {
      console.log('\n✅ User sudah diapprove sebelumnya!');
      process.exit(0);
    }

    // Approve user
    await db.execute({
      sql: `UPDATE telegram_users 
            SET is_active = 1, approved_at = CURRENT_TIMESTAMP, approved_by = ?
            WHERE telegram_id = ?`,
      args: ['admin-cli', telegram_id]
    });

    // Log activity
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPDATE',
        'telegram_users',
        user.id,
        `Approve registrasi Telegram Bot: ${user.nama_karyawan} (@${user.telegram_username || user.telegram_id})`,
        JSON.stringify({ telegram_id: user.telegram_id, nama_karyawan: user.nama_karyawan, bagian: user.bagian }),
        'admin-cli'
      ]
    });

    console.log('\n✅ User berhasil diapprove!');
    console.log('\nUser sekarang bisa menggunakan bot untuk input realisasi.');
    console.log('Silakan coba /input di bot Telegram.');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Get telegram_id from command line argument
const telegram_id = process.argv[2];

if (!telegram_id) {
  console.log('Usage: npm run approve <telegram_id>');
  console.log('Example: npm run approve 123456789');
  process.exit(1);
}

approveUser(telegram_id);
