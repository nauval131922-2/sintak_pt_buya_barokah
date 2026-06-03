import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search') || '';
  const category = request.nextUrl.searchParams.get('category') || '';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
  const offset = (page - 1) * limit;

  try {
    let where = '1=1';
    const args: (string | number)[] = [];

    if (search) {
      where += ' AND name LIKE ?';
      args.push(`%${search}%`);
    }
    if (category) {
      where += ' AND category = ?';
      args.push(category.trim());
    }

    // Get count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM master_pekerjaan_jurnal_produksi WHERE ${where}`,
      args
    });
    const totalCount = (countResult.rows[0] as unknown as { total: number })?.total || 0;

    // Get paginated data
    const result = await db.execute({
      sql: `SELECT * FROM master_pekerjaan_jurnal_produksi WHERE ${where} 
            ORDER BY 
              CASE category
                WHEN 'Setting' THEN 1
                WHEN 'Quality Control' THEN 2
                WHEN 'Cetak' THEN 3
                WHEN 'Finishing' THEN 4
                WHEN 'Gudang' THEN 5
                WHEN 'Teknisi' THEN 6
                WHEN 'Mesin' THEN 7
                ELSE 99
              END ASC,
              name ASC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset]
    });

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: totalCount,
      page,
      limit,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("API GET Master Pekerjaan Jurnal Produksi Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = file?.name || 'Unknown File';
    const password = formData.get('password') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
    }

    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileExt = filename.split('.').pop()?.toLowerCase() || 'xlsm';
    const rand = Math.floor(Math.random() * 1000000);
    tempInputPath = path.join(tempDir, `upload_${Date.now()}_${rand}_input.${fileExt}`);
    tempOutputPath = path.join(tempDir, `upload_${Date.now()}_${rand}_decrypted.${fileExt}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(tempInputPath, buffer);

    let finalPath = tempInputPath;
    let isEncrypted = false;

    // Check if the file is encrypted
    try {
      await execPromise(`msoffcrypto-tool -t "${tempInputPath}"`);
      isEncrypted = true;
    } catch {
      isEncrypted = false;
    }

    if (isEncrypted) {
      // Cek apakah client mengirimkan sandi secara manual
      const isManualPassword = formData.has('password');
      
      if (!isManualPassword) {
        return NextResponse.json({ 
          error: 'PASSWORD_REQUIRED', 
          message: 'Berkas Excel dilindungi sandi. Silakan masukkan sandi.' 
        }, { status: 401 });
      }

      let decryptSuccess = false;
      try {
        const cleanPassword = password.replace(/"/g, '\\"');
        await execPromise(`msoffcrypto-tool -p "${cleanPassword}" "${tempInputPath}" "${tempOutputPath}"`);
        
        // Verifikasi apakah file output didekripsi benar-benar ada dan tidak kosong (minimal 100 bytes)
        if (fs.existsSync(tempOutputPath) && fs.statSync(tempOutputPath).size > 100) {
          decryptSuccess = true;
          finalPath = tempOutputPath;
        } else {
          console.warn("File decrypted tidak ditemukan atau kosong setelah proses dekripsi.");
        }
      } catch (decryptErr) {
        console.error("Gagal mendekripsi file via exec:", decryptErr);
      }

      if (!decryptSuccess) {
        return NextResponse.json({ 
          error: 'PASSWORD_INCORRECT', 
          message: 'Sandi Excel yang Anda masukkan salah. Silakan coba lagi.' 
        }, { status: 401 });
      }
    }

    // Read workbook on server-side using file buffer to prevent Windows file locking issues
    const fileBuffer = await fs.promises.readFile(finalPath);
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellFormula: false, 
      cellHTML: false,
      cellNF: true,
      cellText: true
    });

    const targetSheetName = workbook.SheetNames.find(s => s.toUpperCase() === 'MASTER PEKERJAAN');
    if (!targetSheetName) {
      throw new Error("Sheet 'MASTER PEKERJAAN' tidak ditemukan di dalam file Excel.");
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true }) as Array<Array<string | number | null | undefined>>;

    if (rawRows.length < 4) {
      throw new Error("Format sheet 'MASTER PEKERJAAN' tidak sesuai atau baris data terlalu sedikit.");
    }

    // Baris ke-3 (indeks 2) adalah nama kategori
    const categoryRow = rawRows[2];
    const categoryMap: Record<number, string> = {};
    
    for (let c = 0; c < categoryRow.length; c++) {
      const catVal = categoryRow[c];
      if (catVal && typeof catVal === 'string' && catVal.trim()) {
        categoryMap[c] = catVal.trim();
      }
    }

    const items: { category: string; name: string }[] = [];

    // Mulai dari baris ke-4 (indeks 3)
    for (let r = 3; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row) continue;

      // Hentikan pembacaan baris jika menemukan baris pembatas 'KALENDER' di Kolom A (indeks 0)
      if (row[0] && typeof row[0] === 'string' && row[0].trim().toUpperCase() === 'KALENDER') {
        break;
      }

      for (const colIdxStr in categoryMap) {
        const colIdx = parseInt(colIdxStr);
        if (colIdx < row.length) {
          const cellVal = row[colIdx];
          if (cellVal !== null && cellVal !== undefined) {
            const cleanName = String(cellVal).trim();
            if (cleanName && cleanName !== '') {
              items.push({
                category: categoryMap[colIdx],
                name: cleanName
              });
            }
          }
        }
      }
    }

    if (items.length === 0) {
      throw new Error("Tidak ada data pekerjaan yang ditemukan di sheet 'MASTER PEKERJAAN'.");
    }

    // Dapatkan data master pekerjaan yang ada di database saat ini
    const existingResult = await db.execute("SELECT id, category, name FROM master_pekerjaan_jurnal_produksi");
    const existingRows = existingResult.rows as unknown as Array<{ id: number; category: string; name: string }>;

    // Buat set untuk pencarian cepat dari Excel baru
    const newKeys = new Set(items.map(item => `${item.category.trim()}|${item.name.trim()}`));

    // Cari ID mana saja yang perlu dihapus (karena tidak ada di Excel baru)
    const deleteIds: number[] = [];
    for (const row of existingRows) {
      const key = `${row.category}|${row.name}`;
      if (!newKeys.has(key)) {
        deleteIds.push(row.id);
      }
    }

    const batchOps: Array<{ sql: string; args: (string | number)[] }> = [];

    // 1. Tambahkan operasi DELETE jika ada data yang dihapus
    if (deleteIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < deleteIds.length; i += chunkSize) {
        const chunk = deleteIds.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        batchOps.push({
          sql: `DELETE FROM master_pekerjaan_jurnal_produksi WHERE id IN (${placeholders})`,
          args: chunk
        });
      }
    }

    // 2. Tambahkan operasi INSERT OR IGNORE untuk data baru (agar tidak merusak ID data lama yang tetap ada)
    let imported = 0;
    for (const item of items) {
      if (!item.category || !item.name) continue;
      batchOps.push({
        sql: `INSERT OR IGNORE INTO master_pekerjaan_jurnal_produksi (category, name) VALUES (?, ?)`,
        args: [item.category.trim(), item.name.trim()],
      });
      imported++;
    }

    await db.batch(batchOps, 'write');

    const session = await getSession();

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPLOAD', 
        'master_pekerjaan_jurnal_produksi', 
        0, 
        `Upload Master Pekerjaan Jurnal Produksi dari Excel (${imported} data)`, 
        JSON.stringify({ fileName: filename, imported }),
        session?.username || 'System'
      ]
    });

    return NextResponse.json({ success: true, imported });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("API POST Master Pekerjaan Jurnal Produksi Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    // Clean up temporary files
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try {
        fs.unlinkSync(tempInputPath);
      } catch {}
    }
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      try {
        fs.unlinkSync(tempOutputPath);
      } catch {}
    }
  }
}
