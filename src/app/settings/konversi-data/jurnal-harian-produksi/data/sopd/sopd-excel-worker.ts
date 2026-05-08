import * as XLSX from 'xlsx';

self.addEventListener('message', async (e) => {
  try {
    const { arrayBuffer, filename, origin } = e.data;
    const apiUrl = `${origin}/api/sopd`;

    // 1. Parsing Excel in background thread
    self.postMessage({ type: 'status', message: 'Menganalisa struktur file Excel...' });

    // 1. Parsing Excel - Optimized flags like JHP module
    self.postMessage({ type: 'status', message: 'Menganalisa struktur file Excel...' });
    
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellText: false,
      cellDates: false,
      dense: true
    });

    let targetSheet = 'SOPD';
    if (!workbook.SheetNames.includes('SOPD')) {
      const fallback = workbook.SheetNames.find((s: string) => s === '03 SOPd') ||
                       workbook.SheetNames.find((s: string) => s.toLowerCase().includes('sopd'));
      if (!fallback) throw new Error(`Sheet 'SOPD' tidak ditemukan. Sheet yang tersedia: ${workbook.SheetNames.join(', ')}`);
      targetSheet = fallback;
    }

    const worksheet = workbook.Sheets[targetSheet];
    // Fast read as 2D array (no range:0 to avoid scanning millions of empty cells)
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    
    // 2. Find header row by scanning first 20 rows (JHP Pattern)
    let headerIndex = -1;
    let idxNoSopd = -1;
    
    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
      const row = rawRows[i];
      const foundIdx = row.findIndex(h => {
        const s = String(h || '').toLowerCase().trim();
        return s === 'no. order' || s === 'no order' || s === 'no. sopd' || s === 'no_sopd' || s === 'no sopd';
      });
      if (foundIdx !== -1) {
        headerIndex = i;
        idxNoSopd = foundIdx;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Gagal menemukan kolom 'No. Order'. Pastikan header berada di sekitar baris 1-20.");
    }

    const headers = rawRows[headerIndex];
    const findIdx = (names: string[]) => {
      // 1. Try exact match first
      const exact = headers.findIndex(h => {
        const s = String(h || '').toLowerCase().trim();
        return names.some(n => s === n.toLowerCase());
      });
      if (exact !== -1) return exact;

      // 2. Fallback to includes
      return headers.findIndex(h => {
        const s = String(h || '').toLowerCase().trim();
        return names.some(n => s.includes(n.toLowerCase()));
      });
    };

    const idxTgl       = findIdx(['tanggal order', 'tanggal', 'tgl']);
    const idxNamaOrder = findIdx(['nama order', 'nama_order', 'nama_sopd']);
    const idxQty       = findIdx(['jumlah order', 'qty sopd', 'qty', 'jumlah', 'quantity']);
    const idxUnit      = findIdx(['satuan', 'unit po', 'unit']);
    const idxHarga     = findIdx(['perkiraan harga', 'harga']);
    const idxKet       = findIdx(['keterangan', 'ket']);
    const idxDeadline  = findIdx(['tanggal deadline', 'deadline']);
    const idxSelesai   = findIdx(['tanggal selesai', 'selesai']);

    const excelToDate = (val: any): string => {
      if (!val || val === "") return "";
      let dateObj: Date;
      if (typeof val === 'number') {
        dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      } else if (val instanceof Date) {
        dateObj = val;
      } else {
        const s = String(val).trim();
        if (!s) return "";
        return s;
      }
      const d = dateObj.getUTCDate().toString().padStart(2, '0');
      const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
      const y = dateObj.getUTCFullYear();
      return `${d}-${m}-${y}`;
    };

    // 3. Map data rows
    const mappedData: any[] = [];
    for (let i = headerIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;
      const noSopd = String(row[idxNoSopd] || '').trim();
      if (!noSopd || noSopd.toLowerCase() === 'no. order' || noSopd.toLowerCase() === 'no order') continue;

      let qtySopd = 0;
      const rawQty = row[idxQty];
      if (typeof rawQty === 'number') {
        qtySopd = rawQty;
      } else if (rawQty) {
        let c = String(rawQty).trim().replace(/\s/g, '');
        if (c.includes(',') && c.includes('.')) {
          c = c.lastIndexOf(',') > c.lastIndexOf('.') ? c.replace(/\./g, '').replace(',', '.') : c.replace(/,/g, '');
        } else if (c.includes(',')) { c = c.replace(',', '.'); }
        qtySopd = parseFloat(c) || 0;
      }

      mappedData.push({
        no_sopd:         noSopd,
        tgl:             excelToDate(row[idxTgl]),
        nama_order:      String(row[idxNamaOrder] || '').trim(),
        qty_sopd:        qtySopd,
        unit:            String(row[idxUnit] || '').trim(),
        perkiraan_harga: row[idxHarga] ?? '',
        keterangan:      row[idxKet] ?? '',
        deadline_date:   excelToDate(row[idxDeadline]),
        finished_date:   excelToDate(row[idxSelesai]),
      });
    }

    if (mappedData.length === 0) {
      throw new Error("Tidak ditemukan data transaksi setelah baris header.");
    }

    self.postMessage({ 
      type: 'status', 
      message: `Berhasil membedah ${mappedData.length.toLocaleString('id-ID')} baris data. Menyiapkan pengiriman...`,
      totalRows: mappedData.length,
      currentRows: 0,
      progress: 0
    });

    // 4. Start session
    const startRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'start', filename }),
    });
    if (!startRes.ok) throw new Error('Gagal menginisialisasi upload.');

    // 5. Large Chunk Upload (JHP style)
    const CHUNK_SIZE = 5000;
    const totalChunks = Math.ceil(mappedData.length / CHUNK_SIZE);
    let totalImported = 0;
    let completedChunks = 0;

    for (let index = 0; index < totalChunks; index++) {
      const chunk = mappedData.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chunk', filename, data: chunk }),
      });
      if (!res.ok) throw new Error(`Gagal mengupload bagian ${index + 1}`);
      
      const resData = await res.json();
      totalImported += (resData.imported || chunk.length);
      completedChunks++;
      
      self.postMessage({
        type: 'status',
        message: `Mengunggah... (${completedChunks}/${totalChunks})`,
        progress: Math.round((completedChunks / totalChunks) * 100),
        totalRows: mappedData.length,
        currentRows: Math.min(completedChunks * CHUNK_SIZE, mappedData.length)
      });
    }

    // 6. End session
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'end', filename, data: { importedCount: totalImported } }),
    });

    self.postMessage({ type: 'done', totalImported, totalRows: mappedData.length });

  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
});
