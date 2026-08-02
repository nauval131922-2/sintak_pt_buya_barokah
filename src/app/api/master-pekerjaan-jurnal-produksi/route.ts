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

function isUniqueError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /UNIQUE constraint failed/i.test(msg);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  // JSON create single — dual mode dengan Excel upload
  if (contentType.includes('application/json')) {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const category = String(body?.category ?? '').trim();
      const name = String(body?.name ?? '').trim();

      if (!category || !name) {
        return NextResponse.json({ error: 'Bagian dan nama pekerjaan wajib diisi.' }, { status: 400 });
      }

      const result = await db.execute({
        sql: `INSERT INTO master_pekerjaan_jurnal_produksi (category, name) VALUES (?, ?)`,
        args: [category, name],
      });

      return NextResponse.json({
        success: true,
        id: Number(result.lastInsertRowid),
        category,
        name,
      });
    } catch (error: unknown) {
      if (isUniqueError(error)) {
        return NextResponse.json(
          { error: 'Pekerjaan dengan bagian dan nama yang sama sudah ada.' },
          { status: 409 }
        );
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('API POST (JSON) Master Pekerjaan Jurnal Produksi Error:', error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }

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

    // Merge-only: hanya tambah data baru dari Excel, tidak hapus baris yang sudah ada di DB
    const batchOps: Array<{ sql: string; args: (string | number)[] }> = [];
    let imported = 0;
    for (const item of items) {
      if (!item.category || !item.name) continue;
      batchOps.push({
        sql: `INSERT OR IGNORE INTO master_pekerjaan_jurnal_produksi (category, name) VALUES (?, ?)`,
        args: [item.category.trim(), item.name.trim()],
      });
      imported++;
    }

    if (batchOps.length > 0) {
      await db.batch(batchOps, 'write');
    }

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

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = Number(body?.id);
    const category = String(body?.category ?? '').trim();
    const name = String(body?.name ?? '').trim();

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }
    if (!category || !name) {
      return NextResponse.json({ error: 'Bagian dan nama pekerjaan wajib diisi.' }, { status: 400 });
    }

    const existing = await db.execute({
      sql: `SELECT id FROM master_pekerjaan_jurnal_produksi WHERE id = ?`,
      args: [id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE master_pekerjaan_jurnal_produksi SET category = ?, name = ? WHERE id = ?`,
      args: [category, name, id],
    });

    return NextResponse.json({ success: true, id, category, name });
  } catch (error: unknown) {
    if (isUniqueError(error)) {
      return NextResponse.json(
        { error: 'Pekerjaan dengan bagian dan nama yang sama sudah ada.' },
        { status: 409 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API PUT Master Pekerjaan Jurnal Produksi Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let ids: number[] = [];
    const idParam = request.nextUrl.searchParams.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id) && id > 0) ids = [id];
    } else {
      try {
        const body = await request.json();
        const raw = Array.isArray(body?.ids) ? body.ids : body?.id != null ? [body.id] : [];
        ids = raw.map((v: unknown) => Number(v)).filter((n: number) => !Number.isNaN(n) && n > 0);
      } catch {
        // no body
      }
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      await db.execute({
        sql: `DELETE FROM master_pekerjaan_jurnal_produksi WHERE id IN (${placeholders})`,
        args: chunk,
      });
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API DELETE Master Pekerjaan Jurnal Produksi Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
