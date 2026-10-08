import { NextRequest, NextResponse } from 'next/server';

import db from '@/lib/db';
import { requireApiPermission } from '@/lib/api-guard';

const SHEET_NAME = 'A.DATA KARYAWAN';
// ponytail: satu chunk JSON jangan jebol bodySizeLimit — tolak chunk raksasa per request
const MAX_CHUNK_BYTES = 15 * 1024 * 1024;
const COL_A = 0; // ID Karyawan (employee_no)
const COL_B = 1; // filter: tidak kosong (baris valid)
const COL_C = 2; // Nama
const COL_J = 9; // Jabatan/Bagian

export async function POST(req: NextRequest) {
  // Guard: samakan dengan halaman employees (requirePermission karyawan)
  const gate = await requireApiPermission('karyawan');
  if (gate.error) return gate.error;
  try {
    const bodyText = await req.text();
    if (Buffer.byteLength(bodyText, 'utf8') > MAX_CHUNK_BYTES) {
      return NextResponse.json({ error: 'Ukuran chunk melebihi 15MB. Kecilkan ukuran file atau bagi menjadi beberapa file.' }, { status: 413 });
    }
    const { filename, rows, chunkIndex = 0, totalChunks = 1 } = JSON.parse(bodyText);

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const dataRows = rows;


    const batchOps: any[] = [];
    
    // Hanya reset status aktif pada chunk pertama
    if (chunkIndex === 0) {
      batchOps.push({ 
        sql: `UPDATE employees SET is_active = 0 WHERE employee_no IS NOT NULL AND employee_no != ''`, 
        args: [] 
      });
    }

    let importedCount = 0;

    const currentUser = gate.session.username;

    for (const row of dataRows) {
        const colA = String(row[COL_A] ?? '').trim();
        const colB = String(row[COL_B] ?? '').trim();
        if (!colB) continue;

        const name = String(row[COL_C] ?? '').trim();
        const position = String(row[COL_J] ?? '').trim();

        if (!name || /^\d+$/.test(name)) continue;

        batchOps.push({
            sql: `
              INSERT INTO employees (name, position, department, employee_no, is_active, recorded_by) 
              VALUES (?, ?, ?, ?, 1, ?)
              ON CONFLICT(employee_no) DO UPDATE SET
                name = excluded.name,
                position = excluded.position,
                is_active = 1,
                recorded_by = excluded.recorded_by
            `,
            args: [name, position || '-', '-', colA, currentUser]
        });
        importedCount++;
    }

    const chunkSize = 500;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    // Hanya catat log pada chunk terakhir
    if (chunkIndex === totalChunks - 1) {
      await db.execute({
          sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
              'IMPORT', 
              'employees', 
              0, 
              `Import Karyawan dari Excel (Selesai)`, 
              JSON.stringify({ filename }),
              currentUser
          ]
      });
    }
    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err: unknown) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal saat import.' }, { status: 500 });
  }
}
