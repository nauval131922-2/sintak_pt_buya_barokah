import * as XLSX from 'xlsx';

// Worker parse Master Pekerjaan di browser — file polos dikirim JSON per chunk (tanpa batas MB).
// File bersandi TIDAK lewat sini (dekripsi butuh file utuh di server via FormData).

self.addEventListener('message', async (e) => {
  try {
    const { arrayBuffer, filename, origin } = e.data;
    const apiUrl = `${origin}/api/master-pekerjaan-jurnal-produksi`;

    self.postMessage({ type: 'status', message: 'Membaca sheet MASTER PEKERJAAN...' });

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellText: false,
    });

    const targetSheetName = workbook.SheetNames.find(
      (s) => s.toUpperCase() === 'MASTER PEKERJAAN'
    );
    if (!targetSheetName) {
      throw new Error("Sheet 'MASTER PEKERJAAN' tidak ditemukan di dalam file Excel.");
    }

    const worksheet = workbook.Sheets[targetSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    }) as Array<Array<string | number | null | undefined>>;

    if (rawRows.length < 4) {
      throw new Error("Format sheet 'MASTER PEKERJAAN' tidak sesuai atau baris data terlalu sedikit.");
    }

    // Baris ke-3 (indeks 2) = nama kategori; baris ke-4+ (indeks 3) = data.
    // Henti di baris pembatas 'KALENDER' kolom A — mirror logika server route.ts.
    const categoryRow = rawRows[2];
    const categoryMap: Record<number, string> = {};
    for (let c = 0; c < categoryRow.length; c++) {
      const catVal = categoryRow[c];
      if (catVal && typeof catVal === 'string' && catVal.trim()) {
        categoryMap[c] = catVal.trim();
      }
    }

    const items: { category: string; name: string }[] = [];
    for (let r = 3; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row) continue;
      if (row[0] && typeof row[0] === 'string' && row[0].trim().toUpperCase() === 'KALENDER') break;
      for (const colIdxStr in categoryMap) {
        const colIdx = parseInt(colIdxStr);
        if (colIdx < row.length) {
          const cellVal = row[colIdx];
          if (cellVal !== null && cellVal !== undefined) {
            const cleanName = String(cellVal).trim();
            if (cleanName) items.push({ category: categoryMap[colIdx], name: cleanName });
          }
        }
      }
    }

    if (items.length === 0) {
      throw new Error("Tidak ada data pekerjaan yang ditemukan di sheet 'MASTER PEKERJAAN'.");
    }

    // Chunking adaptif — belah otomatis bila payload dekati guard server 15MB
    const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;
    const chunks: { category: string; name: string }[][] = [];
    let cur: { category: string; name: string }[] = [];
    let curBytes = 0;
    for (const item of items) {
      const itemBytes = JSON.stringify(item).length;
      if (cur.length > 0 && curBytes + itemBytes > MAX_PAYLOAD_BYTES) {
        chunks.push(cur);
        cur = [];
        curBytes = 0;
      }
      cur.push(item);
      curBytes += itemBytes;
      if (cur.length >= 8000) {
        chunks.push(cur);
        cur = [];
        curBytes = 0;
      }
    }
    if (cur.length > 0) chunks.push(cur);
    const totalChunks = chunks.length;
    let totalImported = 0;
    let uploadedRows = 0;

    const uploadChunk = async (index: number) => {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          items: chunks[index],
          chunkIndex: index,
          totalChunks,
          totalRows: items.length,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Server error (${res.status}): ${res.statusText}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          if (res.status === 413) errorMsg = 'Chunk terlalu besar (413).';
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      return data.imported || 0;
    };

    self.postMessage({
      type: 'status',
      message: `Mengunggah data... (1/${totalChunks})`,
      progress: 0,
      totalRows: items.length,
      currentRows: 0,
    });

    // Chunk pertama sinkron, sisanya paralel concurrency 3 (mirror employee-worker)
    totalImported += await uploadChunk(0);
    uploadedRows += chunks[0].length;

    const remaining = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1);
    const CONCURRENCY = 3;
    let completed = 1;
    const runWorker = async () => {
      while (remaining.length > 0) {
        const index = remaining.shift();
        if (index === undefined) break;
        const count = await uploadChunk(index);
        totalImported += count;
        completed++;
        uploadedRows += chunks[index].length;
        self.postMessage({
          type: 'status',
          message: `Mengunggah data... (${completed}/${totalChunks})`,
          progress: Math.round((completed / totalChunks) * 100),
          totalRows: items.length,
          currentRows: Math.min(uploadedRows, items.length),
        });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, runWorker));

    self.postMessage({ type: 'done', totalImported, totalRows: items.length });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
});
