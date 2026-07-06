import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Optional date filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const bagian = searchParams.get("bagian");
    const namaKaryawan = searchParams.get("namaKaryawan");
    const noOrder = searchParams.get("noOrder");
    const jenisPekerjaan = searchParams.get("jenisPekerjaan");
    const belumRealisasi = searchParams.get("belumRealisasi");
    const needTotals = searchParams.get("needTotals") === 'true';

    let whereParts: string[] = [];
    let args: any[] = [];

    if (belumRealisasi === 'true') {
      // Sama dengan logika tombol "+" di tabel: belum realisasi jika semua field realisasi kosong
      whereParts.push('((realisasi IS NULL OR realisasi = 0 OR realisasi = \'\') AND (no_order_2 IS NULL OR no_order_2 = \'\') AND (jenis_pekerjaan_2 IS NULL OR jenis_pekerjaan_2 = \'\'))');
    }

    if (search) {
      // ponytail: token-based AND search — tiap token harus cocok di salah satu kolom
      // ceiling: O(tokens × cols) LIKE scans; upgrade path: FTS5 virtual table jika data > 1M baris
      const cols = ['nama_karyawan', 'nama_order', 'no_order', 'jenis_pekerjaan', 'nama_order_2', 'no_order_2', 'jenis_pekerjaan_2', 'nama_order_manual', 'nama_order_manual_2'];
      const colClause = cols.map(c => `${c} LIKE ?`).join(' OR ');
      const tokens = search.trim().split(/\s+/).filter(Boolean).slice(0, 10); // max 10 token
      for (const token of tokens) {
        whereParts.push(`(${colClause})`);
        const likeStr = `%${token}%`;
        for (let i = 0; i < cols.length; i++) args.push(likeStr);
      }
    }

    if (startDate && endDate) {
      whereParts.push(`(tgl BETWEEN ? AND ?)`);
      args.push(startDate, endDate);
    }

    if (bagian) {
      whereParts.push(`bagian = ?`);
      args.push(bagian);
    }

    if (namaKaryawan) {
      whereParts.push(`nama_karyawan = ?`);
      args.push(namaKaryawan);
    }

    if (noOrder) {
      whereParts.push(`(no_order = ? OR no_order_2 = ? OR nama_order = ? OR nama_order_2 = ?)`);
      args.push(noOrder, noOrder, noOrder, noOrder);
    }

    if (jenisPekerjaan) {
      whereParts.push(`(jenis_pekerjaan = ? OR jenis_pekerjaan_2 = ?)`);
      args.push(jenisPekerjaan, jenisPekerjaan);
    }

    // Selalu filter soft-deleted
    whereParts.push('deleted_at IS NULL');
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Kolom yang dipilih eksplisit untuk menghindari transfer data berlebih
    const SELECT_COLS = `id, posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order,
      jenis_pekerjaan, keterangan, target, realisasi, no_order_2, nama_order_2,
      jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input, nama_order_manual, nama_order_manual_2`;

    // Whitelist kolom sortable — ekspresi SQL langsung, bukan nama kolom user
    const SORT_COLUMNS: Record<string, string> = {
      tgl:              'tgl',
      shift:            'shift',
      absensi:          'absensi',
      nama_karyawan:    'nama_karyawan',
      no_order:         'no_order',
      nama_order:       'nama_order',
      jenis_pekerjaan:  'jenis_pekerjaan',
      keterangan:       'keterangan',
      target:           'target',
      realisasi:        'realisasi',
      no_order_2:       'no_order_2',
      nama_order_2:     'nama_order_2',
      jenis_pekerjaan_2:'jenis_pekerjaan_2',
      bagian:           `CASE UPPER(bagian) WHEN 'SETTING' THEN 1 WHEN 'QUALITY CONTROL' THEN 2 WHEN 'CETAK' THEN 3 WHEN 'FINISHING' THEN 4 WHEN 'GUDANG' THEN 5 WHEN 'TEKNISI' THEN 6 WHEN 'MESIN' THEN 7 ELSE 8 END`,
      rijek:            'rijek',
      jam:              'jam',
      id:               'id',
    };

    const DEFAULT_ORDER = `ORDER BY
        tgl ASC,
        CASE UPPER(bagian)
          WHEN 'SETTING' THEN 1 WHEN 'QUALITY CONTROL' THEN 2 WHEN 'CETAK' THEN 3
          WHEN 'FINISHING' THEN 4 WHEN 'GUDANG' THEN 5 WHEN 'TEKNISI' THEN 6 WHEN 'MESIN' THEN 7 ELSE 8
        END ASC,
        CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
        absensi ASC, id ASC`;

    const sortRaw = searchParams.get('sort') || '';
    let ORDER_BY: string;
    if (sortRaw === 'latest') {
      ORDER_BY = 'ORDER BY id DESC';
    } else if (sortRaw) {
      const clauses = sortRaw.split(',').flatMap(part => {
        const [col, dir] = part.split(':');
        const expr = SORT_COLUMNS[col];
        if (!expr) return [];
        return [`${expr} ${dir === 'asc' ? 'ASC' : 'DESC'}`];
      });
      // ponytail: fallback ke id ASC sebagai tie-breaker stabil
      ORDER_BY = clauses.length ? `ORDER BY ${clauses.join(', ')}, id ASC` : DEFAULT_ORDER;
    } else {
      ORDER_BY = DEFAULT_ORDER;
    }

    const sqlData = `SELECT ${SELECT_COLS} FROM jurnal_harian_produksi ${whereClause} ${ORDER_BY} LIMIT ? OFFSET ?`;
    // Count query — pakai INDEXED BY idx_jurnal_tgl_deleted jika ada filter tgl
    const countTableRef = (startDate && endDate) ? 'jurnal_harian_produksi INDEXED BY idx_jurnal_tgl_deleted' : 'jurnal_harian_produksi';
    const additionalWhere = whereParts.length > 1 ? 'AND ' + whereParts.filter(p => p !== 'deleted_at IS NULL').join(' AND ') : '';
    const sqlTotal = `SELECT COUNT(*) as count FROM ${countTableRef} WHERE deleted_at IS NULL ${additionalWhere}`;

    // Totals query — hanya jalan jika needTotals=true (filter aktif di client)
    let sqlTotals = '';
    if (needTotals && (search || startDate || endDate || bagian || namaKaryawan || noOrder || belumRealisasi)) {
      sqlTotals = `SELECT COALESCE(SUM(COALESCE(realisasi, 0)), 0) as totalRealisasi, COALESCE(SUM(COALESCE(rijek, 0)), 0) as totalRijek FROM ${countTableRef} WHERE deleted_at IS NULL ${additionalWhere}`;
    }

    const sqlLastUpdated = `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated
          FROM activity_logs
          WHERE table_name = 'jurnal_harian_produksi' AND action_type = 'UPLOAD'`;

    const batchStmts: any[] = [
      { sql: sqlData, args: [...args, limit, offset] },
      { sql: sqlTotal, args },
    ];
    if (sqlTotals) {
      batchStmts.push({ sql: sqlTotals, args });
    }
    batchStmts.push({ sql: sqlLastUpdated, args: [] });

    const batchResults = await db.batch(batchStmts, "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    let totalRealisasi = 0, totalRijek = 0;
    if (sqlTotals) {
      const totals = batchResults[2].rows[0] as any;
      totalRealisasi = Number(totals?.totalRealisasi || 0);
      totalRijek = Number(totals?.totalRijek || 0);
    }
    const lastUpdated = batchResults[batchResults.length - 1].rows[0] as any;
    const lastUpdatedVal = lastUpdated?.lastUpdated || null;

    return NextResponse.json({ success: true, data, total, page, limit, lastUpdated: lastUpdatedVal, totalRealisasi, totalRijek });


  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getSession();

    // Deteksi jika ini adalah request single insert dari form CRUD
    if (body.action === 'insert_single') {
      if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const {
        posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order,
        jenis_pekerjaan, keterangan, target, realisasi,
        no_order_2, nama_order_2, jenis_pekerjaan_2,
        bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian,
        nama_order_manual, nama_order_manual_2
      } = body.data;

      const cleanTarget = cleanNumberOrText(target);
      const cleanRealisasi = cleanNumberOrText(realisasi);

      // Jika no_order kosong, gunakan nama_order_manual sebagai nama_order (target)
      const finalNamaOrder = (nama_order && String(nama_order).trim())
        ? String(nama_order).trim()
        : ((!no_order && nama_order_manual && String(nama_order_manual).trim()) ? String(nama_order_manual).trim() : '');
      // Jika no_order_2 kosong DAN ada data realisasi yang diisi, gunakan nama_order_manual_2 sebagai nama_order_2
      const hasRealisasiData = realisasi || no_order_2 || jenis_pekerjaan_2 || bahan_kertas || jml_plate || warna || inscheet || rijek;
      const finalNamaOrder2 = (nama_order_2 && String(nama_order_2).trim())
        ? String(nama_order_2).trim()
        : ((!no_order_2 && nama_order_manual_2 && String(nama_order_manual_2).trim() && hasRealisasiData) ? String(nama_order_manual_2).trim() : '');

      try {
        await db.execute("ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0");
      } catch (e) {} // Kolom sudah ada

      await db.execute({
        sql: `INSERT INTO jurnal_harian_produksi (
          posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, realisasi,
          no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input, created_by, nama_order_manual, nama_order_manual_2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        args: [
          posisi || '', Number(absensi) || 0, tgl || null, shift || '', nama_karyawan || '',
          no_order || '', finalNamaOrder, jenis_pekerjaan || '', keterangan || '', cleanTarget, cleanRealisasi,
          no_order_2 || '', finalNamaOrder2, jenis_pekerjaan_2 || '', bahan_kertas || '', cleanNumberOrText(jml_plate),
          warna || '', cleanNumberOrText(inscheet), cleanNumberOrText(rijek), jam || '', kendala || '', bagian || '',
          session.username || null, nama_order_manual || null, nama_order_manual_2 || null
        ]
      });

      // Ambil ID row yang baru diinsert untuk disimpan di activity_log
      const lastIdResult = await db.execute({ sql: `SELECT last_insert_rowid() as id`, args: [] });
      const newId = Number((lastIdResult.rows[0] as any)?.id || 0);

      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['INSERT', 'jurnal_harian_produksi', newId, `Tambah Jurnal Harian Produksi Baru`, JSON.stringify(body.data), session.username || 'System']
      });

      return NextResponse.json({ success: true });
    }

    if (body.action === 'input_multi_realisasi') {
      if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { id, updated_at, baseData, multiRealisasi } = body;

      if (!multiRealisasi || multiRealisasi.length === 0) {
        return NextResponse.json({ error: 'Data realisasi kosong' }, { status: 400 });
      }

      // Filter baris tambahan yang kosong (no_order_2, jenis_pekerjaan_2, target, dan realisasi semuanya kosong)
      const validAdditional = multiRealisasi.slice(1).filter((row: any) => {
        const noOrder = String(row.no_order_2 || '').trim();
        const jenisPekerjaan = String(row.jenis_pekerjaan_2 || '').trim();
        const target = String(row.target || '').trim();
        const realisasi = String(row.realisasi || '').trim();
        return noOrder || jenisPekerjaan || target || realisasi;
      });
      const filteredMulti = [multiRealisasi[0], ...validAdditional];

      // 1. Update baris pertama (yang memiliki id)
      // Sisi Target (no_order, nama_order, jenis_pekerjaan) ikut data realisasi
      const firstRow = filteredMulti[0];
      // Prioritas nama_order_2:
      // 1. Jika nama_order_manual_2 diisi di baris ini → pakai itu
      // 2. Jika no_order_2 dipilih dari dropdown → pakai nama_order_2 dari firstRow
      const firstNamaOrder2 = (firstRow.nama_order_manual_2 && String(firstRow.nama_order_manual_2).trim())
        ? String(firstRow.nama_order_manual_2).trim()
        : (firstRow.nama_order_2 || '');
      const updateWhere = updated_at ? 'id = ? AND deleted_at IS NULL AND updated_at = ?' : 'id = ? AND deleted_at IS NULL';
      const updateFields = [
          firstRow.no_order_2 || '', firstNamaOrder2, firstRow.jenis_pekerjaan_2 || '',
          cleanNumberOrText(firstRow.target), cleanNumberOrText(firstRow.realisasi),
          firstRow.no_order_2 || '', firstNamaOrder2, firstRow.jenis_pekerjaan_2 || '',
          firstRow.bahan_kertas || '', cleanNumberOrText(firstRow.jml_plate), firstRow.warna || '',
          cleanNumberOrText(firstRow.inscheet), cleanNumberOrText(firstRow.rijek), firstRow.jam || '', firstRow.kendala || '',
          baseData.keterangan || '',
          baseData.nama_order_manual || null, firstRow.nama_order_manual_2 || null,
          session.username || null
        ];
      const updateWhereArgs = updated_at ? [id, updated_at] : [id];
      const result = await db.execute({
        sql: `UPDATE jurnal_harian_produksi SET
          no_order = ?, nama_order = ?, jenis_pekerjaan = ?,
          target = ?, realisasi = ?, no_order_2 = ?, nama_order_2 = ?, jenis_pekerjaan_2 = ?,
          bahan_kertas = ?, jml_plate = ?, warna = ?, inscheet = ?, rijek = ?, jam = ?, kendala = ?,
          keterangan = ?,
          nama_order_manual = ?, nama_order_manual_2 = ?,
          updated_at = CURRENT_TIMESTAMP, updated_by = ?
          WHERE ${updateWhere}`,
        args: [...updateFields, ...updateWhereArgs]
      });

      if (result.rowsAffected === 0) {
        const existing = await db.execute({
          sql: `SELECT id, deleted_at, updated_at FROM jurnal_harian_produksi WHERE id = ?`,
          args: [id]
        });
        if (existing.rows.length === 0 || (existing.rows[0] as any)?.deleted_at) {
          return NextResponse.json({ error: 'Data telah dihapus oleh pengguna lain.', code: 'DELETED' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Data telah diubah oleh pengguna lain. Silakan reload halaman.', code: 'CONFLICT' }, { status: 409 });
      }

      // 2. Insert baris ke-2 hingga selesai (generate new rows, skip yang kosong)
      if (validAdditional.length > 0) {
        try {
          await db.execute("ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0");
        } catch (e) {} // Kolom sudah ada

        let pendingRows: any[][] = [];

        for (const row of validAdditional) {
          // Prioritas nama_order_2: nama_order_manual_2 per baris jika diisi, lalu dari row
          const rowNamaOrder2 = (row.nama_order_manual_2 && String(row.nama_order_manual_2).trim())
            ? String(row.nama_order_manual_2).trim()
            : (row.nama_order_2 || '');
          pendingRows.push([
            baseData.posisi || '', Number(baseData.absensi) || 0, baseData.tgl || null, baseData.shift || '', baseData.nama_karyawan || '',
            row.no_order_2 || '', rowNamaOrder2, row.jenis_pekerjaan_2 || '', baseData.keterangan || '', cleanNumberOrText(row.target), cleanNumberOrText(row.realisasi),
            row.no_order_2 || '', rowNamaOrder2, row.jenis_pekerjaan_2 || '', row.bahan_kertas || '', cleanNumberOrText(row.jml_plate),
            row.warna || '', cleanNumberOrText(row.inscheet), cleanNumberOrText(row.rijek), row.jam || '', row.kendala || '', baseData.bagian || '',
            session.username || null, baseData.nama_order_manual || null, row.nama_order_manual_2 || null
          ]);
        }

        const placeholders = pendingRows.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).join(', ');
        const args = pendingRows.flat();
        const sql = `INSERT INTO jurnal_harian_produksi (
                  posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, realisasi,
                  no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input, created_by, nama_order_manual, nama_order_manual_2
                ) VALUES ${placeholders}`;
        await db.execute({ sql, args });
      }

      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'INSERT',
          'jurnal_harian_produksi',
          id,
          `Input Multi Realisasi (${filteredMulti.length} baris)`,
          JSON.stringify({
            id,
            count: filteredMulti.length,
            realisasi: filteredMulti.map((r: any, i: number) => ({
              baris: i + 1,
              nama_order: r.nama_order_2 || r.nama_order_manual_2 || '-',
              jenis_pekerjaan: r.jenis_pekerjaan_2 || '-',
              target: r.target || 0,
              realisasi: r.realisasi || 0,
              jam: r.jam || '-',
            }))
          }),
          session.username || 'System'
        ]
      });

      return NextResponse.json({ success: true });
    }

    if (body.action === 'bulk_update_shift') {
      if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { ids, shift } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'IDs tidak valid' }, { status: 400 });
      }
      if (!shift || !['1', '2', '3'].includes(String(shift))) {
        return NextResponse.json({ error: 'Shift tidak valid' }, { status: 400 });
      }

      const placeholders = ids.map(() => '?').join(', ');
      await db.execute({
        sql: `UPDATE jurnal_harian_produksi SET shift = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
        args: [String(shift), session.username || null, ...ids]
      });

      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['UPDATE', 'jurnal_harian_produksi', 0, `Bulk update shift ${ids.length} data`, JSON.stringify({ ids, shift }), session.username || 'System']
      });

      return NextResponse.json({ success: true, updatedCount: ids.length });
    }

    // Default flow untuk bulk upload Excel
    const { filename, data: rawData, chunkIndex = 0, totalChunks = 1 } = body;

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    // Hanya hapus data lama jika ini adalah chunk pertama atau tanpa chunking, dan hanya hapus data hasil unggahan (is_manual_input = 0)
    if (chunkIndex === 0) {
      try {
        await db.execute("ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0");
      } catch (e) {} // Kolom sudah ada
      await db.execute("DELETE FROM jurnal_harian_produksi WHERE is_manual_input = 0 OR is_manual_input IS NULL");
      // Hapus log COPY_JADWAL agar tombol copy jadwal besok muncul kembali setelah upload ulang
      await db.execute("DELETE FROM activity_logs WHERE action_type = 'COPY_JADWAL'");
    }

    let importedCount = 0;
    let debugInfo: any = null;

    // Cari baris header untuk deteksi index kolom secara dinamis
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      if (rawData[i] && rawData[i].includes('Tanggal') && rawData[i].includes('Nama Karyawan')) {
        headerRowIndex = i;
        break;
      }
    }

    const getIdx = (name: string, defaultIdx: number) => {
      if (headerRowIndex === -1) return defaultIdx;
      const idx = rawData[headerRowIndex].findIndex((h: any) => String(h || '').toLowerCase().includes(name.toLowerCase()));
      return idx === -1 ? defaultIdx : idx;
    };

    // Deteksi index (dengan fallback ke index standar jika tidak ketemu)
    const idxPosisi = getIdx('Posisi', 1);
    const idxAbsensi = getIdx('Abs.', 2);
    const idxTgl = getIdx('Tanggal', 3);
    const idxShift = getIdx('Sift', 4);
    const idxNama = getIdx('Nama Karyawan', 5);
    const idxNoOrder = getIdx('NO. Order (PPIC)', 6);
    const idxNamaOrder = getIdx('Nama Order', 7);
    const idxJenisPekerjaan = getIdx('Jenis Pekerjaan', 8);
    const idxKeterangan = getIdx('Keterangan', 9);
    const idxTarget = getIdx('Target', 10);
    const idxRealisasi = getIdx('Realisasi', 11);
    const idxNoOrder2 = 12; // Biasanya sesudah Realisasi
    const idxNamaOrder2 = 13;
    const idxJenisPekerjaan2 = 14;
    const idxBahanKertas = getIdx('Bahan Kertas', 15);
    const idxJmlPlate = getIdx('Jml. Plate', 16);
    const idxWarna = getIdx('Warna', 17);
    const idxInscheet = getIdx('Inscheet', 18);
    const idxRijek = getIdx('Rijek', 19);
    const idxJam = getIdx('Jam', 20);
    const idxKendala = getIdx('Kendala', 21);
    const idxBagian = getIdx('Bagian', 23);

    // Fungsi untuk eksekusi bulk insert guna performa maksimal
    const BATCH_SIZE = 1000;
    let pendingRows: any[][] = [];
    const username = session?.username || 'System';

    const flushRows = async (rows: any[][]) => {
      if (rows.length === 0) return;
      const placeholders = rows.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(', ');
      const args = rows.flat();
      const sql = `INSERT INTO jurnal_harian_produksi (
                posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, realisasi,
                no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, created_by
              ) VALUES ${placeholders}`;
      await db.execute({ sql, args });
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      // Lewati baris header itu sendiri
      if (headerRowIndex !== -1 && i <= headerRowIndex) continue;
      if (String(row[idxNama] || '').toLowerCase() === 'nama karyawan') continue;

      const posisi = String(row[idxPosisi] || '').trim();
      const absensi = Number(String(row[idxAbsensi] ?? '').replace(/[^0-9.-]+/g, '')) || 0;

      let tgl = null;
      if (row[idxTgl]) {
        if (typeof row[idxTgl] === 'number') {
           const excelEpoch = new Date(Date.UTC(1899, 11, 30));
           const dateObj = new Date(excelEpoch.getTime() + row[idxTgl] * 86400000);
           const yyyy = dateObj.getUTCFullYear();
           const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
           const dd = String(dateObj.getUTCDate()).padStart(2, '0');
           tgl = `${yyyy}-${mm}-${dd}`;
        } else {
           tgl = String(row[idxTgl]).trim();
        }
      }

      const shift = String(row[idxShift] || '').trim();
      const namaKaryawan = String(row[idxNama] || '').trim();

      // Validasi ketat:
      // 1. Nama karyawan tidak boleh kosong, 'null', atau diawali tanda '-' (baris kategori)
      // 2. Tanggal harus valid (mengandung '-' untuk format YYYY-MM-DD atau merupakan angka Excel)
      const isValidDate = tgl && (tgl.includes('-') || typeof row[idxTgl] === 'number');
      const isCategoryRow = namaKaryawan.startsWith('-') || namaKaryawan.toLowerCase().includes('setting') || namaKaryawan.toLowerCase().includes('quality control');

      if (!tgl || !namaKaryawan || namaKaryawan === 'null' || !isValidDate || isCategoryRow) continue;

      const noOrder = String(row[idxNoOrder] || '').trim();
      const namaOrder = String(row[idxNamaOrder] || '').trim();
      const jenisPekerjaan = String(row[idxJenisPekerjaan] || '').trim();
      const keterangan = String(row[idxKeterangan] || '').trim();
      const target = Number(String(row[idxTarget] || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const realisasi = Number(String(row[idxRealisasi] || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const noOrder2 = String(row[idxNoOrder2] || '').trim();
      const namaOrder2 = String(row[idxNamaOrder2] || '').trim();
      const jenisPekerjaan2 = String(row[idxJenisPekerjaan2] || '').trim();
      const bahanKertas = String(row[idxBahanKertas] || '').trim();
      const jmlPlate = cleanNumberOrText(row[idxJmlPlate]);
      const warna = String(row[idxWarna] || '').trim();
      const inscheet = cleanNumberOrText(row[idxInscheet]);
      const rijek = cleanNumberOrText(row[idxRijek]);
      const jam = String(row[idxJam] || '').trim();
      const kendala = String(row[idxKendala] || '').trim();
      const bagian = String(row[idxBagian] || '').trim();

      pendingRows.push([
        posisi, absensi, tgl, shift, namaKaryawan, noOrder, namaOrder, jenisPekerjaan, keterangan, target, realisasi,
        noOrder2, namaOrder2, jenisPekerjaan2, bahanKertas, jmlPlate, warna, inscheet, rijek, jam, kendala, bagian,
        username
      ]);

      importedCount++;

      // Eksekusi batch saat ukuran batch tercapai
      if (pendingRows.length >= BATCH_SIZE) {
        await flushRows(pendingRows);
        pendingRows = [];
      }
    }

    // Eksekusi sisa baris
    await flushRows(pendingRows);

    // Log activity hanya pada chunk terakhir atau jika tidak ada chunking
    if (chunkIndex === totalChunks - 1) {
      const session = await getSession();
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'UPLOAD',
          'jurnal_harian_produksi',
          0,
          `Upload Jurnal Harian Produksi dari Excel (${filename})`,
          JSON.stringify({ fileName: filename, chunks: totalChunks }),
          session?.username || 'System'
        ]
      });
    }

    return NextResponse.json({
      success: true,
      importedCount,
      debug: debugInfo
    });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, updated_at, ...fields } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });

    const updateParts: string[] = [];
    const updateArgs: any[] = [];

    const allowedFields = [
      'posisi', 'absensi', 'tgl', 'shift', 'nama_karyawan', 'no_order', 'nama_order',
      'jenis_pekerjaan', 'keterangan', 'target', 'realisasi',
      'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2',
      'bahan_kertas', 'jml_plate', 'warna', 'inscheet', 'rijek', 'jam', 'kendala', 'bagian',
      'nama_order_manual', 'nama_order_manual_2'
    ];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = ?`);
        if (['target', 'realisasi', 'jml_plate', 'inscheet', 'rijek'].includes(key)) {
          updateArgs.push(cleanNumberOrText(value));
        } else if (['absensi'].includes(key)) {
          updateArgs.push(Number(value) || 0);
        } else {
          updateArgs.push(value || (key === 'tgl' ? null : ''));
        }
      }
    }

    // Jika nama_order_manual diisi dan no_order kosong → override nama_order dengan nilai manual
    if (fields.nama_order_manual && String(fields.nama_order_manual).trim()) {
      const manualVal = String(fields.nama_order_manual).trim();
      const noOrderVal = String(fields.no_order || '').trim();
      if (!noOrderVal) {
        const idx = updateParts.findIndex(p => p === 'nama_order = ?');
        if (idx !== -1) {
          updateArgs[idx] = manualVal;
        } else {
          updateParts.push('nama_order = ?');
          updateArgs.push(manualVal);
        }
      }
    }

    // Jika nama_order_manual_2 diisi dan no_order_2 kosong → override nama_order_2 dengan nilai manual
    if (fields.nama_order_manual_2 && String(fields.nama_order_manual_2).trim()) {
      const manualVal2 = String(fields.nama_order_manual_2).trim();
      const noOrder2Val = String(fields.no_order_2 || '').trim();
      if (!noOrder2Val) {
        const idx2 = updateParts.findIndex(p => p === 'nama_order_2 = ?');
        if (idx2 !== -1) {
          updateArgs[idx2] = manualVal2;
        } else {
          updateParts.push('nama_order_2 = ?');
          updateArgs.push(manualVal2);
        }
      }
    }

    const rowBefore = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ?`,
      args: [id]
    });
    const snapshotBefore = rowBefore.rows[0] ? Object.fromEntries(Object.entries(rowBefore.rows[0] as Record<string, unknown>)) : { id };

    if (updateParts.length > 0) {
      updateParts.push('updated_at = CURRENT_TIMESTAMP');
      updateParts.push('updated_by = ?');
      updateArgs.push(session.username || null);

      const whereClause = updated_at ? 'id = ? AND deleted_at IS NULL AND updated_at = ?' : 'id = ? AND deleted_at IS NULL';
      const whereArgs = updated_at ? [id, updated_at] : [id];
      const result = await db.execute({
        sql: `UPDATE jurnal_harian_produksi SET ${updateParts.join(', ')} WHERE ${whereClause}`,
        args: [...updateArgs, ...whereArgs]
      });

      if (result.rowsAffected === 0) {
        const existing = await db.execute({
          sql: `SELECT id, deleted_at, updated_at FROM jurnal_harian_produksi WHERE id = ?`,
          args: [id]
        });
        if (existing.rows.length === 0 || (existing.rows[0] as any)?.deleted_at) {
          return NextResponse.json({ error: 'Data telah dihapus oleh pengguna lain.', code: 'DELETED' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Data telah diubah oleh pengguna lain. Silakan reload halaman.', code: 'CONFLICT' }, { status: 409 });
      }

      // Ambil data setelah update untuk raw_data { before, after }
      const rowAfter = await db.execute({
        sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ?`,
        args: [id]
      });
      const snapshotAfter = rowAfter.rows[0] ? Object.fromEntries(Object.entries(rowAfter.rows[0] as Record<string, unknown>)) : { id };

      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['UPDATE', 'jurnal_harian_produksi', id, `Update Jurnal Harian Produksi ID #${id}`, JSON.stringify({ before: snapshotBefore, after: snapshotAfter }), session.username || 'System']
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, clearAll } = await request.json();

    if (clearAll) {
      // Soft delete semua
      await db.execute(`UPDATE jurnal_harian_produksi SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL`);
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['DELETE', 'jurnal_harian_produksi', 0, 'Soft delete seluruh data Jurnal Harian Produksi', '{}', session.username || 'System']
      });
      return NextResponse.json({ success: true });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs tidak valid' }, { status: 400 });
    }

    // Soft delete per id — tulis log per id agar bisa ter-track di dashboard
    const placeholders = ids.map(() => '?').join(', ');

    // Ambil snapshot data sebelum soft-delete
    const rowsBefore = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      args: [...ids]
    });
    const snapshotMap = new Map<number, Record<string, unknown>>();
    for (const row of rowsBefore.rows) {
      const r = row as Record<string, unknown>;
      snapshotMap.set(Number(r.id), Object.fromEntries(Object.entries(r)));
    }

    await db.execute({
      sql: `UPDATE jurnal_harian_produksi SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      args: [session.username || null, session.username || null, ...ids]
    });

    for (const id of ids) {
      const snapshot = snapshotMap.get(Number(id)) || { id };
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['DELETE', 'jurnal_harian_produksi', id, `Soft delete Jurnal Harian Produksi ID #${id}`, JSON.stringify(snapshot), session.username || 'System']
      });
    }

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
