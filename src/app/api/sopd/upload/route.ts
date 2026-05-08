import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@libsql/client';
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Use a direct client instance to bypass the db wrapper's middleware overhead
// during bulk insert operations for maximum performance
const isDev = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;
const useRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;
const dbUrl = useRemote
  ? process.env.TURSO_DATABASE_URL!
  : `file:${path.join(process.cwd(), process.env.DB_PATH || (isDev ? 'database_dev.sqlite' : 'database.sqlite'))}`;

const rawClient = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Step 1: Read only sheet names (very fast, no cell data)
    const bookMeta = XLSX.read(arrayBuffer, { bookSheets: true });
    let targetSheet = 'SOPD';
    if (!bookMeta.SheetNames.includes('SOPD')) {
      const fallback = bookMeta.SheetNames.find(s => s === '03 SOPd') ||
                       bookMeta.SheetNames.find(s => s.toLowerCase().includes('sopd'));
      if (!fallback) throw new Error("Sheet 'SOPD' tidak ditemukan di dalam file Excel.");
      targetSheet = fallback;
    }

    // Step 2: Parse ONLY the target sheet — massive perf gain for large .xlsm files
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      sheets: targetSheet,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellNF: false,
      cellText: false,
      cellDates: true,
    });

    const worksheet = workbook.Sheets[targetSheet];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: "" }) as any[];

    if (rawData.length === 0) {
      throw new Error("File Excel kosong atau format tidak sesuai.");
    }

    // Step 3: Identify column keys once from the first row
    const allKeys = Object.keys(rawData[0]);
    const findKey = (searchStr: string) =>
      allKeys.find(k => k.toLowerCase().trim() === searchStr.toLowerCase().trim()) ||
      allKeys.find(k => k.toLowerCase().includes(searchStr.toLowerCase()));

    const keyNoSopd   = findKey('No. Order')     || findKey('No_SOPd');
    const keyTgl      = findKey('Tgl')            || findKey('Tanggal');
    const keyNamaOrder = findKey('Nama Order')    || findKey('Nama_Order');
    const keyQty      = findKey('Jumlah Order')   || findKey('Qty SOPd') || findKey('Qty');
    const keyUnit     = findKey('Satuan')         || findKey('Unit PO')  || findKey('Unit');
    const keyHarga    = findKey('Perkiraan Harga');
    const keyKet      = findKey('Keterangan');
    const keyDeadline = findKey('Tanggal Deadline');
    const keySelesai  = findKey('Tanggal Selesai');

    const parseDate = (val: any): string | null => {
      if (!val) return null;
      if (val instanceof Date) {
        const d = val.getDate().toString().padStart(2, '0');
        const m = (val.getMonth() + 1).toString().padStart(2, '0');
        return `${d}-${m}-${val.getFullYear()}`;
      }
      const str = String(val).trim();
      return str || null;
    };

    // Step 4: Clear old data
    await rawClient.batch([
      { sql: 'DELETE FROM sopd', args: [] },
      { sql: 'DELETE FROM sopd_harga', args: [] }
    ], "write");

    // Step 5: Build all insert operations in a single pass
    const processedSopd = new Set<string>();
    const sopdOps: any[] = [];
    const hargaOps: any[] = [];
    let importedCount = 0;

    for (const row of rawData) {
      const noSopd    = String(row[keyNoSopd    || ''] || '').trim();
      const namaOrder = String(row[keyNamaOrder || ''] || '').trim();

      if (!noSopd && !namaOrder) continue;

      // Skip header-like rows
      const noStr = noSopd.toLowerCase();
      if (noStr.includes('no') && (noStr.includes('sopd') || noStr.includes('order'))) continue;

      const tgl  = parseDate(row[keyTgl  || '']);
      const unit = String(row[keyUnit || ''] || '').trim();

      // Qty parsing
      let qtySopd = 0;
      const rawQty = row[keyQty || ''];
      if (typeof rawQty === 'number') {
        qtySopd = rawQty;
      } else if (typeof rawQty === 'string') {
        let c = rawQty.trim().replace(/\s/g, '');
        if (c.includes(',') && c.includes('.')) {
          c = c.lastIndexOf(',') > c.lastIndexOf('.')
            ? c.replace(/\./g, '').replace(',', '.')
            : c.replace(/,/g, '');
        } else if (c.includes(',')) {
          c = c.replace(',', '.');
        }
        qtySopd = parseFloat(c) || 0;
      }

      sopdOps.push({
        sql: 'INSERT INTO sopd (no_sopd, tgl, nama_order, qty_sopd, unit) VALUES (?, ?, ?, ?, ?)',
        args: [noSopd, tgl, namaOrder, qtySopd, unit || null]
      });

      if (noSopd && !processedSopd.has(noSopd)) {
        hargaOps.push({
          sql: 'INSERT INTO sopd_harga (no_sopd, perkiraan_harga, keterangan, deadline_date, finished_date) VALUES (?, ?, ?, ?, ?)',
          args: [
            noSopd,
            row[keyHarga    || ''] || null,
            row[keyKet      || ''] || null,
            parseDate(row[keyDeadline || '']),
            parseDate(row[keySelesai  || ''])
          ]
        });
        processedSopd.add(noSopd);
      }

      importedCount++;
    }

    // Step 6: Chunked insert using raw client (bypasses session/context overhead)
    const CHUNK_SIZE = 1000;
    const allOps = [...sopdOps, ...hargaOps];
    for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
      await rawClient.batch(allOps.slice(i, i + CHUNK_SIZE), "write");
    }

    // Step 7: Log activity
    const session = await getSession();
    await rawClient.execute({
      sql: 'INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
      args: ['UPLOAD', 'sopd', 0, `Upload SOPD dari Excel (${importedCount} data)`, JSON.stringify({ fileName: file.name, imported: importedCount }), session?.username || 'System']
    });

    return NextResponse.json({ success: true, message: `Berhasil mengimpor ${importedCount} data SOPD.`, imported: importedCount });

  } catch (error: any) {
    console.error("SOPD Upload Error:", error);
    return NextResponse.json({ error: "Gagal memproses file Excel di server", details: error.message }, { status: 500 });
  }
}
