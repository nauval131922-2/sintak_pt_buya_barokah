import * as XLSX from 'xlsx';

self.addEventListener('message', async (e) => {
  try {
    const { arrayBuffer, filename, origin } = e.data;
    const apiUrl = `${origin}/api/employees/import-raw`;
    
    // 1. Parsing Excel
    self.postMessage({ type: 'status', message: 'Membaca data karyawan dari Excel...' });
    
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellText: false,
      cellDates: false,
      dense: true
    });

    const SHEET_NAME = 'A.DATA KARYAWAN';
    const worksheet = workbook.Sheets[SHEET_NAME];
    
    if (!worksheet) {
      throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan di dalam file Excel.`);
    }

    // Ambil data mentah (array of arrays)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    // Filter baris valid (mulai baris ke-6, dan kolom B tidak kosong)
    const validData = rawData.slice(5).filter((row: any) => row && Array.isArray(row) && row.length > 1);

    if (validData.length === 0) {
      throw new Error("Tidak dapat menemukan data karyawan pada file yang diunggah.");
    }

    // 2. Chunking adaptif — belah otomatis bila payload dekati guard server 15MB
    // (baris lebar/kolom banyak bisa jebol walau jumlah baris kecil)
    const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // jaga di bawah guard 15MB server
    const chunks: any[][][] = [];
    let cur: any[][] = [];
    let curBytes = 0;
    for (const row of validData) {
      const rowBytes = JSON.stringify(row).length;
      if (cur.length > 0 && curBytes + rowBytes > MAX_PAYLOAD_BYTES) {
        chunks.push(cur);
        cur = [];
        curBytes = 0;
      }
      cur.push(row);
      curBytes += rowBytes;
      if (cur.length >= 8000) {
        chunks.push(cur);
        cur = [];
        curBytes = 0;
      }
    }
    if (cur.length > 0) chunks.push(cur);
    const totalChunks = chunks.length;
    let totalImported = 0;

    // 3. Fungsi pembantu upload
    const uploadChunk = async (index: number) => {
      const chunkData = chunks[index];

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          rows: chunkData,
          chunkIndex: index,
          totalChunks
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Server error (${res.status}): ${res.statusText}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || json.details || errorMsg;
        } catch (e) {
          if (res.status === 413) errorMsg = "File terlalu besar untuk diproses sekaligus (413 Payload Too Large).";
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      return data.imported || 0;
    };

    // 4. Proses Upload - Chunk pertama sinkron
    self.postMessage({ 
      type: 'status', 
      message: `Memproses data karyawan (1/${totalChunks})...`, 
      progress: 0,
      totalRows: validData.length,
      currentRows: 0
    });
    
    totalImported += await uploadChunk(0);
    let uploadedRows = chunks[0].length;

    // 5. Paralel Upload (Concurrency 3) - Untuk karyawan biasanya data tidak sebanyak jurnal, jadi 3 sudah cukup
    const remainingChunks = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1);
    const CONCURRENCY = 3;
    let completedChunks = 1;

    const runWorker = async () => {
      while (remainingChunks.length > 0) {
        const index = remainingChunks.shift();
        if (index === undefined) break;

        const count = await uploadChunk(index);
        totalImported += count;
        completedChunks++;
        uploadedRows += chunks[index].length;

        self.postMessage({
          type: 'status',
          message: `Mengunggah data... (${completedChunks}/${totalChunks})`,
          progress: Math.round((completedChunks / totalChunks) * 100),
          totalRows: validData.length,
          currentRows: Math.min(uploadedRows, validData.length)
        });
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, runWorker));

    self.postMessage({ type: 'done', totalImported, totalRows: validData.length });

  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
});
